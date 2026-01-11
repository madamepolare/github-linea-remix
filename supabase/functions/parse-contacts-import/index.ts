import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Split content into chunks to avoid token limits AND function timeouts
// Goal: minimize number of AI calls while keeping each chunk reasonably sized.
function splitContentIntoChunks(content: string, maxLinesPerChunk = 250): string[] {
  const lines = content.split("\n");
  const chunks: string[] = [];

  // Find header line (first non-empty line that looks like a header)
  let headerLine = "";
  for (const line of lines) {
    if (line.trim() && (line.includes(",") || line.includes("\t") || line.includes(";"))) {
      headerLine = line;
      break;
    }
  }

  for (let i = 0; i < lines.length; i += maxLinesPerChunk) {
    const chunkLines = lines.slice(i, i + maxLinesPerChunk);

    // Always ensure we have a header in every chunk except if already present
    if (i > 0 && headerLine) {
      const first = (chunkLines[0] || "").trim();
      const looksLikeHeader = first === headerLine.trim();
      chunks.push((looksLikeHeader ? "" : headerLine + "\n") + chunkLines.join("\n"));
    } else {
      chunks.push(chunkLines.join("\n"));
    }
  }

  return chunks.filter((chunk) => chunk.trim().length > 0);
}

async function parseChunk(
  chunk: string, 
  chunkIndex: number, 
  totalChunks: number,
  fileName: string,
  fileType: string,
  apiKey: string,
  existingCompanyNames: Set<string>
): Promise<{ companies: any[], contacts: any[], summary: string }> {
  const systemPrompt = `Tu es un assistant spécialisé dans l'extraction de données de contacts et d'entreprises à partir de fichiers.
    
Analyse le contenu fourni et extrait TOUS les contacts et entreprises présents - n'en oublie aucun !
- Les contacts (personnes) avec leurs informations: nom, prénom, email, téléphone, fonction/rôle, entreprise associée
- Les entreprises avec leurs informations: nom, secteur d'activité, email, téléphone, site web, adresse, ville, code postal

Règles importantes:
- EXTRAIT TOUS LES CONTACTS présents dans le fichier, sans exception
- Si un contact est associé à une entreprise, crée d'abord l'entreprise puis lie le contact
- Déduplique les entreprises si plusieurs contacts appartiennent à la même
- Si le genre n'est pas explicite, essaie de le déduire du prénom (Jean=male, Marie=female, etc.)
- Normalise les numéros de téléphone au format français si possible
- Extrait le maximum d'informations disponibles
- Ne limite PAS le nombre de contacts extraits

IMPORTANT: Tu DOIS appeler la fonction extract_contacts_and_companies avec les données extraites.`;

  const userPrompt = `Fichier: ${fileName} (${fileType})
${totalChunks > 1 ? `\n[PARTIE ${chunkIndex + 1}/${totalChunks} du fichier - extrait TOUS les contacts de cette partie]` : ''}
${existingCompanyNames.size > 0 ? `\nEntreprises déjà extraites des parties précédentes: ${Array.from(existingCompanyNames).slice(0, 20).join(', ')}${existingCompanyNames.size > 20 ? '...' : ''}` : ''}

Contenu à analyser:
${chunk}

Extrait TOUS les contacts et entreprises. N'en oublie aucun ! Appelle la fonction avec les résultats.`;

  console.log(`Parsing chunk ${chunkIndex + 1}/${totalChunks}, content length: ${chunk.length} chars`);

  // Use gemini-2.5-flash which is more reliable with function calling
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 16384,
      tools: [
        {
          type: "function",
          function: {
            name: "extract_contacts_and_companies",
            description: "Extrait TOUS les contacts et entreprises du fichier sans limite",
            parameters: {
              type: "object",
              properties: {
                companies: {
                  type: "array",
                  description: "Liste COMPLETE de toutes les entreprises extraites",
                  items: {
                    type: "object",
                    properties: {
                      temp_id: { type: "string", description: "ID temporaire pour lier les contacts" },
                      name: { type: "string", description: "Nom de l'entreprise" },
                      industry: { type: "string", description: "Secteur d'activité" },
                      email: { type: "string", description: "Email de l'entreprise" },
                      phone: { type: "string", description: "Téléphone" },
                      website: { type: "string", description: "Site web" },
                      address: { type: "string", description: "Adresse" },
                      city: { type: "string", description: "Ville" },
                      postal_code: { type: "string", description: "Code postal" },
                    },
                    required: ["temp_id", "name"],
                  },
                },
                contacts: {
                  type: "array",
                  description: "Liste COMPLETE de tous les contacts extraits",
                  items: {
                    type: "object",
                    properties: {
                      first_name: { type: "string", description: "Prénom" },
                      last_name: { type: "string", description: "Nom de famille" },
                      email: { type: "string", description: "Email" },
                      phone: { type: "string", description: "Téléphone" },
                      role: { type: "string", description: "Fonction/Poste" },
                      gender: { type: "string", enum: ["male", "female", "other"], description: "Genre" },
                      company_temp_id: { type: "string", description: "ID temporaire de l'entreprise associée" },
                      notes: { type: "string", description: "Notes additionnelles" },
                    },
                    required: ["first_name", "last_name"],
                  },
                },
                summary: {
                  type: "string",
                  description: "Résumé de l'extraction (nombre de contacts/entreprises trouvés dans cette partie)",
                },
              },
              required: ["companies", "contacts", "summary"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_contacts_and_companies" } },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    if (response.status === 402) {
      throw new Error("CREDITS_EXHAUSTED");
    }
    
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  
  // Try to get tool call first
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall) {
    try {
      const result = JSON.parse(toolCall.function.arguments);
      console.log(`Chunk ${chunkIndex + 1} extracted via tool call: ${result.companies?.length || 0} companies, ${result.contacts?.length || 0} contacts`);
      return result;
    } catch (parseError) {
      console.error("Error parsing tool call arguments:", parseError);
    }
  }

  // Fallback: try to extract from content if no tool call
  const content = data.choices?.[0]?.message?.content;
  if (content) {
    console.log(`No tool call for chunk ${chunkIndex + 1}, trying to parse content...`);
    
    // Try to find JSON in the content
    const jsonMatch = content.match(/\{[\s\S]*"companies"[\s\S]*"contacts"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0]);
        console.log(`Chunk ${chunkIndex + 1} extracted from content: ${result.companies?.length || 0} companies, ${result.contacts?.length || 0} contacts`);
        return result;
      } catch (e) {
        console.error("Error parsing JSON from content");
      }
    }
  }

  console.error(`No extractable data for chunk ${chunkIndex + 1}`);
  return { companies: [], contacts: [], summary: "" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileName, fileType } = await req.json();

    if (!fileContent) {
      return new Response(
        JSON.stringify({ error: "No file content provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Starting parse for file: ${fileName}, content length: ${fileContent.length} chars`);

    // Split content into fewer chunks for large files to reduce runtime
    const chunks = splitContentIntoChunks(fileContent, 250); // ~250 lines per chunk
    console.log(`File split into ${chunks.length} chunk(s)`);

    const allCompanies: any[] = [];
    const allContacts: any[] = [];
    const existingCompanyNames = new Set<string>();
    const summaries: string[] = [];

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      try {
        const result = await parseChunk(
          chunks[i],
          i,
          chunks.length,
          fileName,
          fileType,
          LOVABLE_API_KEY,
          existingCompanyNames
        );

        // Add companies, avoiding duplicates
        for (const company of result.companies || []) {
          if (!existingCompanyNames.has(company.name.toLowerCase())) {
            existingCompanyNames.add(company.name.toLowerCase());
            allCompanies.push(company);
          }
        }

        // Add all contacts
        allContacts.push(...(result.contacts || []));
        
        if (result.summary) {
          summaries.push(result.summary);
        }

        // No artificial delay here: we want to avoid edge function timeouts.
        // If rate limiting happens, it is handled and the user can retry.
        // (If needed we can add backoff later based on 429 responses.)
      } catch (chunkError) {
        if (chunkError instanceof Error) {
          if (chunkError.message === "RATE_LIMIT") {
            return new Response(
              JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans quelques instants." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (chunkError.message === "CREDITS_EXHAUSTED") {
            return new Response(
              JSON.stringify({ error: "Crédits IA épuisés, veuillez ajouter des crédits." }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
        console.error(`Error processing chunk ${i + 1}:`, chunkError);
        // Continue with other chunks even if one fails
      }
    }

    const finalSummary = chunks.length > 1 
      ? `${allCompanies.length} entreprise(s) et ${allContacts.length} contact(s) extraits au total (${chunks.length} parties traitées)`
      : summaries[0] || `${allCompanies.length} entreprise(s) et ${allContacts.length} contact(s) extraits`;

    console.log(`Final result: ${allCompanies.length} companies, ${allContacts.length} contacts`);

    return new Response(JSON.stringify({
      companies: allCompanies,
      contacts: allContacts,
      summary: finalSummary,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in parse-contacts-import:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
