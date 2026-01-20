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
        accounts: [],
        defaultAccount: null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to get accounts (to hide tokens from response)
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get workspace email accounts
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('workspace_email_accounts')
      .select('id, gmail_email, display_name, is_default, is_active, connected_by, created_at, updated_at')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      throw new Error('Failed to fetch workspace email accounts');
    }

    const defaultAccount = accounts?.find(a => a.is_default) || null;

    return new Response(JSON.stringify({
      accounts: accounts || [],
      defaultAccount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in workspace-email-status:', error);
    return new Response(JSON.stringify({
      accounts: [],
      defaultAccount: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
