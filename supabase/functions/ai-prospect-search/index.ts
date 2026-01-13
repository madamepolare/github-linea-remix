import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactResult {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  linkedin?: string;
}

interface ProspectResult {
  company_name: string;
  company_website?: string;
  company_address?: string;
  company_city?: string;
  company_postal_code?: string;
  company_phone?: string;
  company_email?: string;
  company_industry?: string;
  company_size?: string;
  contacts: ContactResult[];
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

    // Optimized prompt for maximum contact extraction
    const systemPrompt = `Tu es un expert en prospection commerciale B2B. Ta mission: trouver le MAXIMUM de contacts professionnels nommés avec leurs coordonnées complètes.

RÈGLES STRICTES:
1. QUANTITÉ: Trouve 20-30 entreprises avec tous leurs contacts (vise 50+ contacts au total)
2. PRIORITÉ: Les PERSONNES avec coordonnées sont plus importantes que les entreprises sans contacts
3. QUALITÉ: Décideurs en priorité (DG, Directeurs, Responsables, Associés, Fondateurs, Gérants)
4. EXHAUSTIVITÉ: Pour chaque entreprise, trouve TOUS les contacts disponibles, pas juste 1-2

SOURCES À EXPLOITER SYSTÉMATIQUEMENT:
- LinkedIn: profils publics, pages entreprises, liste des employés
- Sites web officiels: pages équipe, à propos, contact, mentions légales, organigramme
- Annuaires: Societe.com, Pappers.fr, Infogreffe, Manageo, Verif.com, Kompass
- Fédérations et syndicats professionnels du secteur
- Communiqués de presse, articles économiques (Les Echos, Le Moniteur, etc.)
- Google avec opérateurs: "nom entreprise" + "directeur" + "email"

FORMATS D'EMAIL À DÉDUIRE SI NON TROUVÉ:
- prenom.nom@entreprise.fr
- pnom@entreprise.fr
- p.nom@entreprise.fr
- prenom@entreprise.fr

RÉPONSE JSON UNIQUEMENT - PAS DE TEXTE AVANT OU APRÈS:`;

    const userPrompt = `RECHERCHE PROSPECTION B2B: "${query}"
${region ? `RÉGION: ${region}` : ""}
${industry ? `SECTEUR: ${industry}` : ""}

OBJECTIF: Trouve le MAXIMUM d'entreprises et de contacts correspondant à cette recherche.
- Minimum 15-20 entreprises
- Pour chaque entreprise, trouve TOUS les contacts avec leurs coordonnées
- Objectif: 50+ contacts au total avec emails/téléphones

Réponds UNIQUEMENT avec ce format JSON (tableau):
[
  {
    "company_name": "Nom Entreprise (obligatoire)",
    "company_website": "https://...",
    "company_address": "Adresse complète",
    "company_city": "Ville",
    "company_postal_code": "Code postal",
    "company_phone": "Téléphone standard",
    "company_email": "Email général",
    "company_industry": "Secteur précis",
    "company_size": "TPE/PME/ETI/GE",
    "contacts": [
      {
        "name": "Prénom NOM (obligatoire)",
        "role": "Fonction exacte",
        "email": "email@direct.fr",
        "phone": "06/07...",
        "linkedin": "https://linkedin.com/in/..."
      }
    ],
    "notes": "Infos utiles: projets récents, spécialités...",
    "source_url": "https://source-principale.fr",
    "confidence_score": 0.85
  }
]

IMPORTANT: Maximise le nombre de contacts. Ne te limite pas. Trouve-en le plus possible.`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 8000,
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
      console.log("Raw content:", content);
      // Return empty array if parsing fails
      prospects = [];
    }

    // Validate and clean prospects, ensure contacts is always an array
    prospects = prospects
      .filter(p => p.company_name && typeof p.company_name === "string")
      .map(p => ({
        ...p,
        contacts: Array.isArray(p.contacts) ? p.contacts : [],
      }));

    console.log(`Found ${prospects.length} prospects with ${prospects.reduce((acc, p) => acc + (p.contacts?.length || 0), 0)} total contacts`);

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
