import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  type: 'skills' | 'pricing_grid' | 'quote_template' | 'contract_types';
  discipline_name: string;
  discipline_description?: string;
  contract_type_name?: string;
  existing_skills?: string[];
  custom_prompt?: string;
  existing_phases?: { code: string; name: string; percentage: number; category: string }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, discipline_name, discipline_description, contract_type_name, existing_skills, custom_prompt, existing_phases } = await req.json() as GenerateRequest;

    console.log(`[generate-discipline-content] Generating ${type} for discipline: ${discipline_name}`);
    console.log(`[generate-discipline-content] Description: ${discipline_description || 'none'}`);
    console.log(`[generate-discipline-content] Custom prompt: ${custom_prompt || 'none'}`);
    console.log(`[generate-discipline-content] Existing phases: ${existing_phases?.length || 0}`);

    // Get the API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[generate-discipline-content] LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let prompt = '';
    let systemPrompt = '';

    // Build context about the discipline
    const disciplineContext = `
DISCIPLINE: "${discipline_name}"
${discipline_description ? `DESCRIPTION: ${discipline_description}` : ''}

IMPORTANT: Génère du contenu SPÉCIFIQUEMENT adapté à cette discipline.
- Si c'est une agence de communication/publicité → génère des rôles comme Directeur Artistique, Concepteur-Rédacteur, Chef de Pub, etc.
- Si c'est un cabinet d'architecture → génère des rôles comme Architecte, Architecte d'intérieur, Dessinateur-Projeteur, etc.
- Si c'est un bureau d'études → génère des rôles techniques comme Ingénieur Structure, Thermicien, etc.
- NE GÉNÈRE PAS de contenu générique ou inadapté à la discipline.
`.trim();

    if (type === 'skills') {
      systemPrompt = `Tu es un expert RH spécialisé dans les agences créatives et bureaux d'études.
Tu connais parfaitement les métiers et compétences de chaque secteur.
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication, sans texte avant ou après.`;
      
      prompt = `${disciplineContext}

Génère une liste de 8-12 métiers/compétences SPÉCIFIQUES à cette discipline "${discipline_name}".

EXEMPLES PAR DISCIPLINE:
- Agence de communication/pub: Directeur Artistique, Concepteur-Rédacteur, Chef de Publicité, Planneur Stratégique, Motion Designer, Social Media Manager...
- Cabinet d'architecture: Architecte DPLG, Architecte d'intérieur, Urbaniste, Dessinateur-Projeteur, Économiste de la construction...
- Bureau d'études techniques: Ingénieur Structure, Ingénieur Fluides, Thermicien, Acousticien, BIM Manager...
- Agence digitale: UX Designer, UI Designer, Développeur Front, Product Owner, Growth Hacker...

Pour chaque compétence:
- label: Nom du métier en français (PAS de termes génériques comme "Consultant" ou "Expert")
- daily_rate: Taux journalier de vente en EUR (400-1200 selon séniorité)
- cost_daily_rate: Coût journalier (50-65% du taux de vente)
- description: Description courte du rôle (1 phrase)
- color: Une couleur parmi #3b82f6, #22c55e, #f59e0b, #ef4444, #8b5cf6, #ec4899, #06b6d4, #84cc16, #f97316, #6366f1

Réponds avec un JSON array uniquement:
[{"label": "...", "daily_rate": number, "cost_daily_rate": number, "description": "...", "color": "..."}]`;
    } 
    else if (type === 'pricing_grid') {
      systemPrompt = `Tu es un expert en tarification d'agences créatives et bureaux d'études français.
Tu connais les tarifs du marché par secteur.
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication.`;
      
      const skillsList = existing_skills?.join(', ') || '';
      prompt = `${disciplineContext}

Génère une grille tarifaire pour ces compétences: ${skillsList}.

Pour chaque compétence, génère 4 niveaux d'expérience avec tarifs réalistes en EUR:
- junior: 0-2 ans
- confirmed: 2-5 ans
- senior: 5-10 ans  
- expert: 10+ ans

Réponds avec un JSON array:
[{"skill_name": "...", "experience_level": "junior|confirmed|senior|expert", "hourly_rate": number, "daily_rate": number}]`;
    }
    else if (type === 'quote_template') {
      systemPrompt = `Tu es un expert commercial spécialisé dans les agences créatives et bureaux d'études.
Tu connais les phases et livrables typiques de chaque secteur.
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication.`;
      
      const customContext = custom_prompt 
        ? `\n\nINSTRUCTIONS SPÉCIFIQUES DE L'UTILISATEUR:\n"${custom_prompt}"\n\nAdapte le template en fonction de ces instructions.`
        : '';

      // Build phases context from existing phases
      let phasesContext = '';
      if (existing_phases && existing_phases.length > 0) {
        const phasesList = existing_phases.map(p => `- ${p.code}: ${p.name} (${p.percentage}%, ${p.category})`).join('\n');
        phasesContext = `

PHASES DISPONIBLES (définies dans les paramètres):
${phasesList}

IMPORTANT: Tu DOIS utiliser UNIQUEMENT ces phases existantes. 
- Utilise les codes et noms exacts fournis
- Tu peux ajuster les pourcentages si pertinent pour le contexte
- Ne génère PAS de nouvelles phases qui ne sont pas dans cette liste`;
      }

      prompt = `${disciplineContext}
${customContext}
${phasesContext}

Génère un template de devis pour:
- Type de contrat: ${contract_type_name || 'Mission standard'}

Inclus:
- name: Nom du template (adapté aux instructions si fournies)
- description: Description
- default_phases: Array de phases avec {phase_name, phase_code (court), description, percentage}
  ${existing_phases?.length ? '→ Utilise UNIQUEMENT les phases de la liste fournie' : ''}
- default_terms: Conditions générales courtes

Réponds avec un JSON object:
{"name": "...", "description": "...", "default_phases": [{"phase_name": "...", "phase_code": "...", "description": "...", "percentage": number}], "default_terms": "..."}`;
    }
    else if (type === 'contract_types') {
      systemPrompt = `Tu es un expert en gestion commerciale d'agences créatives et bureaux d'études.
Tu connais les types de missions de chaque secteur.
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication.`;
      
      prompt = `${disciplineContext}

Génère 4-6 types de contrats SPÉCIFIQUES à la discipline "${discipline_name}".

EXEMPLES PAR DISCIPLINE:
- Agence de comm: Campagne 360°, Identité de marque, Activation, Contenu social, Stratégie de marque...
- Architecture: Mission complète, Esquisse seule, Permis de construire, Aménagement intérieur, Urbanisme...
- Bureau d'études: Mission complète OPC, Études thermiques, Études structure, Audit énergétique...
- Agence digitale: Site vitrine, Application mobile, Refonte UX, Maintenance évolutive...

Pour chaque type:
- name: Nom en français
- code: Code court (3-6 lettres, ex: CAMP, BRAND, MPC)
- description: Description courte
- icon: Parmi 'FileText', 'Building2', 'Sofa', 'Theater', 'Megaphone', 'Palette', 'Globe'
- color: Parmi #3B82F6, #8B5CF6, #EC4899, #F59E0B, #10B981, #06B6D4, #EF4444
- default_fields: {surface: boolean, construction_budget: boolean, address: boolean, city: boolean, budget: boolean}
- builder_tabs: Array parmi ['general', 'fees', 'lines', 'production', 'planning', 'terms']

Réponds avec un JSON array:
[{"name": "...", "code": "...", "description": "...", "icon": "...", "color": "...", "default_fields": {...}, "builder_tabs": [...]}]`;
    }

    // Call Lovable AI Gateway with correct URL and API key
    const gatewayUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
    
    console.log('[generate-discipline-content] Calling AI Gateway...');
    
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-discipline-content] AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Payment required. Please add credits to your workspace.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';
    
    console.log('[generate-discipline-content] Raw response:', generatedText.substring(0, 300));

    // Parse JSON from response
    let result;
    try {
      // Remove markdown code blocks if present
      let cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Try to fix truncated JSON arrays
      if (cleanedText.startsWith('[') && !cleanedText.endsWith(']')) {
        console.log('[generate-discipline-content] JSON appears truncated, attempting to fix...');
        // Find the last complete object
        const lastCompleteIndex = cleanedText.lastIndexOf('},');
        if (lastCompleteIndex > 0) {
          cleanedText = cleanedText.substring(0, lastCompleteIndex + 1) + ']';
          console.log('[generate-discipline-content] Fixed truncated array');
        }
      }
      
      result = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('[generate-discipline-content] JSON parse error:', parseError);
      console.error('[generate-discipline-content] Raw text was:', generatedText.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('[generate-discipline-content] Successfully generated', type, '- items:', Array.isArray(result) ? result.length : 1);

    return new Response(JSON.stringify({ 
      success: true, 
      type,
      data: result 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-discipline-content] Error:', errorMessage);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
