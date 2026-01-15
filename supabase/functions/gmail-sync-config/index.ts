import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncConfigRequest {
  action: "get" | "update";
  interval_minutes?: number;
  enabled?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Verify user authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Not authenticated");
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Get user's workspace
    const { data: profile } = await supabaseUser
      .from("profiles")
      .select("active_workspace_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.active_workspace_id) {
      throw new Error("No active workspace");
    }

    const body: SyncConfigRequest = await req.json();
    const { action, interval_minutes, enabled } = body;

    if (action === "get") {
      // Get from workspace_settings
      const { data: setting } = await supabaseAdmin
        .from("workspace_settings")
        .select("setting_value")
        .eq("workspace_id", profile.active_workspace_id)
        .eq("setting_type", "gmail_sync")
        .eq("setting_key", "auto_sync_config")
        .single();

      const config = setting?.setting_value || { interval_minutes: 5, enabled: true };

      return new Response(
        JSON.stringify({ 
          success: true, 
          config
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "update") {
      // Update workspace setting
      const newConfig = {
        interval_minutes: interval_minutes || 5,
        enabled: enabled !== undefined ? enabled : true,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      };

      // Upsert the setting
      const { error: upsertError } = await supabaseAdmin
        .from("workspace_settings")
        .upsert({
          workspace_id: profile.active_workspace_id,
          setting_type: "gmail_sync",
          setting_key: "auto_sync_config",
          setting_value: newConfig,
          is_active: true,
        }, {
          onConflict: "workspace_id,setting_type,setting_key",
        });

      if (upsertError) {
        console.error("Error upserting setting:", upsertError);
        throw new Error("Failed to update setting");
      }

      // Log the config change - cron update would require direct DB access
      // For now, the global cron runs every 5 min and syncs all connections
      console.log(`Gmail sync config updated: interval=${interval_minutes}min, enabled=${enabled}`);
      console.log("Note: Cron schedule update requires manual DB configuration");

      return new Response(
        JSON.stringify({ success: true, config: newConfig }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    console.error("Error in gmail-sync-config:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
