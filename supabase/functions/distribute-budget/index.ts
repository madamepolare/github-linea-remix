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

    // Build a mapping of ID -> name for the AI, but also include the ID explicitly
    const linesDescription = lines.map(l => 
      `- ID="${l.id}": ${l.name}${l.description ? ` (${l.description})` : ''} [type: ${l.type}]`
    ).join('\n');
    
    // Build a JSON template showing the exact IDs we expect back
    const expectedIdsJson = JSON.stringify(lines.map(l => ({ id: l.id, price: 0 })), null, 2);

    const systemPrompt = `Tu es un expert en tarification de projets. Tu dois répartir un budget total sur différentes prestations de manière cohérente et réaliste.

Règles importantes:
- La somme de tous les prix doit être EXACTEMENT égale au budget cible
- Les prix doivent être arrondis à des valeurs entières ou avec 2 décimales max
- Les prestations plus complexes ou longues doivent avoir des prix plus élevés
- Les phases importantes (conception, développement) sont généralement plus chères
- Respecte les proportions habituelles du marché
- IMPORTANT: Tu dois utiliser EXACTEMENT les mêmes IDs que ceux fournis dans la liste (les IDs commencent par "line-" ou sont des UUID)

Tu dois répondre UNIQUEMENT avec un JSON valide, sans markdown ni texte autour.`;

    const userPrompt = `Budget cible: ${targetBudget}€ HT
${projectType ? `Type de projet: ${projectType}` : ''}
${projectDescription ? `Description: ${projectDescription}` : ''}

Prestations à tarifer (avec leurs IDs exacts):
${linesDescription}

Répartis le budget de ${targetBudget}€ sur ces prestations. 

IMPORTANT: Tu DOIS utiliser les IDs EXACTS fournis (par exemple "line-1234567890-abc123def" ou un UUID).
NE PAS utiliser le nom de la prestation comme ID.

Réponds avec un JSON de cette forme exacte, en utilisant les IDs ci-dessus:
${expectedIdsJson}

La somme des prices doit être EXACTEMENT ${targetBudget}€`;

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
    
    console.log('AI raw response:', content);
    
    // Parse the JSON response
    let parsedResult: { lines: Array<{ id: string; price: number }> };
    try {
      // Clean up potential markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      
      // Handle both array format and { lines: [...] } format
      if (Array.isArray(parsed)) {
        parsedResult = { lines: parsed };
      } else if (parsed.lines && Array.isArray(parsed.lines)) {
        parsedResult = parsed;
      } else {
        throw new Error('Unexpected format');
      }
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

    // Build a map from expected IDs for validation
    const expectedIds = new Set(lines.map(l => l.id));
    
    // Check if AI used correct IDs, if not try to match by index/order
    const aiUsedCorrectIds = parsedResult.lines.every((l) => expectedIds.has(l.id));
    
    if (!aiUsedCorrectIds) {
      console.log('AI did not use correct IDs, mapping by order');
      // AI returned wrong IDs, map by order instead
      parsedResult.lines = parsedResult.lines.map((l, index) => ({
        id: lines[index]?.id || l.id,
        price: l.price
      }));
    }
    
    // Validate and adjust to ensure exact total
    const total = parsedResult.lines.reduce((sum, l) => sum + (l.price || 0), 0);
    const diff = targetBudget - total;
    if (Math.abs(diff) > 0.01 && parsedResult.lines.length > 0) {
      // Adjust the first line to make the total exact
      parsedResult.lines[0].price = Math.round((parsedResult.lines[0].price + diff) * 100) / 100;
    }
    
    console.log('Final result:', JSON.stringify(parsedResult));

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
