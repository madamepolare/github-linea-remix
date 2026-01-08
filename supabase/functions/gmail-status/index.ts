import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

    const supabase = createClient(SUPABASE_URL!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user's active workspace
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_workspace_id')
      .eq('user_id', user.id)
      .single();

    const workspaceId = profile?.active_workspace_id;
    if (!workspaceId) {
      return new Response(JSON.stringify({
        connected: false,
        email: null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for Gmail connection
    const { data: connection } = await supabase
      .from('gmail_connections')
      .select('gmail_email, is_active, updated_at')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .single();

    return new Response(JSON.stringify({
      connected: !!connection,
      email: connection?.gmail_email || null,
      lastSync: connection?.updated_at || null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gmail-status:', error);
    return new Response(JSON.stringify({
      connected: false,
      email: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 200, // Return 200 even on error to avoid breaking the UI
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
