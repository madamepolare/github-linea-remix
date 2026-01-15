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
    const { discipline, disciplineName, categoryKey, categoryLabel, existingTypes } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating types for category: ${categoryLabel} (${categoryKey}) in discipline: ${disciplineName}`);

    const existingTypesStr = existingTypes?.length > 0 
      ? `Types déjà existants (ne pas répéter): ${existingTypes.join(", ")}`
      : "";

    const systemPrompt = `Tu es un expert en organisation d'entreprises pour les agences de ${disciplineName}. 
Tu dois générer des types/sous-catégories d'entreprises pertinentes pour ce domaine.
Réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de texte autour).`;

    const userPrompt = `Génère 4-6 types d'entreprises pour la catégorie "${categoryLabel}" dans une agence de "${disciplineName}".

${existingTypesStr}

Ces types doivent être spécifiques au métier et utiles pour qualifier les entreprises.
Chaque type doit avoir un nom complet et une abréviation courte (max 8 caractères).

Utilise des couleurs HEX variées: #10B981, #3B82F6, #8B5CF6, #F97316, #EF4444, #EC4899, #06B6D4, #84CC16.

Réponds avec ce format JSON exact:
{
  "types": [
    { "key": "exemple_key", "label": "Label complet", "shortLabel": "Abrév", "color": "#10B981" }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erreur du service IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Réponse IA vide");
    }

    console.log("AI response:", content);

    // Parse the JSON from the response
    let parsed;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Réponse IA invalide");
    }

    // Validate structure
    if (!parsed.types || !Array.isArray(parsed.types)) {
      throw new Error("Structure de réponse invalide");
    }

    // Add category to each type
    const typesWithCategory = parsed.types.map((t: any) => ({
      ...t,
      category: categoryKey,
    }));

    return new Response(JSON.stringify({ types: typesWithCategory }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-company-types:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
