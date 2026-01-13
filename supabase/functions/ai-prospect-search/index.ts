import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProspectResult {
  company_name: string;
  company_website?: string;
  company_address?: string;
  company_city?: string;
  company_phone?: string;
  company_email?: string;
  company_industry?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_role?: string;
  notes?: string;
  source_url?: string;
  confidence_score?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, region, industry } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Perplexity API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build enhanced prompt for structured prospect search
    const searchPrompt = `Tu es un assistant commercial expert en recherche de prospects B2B pour le secteur de l'architecture et du BTP en France.

Recherche des entreprises et contacts correspondant à cette demande: "${query}"
${region ? `Région ciblée: ${region}` : ""}
${industry ? `Secteur: ${industry}` : ""}

Pour chaque prospect trouvé, fournis les informations suivantes au format JSON:
- company_name: Nom de l'entreprise (obligatoire)
- company_website: Site web
- company_address: Adresse complète
- company_city: Ville
- company_phone: Téléphone entreprise
- company_email: Email général
- company_industry: Secteur d'activité
- contact_name: Nom du contact principal (si disponible)
- contact_email: Email du contact
- contact_phone: Téléphone direct du contact
- contact_role: Fonction du contact
- notes: Notes utiles (spécialités, projets récents, etc.)
- source_url: URL source de l'information
- confidence_score: Score de confiance de 0 à 1

Réponds UNIQUEMENT avec un tableau JSON valide de prospects. Maximum 10 résultats pertinents.
Si tu ne trouves pas d'informations fiables, renvoie un tableau vide [].

IMPORTANT: 
- Ne fournis que des informations vérifiables depuis des sources publiques
- Privilégie les entreprises avec des coordonnées complètes
- Indique clairement quand une information est incertaine via le score de confiance`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "Tu es un assistant de prospection commerciale. Tu fournis UNIQUEMENT des réponses au format JSON valide."
          },
          {
            role: "user",
            content: searchPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to search prospects", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    // Parse the JSON response
    let prospects: ProspectResult[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        prospects = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse prospects JSON:", parseError);
      // Return empty array if parsing fails
      prospects = [];
    }

    // Validate and clean prospects
    prospects = prospects.filter(p => p.company_name && typeof p.company_name === "string");

    return new Response(
      JSON.stringify({ 
        prospects, 
        citations,
        query,
        count: prospects.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-prospect-search:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
