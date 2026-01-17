import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateTasksRequest {
  deliverableName: string;
  phaseName?: string;
  projectName: string;
  description?: string;
  dueDate?: string;
  phaseCode?: string;
}

interface GeneratedTask {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  estimatedHours?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      deliverableName,
      phaseName,
      projectName,
      description,
      dueDate,
      phaseCode,
    }: GenerateTasksRequest = await req.json();

    if (!deliverableName || !projectName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: deliverableName and projectName" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const systemPrompt = `Tu es un assistant expert en gestion de projet pour une agence d'architecture et de design.
Tu génères des listes de tâches précises et actionables pour préparer des livrables de projet.

Contexte métier:
- Les phases de projet architecture incluent: ESQ (esquisse), APS (avant-projet sommaire), APD (avant-projet définitif), PRO (projet), DCE (dossier de consultation), ACT (assistance contrat travaux), VISA, DET, AOR
- Les livrables typiques incluent: plans, coupes, élévations, perspectives, carnets de détails, CCTP, bordereaux, etc.

Règles:
- Génère entre 3 et 6 tâches pertinentes
- Chaque tâche doit être actionable et spécifique
- Inclure les étapes de vérification et validation
- Adapter les tâches au type de livrable et à la phase

Réponds UNIQUEMENT en JSON avec cette structure:
{
  "tasks": [
    {
      "title": "Titre de la tâche",
      "description": "Description optionnelle",
      "priority": "low" | "medium" | "high",
      "estimatedHours": 2
    }
  ]
}`;

    const userPrompt = `Génère les tâches nécessaires pour préparer ce livrable:

Projet: ${projectName}
Livrable: ${deliverableName}
${phaseName ? `Phase: ${phaseName}` : ""}
${phaseCode ? `Code phase: ${phaseCode}` : ""}
${description ? `Description: ${description}` : ""}
${dueDate ? `Date d'échéance: ${dueDate}` : ""}

Génère une liste de tâches actionables pour préparer et finaliser ce livrable.`;

    console.log("Calling Lovable AI for task generation...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate tasks" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "No content generated" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("AI response content:", content);

    // Parse JSON response
    let tasksResult: { tasks: GeneratedTask[] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        tasksResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Fallback: generate basic tasks
      tasksResult = {
        tasks: [
          {
            title: `Préparer ${deliverableName}`,
            description: `Préparer le livrable ${deliverableName} pour le projet ${projectName}`,
            priority: "medium",
            estimatedHours: 4,
          },
          {
            title: `Vérifier ${deliverableName}`,
            description: "Vérification qualité et conformité",
            priority: "high",
            estimatedHours: 2,
          },
          {
            title: `Valider ${deliverableName}`,
            description: "Validation finale avant envoi",
            priority: "high",
            estimatedHours: 1,
          },
        ],
      };
    }

    console.log("Generated tasks:", tasksResult);

    return new Response(JSON.stringify(tasksResult), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in generate-deliverable-tasks:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
