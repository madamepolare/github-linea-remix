import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  type: 'skills' | 'pricing_grid' | 'quote_template';
  discipline_name: string;
  discipline_description?: string;
  contract_type_name?: string;
  existing_skills?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, discipline_name, discipline_description, contract_type_name, existing_skills } = await req.json() as GenerateRequest;

    console.log(`[generate-discipline-content] Generating ${type} for discipline: ${discipline_name}`);

    let prompt = '';
    let systemPrompt = '';

    if (type === 'skills') {
      systemPrompt = `Tu es un expert en gestion d'agences créatives et de bureaux d'études. Tu génères des listes de compétences/métiers professionnels.
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication.`;
      
      prompt = `Génère une liste de 8-12 compétences/métiers professionnels pour une discipline "${discipline_name}"${discipline_description ? ` (${discipline_description})` : ''}.

Pour chaque compétence, inclus:
- name: Nom du métier/compétence en français
- code: Code court (3-5 lettres majuscules)
- description: Description courte (1 phrase)
- category: Catégorie parmi 'creative', 'technical', 'management', 'production'

Réponds avec un JSON array:
[{"name": "...", "code": "...", "description": "...", "category": "..."}]`;
    } 
    else if (type === 'pricing_grid') {
      systemPrompt = `Tu es un expert en tarification d'agences et bureaux d'études français. Tu connais les tarifs du marché.
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication.`;
      
      const skillsList = existing_skills?.join(', ') || '';
      prompt = `Génère une grille tarifaire réaliste pour la discipline "${discipline_name}" avec les compétences: ${skillsList}.

Pour chaque compétence, génère 4 niveaux d'expérience avec tarifs en EUR:
- junior: 0-2 ans d'expérience
- confirmed: 2-5 ans
- senior: 5-10 ans  
- expert: 10+ ans

Réponds avec un JSON array:
[{
  "skill_name": "...",
  "experience_level": "junior|confirmed|senior|expert",
  "hourly_rate": number,
  "daily_rate": number
}]`;
    }
    else if (type === 'quote_template') {
      systemPrompt = `Tu es un expert en rédaction de devis et contrats pour agences créatives et bureaux d'études.
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication.`;
      
      prompt = `Génère un template de devis pour:
- Discipline: ${discipline_name}
- Type de contrat: ${contract_type_name || 'Standard'}

Inclus:
- name: Nom du template
- description: Description
- default_phases: Array de phases avec {phase_name, phase_code, description, percentage (du total)}
- default_terms: Conditions générales courtes

Réponds avec un JSON object:
{
  "name": "...",
  "description": "...",
  "default_phases": [{"phase_name": "...", "phase_code": "...", "description": "...", "percentage": number}],
  "default_terms": "..."
}`;
    }

    // Call Lovable AI Gateway (Gemini)
    const gatewayUrl = Deno.env.get('AI_GATEWAY_URL') || 'https://ai-gateway.lovable.dev';
    
    const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${req.headers.get('authorization')?.replace('Bearer ', '')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-discipline-content] AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';
    
    console.log('[generate-discipline-content] Raw response:', generatedText.substring(0, 200));

    // Parse JSON from response
    let result;
    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      result = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('[generate-discipline-content] JSON parse error:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('[generate-discipline-content] Successfully generated', type);

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
