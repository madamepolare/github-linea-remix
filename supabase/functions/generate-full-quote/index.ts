import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PhaseTemplate {
  code: string;
  name: string;
  description?: string;
  default_percentage?: number;
  category: 'base' | 'complementary';
  deliverables?: string[];
}

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
      existingPricingItems,
      phaseTemplates
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating full quote for:", { projectType, documentType, projectBudget, projectSurface, phasesCount: phaseTemplates?.length });

    // Build phase templates context for AI
    const phaseTemplatesContext = phaseTemplates && phaseTemplates.length > 0
      ? `\n\nPHASES DISPONIBLES (UTILISE UNIQUEMENT CELLES-CI):\n${(phaseTemplates as PhaseTemplate[]).map(p => 
          `- ${p.code}: ${p.name}${p.description ? ` - ${p.description}` : ''}${p.default_percentage ? ` (${p.default_percentage}% recommandé)` : ''} [${p.category}]`
        ).join('\n')}`
      : '';

    const systemPrompt = `Tu es un expert en création de devis et propositions commerciales pour l'architecture, le design d'intérieur, la communication et la scénographie en France.

Tu crées des devis complets et professionnels adaptés au projet décrit.

RÈGLE CRITIQUE - PHASES:
- Tu DOIS utiliser UNIQUEMENT les phases fournies dans la liste "PHASES DISPONIBLES"
- NE CRÉE PAS de nouvelles phases ou codes de phase
- Chaque ligne de type "phase" doit avoir un phase_code correspondant exactement à un code de la liste
- Tu peux ajouter des lignes de type "service", "expense", "option" ou "discount" librement
- Respecte les pourcentages recommandés quand ils sont fournis

Autres règles:
- Propose une structure logique avec les phases disponibles
- Les montants doivent être réalistes pour le marché français
- Ajoute des options pertinentes pour upsell
- Inclus les frais habituels (déplacements, impressions, etc.)
- Les descriptions doivent être professionnelles et détaillées
${phaseTemplatesContext}`;

    const pricingContext = existingPricingItems?.length > 0 
      ? `\n\nGrille tarifaire disponible (tu peux t'en inspirer pour les services):\n${existingPricingItems.map((item: any) => `- ${item.name}: ${item.unit_price}€/${item.unit}`).join('\n')}`
      : '';

    const userPrompt = `Crée un devis complet pour ce projet:

Type de document: ${documentType === 'quote' ? 'Devis' : documentType === 'contract' ? 'Contrat' : 'Proposition'}
Type de projet: ${projectType || 'Général'}
${projectDescription ? `Description: ${projectDescription}` : ''}
${projectBudget ? `Budget travaux/référence: ${projectBudget}€` : ''}
${projectSurface ? `Surface: ${projectSurface}m²` : ''}
${clientInfo ? `Client: ${clientInfo}` : ''}
${pricingContext}

IMPORTANT: Utilise UNIQUEMENT les phases de la liste fournie. Génère un devis structuré avec les lignes appropriées.`;

    // Build allowed phase codes for validation
    const allowedPhaseCodes = phaseTemplates?.map((p: PhaseTemplate) => p.code) || [];

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
              description: "Génère un devis complet avec toutes les lignes. Pour les phases, utilise UNIQUEMENT les codes fournis.",
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
                        phase_code: { 
                          type: "string", 
                          description: "Code de phase (DOIT correspondre à un code de la liste fournie)",
                          enum: allowedPhaseCodes.length > 0 ? allowedPhaseCodes : undefined
                        },
                        phase_name: { type: "string", description: "Nom de la ligne/prestation" },
                        phase_description: { type: "string", description: "Description détaillée" },
                        line_type: { 
                          type: "string", 
                          enum: ["phase", "service", "option", "expense", "discount"],
                          description: "Type de ligne - utilise 'phase' uniquement avec les codes fournis"
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
    console.log("AI response received");

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_quote") {
      throw new Error("Réponse IA invalide");
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log("Generated quote with", result.lines?.length, "lines");

    // Validate and filter phase codes - only allow codes from the provided templates
    const validatedLines = result.lines.map((line: any, index: number) => {
      // If it's a phase type, validate the code
      if (line.line_type === 'phase' && line.phase_code) {
        const isValidCode = allowedPhaseCodes.includes(line.phase_code);
        if (!isValidCode) {
          console.warn(`Invalid phase code ${line.phase_code} - converting to service`);
          return {
            ...line,
            id: `ai-${Date.now()}-${index}`,
            sort_order: index,
            line_type: 'service', // Convert to service if code is invalid
            phase_code: undefined,
            billing_type: line.billing_type || 'one_time',
            is_optional: line.line_type === 'option'
          };
        }
      }
      
      return {
        ...line,
        id: `ai-${Date.now()}-${index}`,
        sort_order: index,
        billing_type: line.billing_type || 'one_time',
        is_optional: line.line_type === 'option'
      };
    });

    return new Response(JSON.stringify({
      ...result,
      lines: validatedLines
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
