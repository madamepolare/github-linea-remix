import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rcText } = await req.json();

    if (!rcText || typeof rcText !== 'string') {
      return new Response(
        JSON.stringify({ error: 'rcText is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Tu es un expert en marchés publics français. Analyse le texte du Règlement de Consultation (RC) fourni et extrais la liste des pièces/livrables demandés.

Pour chaque livrable détecté, retourne:
- type: un identifiant court (ex: "dc1", "urssaf", "memoire_technique", "dpgf", etc.)
- name: le nom complet du document
- responsible_type: "mandataire" si seul le mandataire doit fournir, "tous" si tous les membres du groupement doivent fournir
- is_mandatory: true si obligatoire, false si optionnel

Types standards à utiliser quand applicable:
- dc1, dc2, dc4 (formulaires DC)
- urssaf (attestation URSSAF)
- kbis (extrait Kbis)
- attestation_fiscale
- attestation_assurance (assurance RCP)
- references (références et expériences)
- cv (CV de l'équipe)
- habilitations
- acte_engagement
- memoire_technique
- dpgf
- bpu
- planning
- pieces_graphiques
- note_methodologique

Retourne UNIQUEMENT un JSON valide avec la structure:
{
  "deliverables": [
    { "type": "...", "name": "...", "responsible_type": "...", "is_mandatory": true/false }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyse ce texte du RC et extrais les livrables demandés:\n\n${rcText}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    console.log('AI response content:', content);

    // Parse JSON from response
    let deliverables = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        deliverables = parsed.deliverables || [];
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Return empty array if parsing fails
      deliverables = [];
    }

    return new Response(
      JSON.stringify({ deliverables }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in analyze-deliverables:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
