import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadResult {
  company_name: string;
  company_website?: string;
  company_address?: string;
  company_city?: string;
  company_postal_code?: string;
  company_phone?: string;
  company_email?: string;
  company_industry?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_role?: string;
  source_url?: string;
  confidence_score: number;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, region, industry, count = 5 } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (!openaiApiKey) {
      console.error("Missing OPENAI_API_KEY");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Searching leads for: ${query}, region: ${region || "any"}, industry: ${industry || "any"}`);

    // Step 1: Use Perplexity for real-time web search if available
    let webSearchResults = "";
    if (perplexityApiKey) {
      console.log("Using Perplexity for web search...");
      try {
        const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${perplexityApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-sonar-large-128k-online",
            messages: [
              {
                role: "system",
                content: `Tu es un assistant de recherche B2B. Tu cherches des entreprises et contacts professionnels réels.
Fournis des informations vérifiables: noms d'entreprises, sites web, adresses, contacts avec emails et téléphones.
Concentre-toi sur des résultats en France${region ? ` dans la région ${region}` : ""}.`
              },
              {
                role: "user",
                content: `Trouve ${count} entreprises correspondant à cette recherche: "${query}"${industry ? ` dans le secteur ${industry}` : ""}.
Pour chaque entreprise, donne: nom, site web, adresse complète, téléphone, email de contact, et si possible le nom et poste d'un décideur.`
              }
            ],
          }),
        });

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          webSearchResults = perplexityData.choices?.[0]?.message?.content || "";
          console.log("Perplexity search completed");
        } else {
          console.error("Perplexity error:", await perplexityResponse.text());
        }
      } catch (error) {
        console.error("Perplexity search failed:", error);
      }
    }

    // Step 2: Use OpenAI to structure and enrich the results
    console.log("Using OpenAI to structure leads...");
    
    const systemPrompt = `Tu es un assistant spécialisé dans la génération de leads B2B.
Tu dois retourner des entreprises et contacts RÉELS et VÉRIFIABLES.
${webSearchResults ? "Utilise les informations de recherche web fournies pour générer des leads précis." : "Génère des leads basés sur ta connaissance des entreprises françaises."}

Retourne UNIQUEMENT un JSON valide avec ce format:
{
  "leads": [
    {
      "company_name": "Nom de l'entreprise",
      "company_website": "https://...",
      "company_address": "Adresse complète",
      "company_city": "Ville",
      "company_postal_code": "Code postal",
      "company_phone": "+33...",
      "company_email": "contact@...",
      "company_industry": "Secteur d'activité",
      "contact_name": "Prénom Nom",
      "contact_email": "prenom.nom@...",
      "contact_phone": "+33...",
      "contact_role": "Poste/Fonction",
      "source_url": "URL source si disponible",
      "confidence_score": 0.0-1.0,
      "notes": "Notes additionnelles"
    }
  ]
}

IMPORTANT:
- confidence_score doit refléter la fiabilité des données (1.0 = vérifié, 0.5 = probable, 0.3 = incertain)
- N'invente PAS de données. Si tu n'es pas sûr, mets null ou une confidence basse
- Préfère les emails professionnels nominatifs aux emails génériques`;

    const userPrompt = `Recherche: "${query}"
${region ? `Région: ${region}` : ""}
${industry ? `Secteur: ${industry}` : ""}
Nombre demandé: ${count}

${webSearchResults ? `Résultats de recherche web:\n${webSearchResults}` : ""}

Génère ${count} leads B2B pertinents au format JSON.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "OpenAI API error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content || "";
    
    console.log("OpenAI response received, parsing JSON...");

    // Parse JSON from response
    let leads: LeadResult[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        leads = parsed.leads || [];
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.log("Raw content:", content);
    }

    console.log(`Found ${leads.length} leads`);

    return new Response(
      JSON.stringify({
        leads,
        query,
        region,
        industry,
        count: leads.length,
        sources: perplexityApiKey ? ["openai", "perplexity"] : ["openai"],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in openai-lead-search:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
