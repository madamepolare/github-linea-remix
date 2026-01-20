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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // Contains user_id:workspace_id
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return new Response(
        `<html><body><script>window.opener.postMessage({type:'workspace-email-oauth-error',error:'${error}'},'*');window.close();</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    const [userId, workspaceId] = state.split(':');
    if (!userId || !workspaceId) {
      throw new Error('Invalid state parameter');
    }

    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${SUPABASE_URL}/functions/v1/workspace-email-oauth-callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();
    console.log('Tokens received:', { 
      hasAccessToken: !!tokens.access_token, 
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in 
    });

    // Get user's Gmail address
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();
    const gmailEmail = userInfo.email;
    console.log('Workspace Gmail email:', gmailEmail);

    // Store tokens in database
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check if user is admin/owner of the workspace
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .single();

    if (memberError || !member || !['owner', 'admin'].includes(member.role)) {
      throw new Error('Only workspace admins can add workspace email accounts');
    }

    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Check if this is the first account for this workspace (make it default)
    const { count } = await supabase
      .from('workspace_email_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    const isDefault = count === 0;

    const { error: dbError } = await supabase
      .from('workspace_email_accounts')
      .upsert({
        workspace_id: workspaceId,
        gmail_email: gmailEmail,
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        token_expires_at: tokenExpiresAt,
        is_active: true,
        is_default: isDefault,
        connected_by: userId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'workspace_id,gmail_email',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store connection');
    }

    console.log('Workspace email connection stored successfully');

    // Return success page that closes the popup
    return new Response(
      `<html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'workspace-email-oauth-success',
              email: '${gmailEmail}'
            }, '*');
            window.close();
          </script>
          <p>Connexion réussie ! Cette fenêtre va se fermer...</p>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('Error in workspace-email-oauth-callback:', error);
    return new Response(
      `<html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'workspace-email-oauth-error',
              error: '${error instanceof Error ? error.message : 'Unknown error'}'
            }, '*');
            window.close();
          </script>
          <p>Erreur de connexion. Cette fenêtre va se fermer...</p>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
});
