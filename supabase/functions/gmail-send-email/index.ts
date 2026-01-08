import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  // CRM tracking fields
  contactId?: string;
  companyId?: string;
  leadId?: string;
  projectId?: string;
  tenderId?: string;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token refresh failed:', error);
    throw new Error('Failed to refresh access token');
  }

  return response.json();
}

function createMimeMessage(
  from: string,
  to: string | string[],
  subject: string,
  htmlBody: string,
  cc?: string[],
  bcc?: string[],
  replyTo?: string
): string {
  const toAddresses = Array.isArray(to) ? to.join(', ') : to;
  
  let headers = [
    `From: ${from}`,
    `To: ${toAddresses}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ];

  if (cc && cc.length > 0) {
    headers.push(`Cc: ${cc.join(', ')}`);
  }
  if (bcc && bcc.length > 0) {
    headers.push(`Bcc: ${bcc.join(', ')}`);
  }
  if (replyTo) {
    headers.push(`Reply-To: ${replyTo}`);
  }

  const message = headers.join('\r\n') + '\r\n\r\n' + btoa(unescape(encodeURIComponent(htmlBody)));
  
  // URL-safe base64 encoding
  return btoa(message)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
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

    // Create client with user's auth
    const supabaseUser = createClient(SUPABASE_URL!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { to, subject, body, cc, bcc, replyTo, contactId, companyId, leadId, projectId, tenderId }: SendEmailRequest = await req.json();

    if (!to || !subject || !body) {
      throw new Error('Missing required fields: to, subject, body');
    }

    // Get user's active workspace from profile
    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('active_workspace_id')
      .eq('user_id', user.id)
      .single();

    const workspaceId = profile?.active_workspace_id;
    if (!workspaceId) {
      throw new Error('No active workspace');
    }

    // Get Gmail connection with service role
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data: connection, error: connError } = await supabaseAdmin
      .from('gmail_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      throw new Error('Gmail not connected. Please connect your Gmail account in settings.');
    }

    // Check if token needs refresh
    let accessToken = connection.access_token;
    const tokenExpiry = new Date(connection.token_expires_at);
    
    if (tokenExpiry <= new Date(Date.now() + 60000)) { // Refresh if expiring in 1 minute
      console.log('Refreshing access token...');
      const newTokens = await refreshAccessToken(connection.refresh_token);
      accessToken = newTokens.access_token;
      
      // Update stored token
      await supabaseAdmin
        .from('gmail_connections')
        .update({
          access_token: newTokens.access_token,
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);
    }

    // Create and send email via Gmail API
    const rawMessage = createMimeMessage(
      connection.gmail_email,
      to,
      subject,
      body,
      cc,
      bcc,
      replyTo
    );

    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawMessage }),
    });

    if (!gmailResponse.ok) {
      const errorText = await gmailResponse.text();
      console.error('Gmail API error:', gmailResponse.status, errorText);
      throw new Error(`Failed to send email via Gmail: ${gmailResponse.status}`);
    }

    const gmailResult = await gmailResponse.json();
    console.log('Email sent via Gmail:', gmailResult.id);

    // Record email in CRM
    const toEmail = Array.isArray(to) ? to[0] : to;
    const { data: emailRecord, error: emailError } = await supabaseAdmin
      .from('crm_emails')
      .insert({
        workspace_id: workspaceId,
        to_email: toEmail,
        from_email: connection.gmail_email,
        subject,
        body,
        status: 'sent',
        sent_at: new Date().toISOString(),
        created_by: user.id,
        contact_id: contactId || null,
        company_id: companyId || null,
        lead_id: leadId || null,
        project_id: projectId || null,
        tender_id: tenderId || null,
        gmail_message_id: gmailResult.id,
        gmail_thread_id: gmailResult.threadId,
        direction: 'outbound',
        synced_from_gmail: false,
      })
      .select()
      .single();

    if (emailError) {
      console.error('Failed to record email:', emailError);
      // Don't throw - email was sent successfully
    }

    return new Response(JSON.stringify({
      success: true,
      messageId: gmailResult.id,
      threadId: gmailResult.threadId,
      emailRecordId: emailRecord?.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gmail-send-email:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
