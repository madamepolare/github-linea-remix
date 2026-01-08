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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Get user from auth header
    const supabaseUser = createClient(SUPABASE_URL!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user's active workspace
    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('active_workspace_id')
      .eq('user_id', user.id)
      .single();

    const workspaceId = profile?.active_workspace_id;
    if (!workspaceId) {
      throw new Error('No active workspace');
    }

    // Get connection to revoke token
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data: connection } = await supabaseAdmin
      .from('gmail_connections')
      .select('refresh_token')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .single();

    // Revoke token at Google
    if (connection?.refresh_token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${connection.refresh_token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        console.log('Google token revoked');
      } catch (revokeError) {
        console.error('Failed to revoke Google token:', revokeError);
        // Continue anyway - user wants to disconnect
      }
    }

    // Delete connection from database
    const { error: deleteError } = await supabaseAdmin
      .from('gmail_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId);

    if (deleteError) {
      throw new Error('Failed to delete connection');
    }

    console.log('Gmail disconnected for user:', user.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gmail-disconnect:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
