import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    parts?: Array<{ body?: { data?: string }; mimeType?: string }>;
    body?: { data?: string };
    mimeType?: string;
  };
  internalDate?: string;
}

interface ConnectionToSync {
  id: string;
  refresh_token: string;
  access_token: string;
  token_expires_at: string;
  gmail_email: string;
  workspace_id: string;
  user_id?: string;
  is_workspace_account: boolean;
  history_id?: number;
}

async function refreshAccessToken(
  refreshToken: string, 
  clientId: string, 
  clientSecret: string
): Promise<{ access_token: string; expires_in: number }> {
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

function getHeader(headers: Array<{ name: string; value: string }> | undefined, name: string): string {
  return headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function extractEmail(headerValue: string): string {
  const match = headerValue.match(/<([^>]+)>/) || headerValue.match(/([^\s<]+@[^\s>]+)/);
  return match ? match[1].toLowerCase() : headerValue.toLowerCase().trim();
}

function decodeBase64Url(data: string): string {
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return decodeURIComponent(escape(decoded));
  } catch {
    return '';
  }
}

function extractBody(payload: GmailMessage['payload']): string {
  if (!payload) return '';

  // Try to get HTML body first, then plain text
  if (payload.parts) {
    const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) {
      return decodeBase64Url(htmlPart.body.data);
    }
    const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      return decodeBase64Url(textPart.body.data);
    }
    // Handle nested multipart
    for (const part of payload.parts) {
      if (part.mimeType?.startsWith('multipart/') && (part as any).parts) {
        const nestedBody = extractBody(part as any);
        if (nestedBody) return nestedBody;
      }
    }
  }

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  return '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const WORKSPACE_GOOGLE_CLIENT_ID = Deno.env.get('WORKSPACE_GOOGLE_CLIENT_ID');
  const WORKSPACE_GOOGLE_CLIENT_SECRET = Deno.env.get('WORKSPACE_GOOGLE_CLIENT_SECRET');
  
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Check if this is a user-triggered sync or cron
    const authHeader = req.headers.get('authorization');
    let targetConnections: ConnectionToSync[] = [];
    let isUserTriggered = false;

    // Determine if this is a user-triggered call or a cron/anonymous call
    // Cron calls use the anon key in the Authorization header
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      // If the token is NOT the anon key, it's a user JWT
      if (token !== SUPABASE_ANON_KEY) {
        isUserTriggered = true;
      }
    }

    if (isUserTriggered && authHeader) {
      // User-triggered sync
      const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('active_workspace_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.active_workspace_id) {
        throw new Error('No active workspace');
      }

      const userWorkspaceId = profile.active_workspace_id;

      // Get personal connection
      const { data: personalConn } = await supabaseAdmin
        .from('gmail_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('workspace_id', userWorkspaceId)
        .eq('is_active', true)
        .single();

      if (personalConn) {
        targetConnections.push({
          ...personalConn,
          is_workspace_account: false,
        });
      }

      // Get workspace email accounts
      const { data: workspaceAccounts } = await supabaseAdmin
        .from('workspace_email_accounts')
        .select('*')
        .eq('workspace_id', userWorkspaceId)
        .eq('is_active', true);

      if (workspaceAccounts) {
        for (const account of workspaceAccounts) {
          targetConnections.push({
            id: account.id,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            token_expires_at: account.token_expires_at,
            gmail_email: account.gmail_email,
            workspace_id: account.workspace_id,
            user_id: account.connected_by,
            is_workspace_account: true,
            history_id: account.history_id,
          });
        }
      }
    } else {
      // Cron-triggered sync - sync all active workspace email accounts
      // We only sync workspace accounts via cron (not personal accounts) for privacy
      console.log('Cron-triggered sync: syncing all active workspace email accounts');

      // Workspace email accounts only for cron
      const { data: workspaceAccounts } = await supabaseAdmin
        .from('workspace_email_accounts')
        .select('*')
        .eq('is_active', true);

      if (workspaceAccounts) {
        for (const account of workspaceAccounts) {
          targetConnections.push({
            id: account.id,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            token_expires_at: account.token_expires_at,
            gmail_email: account.gmail_email,
            workspace_id: account.workspace_id,
            user_id: account.connected_by,
            is_workspace_account: true,
            history_id: account.history_id,
          });
        }
      }
    }

    console.log(`Syncing ${targetConnections.length} Gmail connection(s) (${targetConnections.filter(c => c.is_workspace_account).length} workspace accounts)`);

    let totalSynced = 0;
    let errors: string[] = [];

    for (const connection of targetConnections) {
      try {
        // Select correct OAuth credentials based on account type
        const clientId = connection.is_workspace_account ? WORKSPACE_GOOGLE_CLIENT_ID : GOOGLE_CLIENT_ID;
        const clientSecret = connection.is_workspace_account ? WORKSPACE_GOOGLE_CLIENT_SECRET : GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          console.log(`Skipping ${connection.gmail_email}: missing OAuth credentials for ${connection.is_workspace_account ? 'workspace' : 'personal'} account`);
          continue;
        }

        // Refresh token if needed
        let accessToken = connection.access_token;
        const tokenExpiry = new Date(connection.token_expires_at);

        if (tokenExpiry <= new Date(Date.now() + 60000)) {
          console.log(`Refreshing token for ${connection.gmail_email}`);
          const newTokens = await refreshAccessToken(connection.refresh_token, clientId, clientSecret);
          accessToken = newTokens.access_token;

          // Update token in correct table
          const tableName = connection.is_workspace_account ? 'workspace_email_accounts' : 'gmail_connections';
          await supabaseAdmin
            .from(tableName)
            .update({
              access_token: newTokens.access_token,
              token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', connection.id);
        }

        // Get ONLY contacts/companies that are in a pipeline (not all contacts)
        const { data: pipelineEntries } = await supabaseAdmin
          .from('contact_pipeline_entries')
          .select('contact_id, company_id')
          .eq('workspace_id', connection.workspace_id);

        const pipelineContactIds = new Set(
          (pipelineEntries || []).filter(e => e.contact_id).map(e => e.contact_id)
        );
        const pipelineCompanyIds = new Set(
          (pipelineEntries || []).filter(e => e.company_id).map(e => e.company_id)
        );

        // Get contacts that are in pipelines
        const { data: contacts } = await supabaseAdmin
          .from('contacts')
          .select('id, email, crm_company_id')
          .eq('workspace_id', connection.workspace_id)
          .not('email', 'is', null);

        // Get companies that are in pipelines
        const { data: companies } = await supabaseAdmin
          .from('crm_companies')
          .select('id, email')
          .eq('workspace_id', connection.workspace_id)
          .not('email', 'is', null);

        // Filter to only pipeline contacts/companies
        const pipelineContacts = (contacts || []).filter(c => 
          pipelineContactIds.has(c.id) || pipelineCompanyIds.has(c.crm_company_id)
        );
        const pipelineCompanies = (companies || []).filter(c => 
          pipelineCompanyIds.has(c.id)
        );

        const contactsByEmail = new Map(
          pipelineContacts.map(c => [c.email?.toLowerCase(), c])
        );

        const companiesByEmail = new Map(
          pipelineCompanies.map(c => [c.email?.toLowerCase(), { id: c.id }])
        );

        // Build list of emails to track (only pipeline-related)
        const trackedEmails = new Set<string>();
        pipelineContacts.forEach(c => c.email && trackedEmails.add(c.email.toLowerCase()));
        pipelineCompanies.forEach(c => c.email && trackedEmails.add(c.email.toLowerCase()));

        if (trackedEmails.size === 0) {
          console.log(`No pipeline contacts/companies for ${connection.gmail_email}, skipping sync`);
          continue;
        }

        console.log(`${connection.gmail_email}: tracking ${trackedEmails.size} pipeline-related email addresses`);

        // Fetch recent messages from Gmail (last 50)
        const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=newer_than:7d`;
        const listResponse = await fetch(listUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!listResponse.ok) {
          const errText = await listResponse.text();
          console.error(`Gmail list failed for ${connection.gmail_email}:`, errText);
          errors.push(`${connection.gmail_email}: List failed`);
          continue;
        }

        const listResult = await listResponse.json();
        const messageIds: string[] = (listResult.messages || []).map((m: any) => m.id);

        if (messageIds.length === 0) {
          console.log(`No new messages for ${connection.gmail_email}`);
          continue;
        }

        // Check which messages we already have
        const { data: existingEmails } = await supabaseAdmin
          .from('crm_emails')
          .select('gmail_message_id')
          .eq('workspace_id', connection.workspace_id)
          .in('gmail_message_id', messageIds);

        const existingIds = new Set((existingEmails || []).map(e => e.gmail_message_id));
        const newMessageIds = messageIds.filter(id => !existingIds.has(id));

        console.log(`${connection.gmail_email}: ${newMessageIds.length} new messages to sync`);

        // Fetch and store new messages
        for (const msgId of newMessageIds.slice(0, 20)) { // Limit to 20 per sync
          try {
            const msgResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (!msgResponse.ok) continue;

            const message: GmailMessage = await msgResponse.json();
            const headers = message.payload?.headers || [];

            const from = getHeader(headers, 'From');
            const to = getHeader(headers, 'To');
            const subject = getHeader(headers, 'Subject');
            const cc = getHeader(headers, 'Cc');

            const fromEmail = extractEmail(from);
            const toEmail = extractEmail(to);

            // Determine direction
            const isInbound = toEmail === connection.gmail_email.toLowerCase();
            const otherEmail = isInbound ? fromEmail : toEmail;

            // ONLY sync if the other party is in a pipeline
            if (!trackedEmails.has(otherEmail)) {
              // Skip this email - not related to any pipeline entry
              continue;
            }

            const body = extractBody(message.payload);

            // Try to match to a contact or company by address
            const matchedContact = contactsByEmail.get(otherEmail);
            const matchedCompany = companiesByEmail.get(otherEmail);

            // If inbound, prefer association from existing outbound email in same thread (pipeline context)
            // This prevents mismatches when the sender email belongs to a contact attached to a different company.
            let threadContactId: string | null = null;
            let threadCompanyId: string | null = null;
            if (isInbound && message.threadId) {
              const { data: lastOutbound } = await supabaseAdmin
                .from('crm_emails')
                .select('contact_id, company_id')
                .eq('workspace_id', connection.workspace_id)
                .eq('gmail_thread_id', message.threadId)
                .eq('direction', 'outbound')
                .order('sent_at', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              threadContactId = lastOutbound?.contact_id || null;
              threadCompanyId = lastOutbound?.company_id || null;
            }

            const emailRecord = {
              workspace_id: connection.workspace_id,
              gmail_message_id: message.id,
              gmail_thread_id: message.threadId,
              from_email: fromEmail,
              to_email: toEmail,
              subject: subject || '(Sans objet)',
              body: body.substring(0, 50000), // Limit body size
              direction: isInbound ? 'inbound' : 'outbound',
              status: isInbound ? 'received' : 'sent',
              received_at: isInbound ? new Date(parseInt(message.internalDate || '0')).toISOString() : null,
              sent_at: !isInbound ? new Date(parseInt(message.internalDate || '0')).toISOString() : null,
              is_read: !message.labelIds?.includes('UNREAD'),
              labels: message.labelIds || [],
              synced_from_gmail: true,
              contact_id: threadContactId || matchedContact?.id || null,
              company_id: threadCompanyId || matchedContact?.crm_company_id || matchedCompany?.id || null,
              cc: cc ? cc.split(',').map(e => extractEmail(e.trim())) : null,
              created_by: connection.user_id || null,
              workspace_email_account_id: connection.is_workspace_account ? connection.id : null,
              sent_via: connection.is_workspace_account ? 'workspace' : 'personal',
            };

            const { error: insertError } = await supabaseAdmin
              .from('crm_emails')
              .insert(emailRecord);

            if (!insertError) {
              totalSynced++;
            } else {
              console.error(`Insert error for ${msgId}:`, insertError.message);
            }
          } catch (msgError) {
            console.error(`Error processing message ${msgId}:`, msgError);
          }
        }

        // Update history_id for incremental sync
        if (listResult.historyId) {
          const tableName = connection.is_workspace_account ? 'workspace_email_accounts' : 'gmail_connections';
          await supabaseAdmin
            .from(tableName)
            .update({ history_id: parseInt(listResult.historyId) })
            .eq('id', connection.id);
        }

      } catch (connError) {
        console.error(`Error syncing ${connection.gmail_email}:`, connError);
        errors.push(`${connection.gmail_email}: ${connError instanceof Error ? connError.message : 'Unknown error'}`);
      }
    }

    console.log(`Sync complete: ${totalSynced} emails synced, ${errors.length} errors`);

    return new Response(JSON.stringify({
      success: true,
      synced: totalSynced,
      connections: targetConnections.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gmail-sync:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});