import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WORKSPACE_GOOGLE_CLIENT_ID = Deno.env.get('WORKSPACE_GOOGLE_CLIENT_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

    if (!WORKSPACE_GOOGLE_CLIENT_ID) {
      throw new Error('Workspace Google OAuth not configured');
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/workspace-email-oauth-callback`;

    return new Response(JSON.stringify({
      clientId: WORKSPACE_GOOGLE_CLIENT_ID,
      redirectUri,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in workspace-email-config:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
