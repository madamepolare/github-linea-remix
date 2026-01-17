import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyInput {
  id: string;
  name: string;
  website?: string | null;
  description?: string | null;
  email?: string | null;
  current_industry?: string | null;
  current_category?: string | null;
  bet_specialties?: string[] | null;
}

interface ContactInput {
  id: string;
  name: string;
  role?: string | null;
  email?: string | null;
  current_type?: string | null;
  company_name?: string | null;
  company_industry?: string | null;
}

interface CategoryConfig {
  key: string;
  label: string;
  types?: { key: string; label: string; shortLabel?: string }[];
}

interface CategorizationResult {
  id: string;
  name: string;
  suggested_category?: string;
  suggested_category_label?: string;
  suggested_type?: string;
  suggested_type_label?: string;
  suggested_bet_specialties?: string[];
  confidence: number;
  reason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      entities, 
      entityType, 
      categories, 
      types,
      betSpecialties,
      contactTypes 
    } = await req.json();

    if (!entities || entities.length === 0) {
      return new Response(
        JSON.stringify({ error: "No entities provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (entityType === "companies") {
      // Build list of valid type keys
      const validTypeKeys = (types || []).map((t: any) => t.key);
      const validBetSpecKeys = (betSpecialties || []).map((s: any) => s.key);
      
      // Build category -> types mapping with clear key emphasis
      const typesList = (types || [])
        .map((t: any) => `  - KEY: "${t.key}" → ${t.label} (catégorie: ${t.category})`)
        .join("\n");

      const betSpecList = (betSpecialties || [])
        .map((s: any) => `  - KEY: "${s.key}" → ${s.label}`)
        .join("\n");

      systemPrompt = `Tu es un expert en classification d'entreprises pour le secteur de l'architecture et de la construction en France.
Tu dois analyser chaque entreprise et suggérer le TYPE le plus approprié parmi la liste EXACTE fournie.

⚠️ RÈGLE CRITIQUE: Tu DOIS utiliser UNIQUEMENT les KEYS exactes listées ci-dessous. Ne jamais inventer de nouvelles valeurs!

TYPES D'ENTREPRISES DISPONIBLES (utilise UNIQUEMENT ces keys):
${typesList}

SPÉCIALITÉS BET (uniquement si le type est "bet"):
${betSpecList || "Non configurées"}

EXEMPLES DE CLASSIFICATION CORRECTE:
- "Ville de Paris", "Mairie de Nice" → type: "client_public"
- "BET Structure SA", "Ingénierie Fluides" → type: "bet" + bet_specialties: ["structure"] ou ["fluides"]
- "Agence Martin Architecte" → type: "architecte"
- "Bouygues Construction" → type: "entreprise_generale"
- "SARL Plomberie Dupont" → type: "artisan" ou "second_oeuvre"
- "Promoteur Immobilier X" → type: "client_prive"
- "Économiste de la construction" → type: "economiste"
- "Bureau de contrôle" → type: "bet" + bet_specialties appropriées

RÈGLES:
1. suggested_type DOIT être une des keys EXACTES listées: ${validTypeKeys.join(", ")}
2. Si type = "bet", ajoute suggested_bet_specialties avec les keys EXACTES: ${validBetSpecKeys.join(", ")}
3. Copie l'ID EXACTEMENT tel que fourni dans l'input (format UUID)
4. confidence = score de 0 à 100
5. reason = explication courte

RÉPONDS EN JSON VALIDE.`;

      userPrompt = `Analyse ces entreprises et suggère leur type (utilise UNIQUEMENT les keys valides):

${(entities as CompanyInput[]).map((e, i) => 
  `${i + 1}. ID: ${e.id}
   Nom: ${e.name}
   Site: ${e.website || "non renseigné"}
   Email: ${e.email || "non renseigné"}
   Type actuel: ${e.current_industry || "aucun"}
   Spécialités BET actuelles: ${e.bet_specialties?.join(", ") || "aucune"}`
).join("\n\n")}

Retourne un JSON STRICT:
{
  "results": [
    {
      "id": "COPIE_EXACTE_UUID_DE_INPUT",
      "name": "nom entreprise",
      "suggested_type": "UNE_DES_KEYS_VALIDES",
      "suggested_type_label": "Libellé correspondant",
      "suggested_bet_specialties": ["key1", "key2"],
      "confidence": 85,
      "reason": "Explication courte"
    }
  ]
}

Keys de type valides: ${validTypeKeys.join(", ")}
Keys de spécialités BET valides: ${validBetSpecKeys.join(", ")}`;

    } else if (entityType === "contacts") {
      const contactTypeLabels = (contactTypes || [])
        .map((t: any) => `${t.key} (${t.label})`)
        .join(", ");

      systemPrompt = `Tu es un expert en classification de contacts professionnels pour le secteur de l'architecture et de la construction.
Tu dois analyser chaque contact et suggérer le type le plus approprié parmi ceux fournis.

TYPES DE CONTACTS DISPONIBLES:
${contactTypeLabels || "Non configurés"}

RÈGLES:
1. Analyse le nom, le rôle, l'email et l'entreprise pour déterminer le type
2. Exemples de patterns:
   - "Directeur", "PDG", "Gérant" → decision_maker
   - "Chargé de projet", "Chef de projet" → project_manager
   - "Commercial", "Responsable commercial" → commercial
   - "Architecte" (dans le rôle) → architect
   - "Ingénieur" → engineer
   - "Comptable", "DAF" → administrative
3. Retourne un score de confiance entre 0 et 100

RÉPONDS EN JSON VALIDE.`;

      userPrompt = `Analyse ces contacts et suggère leur type:

${(entities as ContactInput[]).map((c, i) => 
  `${i + 1}. ID: ${c.id}
   Nom: ${c.name}
   Rôle: ${c.role || "non renseigné"}
   Email: ${c.email || "non renseigné"}
   Entreprise: ${c.company_name || "non renseignée"}
   Secteur entreprise: ${c.company_industry || "non renseigné"}
   Type actuel: ${c.current_type || "aucun"}`
).join("\n\n")}

Retourne un JSON avec:
{
  "results": [
    {
      "id": "uuid",
      "name": "nom contact",
      "suggested_type": "clé_type",
      "suggested_type_label": "Libellé Type",
      "confidence": 85,
      "reason": "Explication courte"
    }
  ]
}`;
    }

    console.log("Calling Lovable AI for auto-categorization...");
    console.log("Entity type:", entityType);
    console.log("Number of entities:", entities.length);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty response from AI");
    }

    console.log("AI Response:", content);

    // Parse JSON response
    let parsedContent;
    try {
      // Clean up potential markdown
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      parsedContent = JSON.parse(cleanContent.trim());
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      throw new Error("Invalid JSON response from AI");
    }

    return new Response(
      JSON.stringify({ 
        results: parsedContent.results || [],
        entityType 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in auto-categorize-companies:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
