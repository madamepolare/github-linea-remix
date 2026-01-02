import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { text, exchangeContent } = await req.json();
    
    const inputText = exchangeContent || text;
    if (!inputText) {
      throw new Error("No text or exchange content provided");
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant de gestion de projet. À partir du texte fourni, génère une liste de sous-tâches claires, concrètes et actionnables.
            
Règles:
- Génère entre 3 et 8 sous-tâches maximum
- Chaque sous-tâche doit être courte (max 10 mots)
- Commence chaque sous-tâche par un verbe d'action
- Réponds UNIQUEMENT avec un JSON valide au format: {"subtasks": ["tâche 1", "tâche 2", ...]}`
          },
          {
            role: 'user',
            content: `Génère des sous-tâches à partir de ce texte:\n\n${inputText}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    // Parse the JSON response
    let subtasks: string[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        subtasks = parsed.subtasks || [];
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      // Fallback: split by newlines and clean up
      subtasks = content
        .split('\n')
        .map((line: string) => line.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter((line: string) => line.length > 0 && line.length < 100);
    }

    return new Response(JSON.stringify({ subtasks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-subtasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});