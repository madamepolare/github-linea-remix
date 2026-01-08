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
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Check if this is a user-triggered sync or cron
    const authHeader = req.headers.get('authorization');
    let targetConnections: any[] = [];

    if (authHeader && !authHeader.includes(Deno.env.get('SUPABASE_ANON_KEY')!)) {
      // User-triggered sync
      const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: profile } = await supabaseUser
        .from('profiles')
        .select('active_workspace_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.active_workspace_id) {
        throw new Error('No active workspace');
      }

      const { data: connection } = await supabaseAdmin
        .from('gmail_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('workspace_id', profile.active_workspace_id)
        .eq('is_active', true)
        .single();

      if (connection) {
        targetConnections = [connection];
      }
    } else {
      // Cron-triggered sync - sync all active connections
      const { data: connections } = await supabaseAdmin
        .from('gmail_connections')
        .select('*')
        .eq('is_active', true);

      targetConnections = connections || [];
    }

    console.log(`Syncing ${targetConnections.length} Gmail connection(s)`);

    let totalSynced = 0;
    let errors: string[] = [];

    for (const connection of targetConnections) {
      try {
        // Refresh token if needed
        let accessToken = connection.access_token;
        const tokenExpiry = new Date(connection.token_expires_at);

        if (tokenExpiry <= new Date(Date.now() + 60000)) {
          console.log(`Refreshing token for ${connection.gmail_email}`);
          const newTokens = await refreshAccessToken(connection.refresh_token);
          accessToken = newTokens.access_token;

          await supabaseAdmin
            .from('gmail_connections')
            .update({
              access_token: newTokens.access_token,
              token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', connection.id);
        }

        // Get known contacts for this workspace
        const { data: contacts } = await supabaseAdmin
          .from('contacts')
          .select('id, email, crm_company_id')
          .eq('workspace_id', connection.workspace_id)
          .not('email', 'is', null);

        const contactsByEmail = new Map(
          (contacts || []).map(c => [c.email?.toLowerCase(), c])
        );

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
            const date = getHeader(headers, 'Date');
            const cc = getHeader(headers, 'Cc');

            const fromEmail = extractEmail(from);
            const toEmail = extractEmail(to);
            const body = extractBody(message.payload);

            // Determine direction
            const isInbound = toEmail === connection.gmail_email.toLowerCase();
            const otherEmail = isInbound ? fromEmail : toEmail;

            // Try to match to a contact
            const matchedContact = contactsByEmail.get(otherEmail);

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
              contact_id: matchedContact?.id || null,
              company_id: matchedContact?.crm_company_id || null,
              cc: cc ? cc.split(',').map(e => extractEmail(e.trim())) : null,
              created_by: connection.user_id,
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
          await supabaseAdmin
            .from('gmail_connections')
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
