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
    const { lineName, lineType, projectType, projectDescription, context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating description for line:", { lineName, lineType, projectType });

    const systemPrompt = `Tu es un expert en rédaction de devis et propositions commerciales pour l'architecture, le design d'intérieur et la communication.
Tu génères des descriptions professionnelles et précises pour les lignes de devis.

Règles:
- La description doit être concise mais complète (2-4 phrases)
- Utilise un ton professionnel mais accessible
- Mentionne les livrables quand c'est pertinent
- Adapte le vocabulaire au type de projet`;

    const userPrompt = `Génère une description professionnelle pour cette ligne de devis:

Nom: ${lineName}
Type de ligne: ${lineType === 'phase' ? 'Phase de mission' : lineType === 'service' ? 'Prestation' : lineType === 'option' ? 'Option' : lineType === 'expense' ? 'Frais' : 'Remise'}
Type de projet: ${projectType || 'Général'}
${projectDescription ? `Contexte du projet: ${projectDescription}` : ''}
${context ? `Informations additionnelles: ${context}` : ''}

Réponds uniquement avec la description, sans guillemets ni préfixe.`;

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
        max_tokens: 300,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes dépassée, réessayez plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erreur du service IA");
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim();

    console.log("Generated description:", description);

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-line-description:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
