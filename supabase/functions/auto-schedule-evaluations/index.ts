import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WorkspaceMember {
  user_id: string;
  workspace_id: string;
  role: string;
}

interface TeamEvaluation {
  id: string;
  user_id: string;
  workspace_id: string;
  scheduled_date: string;
  evaluation_type: string;
  status: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const now = new Date();
    const sixMonthsFromNow = new Date(now);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    
    // Get all workspaces
    const { data: workspaces, error: wsError } = await supabase
      .from("workspaces")
      .select("id");
    
    if (wsError) throw wsError;
    
    const results: { workspace_id: string; created: number; skipped: number }[] = [];
    
    for (const workspace of workspaces || []) {
      // Get all members of this workspace (excluding owners/admins who typically evaluate, not get evaluated)
      const { data: members, error: membersError } = await supabase
        .from("workspace_members")
        .select("user_id, workspace_id, role")
        .eq("workspace_id", workspace.id)
        .neq("is_hidden", true);
      
      if (membersError) {
        console.error(`Error fetching members for workspace ${workspace.id}:`, membersError);
        continue;
      }
      
      // Get existing evaluations for the next 6 months
      const { data: existingEvaluations, error: evalError } = await supabase
        .from("team_evaluations")
        .select("id, user_id, workspace_id, scheduled_date, evaluation_type, status")
        .eq("workspace_id", workspace.id)
        .gte("scheduled_date", now.toISOString())
        .lte("scheduled_date", sixMonthsFromNow.toISOString())
        .in("status", ["scheduled", "in_progress", "pending"]);
      
      if (evalError) {
        console.error(`Error fetching evaluations for workspace ${workspace.id}:`, evalError);
        continue;
      }
      
      // Find users who don't have an annual evaluation scheduled in the next 6 months
      const usersWithEvaluation = new Set(
        (existingEvaluations || [])
          .filter(e => e.evaluation_type === "annual")
          .map(e => e.user_id)
      );
      
      const membersNeedingEvaluation = (members || []).filter(
        m => !usersWithEvaluation.has(m.user_id)
      );
      
      // Get the first admin/owner to be the default evaluator
      const { data: admins } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", workspace.id)
        .in("role", ["owner", "admin"])
        .limit(1);
      
      const defaultEvaluatorId = admins?.[0]?.user_id;
      
      if (!defaultEvaluatorId) {
        console.log(`No admin found for workspace ${workspace.id}, skipping`);
        continue;
      }
      
      let created = 0;
      let skipped = 0;
      
      for (const member of membersNeedingEvaluation) {
        // Don't create self-evaluations for the evaluator
        if (member.user_id === defaultEvaluatorId) {
          skipped++;
          continue;
        }
        
        // Calculate suggested date (6 months from now, on a weekday at 10:00)
        const suggestedDate = new Date(sixMonthsFromNow);
        // Move to next weekday if weekend
        while (suggestedDate.getDay() === 0 || suggestedDate.getDay() === 6) {
          suggestedDate.setDate(suggestedDate.getDate() + 1);
        }
        suggestedDate.setHours(10, 0, 0, 0);
        
        // Create a "pending" evaluation (needs to be scheduled)
        const { error: insertError } = await supabase
          .from("team_evaluations")
          .insert({
            workspace_id: workspace.id,
            user_id: member.user_id,
            evaluator_id: defaultEvaluatorId,
            evaluation_type: "annual",
            scheduled_date: suggestedDate.toISOString(),
            status: "pending", // New status for auto-generated, needs scheduling
            notes: "Entretien annuel généré automatiquement - à planifier",
            duration_minutes: 60,
            panel_members: [],
          });
        
        if (insertError) {
          console.error(`Error creating evaluation for user ${member.user_id}:`, insertError);
          skipped++;
        } else {
          created++;
        }
      }
      
      results.push({
        workspace_id: workspace.id,
        created,
        skipped,
      });
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Auto-scheduling completed",
        results,
        timestamp: now.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in auto-schedule-evaluations:", errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});