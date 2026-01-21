import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Archive tasks that have been done for more than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: tasksToArchive, error: fetchError } = await supabase
      .from("tasks")
      .select("id, title")
      .eq("status", "done")
      .not("completed_at", "is", null)
      .lt("completed_at", twentyFourHoursAgo);

    if (fetchError) {
      throw fetchError;
    }

    if (!tasksToArchive || tasksToArchive.length === 0) {
      return new Response(
        JSON.stringify({ message: "No tasks to archive", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const taskIds = tasksToArchive.map(t => t.id);

    // Update status to archived
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ status: "archived" })
      .in("id", taskIds);

    if (updateError) {
      throw updateError;
    }

    console.log(`Archived ${taskIds.length} tasks:`, tasksToArchive.map(t => t.title));

    return new Response(
      JSON.stringify({ 
        message: `Successfully archived ${taskIds.length} tasks`,
        count: taskIds.length,
        tasks: tasksToArchive.map(t => ({ id: t.id, title: t.title }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error archiving tasks:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
