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
    const { documentUrl, documentType, tenderId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Analyzing document for tender ${tenderId}, type: ${documentType}`);

    // Define extraction schema based on document type
    const extractionPrompt = getExtractionPrompt(documentType);

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
            content: `Tu es un expert en marchés publics français. Tu analyses les documents de consultation (DCE) pour en extraire les informations clés de manière structurée.
            
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte supplémentaire.`
          },
          {
            role: "user",
            content: `Analyse ce document de type "${documentType}" disponible à l'URL: ${documentUrl}

${extractionPrompt}

Réponds avec un JSON structuré contenant les informations extraites.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tender_data",
              description: "Extrait les données structurées d'un document de consultation",
              parameters: {
                type: "object",
                properties: {
                  budget: {
                    type: "object",
                    properties: {
                      amount: { type: "number", description: "Montant estimé en euros" },
                      disclosed: { type: "boolean", description: "Budget affiché ou non" },
                      notes: { type: "string" }
                    }
                  },
                  deadlines: {
                    type: "object",
                    properties: {
                      submission: { type: "string", description: "Date limite de dépôt (ISO)" },
                      questions: { type: "string", description: "Date limite questions" },
                      site_visit: { type: "string", description: "Date visite de site" },
                      jury: { type: "string", description: "Date jury/commission" },
                      results: { type: "string", description: "Date résultats" }
                    }
                  },
                  site_visit: {
                    type: "object",
                    properties: {
                      required: { type: "boolean" },
                      date: { type: "string" },
                      location: { type: "string" }
                    }
                  },
                  selection_criteria: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        weight: { type: "number", description: "Pondération en %" },
                        sub_criteria: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              weight: { type: "number" }
                            }
                          }
                        }
                      }
                    }
                  },
                  required_competencies: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        specialty: { type: "string", description: "architecte, bet_structure, bet_fluides, thermicien, etc." },
                        mandatory: { type: "boolean" },
                        requirements: { type: "string" }
                      }
                    }
                  },
                  required_documents: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        name: { type: "string" },
                        mandatory: { type: "boolean" }
                      }
                    }
                  },
                  project_info: {
                    type: "object",
                    properties: {
                      type: { type: "string", description: "Type de projet" },
                      surface: { type: "number", description: "Surface en m²" },
                      location: { type: "string" },
                      description: { type: "string" }
                    }
                  },
                  procedure: {
                    type: "object",
                    properties: {
                      type: { type: "string", description: "ouvert, restreint, adapte, concours, dialogue" },
                      lots: { type: "boolean" },
                      lots_count: { type: "number" }
                    }
                  },
                  insurance_requirements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        minimum_amount: { type: "number" }
                      }
                    }
                  },
                  reference_requirements: {
                    type: "object",
                    properties: {
                      count: { type: "number", description: "Nombre de références demandées" },
                      min_budget: { type: "number" },
                      max_age_years: { type: "number" },
                      specific_types: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                required: []
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_tender_data" } }
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
    console.log("AI response:", JSON.stringify(data, null, 2));

    // Extract the function call result
    let extractedData = {};
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        extractedData = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      extractedData,
      documentType,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-tender-documents:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getExtractionPrompt(documentType: string): string {
  switch (documentType) {
    case 'rc':
      return `Ce document est un Règlement de Consultation.
Extrais les informations suivantes:
- Type de procédure
- Dates limites (dépôt, questions, visite, jury)
- Critères de sélection et pondérations
- Compétences requises (architecte, BET, etc.)
- Visite de site obligatoire ou non
- Documents à fournir
- Exigences de références`;
    
    case 'ccap':
      return `Ce document est un CCAP (Cahier des Clauses Administratives Particulières).
Extrais les informations suivantes:
- Délais d'exécution
- Pénalités
- Assurances requises
- Conditions de paiement
- Garanties`;
    
    case 'cctp':
      return `Ce document est un CCTP (Cahier des Clauses Techniques Particulières).
Extrais les informations suivantes:
- Description du projet
- Surface
- Exigences techniques
- Normes applicables`;
    
    case 'ae':
      return `Ce document est un Acte d'Engagement.
Extrais les informations suivantes:
- Montant du marché
- Forme du groupement
- Répartition par lot`;
    
    default:
      return `Extrais toutes les informations pertinentes pour répondre à cet appel d'offres:
- Budget
- Dates
- Exigences
- Critères de sélection`;
  }
}
