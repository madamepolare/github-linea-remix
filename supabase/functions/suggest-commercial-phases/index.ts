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
    const { projectType, projectDescription, projectBudget, projectSurface, documentType, feePercentage: inputFeePercentage } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating phase suggestions for:", { projectType, documentType, projectBudget, projectSurface, inputFeePercentage });

    const systemPrompt = `Tu es un expert en contrats de maîtrise d'œuvre pour l'architecture et le design d'intérieur en France. 
Tu connais parfaitement la Loi MOP, les contrats types de l'Ordre des Architectes, et les pratiques du marché.

Tu dois proposer une répartition optimale des phases de mission avec leurs pourcentages d'honoraires, adaptée au projet spécifique.

Règles importantes:
- Le total des pourcentages DOIT faire exactement 100%
- Adapte les phases selon le type de projet et sa complexité
- Pour les projets d'intérieur, certaines phases architecture (PC, VISA) peuvent être désactivées
- Pour les petits budgets, suggère de regrouper certaines phases
- Propose des pourcentages réalistes basés sur les pratiques du marché

Types de projet:
- "interior": Architecture d'intérieur (rénovation, aménagement)
- "architecture": Architecture (construction, extension)
- "scenography": Scénographie (exposition, muséographie)`;

    const userPrompt = `Projet: ${documentType === 'quote' ? 'Devis' : documentType === 'contract' ? 'Contrat' : 'Proposition'}
Type: ${projectType === 'interior' ? 'Architecture d\'intérieur' : projectType === 'architecture' ? 'Architecture' : 'Scénographie'}
${projectDescription ? `Description: ${projectDescription}` : ''}
${projectBudget ? `Budget travaux estimé: ${projectBudget}€` : ''}
${projectSurface ? `Surface: ${projectSurface}m²` : ''}

Propose une répartition optimale des phases avec leurs pourcentages. Réponds avec les phases adaptées à ce projet.`;

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
              name: "suggest_phases",
              description: "Retourne les phases recommandées avec leurs pourcentages d'honoraires",
              parameters: {
                type: "object",
                properties: {
                  phases: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        code: { type: "string", description: "Code de la phase (ex: ESQ, APS, APD)" },
                        name: { type: "string", description: "Nom complet de la phase" },
                        description: { type: "string", description: "Description courte de la phase" },
                        percentage: { type: "number", description: "Pourcentage des honoraires (0-100)" },
                        isIncluded: { type: "boolean", description: "Si la phase est recommandée pour ce projet" },
                        deliverables: {
                          type: "array",
                          items: { type: "string" },
                          description: "Liste des livrables de cette phase"
                        }
                      },
                      required: ["code", "name", "percentage", "isIncluded", "deliverables"]
                    }
                  },
                  feePercentage: {
                    type: "number",
                    description: "Pourcentage d'honoraires recommandé par rapport au budget travaux (ex: 10 pour 10%)"
                  },
                  reasoning: {
                    type: "string",
                    description: "Explication courte de la recommandation"
                  }
                },
                required: ["phases", "reasoning"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_phases" } }
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
    console.log("AI response received:", JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "suggest_phases") {
      throw new Error("Réponse IA invalide");
    }

    const suggestions = JSON.parse(toolCall.function.arguments);
    console.log("Parsed suggestions:", suggestions);

    // Calculate amounts based on budget and fee percentage
    const effectiveFeePercentage = inputFeePercentage || suggestions.feePercentage || 12;
    const totalFee = projectBudget ? (projectBudget * effectiveFeePercentage / 100) : 0;
    
    // Add amounts to each phase
    const phasesWithAmounts = suggestions.phases.map((phase: any) => ({
      ...phase,
      amount: phase.isIncluded ? Math.round(totalFee * phase.percentage / 100) : 0
    }));

    const result = {
      ...suggestions,
      phases: phasesWithAmounts,
      feePercentage: effectiveFeePercentage,
      totalFee
    };

    console.log("Final result with amounts:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in suggest-commercial-phases:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
