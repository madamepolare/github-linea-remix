import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    console.log(`Analyzing ${files.length} files before tender creation`);

    // Build file descriptions for the AI
    const fileDescriptions = files.map((f: { name: string; type: string; content: string }) => {
      const docType = detectDocumentType(f.name);
      return `Document: ${f.name} (Type détecté: ${docType})
Contenu (extrait base64 - à interpréter): ${f.content.substring(0, 1000)}...`;
    }).join('\n\n---\n\n');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en marchés publics français spécialisé dans l'analyse des DCE (Dossiers de Consultation des Entreprises).
            
Tu analyses les noms de fichiers et leurs contenus pour en déduire les informations clés sur l'appel d'offres.

Tu dois extraire un MAXIMUM d'informations à partir des noms de fichiers et de leurs contenus :
- Le titre/objet du marché (souvent dans le nom du fichier ou le contenu)
- La référence/numéro de consultation
- Le maître d'ouvrage
- Le lieu/adresse du projet
- Le budget estimé
- Les dates clés (deadline, visite de site, etc.)
- Le type de procédure
- Les critères de jugement

Sois intelligent dans ton analyse : les noms de fichiers contiennent souvent des indices précieux (ex: "RC_Ecole_Jean_Moulin_2024.pdf" → projet d'école).

Réponds UNIQUEMENT avec les données structurées demandées.`
          },
          {
            role: "user",
            content: `Analyse ces ${files.length} documents DCE et extrais toutes les informations possibles pour créer la fiche du concours :

${fileDescriptions}

Extrais le maximum d'informations pour pré-remplir le concours.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tender_info",
              description: "Extrait les informations principales d'un appel d'offres à partir des documents DCE",
              parameters: {
                type: "object",
                properties: {
                  title: { 
                    type: "string", 
                    description: "Titre/Objet du marché (ex: 'Construction d'un groupe scolaire')" 
                  },
                  reference: { 
                    type: "string", 
                    description: "Référence/Numéro de consultation (ex: 'MAPA-2024-015')" 
                  },
                  client_name: { 
                    type: "string", 
                    description: "Nom du maître d'ouvrage (ex: 'Ville de Lyon')" 
                  },
                  client_type: { 
                    type: "string", 
                    description: "Type de client: collectivite, bailleur_social, etat, hopital, universite, etablissement_public, prive" 
                  },
                  location: { 
                    type: "string", 
                    description: "Lieu/Adresse du projet" 
                  },
                  estimated_budget: { 
                    type: "number", 
                    description: "Budget estimé en euros HT" 
                  },
                  procedure_type: { 
                    type: "string", 
                    description: "Type de procédure: ouvert, restreint, adapte, mapa, concours, dialogue, partenariat" 
                  },
                  submission_deadline: { 
                    type: "string", 
                    description: "Date limite de dépôt (format ISO: YYYY-MM-DD)" 
                  },
                  site_visit_date: { 
                    type: "string", 
                    description: "Date de visite de site (format ISO: YYYY-MM-DD)" 
                  },
                  site_visit_required: { 
                    type: "boolean", 
                    description: "Visite de site obligatoire" 
                  },
                  project_description: { 
                    type: "string", 
                    description: "Description du projet" 
                  },
                  surface_area: { 
                    type: "number", 
                    description: "Surface en m²" 
                  },
                  detected_documents: {
                    type: "array",
                    description: "Types de documents détectés",
                    items: {
                      type: "object",
                      properties: {
                        filename: { type: "string" },
                        type: { type: "string", description: "rc, ccap, cctp, programme, lettre_consultation, etc." }
                      }
                    }
                  }
                },
                required: ["title"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_tender_info" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract the function call result
    let extractedData = { title: "Nouveau concours" };
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        extractedData = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
        console.log("Extracted tender info:", JSON.stringify(extractedData, null, 2));
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      extractedData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-dce-before-creation:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function detectDocumentType(fileName: string): string {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes('rc') || lowerName.includes('reglement') || lowerName.includes('règlement')) {
    return 'rc';
  }
  if (lowerName.includes('ccap') || lowerName.includes('clauses admin')) {
    return 'ccap';
  }
  if (lowerName.includes('cctp') || lowerName.includes('clauses tech')) {
    return 'cctp';
  }
  if (lowerName.includes('programme') || lowerName.includes('note_programme')) {
    return 'programme';
  }
  if (lowerName.includes('lettre') || lowerName.includes('consultation')) {
    return 'lettre_consultation';
  }
  if (lowerName.includes('visite') || lowerName.includes('attestation')) {
    return 'attestation_visite';
  }
  if (lowerName.includes('ae') || lowerName.includes('acte') || lowerName.includes('engagement')) {
    return 'acte_engagement';
  }
  if (lowerName.includes('dpgf') || lowerName.includes('prix')) {
    return 'dpgf';
  }
  if (lowerName.includes('plan') || lowerName.includes('dwg') || lowerName.includes('dxf')) {
    return 'plans';
  }
  
  return 'autre';
}
