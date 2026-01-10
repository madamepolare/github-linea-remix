import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_url } = await req.json();

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: "image_url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Tu es un expert en design graphique et mise en page de documents commerciaux. 
Tu vas analyser une image de devis/facture et extraire les caractéristiques visuelles pour générer un thème.

Analyse l'image et retourne un JSON avec ces propriétés:
- primary_color: couleur principale (texte principal) en hex
- secondary_color: couleur secondaire (texte léger) en hex  
- accent_color: couleur d'accent (liens, boutons) en hex
- background_color: couleur de fond en hex
- header_bg_color: couleur de fond de l'en-tête en hex (ou null si transparent)
- heading_font: police suggérée pour les titres (Inter, Roboto, Poppins, Montserrat, Playfair Display, etc.)
- body_font: police suggérée pour le corps de texte
- heading_size: taille des titres (ex: "24px")
- body_size: taille du texte (ex: "11px")
- header_style: style d'en-tête ("classic", "modern", "minimal", "centered")
- logo_position: position du logo ("left", "center", "right")
- logo_size: taille du logo ("small", "medium", "large")
- table_header_bg: couleur de fond des en-têtes de tableau en hex
- table_border_style: style des bordures ("solid", "dashed", "none")
- table_stripe_rows: alternance des lignes (true/false)
- footer_style: style du pied de page ("simple", "detailed", "minimal")
- show_signature_area: afficher la zone de signature (true/false)

Retourne UNIQUEMENT le JSON valide, sans texte additionnel.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyse cette image de devis et génère un thème correspondant.",
              },
              {
                type: "image_url",
                image_url: { url: image_url },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to analyze image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON from the AI response
    let theme;
    try {
      // Remove markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      theme = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse theme", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ theme }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
