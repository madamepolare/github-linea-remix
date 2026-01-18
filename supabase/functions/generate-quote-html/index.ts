import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_url, mode = "full" } = await req.json();

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

    const systemPrompt = `Tu es un expert en design de documents HTML/CSS pour devis professionnels.
Tu vas analyser une image de devis et générer du HTML/CSS qui reproduit EXACTEMENT le design visuel.

Règles CRITIQUES:
1. Reproduis le design le plus fidèlement possible (couleurs, polices, espacements, mise en page)
2. Le HTML doit être un template avec des variables Mustache {{variable}}
3. Utilise des classes CSS inline ou un bloc <style> en haut
4. Le HTML doit être prêt pour impression (format A4, 210mm x 297mm)
5. Inclus tous les détails visuels: bordures, ombres, dégradés, alignements

Variables disponibles à utiliser:
- {{document_number}} - Numéro du devis
- {{date}} - Date du document
- {{validity_date}} - Date de validité
- {{agency_name}} - Nom de l'agence
- {{agency_address}} - Adresse
- {{agency_phone}} - Téléphone
- {{agency_email}} - Email
- {{agency_logo_url}} - URL du logo
- {{client_name}} - Nom du client
- {{client_address}} - Adresse client
- {{client_email}} - Email client
- {{project_name}} - Nom du projet
- {{project_address}} - Adresse du projet
- {{project_city}} - Ville du projet
- {{#phases}}...{{/phases}} - Boucle sur les phases
- {{phase_code}} - Code de la phase
- {{phase_name}} - Nom de la phase
- {{phase_amount}} - Montant de la phase
- {{phase_percentage}} - Pourcentage
- {{total_ht}} - Total HT
- {{tva_amount}} - Montant TVA
- {{total_ttc}} - Total TTC
- {{payment_terms}} - Conditions de paiement
- {{general_conditions}} - Conditions générales
- {{signature_area}} - Zone de signature

Retourne un JSON avec:
{
  "html": "Le template HTML complet avec CSS intégré",
  "css_variables": { couleurs extraites en format CSS custom properties },
  "fonts_used": ["Liste des polices Google Fonts nécessaires"],
  "description": "Brève description du style détecté"
}

Retourne UNIQUEMENT le JSON valide.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyse cette image de devis et génère un template HTML/CSS qui reproduit EXACTEMENT ce design. Mode: ${mode}`,
              },
              {
                type: "image_url",
                image_url: { url: image_url },
              },
            ],
          },
        ],
        max_tokens: 8000,
        temperature: 0.2,
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
    let result;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Try to extract HTML directly if JSON parsing fails
      if (content.includes("<html") || content.includes("<!DOCTYPE") || content.includes("<div")) {
        result = {
          html: content,
          css_variables: {},
          fonts_used: [],
          description: "Template HTML extrait directement"
        };
      } else {
        return new Response(
          JSON.stringify({ error: "Failed to parse response", raw: content }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify(result),
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
