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
    const { pipelineName, pipelineType, targetContactType, objective } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const contextInfo = pipelineType === "contact" 
      ? `Pipeline de prospection/nurturing pour des contacts de type: ${targetContactType || "général"}`
      : "Pipeline commercial pour gérer des opportunités de vente";

    const systemPrompt = `Tu es un expert en CRM et en processus commerciaux pour des agences d'architecture et bureaux d'études.
Tu dois générer:
1. Des étapes de pipeline pertinentes et professionnelles
2. Un prompt IA de base pour générer les emails de ce pipeline
3. Pour chaque étape nécessitant un email, un prompt IA spécifique à cette étape

Pour les étapes, chaque étape doit avoir:
- Un nom court et clair (max 25 caractères)
- Une couleur hex appropriée (utilise ces couleurs: #6B7280, #3B82F6, #8B5CF6, #EC4899, #F97316, #22C55E, #EF4444)
- Une probabilité de conversion (0-100%)
- requires_email_on_enter: boolean (true si cette étape nécessite l'envoi d'un email)
- is_final_stage: boolean (true uniquement pour la dernière étape de succès ou d'échec)
- email_ai_prompt: string (prompt IA spécifique pour générer l'email de cette étape, seulement si requires_email_on_enter est true)

Pour le prompt email IA global (email_ai_prompt):
- C'est un prompt de base qui sera utilisé pour générer automatiquement les emails
- Il doit décrire le ton, le style et les objectifs de communication de ce pipeline
- Maximum 300 caractères

Pour les prompts email par étape:
- Chaque étape avec requires_email_on_enter=true doit avoir son propre email_ai_prompt
- Ce prompt décrit spécifiquement l'objectif et le contenu attendu de l'email pour cette étape
- Maximum 200 caractères

Génère entre 4 et 7 étapes logiques qui suivent un parcours cohérent du début à la fin.`;

    const userPrompt = `Génère des étapes de pipeline et des prompts email IA pour:
- Nom du pipeline: ${pipelineName}
- Type: ${contextInfo}
- Objectif/Description: ${objective || "Non spécifié"}

Retourne les étapes dans l'ordre logique du parcours client, avec un prompt IA global pour la génération d'emails, et un prompt spécifique pour chaque étape nécessitant un email.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_pipeline_config",
              description: "Crée les étapes du pipeline et le prompt email IA",
              parameters: {
                type: "object",
                properties: {
                  stages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nom de l'étape (max 25 caractères)" },
                        color: { type: "string", description: "Couleur hex de l'étape" },
                        probability: { type: "number", description: "Probabilité de conversion 0-100" },
                        requires_email_on_enter: { type: "boolean", description: "Si un email est requis" },
                        is_final_stage: { type: "boolean", description: "Si c'est une étape finale" },
                        email_ai_prompt: { type: "string", description: "Prompt IA pour générer l'email de cette étape (si requires_email_on_enter est true)" },
                      },
                      required: ["name", "color", "probability", "requires_email_on_enter", "is_final_stage"],
                      additionalProperties: false,
                    },
                  },
                  email_ai_prompt: {
                    type: "string",
                    description: "Prompt IA de base pour générer les emails de ce pipeline (max 300 caractères)"
                  },
                },
                required: ["stages", "email_ai_prompt"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_pipeline_config" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "create_pipeline_config") {
      throw new Error("Invalid AI response format");
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log("Generated pipeline config:", result);

    return new Response(
      JSON.stringify({ 
        stages: result.stages,
        email_ai_prompt: result.email_ai_prompt 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating pipeline stages:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
