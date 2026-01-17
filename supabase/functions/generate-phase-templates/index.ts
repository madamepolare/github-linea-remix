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
    const { projectType, projectTypeLabel } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating phase templates for:", { projectType, projectTypeLabel });

    const systemPrompt = `Tu es un expert en gestion de projets dans les domaines de l'architecture, du design d'intérieur, de la communication et de la scénographie en France.

Tu génères des templates de phases de mission professionnelles et réalistes.

Règles importantes:
- Génère entre 5 et 12 phases de base qui totalisent exactement 100%
- Génère 3-6 phases complémentaires optionnelles
- Les codes doivent être courts (2-5 caractères), en majuscules
- Respecte les standards du métier en France
- Pour l'architecture: base-toi sur la loi MOP (ESQ, APS, APD, PRO, ACT, VISA, DET, AOR)
- Pour le design d'intérieur: phases similaires adaptées (AVP, APS, APD, EXE, SUIVI)
- Pour la communication: phases créatives (BRIEF, CONCEPT, CREATION, PROD, DEPLOIEMENT)
- Pour la scénographie: phases spécifiques (DIAG, CONCEPT, DEV, TECH, PROD, MONTAGE)
- Les livrables doivent être concrets et professionnels
- Les descriptions doivent être claires et informatives`;

    const userPrompt = `Génère les phases de mission standards pour un projet de type "${projectTypeLabel || projectType}".

Fournis:
1. Les phases de BASE (mission principale) dont la somme des pourcentages = 100%
2. Les phases COMPLÉMENTAIRES (optionnelles, prestations additionnelles)

Chaque phase doit avoir un code court, un nom clair, une description, un pourcentage par défaut et une liste de livrables.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_phases",
              description: "Génère les phases de mission pour un type de projet",
              parameters: {
                type: "object",
                properties: {
                  basePhases: {
                    type: "array",
                    description: "Phases de base de la mission (somme = 100%)",
                    items: {
                      type: "object",
                      properties: {
                        code: { type: "string", description: "Code court (2-5 caractères, majuscules)" },
                        name: { type: "string", description: "Nom de la phase" },
                        description: { type: "string", description: "Description de la phase" },
                        default_percentage: { type: "number", description: "Pourcentage de la mission" },
                        deliverables: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Liste des livrables" 
                        }
                      },
                      required: ["code", "name", "description", "default_percentage", "deliverables"]
                    }
                  },
                  complementaryPhases: {
                    type: "array",
                    description: "Phases complémentaires optionnelles",
                    items: {
                      type: "object",
                      properties: {
                        code: { type: "string", description: "Code court (2-5 caractères, majuscules)" },
                        name: { type: "string", description: "Nom de la phase" },
                        description: { type: "string", description: "Description de la phase" },
                        default_percentage: { type: "number", description: "Pourcentage suggéré" },
                        deliverables: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Liste des livrables" 
                        }
                      },
                      required: ["code", "name", "description", "default_percentage", "deliverables"]
                    }
                  }
                },
                required: ["basePhases", "complementaryPhases"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_phases" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes dépassée, réessayez plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erreur du service IA");
    }

    const data = await response.json();
    console.log("AI response received");

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_phases") {
      throw new Error("Réponse IA invalide");
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log("Generated phases:", { base: result.basePhases?.length, complementary: result.complementaryPhases?.length });

    // Validate that base phases sum to ~100%
    const baseTotal = result.basePhases?.reduce((sum: number, p: any) => sum + (p.default_percentage || 0), 0) || 0;
    console.log("Base phases total:", baseTotal);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-phase-templates:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
