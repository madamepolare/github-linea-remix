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

type GenerationMode = 'percentage' | 'fixed' | 'complete';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      projectType, 
      projectDescription, 
      projectBudget,
      constructionBudget,
      feePercentage,
      projectSurface, 
      documentType,
      clientInfo,
      existingPricingItems,
      phaseTemplates,
      generationMode = 'complete',
      targetBudget,
      bpuItems,
      bpuName
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating quote:", { projectType, generationMode, constructionBudget, feePercentage, phasesCount: phaseTemplates?.length, targetBudget, hasBpu: !!bpuItems });

    // Calculate total fees for percentage mode
    const totalFees = constructionBudget && feePercentage 
      ? (constructionBudget * feePercentage) / 100 
      : null;

    // Build phase templates context for AI
    const phaseTemplatesContext = phaseTemplates && phaseTemplates.length > 0
      ? `\n\nPHASES DISPONIBLES (codes et % recommandés):\n${(phaseTemplates as PhaseTemplate[]).map(p => 
          `- ${p.code}: ${p.name}${p.description ? ` - ${p.description}` : ''}${p.default_percentage ? ` (${p.default_percentage}% recommandé)` : ''} [${p.category}]`
        ).join('\n')}`
      : '';

    // Build BPU context if provided
    const bpuContext = bpuItems && bpuItems.length > 0
      ? `\n\nGRILLE BPU "${bpuName || 'Grille tarifaire'}" - UTILISE CES RÉFÉRENCES:
${bpuItems.map((item: any) => 
  `- Réf: ${item.ref || 'N/A'} | ${item.name} | ${item.unit_price}€/${item.unit}${item.category ? ` [${item.category}]` : ''}`
).join('\n')}

IMPORTANT: Pour les prestations forfaitaires, utilise UNIQUEMENT les lignes de ce BPU avec leurs références exactes (pricing_ref).`
      : '';

    // Build mode-specific instructions
    let modeInstructions = '';
    const budgetTarget = targetBudget ? `\nBUDGET CIBLE: ${targetBudget}€ - ajuste les quantités/prestations pour s'en approcher` : '';
    
    switch (generationMode as GenerationMode) {
      case 'percentage':
        modeInstructions = `
MODE: HONORAIRES EN POURCENTAGE
- Génère UNIQUEMENT des lignes de type "phase" avec pricing_mode="percentage"
- Chaque phase doit avoir un percentage_fee correspondant à sa part des honoraires totaux
- Le total des percentage_fee doit faire ~100% (réparti selon importance)
- Calcule amount = (totalFees × percentage_fee) / 100
- Budget travaux: ${constructionBudget}€, Taux honoraires: ${feePercentage}%, Total honoraires: ${totalFees}€
- NE PAS générer de services forfaitaires, frais ou options${budgetTarget}`;
        break;
      case 'fixed':
        modeInstructions = `
MODE: PRESTATIONS FORFAITAIRES
- Génère des lignes de type "service", "option", "expense" avec pricing_mode="fixed"
- Propose des prestations à prix fixe adaptées au projet
${bpuContext ? '- UTILISE les lignes du BPU fourni avec leurs références (pricing_ref)' : '- Tu peux créer librement des services, options et frais'}
- NE PAS utiliser les phases en pourcentage
- Les montants doivent être réalistes pour le marché français${budgetTarget}`;
        break;
      case 'complete':
      default:
        modeInstructions = `
MODE: DEVIS COMPLET (phases % + forfaits)
- Génère des phases avec pricing_mode="percentage" pour les missions principales
- Le total des percentage_fee des phases doit faire ~100%
- Budget travaux: ${constructionBudget || 'non renseigné'}€, Taux: ${feePercentage || 12}%
- Ajoute aussi des services forfaitaires (pricing_mode="fixed") pour compléter
${bpuContext ? '- Pour les forfaits, UTILISE les lignes du BPU fourni avec leurs références' : ''}
- Inclus des options et frais pertinents
- Propose une structure équilibrée entre phases % et forfaits${budgetTarget}`;
        break;
    }

    const systemPrompt = `Tu es un expert en création de devis et propositions commerciales pour l'architecture, le design d'intérieur, la communication et la scénographie en France.

${modeInstructions}

RÈGLES POUR LES PHASES (si applicable):
- Utilise UNIQUEMENT les phases fournies dans "PHASES DISPONIBLES"
- Chaque phase doit avoir phase_code correspondant à un code de la liste
- Respecte les pourcentages recommandés comme base
${phaseTemplatesContext}
${bpuContext}

RÈGLES GÉNÉRALES:
- Les montants doivent être réalistes pour le marché français
- Les descriptions doivent être professionnelles
- Ajoute des livrables pertinents pour chaque phase/service
- Si un BPU est fourni, utilise le champ pricing_ref pour stocker la référence du BPU`;

    const pricingContext = existingPricingItems?.length > 0 
      ? `\n\nGrille tarifaire disponible:\n${existingPricingItems.map((item: any) => `- ${item.name}: ${item.unit_price}€/${item.unit}`).join('\n')}`
      : '';

    const userPrompt = `Crée un devis pour ce projet:

Type: ${projectType || 'Général'}
${projectDescription ? `Description: ${projectDescription}` : ''}
${constructionBudget ? `Budget travaux: ${constructionBudget}€` : ''}
${feePercentage ? `Taux honoraires: ${feePercentage}%` : ''}
${projectBudget ? `Budget projet: ${projectBudget}€` : ''}
${projectSurface ? `Surface: ${projectSurface}m²` : ''}
${clientInfo ? `Client: ${clientInfo}` : ''}
${targetBudget ? `Budget cible pour le devis: ${targetBudget}€` : ''}
${pricingContext}

Génère les lignes selon le mode demandé.`;

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
              description: "Génère un devis avec les lignes appropriées selon le mode demandé.",
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
                          description: "Code de phase (pour les phases uniquement)",
                          enum: allowedPhaseCodes.length > 0 ? allowedPhaseCodes : undefined
                        },
                        phase_name: { type: "string", description: "Nom de la ligne/prestation" },
                        phase_description: { type: "string", description: "Description détaillée" },
                        line_type: { 
                          type: "string", 
                          enum: ["phase", "service", "option", "expense", "discount"],
                          description: "Type de ligne"
                        },
                        pricing_mode: {
                          type: "string",
                          enum: ["percentage", "fixed"],
                          description: "Mode de tarification: percentage pour les phases en %, fixed pour les forfaits"
                        },
                        pricing_ref: {
                          type: "string",
                          description: "Référence BPU/marché de la ligne (si applicable)"
                        },
                        percentage_fee: { 
                          type: "number", 
                          description: "Pour pricing_mode=percentage: % des honoraires totaux (0-100)" 
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
                        deliverables: {
                          type: "array",
                          items: { type: "string" },
                          description: "Liste des livrables"
                        }
                      },
                      required: ["phase_name", "line_type", "pricing_mode", "quantity", "unit", "unit_price", "amount", "is_included"]
                    }
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
    console.log("Generated quote with", result.lines?.length, "lines, mode:", generationMode);

    // Validate and process lines
    const validatedLines = result.lines.map((line: any, index: number) => {
      // If it's a phase type with percentage mode, validate the code
      if (line.line_type === 'phase' && line.phase_code) {
        const isValidCode = allowedPhaseCodes.includes(line.phase_code);
        if (!isValidCode) {
          console.warn(`Invalid phase code ${line.phase_code} - converting to service`);
          return {
            ...line,
            id: `ai-${Date.now()}-${index}`,
            sort_order: index,
            line_type: 'service',
            pricing_mode: 'fixed',
            phase_code: undefined,
            billing_type: line.billing_type || 'one_time',
            is_optional: line.line_type === 'option'
          };
        }
      }

      // Recalculate amount for percentage mode if we have the budget
      let amount = line.amount;
      if (line.pricing_mode === 'percentage' && totalFees && line.percentage_fee) {
        amount = Math.round((totalFees * line.percentage_fee) / 100);
      }
      
      return {
        ...line,
        id: `ai-${Date.now()}-${index}`,
        sort_order: index,
        amount,
        unit_price: amount, // For percentage mode, unit_price = amount
        billing_type: line.billing_type || 'one_time',
        is_optional: line.line_type === 'option',
        pricing_mode: line.pricing_mode || 'fixed'
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