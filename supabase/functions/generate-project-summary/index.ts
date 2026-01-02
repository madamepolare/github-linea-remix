import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProjectData {
  name: string;
  description?: string;
  project_type?: string;
  status?: string;
  budget?: number;
  surface_area?: number;
  city?: string;
  phases: Array<{
    name: string;
    status: string;
    start_date?: string;
    end_date?: string;
  }>;
  tasks: Array<{
    title: string;
    status: string;
    priority: string;
    due_date?: string;
  }>;
  deliverables: Array<{
    name: string;
    status: string;
    due_date?: string;
  }>;
  observations: Array<{
    description: string;
    status: string;
    priority: string;
  }>;
  lots: Array<{
    name: string;
    status: string;
    budget?: number;
  }>;
  moeTeam: Array<{
    role: string;
    company_name?: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();

    if (!projectId) {
      console.error("Missing projectId");
      return new Response(
        JSON.stringify({ error: "Project ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating summary for project:", projectId);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
        id,
        name,
        description,
        project_type,
        status,
        budget,
        surface_area,
        city,
        start_date,
        end_date
      `)
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch phases
    const { data: phases } = await supabase
      .from("project_phases")
      .select("name, status, start_date, end_date")
      .eq("project_id", projectId)
      .order("sort_order");

    // Fetch tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("title, status, priority, due_date")
      .eq("project_id", projectId);

    // Fetch deliverables
    const { data: deliverables } = await supabase
      .from("project_deliverables")
      .select("name, status, due_date")
      .eq("project_id", projectId);

    // Fetch observations
    const { data: observations } = await supabase
      .from("project_observations")
      .select("description, status, priority")
      .eq("project_id", projectId);

    // Fetch lots
    const { data: lots } = await supabase
      .from("project_lots")
      .select("name, status, budget")
      .eq("project_id", projectId);

    // Fetch MOE team with company names
    const { data: moeTeam } = await supabase
      .from("project_moe_team")
      .select(`
        role,
        crm_companies:crm_company_id (name)
      `)
      .eq("project_id", projectId);

    // Build project data object
    const projectData: ProjectData = {
      name: project.name,
      description: project.description || undefined,
      project_type: project.project_type || undefined,
      status: project.status || undefined,
      budget: project.budget || undefined,
      surface_area: project.surface_area || undefined,
      city: project.city || undefined,
      phases: phases || [],
      tasks: tasks || [],
      deliverables: deliverables || [],
      observations: observations || [],
      lots: lots || [],
      moeTeam: (moeTeam || []).map((m: any) => ({
        role: m.role,
        company_name: m.crm_companies?.name,
      })),
    };

    console.log("Project data collected:", {
      phases: projectData.phases.length,
      tasks: projectData.tasks.length,
      deliverables: projectData.deliverables.length,
      observations: projectData.observations.length,
      lots: projectData.lots.length,
      moeTeam: projectData.moeTeam.length,
    });

    // Calculate statistics
    const completedPhases = projectData.phases.filter(p => p.status === "completed").length;
    const totalPhases = projectData.phases.length;
    const progressPercent = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
    
    const completedTasks = projectData.tasks.filter(t => t.status === "done").length;
    const inProgressTasks = projectData.tasks.filter(t => t.status === "in_progress").length;
    const overdueTasks = projectData.tasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"
    ).length;
    
    const openObservations = projectData.observations.filter(o => o.status === "open").length;
    const criticalObservations = projectData.observations.filter(o => o.priority === "critical").length;
    
    const currentPhase = projectData.phases.find(p => p.status === "in_progress");

    // Build prompt for AI
    const prompt = `Tu es un assistant de gestion de projet d'architecture. Génère un résumé exécutif concis (3-5 phrases) de l'état d'avancement du projet suivant. Le résumé doit être professionnel, en français, et mentionner les points clés et alertes importantes.

Projet: ${projectData.name}
${projectData.description ? `Description: ${projectData.description}` : ""}
Type: ${projectData.project_type || "Non défini"}
${projectData.city ? `Localisation: ${projectData.city}` : ""}
${projectData.surface_area ? `Surface: ${projectData.surface_area} m²` : ""}
${projectData.budget ? `Budget: ${projectData.budget.toLocaleString("fr-FR")} €` : ""}

AVANCEMENT:
- Progression globale: ${progressPercent}% (${completedPhases}/${totalPhases} phases terminées)
${currentPhase ? `- Phase en cours: ${currentPhase.name}` : "- Aucune phase en cours"}

TÂCHES:
- Total: ${projectData.tasks.length} tâches
- Terminées: ${completedTasks}
- En cours: ${inProgressTasks}
${overdueTasks > 0 ? `- ⚠️ En retard: ${overdueTasks}` : ""}

LIVRABLES:
- ${projectData.deliverables.filter(d => d.status === "delivered" || d.status === "validated").length}/${projectData.deliverables.length} livrés/validés

CHANTIER:
- ${projectData.lots.length} lots
${projectData.observations.length > 0 ? `- ${projectData.observations.length} observations (${openObservations} ouvertes)` : ""}
${criticalObservations > 0 ? `- ⚠️ ${criticalObservations} observations critiques` : ""}

ÉQUIPE MOE:
${projectData.moeTeam.length > 0 ? projectData.moeTeam.map(m => `- ${m.role}${m.company_name ? `: ${m.company_name}` : ""}`).join("\n") : "- Équipe non définie"}

Génère uniquement le résumé, sans introduction ni conclusion.`;

    console.log("Calling Lovable AI for summary generation...");

    // Call Lovable AI API
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const summary = aiResult.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      console.error("No summary generated from AI");
      return new Response(
        JSON.stringify({ error: "Failed to generate summary" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Summary generated successfully");

    // Update project with AI summary
    const { error: updateError } = await supabase
      .from("projects")
      .update({ ai_summary: summary, updated_at: new Date().toISOString() })
      .eq("id", projectId);

    if (updateError) {
      console.error("Failed to update project:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to save summary" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Summary saved to project");

    return new Response(
      JSON.stringify({ summary }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-project-summary:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
