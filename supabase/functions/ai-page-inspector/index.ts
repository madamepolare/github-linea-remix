import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzablePage {
  id: string;
  name: string;
  route: string;
  description: string;
  expectedFeatures: string[];
  styleGuide: string[];
}

interface InspectorRequest {
  page: AnalyzablePage;
  additionalContext?: string;
}

interface Issue {
  id: string;
  type: 'graphique' | 'comportement' | 'accessibilite' | 'responsive' | 'ux';
  severity: 'critique' | 'important' | 'mineur';
  title: string;
  description: string;
  location: string;
  lovablePrompt: string;
}

interface InspectorResponse {
  pageName: string;
  overallScore: number;
  issues: Issue[];
  suggestions: string[];
  analyzedAt: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { page, additionalContext } = await req.json() as InspectorRequest;

    console.log(`[AI Page Inspector] Analyzing page: ${page.name}`);

    const systemPrompt = `Tu es un expert UI/UX spécialisé dans l'analyse d'applications web React/Tailwind. 
Tu dois analyser une page d'application et identifier les problèmes potentiels.

CRITÈRES D'ANALYSE:
1. **Cohérence graphique**: Padding, margins, couleurs, typographie, espacements
2. **Comportements manquants**: États loading, empty, error, hover, focus
3. **Accessibilité**: Contraste, labels, navigation clavier, ARIA
4. **Responsive**: Adaptation mobile/tablet, breakpoints
5. **UX Patterns**: Feedback utilisateur, confirmations, micro-interactions

RÈGLES DE SCORING:
- 100: Parfait, aucun problème
- 80-99: Excellent, problèmes mineurs
- 60-79: Bon, quelques améliorations nécessaires
- 40-59: Moyen, problèmes importants
- 0-39: Critique, refonte nécessaire

RÈGLES POUR LES PROMPTS LOVABLE:
- Sois précis et actionnable
- Mentionne les composants spécifiques
- Indique les valeurs Tailwind exactes quand possible
- Utilise le vocabulaire technique approprié

Réponds UNIQUEMENT avec un JSON valide, sans markdown ni texte autour.`;

    const userPrompt = `Analyse cette page et génère un rapport d'inspection:

**Page**: ${page.name}
**Route**: ${page.route}
**Description**: ${page.description}

**Fonctionnalités attendues**:
${page.expectedFeatures.map(f => `- ${f}`).join('\n')}

**Guide de style attendu**:
${page.styleGuide.map(s => `- ${s}`).join('\n')}

${additionalContext ? `**Contexte additionnel**: ${additionalContext}` : ''}

Génère un JSON avec cette structure exacte:
{
  "pageName": "${page.name}",
  "overallScore": <number 0-100>,
  "issues": [
    {
      "id": "<unique-id>",
      "type": "<graphique|comportement|accessibilite|responsive|ux>",
      "severity": "<critique|important|mineur>",
      "title": "<titre court>",
      "description": "<description détaillée du problème>",
      "location": "<où dans la page>",
      "lovablePrompt": "<prompt Lovable pour corriger>"
    }
  ],
  "suggestions": ["<suggestion d'amélioration générale>"]
}

Génère entre 3 et 8 issues réalistes basées sur les patterns communs d'erreurs UI/UX dans les applications similaires.`;

    console.log('[AI Page Inspector] Calling AI model...');

    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Page Inspector] API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('[AI Page Inspector] Raw AI response:', content);

    // Parse the JSON response
    let result: InspectorResponse;
    try {
      // Clean the response (remove potential markdown code blocks)
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      result = JSON.parse(cleanedContent);
      result.analyzedAt = new Date().toISOString();
    } catch (parseError) {
      console.error('[AI Page Inspector] Failed to parse AI response:', parseError);
      // Return a fallback response
      result = {
        pageName: page.name,
        overallScore: 75,
        issues: [
          {
            id: 'parse-error',
            type: 'ux',
            severity: 'mineur',
            title: 'Analyse incomplète',
            description: 'L\'analyse IA n\'a pas pu être complètement parsée. Veuillez réessayer.',
            location: 'Général',
            lovablePrompt: 'Réessayer l\'analyse de la page',
          },
        ],
        suggestions: ['Réessayer l\'analyse pour obtenir des résultats complets'],
        analyzedAt: new Date().toISOString(),
      };
    }

    console.log('[AI Page Inspector] Analysis complete:', result.pageName, 'Score:', result.overallScore);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Page Inspector] Error:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        pageName: 'Erreur',
        overallScore: 0,
        issues: [],
        suggestions: [],
        analyzedAt: new Date().toISOString(),
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
