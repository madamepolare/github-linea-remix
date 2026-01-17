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
    const { projectType, projectTypeLabel, discipline, disciplineName, customPrompt } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating phase templates for:", { projectType, projectTypeLabel, discipline, disciplineName, customPrompt });

    // Build discipline-specific guidance
    const disciplineGuidance: Record<string, string> = {
      architecture: `Tu es expert en architecture en France. Base-toi sur la loi MOP:
- Phases de base: ESQ (Esquisse), APS (Avant-Projet Sommaire), APD (Avant-Projet Définitif), PRO (Projet), ACT (Assistance Contrats Travaux), VISA (Visa), DET (Direction Exécution Travaux), AOR (Assistance Opérations Réception)
- Les livrables doivent être conformes aux standards de la profession d'architecte
- Respecte les usages et terminologies de l'Ordre des Architectes`,
      scenographie: `Tu es expert en scénographie d'exposition et muséographie en France:
- Phases typiques: DIAG (Diagnostic), CONCEPT (Conception), AVP (Avant-Projet), DEV (Développement), TECH (Études Techniques), PROD (Production), MONTAGE, EXPLOITATION
- Inclure les spécificités muséographiques: parcours visiteur, éclairage scénique, médiation, interactivité
- Adapter aux standards des musées et lieux d'exposition`,
      communication: `Tu es expert en communication et design graphique:
- Phases créatives: BRIEF, AUDIT, STRAT (Stratégie), CONCEPT, CREA (Création), PROD (Production), DEPLOY (Déploiement)
- Inclure les livrables digitaux et print
- Adapter aux campagnes de communication, identité visuelle, branding`,
      interior: `Tu es expert en architecture d'intérieur et design d'espace:
- Phases: DIAG (Diagnostic), CONCEPT, APS (Avant-Projet Sommaire), APD (Avant-Projet Définitif), PRO (Projet), SUIVI (Suivi de chantier)
- Inclure les spécificités décoration, aménagement, mobilier
- Adapter aux projets résidentiels et tertiaires`
    };

    const disciplineContext = disciplineGuidance[discipline] || disciplineGuidance.architecture;

    // Build the user prompt based on whether there's a custom prompt
    let userPrompt = '';
    if (customPrompt) {
      userPrompt = `Génère les phases de mission adaptées pour: "${customPrompt}"

Cette mission est dans le cadre de la discipline "${disciplineName || discipline}" et du type de projet "${projectTypeLabel || projectType}".

Fournis:
1. Les phases de BASE (mission principale) dont la somme des pourcentages = 100%
2. Les phases COMPLÉMENTAIRES (optionnelles, prestations additionnelles)

IMPORTANT: Adapte les phases spécifiquement pour "${customPrompt}". Ne génère que les phases pertinentes pour ce type de mission.`;
    } else {
      userPrompt = `Génère les phases de mission standards pour un projet de type "${projectTypeLabel || projectType}".

Fournis:
1. Les phases de BASE (mission principale) dont la somme des pourcentages = 100%
2. Les phases COMPLÉMENTAIRES (optionnelles, prestations additionnelles)

Chaque phase doit avoir un code court, un nom clair, une description, un pourcentage par défaut et une liste de livrables.`;
    }

    const systemPrompt = `${disciplineContext}

Tu génères des templates de phases de mission professionnelles et réalistes pour la discipline "${disciplineName || discipline}".

Règles importantes:
- Génère entre 3 et 10 phases de base qui totalisent exactement 100%
- Génère 2-5 phases complémentaires optionnelles
- Les codes doivent être courts (2-5 caractères), en majuscules
- Respecte les standards du métier en France pour cette discipline
- Les livrables doivent être concrets et professionnels
- Les descriptions doivent être claires et informatives
- Adapte les phases au contexte spécifique demandé`;

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
