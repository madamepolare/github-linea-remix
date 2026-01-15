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
    const { discipline, disciplineName } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un expert en organisation d'entreprises pour les agences de ${disciplineName}. 
Tu dois générer des catégories et sous-catégories d'entreprises pertinentes pour ce domaine.

Réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de texte autour).`;

    const userPrompt = `Génère des catégories et types d'entreprises pour une agence de "${disciplineName}" (discipline: ${discipline}).

Les catégories doivent regrouper les types d'entreprises que cette agence peut avoir en contact :
- Clients (différents types selon le domaine)
- Partenaires/Prestataires spécifiques au domaine
- Fournisseurs pertinents
- Autres catégories métier

Pour chaque catégorie, fournis 2-5 types d'entreprises avec un libellé court.

Utilise ces couleurs HEX: #10B981 (vert), #3B82F6 (bleu), #8B5CF6 (violet), #F97316 (orange), #EF4444 (rouge), #EC4899 (rose), #06B6D4 (cyan), #84CC16 (lime).

Réponds avec ce format JSON exact:
{
  "categories": [
    { "key": "client", "label": "Clients", "color": "#10B981" }
  ],
  "subcategories": [
    { "key": "client_prive", "label": "Client privé", "shortLabel": "Privé", "color": "#10B981", "category": "client" }
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

    // Parse the JSON from the response
    let parsed;
    try {
      // Clean up potential markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Réponse IA invalide");
    }

    // Validate structure
    if (!parsed.categories || !Array.isArray(parsed.categories)) {
      throw new Error("Structure de réponse invalide");
    }
    if (!parsed.subcategories || !Array.isArray(parsed.subcategories)) {
      parsed.subcategories = [];
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-company-categories:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
