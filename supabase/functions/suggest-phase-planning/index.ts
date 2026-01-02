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
    const { 
      phases, 
      projectType, 
      projectStartDate, 
      projectEndDate,
      projectDescription,
      projectBudget,
      projectSurface 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Planning phases:", { phases: phases?.length, projectType, projectStartDate, projectEndDate });

    // Calculate project duration in days
    const start = new Date(projectStartDate);
    const end = projectEndDate ? new Date(projectEndDate) : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const phasesList = phases.map((p: any) => `- ${p.name} (${p.percentage_fee || 15}%)`).join('\n');

    const systemPrompt = `Tu es un expert en planification de projets d'architecture et de design d'intérieur en France.
Tu connais les durées typiques des différentes phases de mission selon la Loi MOP.

Tu dois proposer un planning réaliste des phases en fonction:
- Du type de projet
- De la durée totale disponible
- Des pourcentages d'honoraires (qui reflètent l'importance relative de chaque phase)
- Des contraintes administratives (délais d'instruction PC, etc.)

Règles importantes:
- Les phases doivent être séquentielles mais peuvent se chevaucher légèrement
- ESQ/APS sont généralement plus courts
- APD/PRO nécessitent plus de temps pour les détails techniques
- La phase DCE/ACT dépend du type de consultation
- DET/AOR dépendent de la durée des travaux
- Pour un projet d'intérieur sans PC, certaines phases sont plus courtes`;

    const userPrompt = `Projet ${projectType === 'interior' ? "d'architecture d'intérieur" : projectType === 'architecture' ? "d'architecture" : "de scénographie"}
${projectDescription ? `Description: ${projectDescription}` : ''}
${projectBudget ? `Budget: ${projectBudget.toLocaleString('fr-FR')}€` : ''}
${projectSurface ? `Surface: ${projectSurface}m²` : ''}

Date de début: ${projectStartDate}
Date de fin souhaitée: ${projectEndDate || 'Non définie (12 mois par défaut)'}
Durée totale: ${totalDays} jours

Phases à planifier:
${phasesList}

Propose des dates de début et fin pour chaque phase, en respectant la durée totale du projet.`;

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
              name: "plan_phases",
              description: "Retourne le planning des phases avec dates de début et fin",
              parameters: {
                type: "object",
                properties: {
                  planned_phases: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nom de la phase" },
                        start_date: { type: "string", description: "Date de début au format YYYY-MM-DD" },
                        end_date: { type: "string", description: "Date de fin au format YYYY-MM-DD" },
                        duration_days: { type: "number", description: "Durée en jours" },
                        notes: { type: "string", description: "Notes sur cette phase (optionnel)" }
                      },
                      required: ["name", "start_date", "end_date", "duration_days"]
                    }
                  },
                  summary: {
                    type: "string",
                    description: "Résumé du planning proposé"
                  },
                  warnings: {
                    type: "array",
                    items: { type: "string" },
                    description: "Alertes ou recommandations"
                  }
                },
                required: ["planned_phases", "summary"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "plan_phases" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes dépassée" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erreur du service IA");
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "plan_phases") {
      throw new Error("Réponse IA invalide");
    }

    const planning = JSON.parse(toolCall.function.arguments);
    console.log("Parsed planning:", planning);

    return new Response(JSON.stringify(planning), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in suggest-phase-planning:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
