import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Task {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
  estimated_hours: number;
  assigned_to: string[];
}

interface TeamMember {
  user_id: string;
  full_name: string;
  absences: Array<{ start: string; end: string }>;
}

interface ExistingSchedule {
  user_id: string;
  start: string;
  end: string;
}

interface RequestBody {
  unscheduledTasks: Task[];
  teamMembers: TeamMember[];
  existingSchedules: ExistingSchedule[];
  dateRange: { start: string; end: string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { unscheduledTasks, teamMembers, existingSchedules, dateRange } = body;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build context for AI
    const tasksSummary = unscheduledTasks.map(t => 
      `- "${t.title}" (priorité: ${t.priority || "normale"}, durée: ${t.estimated_hours}h${t.due_date ? `, deadline: ${t.due_date}` : ""}${t.assigned_to?.length ? `, assigné: ${t.assigned_to.join(", ")}` : ""})`
    ).join("\n");

    const membersSummary = teamMembers.map(m => {
      const absenceInfo = m.absences.length > 0 
        ? `, absences: ${m.absences.map(a => `${a.start} à ${a.end}`).join(", ")}`
        : "";
      return `- ${m.full_name} (ID: ${m.user_id}${absenceInfo})`;
    }).join("\n");

    const existingSchedulesSummary = existingSchedules.length > 0
      ? existingSchedules.map(s => `- ${s.user_id}: ${s.start} à ${s.end}`).join("\n")
      : "Aucun créneau existant";

    const prompt = `Tu es un assistant de planification pour une équipe. Analyse les tâches non planifiées et propose un planning optimal.

## Tâches à planifier:
${tasksSummary}

## Membres de l'équipe:
${membersSummary}

## Créneaux déjà planifiés:
${existingSchedulesSummary}

## Période de planification:
Du ${dateRange.start} au ${dateRange.end}

## Instructions:
1. Priorise les tâches urgentes et celles avec deadline proche
2. Respecte les heures de travail (9h-18h)
3. Évite les chevauchements pour un même membre
4. Tiens compte des absences des membres
5. Si une tâche est assignée à quelqu'un, planifie-la pour cette personne
6. Équilibre la charge entre les membres disponibles

Réponds UNIQUEMENT avec un JSON valide dans ce format exact:
{
  "suggestions": [
    {
      "task_id": "uuid-de-la-tâche",
      "task_title": "Titre de la tâche",
      "user_id": "uuid-du-membre",
      "user_name": "Nom du membre",
      "start_datetime": "2024-01-15T09:00:00.000Z",
      "end_datetime": "2024-01-15T11:00:00.000Z",
      "reason": "Explication courte"
    }
  ],
  "warnings": ["Avertissement si charge élevée ou problème"],
  "analysis": "Résumé de la répartition proposée"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Tu es un assistant de planification expert. Tu réponds uniquement en JSON valide sans markdown ni commentaires.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API Error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    console.log("AI Response:", content);

    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      result = {
        suggestions: [],
        warnings: ["L'IA n'a pas pu générer un planning valide. Veuillez réessayer."],
        analysis: "Erreur lors de la génération du planning.",
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in ai-workflow-planning:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: message,
        suggestions: [],
        warnings: ["Erreur lors de la génération du planning"],
        analysis: "",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
