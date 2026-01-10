import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const systemPrompt = `Tu es un assistant spécialisé dans l'extraction de données de contacts et d'entreprises à partir de fichiers.
    
Analyse le contenu fourni et extrait:
- Les contacts (personnes) avec leurs informations: nom, prénom, email, téléphone, fonction/rôle, entreprise associée
- Les entreprises avec leurs informations: nom, secteur d'activité, email, téléphone, site web, adresse, ville, code postal

Règles importantes:
- Si un contact est associé à une entreprise, crée d'abord l'entreprise puis lie le contact
- Déduplique les entreprises si plusieurs contacts appartiennent à la même
- Si le genre n'est pas explicite, essaie de le déduire du prénom (Jean=male, Marie=female, etc.)
- Normalise les numéros de téléphone au format français si possible
- Extrait le maximum d'informations disponibles`;

    const userPrompt = `Fichier: ${fileName} (${fileType})

Contenu à analyser:
${fileContent}

Extrait tous les contacts et entreprises de ce fichier.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_contacts_and_companies",
              description: "Extrait les contacts et entreprises du fichier",
              parameters: {
                type: "object",
                properties: {
                  companies: {
                    type: "array",
                    description: "Liste des entreprises extraites",
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
                    description: "Liste des contacts extraits",
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
                    description: "Résumé de l'extraction (nombre de contacts/entreprises trouvés)",
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
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés, veuillez ajouter des crédits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
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
