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
      projectType, 
      projectDescription, 
      projectBudget, 
      projectSurface, 
      documentType,
      clientInfo,
      existingPricingItems 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating full quote for:", { projectType, documentType, projectBudget, projectSurface });

    const systemPrompt = `Tu es un expert en création de devis et propositions commerciales pour l'architecture, le design d'intérieur, la communication et la scénographie en France.

Tu crées des devis complets et professionnels adaptés au projet décrit.

Règles importantes:
- Propose une structure logique avec phases, prestations et options
- Les montants doivent être réalistes pour le marché français
- Ajoute des options pertinentes pour upsell
- Inclus les frais habituels (déplacements, impressions, etc.)
- Adapte le nombre de lignes à la complexité du projet (5-15 lignes généralement)
- Pour l'architecture/intérieur: utilise les phases classiques (ESQ, APS, APD, PRO, ACT, DET, AOR)
- Pour la communication: propose des prestations créatives et de production
- Les descriptions doivent être professionnelles et détaillées`;

    const pricingContext = existingPricingItems?.length > 0 
      ? `\n\nGrille tarifaire disponible (tu peux t'en inspirer):\n${existingPricingItems.map((item: any) => `- ${item.name}: ${item.unit_price}€/${item.unit}`).join('\n')}`
      : '';

    const userPrompt = `Crée un devis complet pour ce projet:

Type de document: ${documentType === 'quote' ? 'Devis' : documentType === 'contract' ? 'Contrat' : 'Proposition'}
Type de projet: ${projectType || 'Général'}
${projectDescription ? `Description: ${projectDescription}` : ''}
${projectBudget ? `Budget travaux/référence: ${projectBudget}€` : ''}
${projectSurface ? `Surface: ${projectSurface}m²` : ''}
${clientInfo ? `Client: ${clientInfo}` : ''}
${pricingContext}

Génère un devis structuré avec les lignes appropriées.`;

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
              name: "generate_quote",
              description: "Génère un devis complet avec toutes les lignes",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Titre suggéré pour le devis"
                  },
                  lines: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        phase_code: { type: "string", description: "Code court (ex: ESQ, APD, PROD)" },
                        phase_name: { type: "string", description: "Nom de la ligne/prestation" },
                        phase_description: { type: "string", description: "Description détaillée" },
                        line_type: { 
                          type: "string", 
                          enum: ["phase", "service", "option", "expense", "discount"],
                          description: "Type de ligne"
                        },
                        quantity: { type: "number", description: "Quantité" },
                        unit: { type: "string", description: "Unité (forfait, heure, jour, m², etc.)" },
                        unit_price: { type: "number", description: "Prix unitaire HT en euros" },
                        amount: { type: "number", description: "Montant total HT en euros" },
                        is_included: { type: "boolean", description: "Inclus dans le total (false pour les options)" },
                        billing_type: { 
                          type: "string",
                          enum: ["one_time", "monthly", "quarterly", "yearly"],
                          description: "Type de facturation"
                        },
                        percentage_fee: { 
                          type: "number", 
                          description: "Pour les phases: pourcentage du budget (optionnel)" 
                        },
                        deliverables: {
                          type: "array",
                          items: { type: "string" },
                          description: "Liste des livrables (optionnel)"
                        }
                      },
                      required: ["phase_name", "line_type", "quantity", "unit", "unit_price", "amount", "is_included"]
                    }
                  },
                  feePercentage: {
                    type: "number",
                    description: "Pourcentage global d'honoraires par rapport au budget (si applicable)"
                  },
                  reasoning: {
                    type: "string",
                    description: "Explication courte des choix effectués"
                  }
                },
                required: ["title", "lines", "reasoning"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_quote" } }
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
    if (!toolCall || toolCall.function.name !== "generate_quote") {
      throw new Error("Réponse IA invalide");
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log("Generated quote:", result);

    // Add IDs and sort order to lines
    const linesWithIds = result.lines.map((line: any, index: number) => ({
      ...line,
      id: `ai-${Date.now()}-${index}`,
      sort_order: index,
      billing_type: line.billing_type || 'one_time',
      is_optional: line.line_type === 'option'
    }));

    return new Response(JSON.stringify({
      ...result,
      lines: linesWithIds
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-full-quote:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
