import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LineInfo {
  id: string;
  name: string;
  description?: string;
  type: string;
  current_price: number;
}

interface RequestBody {
  targetBudget: number;
  lines: LineInfo[];
  projectType?: string;
  projectDescription?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetBudget, lines, projectType, projectDescription } = await req.json() as RequestBody;

    if (!targetBudget || !lines || lines.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const linesDescription = lines.map(l => 
      `- ${l.name}${l.description ? ` (${l.description})` : ''} [type: ${l.type}]`
    ).join('\n');

    const systemPrompt = `Tu es un expert en tarification de projets. Tu dois répartir un budget total sur différentes prestations de manière cohérente et réaliste.

Règles importantes:
- La somme de tous les prix doit être EXACTEMENT égale au budget cible
- Les prix doivent être arrondis à des valeurs entières ou avec 2 décimales max
- Les prestations plus complexes ou longues doivent avoir des prix plus élevés
- Les phases importantes (conception, développement) sont généralement plus chères
- Respecte les proportions habituelles du marché

Tu dois répondre UNIQUEMENT avec un JSON valide, sans markdown ni texte autour.`;

    const userPrompt = `Budget cible: ${targetBudget}€ HT
${projectType ? `Type de projet: ${projectType}` : ''}
${projectDescription ? `Description: ${projectDescription}` : ''}

Prestations à tarifer:
${linesDescription}

Répartis le budget de ${targetBudget}€ sur ces prestations. Réponds avec un JSON de cette forme exacte:
{
  "lines": [
    {"id": "id_de_la_ligne", "price": 1234.56},
    ...
  ]
}

IMPORTANT: La somme des prices doit être EXACTEMENT ${targetBudget}€`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    // Parse the JSON response
    let parsedResult;
    try {
      // Clean up potential markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback: distribute evenly
      const evenPrice = Math.round((targetBudget / lines.length) * 100) / 100;
      const remainder = targetBudget - (evenPrice * lines.length);
      parsedResult = {
        lines: lines.map((l, i) => ({
          id: l.id,
          price: i === 0 ? evenPrice + remainder : evenPrice
        }))
      };
    }

    // Validate and adjust to ensure exact total
    if (parsedResult.lines && Array.isArray(parsedResult.lines)) {
      const total = parsedResult.lines.reduce((sum: number, l: { price: number }) => sum + l.price, 0);
      const diff = targetBudget - total;
      if (Math.abs(diff) > 0.01 && parsedResult.lines.length > 0) {
        // Adjust the first line to make the total exact
        parsedResult.lines[0].price = Math.round((parsedResult.lines[0].price + diff) * 100) / 100;
      }
    }

    return new Response(
      JSON.stringify(parsedResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in distribute-budget:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
