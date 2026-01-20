import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateRequest {
  accountId: string;
  action: 'setDefault' | 'updateDisplayName' | 'disconnect';
  displayName?: string;
}

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

    const { accountId, action, displayName }: UpdateRequest = await req.json();

    if (!accountId || !action) {
      throw new Error('Missing required fields');
    }

    // Get user's active workspace
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_workspace_id')
      .eq('user_id', user.id)
      .single();

    const workspaceId = profile?.active_workspace_id;
    if (!workspaceId) {
      throw new Error('No active workspace');
    }

    // Verify user is admin/owner
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new Error('Only workspace admins can manage email accounts');
    }

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verify account belongs to this workspace
    const { data: account } = await supabaseAdmin
      .from('workspace_email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!account) {
      throw new Error('Account not found');
    }

    switch (action) {
      case 'setDefault':
        // The trigger will handle unsetting other defaults
        await supabaseAdmin
          .from('workspace_email_accounts')
          .update({ is_default: true, updated_at: new Date().toISOString() })
          .eq('id', accountId);
        break;

      case 'updateDisplayName':
        await supabaseAdmin
          .from('workspace_email_accounts')
          .update({ display_name: displayName || null, updated_at: new Date().toISOString() })
          .eq('id', accountId);
        break;

      case 'disconnect':
        await supabaseAdmin
          .from('workspace_email_accounts')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', accountId);
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in workspace-email-update:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
