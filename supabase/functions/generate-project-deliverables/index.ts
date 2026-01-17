import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Phase {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

interface GenerateRequest {
  projectName: string;
  projectType: string | null;
  phases: Phase[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectName, projectType, phases } = await req.json() as GenerateRequest;

    if (!phases || phases.length === 0) {
      return new Response(
        JSON.stringify({ error: "Aucune phase définie pour ce projet" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context for AI
    const phasesContext = phases.map(p => {
      let dateInfo = "";
      if (p.start_date) dateInfo += `début: ${p.start_date}`;
      if (p.end_date) dateInfo += `${dateInfo ? ", " : ""}fin: ${p.end_date}`;
      return `- ${p.name}${dateInfo ? ` (${dateInfo})` : ""}`;
    }).join("\n");

    const projectTypeLabel = projectType || "projet d'architecture/design";

    const prompt = `Tu es un expert en gestion de projets d'architecture et de design. 

Génère une liste de livrables professionnels pour ce projet:
- Nom du projet: ${projectName}
- Type de projet: ${projectTypeLabel}
- Phases du projet:
${phasesContext}

Pour chaque phase, propose 2 à 4 livrables pertinents avec:
1. Le nom du livrable (court et professionnel)
2. Une description courte (1 phrase)
3. La date d'échéance suggérée (basée sur les dates de phase, format YYYY-MM-DD)
4. L'ID de la phase associée

Adapte les livrables au type de projet:
- Architecture: plans, permis, études, DOE, CCTP, etc.
- Design intérieur: moodboards, plans d'aménagement, carnets de détails, etc.
- Scénographie: scénarios, signalétique, plans de montage, etc.
- Communication/Création: briefs, maquettes, guidelines, assets, etc.

Réponds UNIQUEMENT avec un JSON valide, pas de texte avant ou après:
{
  "deliverables": [
    {
      "phase_id": "uuid de la phase",
      "name": "Nom du livrable",
      "description": "Description courte",
      "due_date": "YYYY-MM-DD ou null"
    }
  ]
}`;

    console.log("Generating deliverables for project:", projectName);
    console.log("Phases:", phases.map(p => p.name).join(", "));

    // Call Lovable AI Gateway
    const response = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          {
            role: "system",
            content: "Tu es un assistant expert en gestion de projets créatifs. Tu génères des livrables professionnels adaptés au contexte. Tu réponds toujours en JSON valide uniquement."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI Gateway error:", error);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI Response:", content);

    // Parse JSON from response (handle markdown code blocks if present)
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent.replace(/```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/```\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonContent);
    
    // Validate and filter deliverables
    const validDeliverables = (parsed.deliverables || []).filter((d: any) => {
      const phaseExists = phases.some(p => p.id === d.phase_id);
      if (!phaseExists) {
        console.warn(`Phase ID ${d.phase_id} not found, skipping deliverable:`, d.name);
      }
      return d.name && phaseExists;
    });

    console.log(`Generated ${validDeliverables.length} valid deliverables`);

    return new Response(
      JSON.stringify({ deliverables: validDeliverables }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating deliverables:", errorMessage);
    return new Response(
      JSON.stringify({ 
        error: "Erreur lors de la génération des livrables",
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
