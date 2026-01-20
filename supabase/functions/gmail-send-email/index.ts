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
  skipSignature?: boolean;
  // Sender selection
  sendVia?: 'personal' | 'workspace';
  workspaceEmailAccountId?: string; // Optional: specific workspace account
  // CRM tracking fields
  contactId?: string;
  companyId?: string;
  leadId?: string;
  projectId?: string;
  tenderId?: string;
}

function processSignatureTemplate(
  signature: string,
  userData: { fullName?: string; email?: string },
  workspaceData: { name?: string; phone?: string; email?: string; website?: string; address?: string; city?: string; postal_code?: string }
): string {
  const values: Record<string, string> = {
    "{{user_name}}": userData.fullName || "",
    "{{workspace_name}}": workspaceData.name || "",
    "{{phone}}": workspaceData.phone || "",
    "{{email}}": workspaceData.email || "",
    "{{website}}": workspaceData.website || "",
    "{{address}}": workspaceData.address || "",
    "{{city}}": workspaceData.city || "",
    "{{postal_code}}": workspaceData.postal_code || "",
  };

  let result = signature;
  
  Object.entries(values).forEach(([key, value]) => {
    result = result.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
  });

  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, content) => {
    const value = values[`{{${key}}}`];
    return value ? content : "";
  });

  return result;
}

async function refreshAccessToken(
  refreshToken: string, 
  isWorkspace: boolean = false
): Promise<{ access_token: string; expires_in: number }> {
  // Use appropriate credentials based on account type
  const clientId = isWorkspace 
    ? Deno.env.get('WORKSPACE_GOOGLE_CLIENT_ID') 
    : Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = isWorkspace 
    ? Deno.env.get('WORKSPACE_GOOGLE_CLIENT_SECRET') 
    : Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
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
  fromName: string | null,
  to: string | string[],
  subject: string,
  htmlBody: string,
  cc?: string[],
  bcc?: string[],
  replyTo?: string
): string {
  const toAddresses = Array.isArray(to) ? to.join(', ') : to;
  const fromHeader = fromName ? `${fromName} <${from}>` : from;
  
  let headers = [
    `From: ${fromHeader}`,
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

    const supabaseUser = createClient(SUPABASE_URL!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { 
      to, subject, body, cc, bcc, replyTo, skipSignature, 
      sendVia = 'workspace', // Default to workspace if available
      workspaceEmailAccountId,
      contactId, companyId, leadId, projectId, tenderId 
    }: SendEmailRequest = await req.json();

    if (!to || !subject || !body) {
      throw new Error('Missing required fields: to, subject, body');
    }

    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('active_workspace_id, full_name')
      .eq('user_id', user.id)
      .single();

    const workspaceId = profile?.active_workspace_id;
    if (!workspaceId) {
      throw new Error('No active workspace');
    }

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get workspace data for signature
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('name, phone, email, website, address, city, postal_code, email_signature, email_signature_enabled')
      .eq('id', workspaceId)
      .single();

    // Determine which account to use
    let connection: any = null;
    let isWorkspaceAccount = false;
    let senderDisplayName: string | null = null;

    // Try workspace email first if sendVia is 'workspace' or we have a specific account ID
    if (sendVia === 'workspace' || workspaceEmailAccountId) {
      let query = supabaseAdmin
        .from('workspace_email_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true);

      if (workspaceEmailAccountId) {
        query = query.eq('id', workspaceEmailAccountId);
      } else {
        query = query.eq('is_default', true);
      }

      const { data: workspaceAccount } = await query.single();
      
      if (workspaceAccount) {
        connection = workspaceAccount;
        isWorkspaceAccount = true;
        senderDisplayName = workspaceAccount.display_name;
      }
    }

    // Fall back to personal account if no workspace account or sendVia is 'personal'
    if (!connection && sendVia === 'personal') {
      const { data: personalConn, error: connError } = await supabaseAdmin
        .from('gmail_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .single();

      if (!connError && personalConn) {
        connection = personalConn;
      }
    }

    // If still no connection, try workspace default then personal
    if (!connection) {
      // Try workspace default
      const { data: wsDefault } = await supabaseAdmin
        .from('workspace_email_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .eq('is_default', true)
        .single();

      if (wsDefault) {
        connection = wsDefault;
        isWorkspaceAccount = true;
        senderDisplayName = wsDefault.display_name;
      } else {
        // Try personal
        const { data: personal } = await supabaseAdmin
          .from('gmail_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('workspace_id', workspaceId)
          .eq('is_active', true)
          .single();

        if (personal) {
          connection = personal;
        }
      }
    }

    if (!connection) {
      throw new Error('Aucun compte email configuré. Veuillez connecter un compte Gmail dans les paramètres.');
    }

    const senderEmail = connection.gmail_email;

    // Prepare email body with signature
    let finalBody = body;
    
    if (!skipSignature && workspace?.email_signature_enabled && workspace?.email_signature) {
      const processedSignature = processSignatureTemplate(
        workspace.email_signature,
        { fullName: profile?.full_name || '', email: senderEmail },
        {
          name: workspace.name,
          phone: workspace.phone,
          email: workspace.email,
          website: workspace.website,
          address: workspace.address,
          city: workspace.city,
          postal_code: workspace.postal_code,
        }
      );
      
      finalBody = `${body}<br><br>--<br>${processedSignature}`;
    }

    // Check if token needs refresh
    let accessToken = connection.access_token;
    const tokenExpiry = new Date(connection.token_expires_at);
    
    if (tokenExpiry <= new Date(Date.now() + 60000)) {
      console.log('Refreshing access token...');
      const newTokens = await refreshAccessToken(connection.refresh_token, isWorkspaceAccount);
      accessToken = newTokens.access_token;
      
      // Update stored token in appropriate table
      const updateTable = isWorkspaceAccount ? 'workspace_email_accounts' : 'gmail_connections';
      await supabaseAdmin
        .from(updateTable)
        .update({
          access_token: newTokens.access_token,
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);
    }

    // Create and send email via Gmail API
    const rawMessage = createMimeMessage(
      senderEmail,
      senderDisplayName,
      to,
      subject,
      finalBody,
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
    console.log('Email sent via Gmail:', gmailResult.id, 'via:', isWorkspaceAccount ? 'workspace' : 'personal');

    // Record email in CRM
    const toEmail = Array.isArray(to) ? to[0] : to;
    const { data: emailRecord, error: emailError } = await supabaseAdmin
      .from('crm_emails')
      .insert({
        workspace_id: workspaceId,
        to_email: toEmail,
        from_email: senderEmail,
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
    }

    // Update pipeline entry to mark as awaiting response
    if (contactId || companyId) {
      const entryQuery = supabaseAdmin
        .from('contact_pipeline_entries')
        .update({ 
          awaiting_response: true,
          last_email_sent_at: new Date().toISOString(),
        })
        .eq('workspace_id', workspaceId);

      if (contactId) {
        await entryQuery.eq('contact_id', contactId);
      } else if (companyId) {
        await entryQuery.eq('company_id', companyId);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      messageId: gmailResult.id,
      threadId: gmailResult.threadId,
      emailRecordId: emailRecord?.id,
      sentVia: isWorkspaceAccount ? 'workspace' : 'personal',
      sentFrom: senderEmail,
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