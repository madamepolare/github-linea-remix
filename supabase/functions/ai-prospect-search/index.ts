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

    // Build enhanced prompt for structured prospect search with detailed contacts
    const searchPrompt = `Tu es un assistant commercial expert en recherche de prospects B2B en France.

MISSION: Recherche des entreprises et leurs contacts clés correspondant à cette demande: "${query}"
${region ? `Région ciblée: ${region}` : ""}
${industry ? `Secteur: ${industry}` : ""}

IMPORTANT: Tu dois trouver les CONTACTS NOMMÉS avec leurs coordonnées complètes. C'est essentiel.

Pour CHAQUE entreprise trouvée, fournis les informations suivantes au format JSON:

{
  "company_name": "Nom complet de l'entreprise (obligatoire)",
  "company_website": "Site web officiel",
  "company_address": "Adresse postale complète",
  "company_city": "Ville",
  "company_postal_code": "Code postal",
  "company_phone": "Téléphone standard",
  "company_email": "Email général (contact@, info@, etc.)",
  "company_industry": "Secteur d'activité précis",
  "company_size": "Taille estimée (TPE, PME, ETI, GE)",
  "contacts": [
    {
      "name": "Prénom NOM du contact (obligatoire)",
      "email": "Email professionnel direct",
      "phone": "Téléphone direct ou mobile",
      "role": "Fonction/Poste dans l'entreprise",
      "linkedin": "URL profil LinkedIn si disponible"
    }
  ],
  "notes": "Informations utiles: spécialités, projets récents, chiffre d'affaires, etc.",
  "source_url": "URL de la source principale",
  "confidence_score": 0.85
}

CONSIGNES STRICTES:
1. Trouve au MAXIMUM les contacts suivants pour chaque entreprise:
   - Dirigeant/PDG/Gérant
   - Directeur technique ou commercial
   - Responsable projets/achats
2. Recherche les emails et téléphones sur:
   - Le site officiel de l'entreprise
   - LinkedIn
   - Annuaires professionnels (Societe.com, Pappers, etc.)
   - Pages mentions légales
3. Score de confiance: 
   - 0.9+ = Informations vérifiées sur plusieurs sources
   - 0.7-0.9 = Information trouvée mais source unique
   - 0.5-0.7 = Information probable mais non vérifiée
4. Maximum 8 entreprises avec le plus de détails possible
5. Privilégie la QUALITÉ des informations à la quantité

Réponds UNIQUEMENT avec un tableau JSON valide. Si aucun résultat, renvoie [].`;

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
