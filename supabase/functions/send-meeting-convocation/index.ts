import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConvocationRequest {
  meetingTitle: string;
  meetingNumber: number | null;
  meetingDate: string;
  meetingLocation: string | null;
  projectName: string;
  customMessage?: string;
  recipients: Array<{ name: string; email: string }>;
}

async function refreshGoogleAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<string> {
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
    const errorText = await response.text();
    console.error('Token refresh error:', errorText);
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();
  return data.access_token;
}

async function sendViaGmail(accessToken: string, from: string, to: string, subject: string, html: string) {
  const emailLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
  ];

  const rawMessage = emailLines.join('\r\n');
  const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gmail send failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const WORKSPACE_GOOGLE_CLIENT_ID = Deno.env.get('WORKSPACE_GOOGLE_CLIENT_ID');
    const WORKSPACE_GOOGLE_CLIENT_SECRET = Deno.env.get('WORKSPACE_GOOGLE_CLIENT_SECRET');

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ConvocationRequest = await req.json();
    console.log("Sending convocation:", body);

    const { 
      meetingTitle, 
      meetingNumber, 
      meetingDate, 
      meetingLocation, 
      projectName, 
      customMessage,
      recipients 
    } = body;

    if (!recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's active workspace
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('active_workspace_id')
      .eq('user_id', user.id)
      .single();

    const workspaceId = profile?.active_workspace_id;

    // Try to get workspace email account for Gmail sending
    let workspaceEmailAccount = null;
    if (workspaceId && WORKSPACE_GOOGLE_CLIENT_ID && WORKSPACE_GOOGLE_CLIENT_SECRET) {
      const { data: wsAccount } = await supabaseAdmin
        .from('workspace_email_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .eq('is_default', true)
        .single();

      if (wsAccount) {
        workspaceEmailAccount = wsAccount;
      }
    }

    // Format date
    const date = new Date(meetingDate);
    const formattedDate = date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Build HTML email
    const buildEmailHtml = (recipientName: string) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0 0; opacity: 0.9; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
          .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .info-row { display: flex; margin: 10px 0; }
          .info-label { color: #6b7280; min-width: 100px; }
          .info-value { font-weight: 500; }
          .message { background: #eff6ff; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Convocation - Réunion de chantier${meetingNumber ? ` n°${meetingNumber}` : ""}</h1>
            <p>${projectName}</p>
          </div>
          <div class="content">
            <p>Bonjour ${recipientName},</p>
            <p>Vous êtes convoqué(e) à la prochaine réunion de chantier :</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">📋 Objet</span>
                <span class="info-value">${meetingTitle}</span>
              </div>
              <div class="info-row">
                <span class="info-label">📅 Date</span>
                <span class="info-value">${formattedDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">🕐 Heure</span>
                <span class="info-value">${formattedTime}</span>
              </div>
              ${meetingLocation ? `
              <div class="info-row">
                <span class="info-label">📍 Lieu</span>
                <span class="info-value">${meetingLocation}</span>
              </div>
              ` : ""}
            </div>

            ${customMessage ? `
            <div class="message">
              <strong>Message :</strong><br/>
              ${customMessage.replace(/\n/g, "<br/>")}
            </div>
            ` : ""}

            <p>Merci de confirmer votre présence.</p>
            <p>Cordialement,<br/>L'équipe projet</p>

            <div class="footer">
              <p>Cet email a été envoyé via l'application de gestion de projet.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const results: Array<{ email: string; status: string; error?: string }> = [];

    // Send via workspace Gmail if available
    if (workspaceEmailAccount && WORKSPACE_GOOGLE_CLIENT_ID && WORKSPACE_GOOGLE_CLIENT_SECRET) {
      try {
        const accessToken = await refreshGoogleAccessToken(
          workspaceEmailAccount.refresh_token,
          WORKSPACE_GOOGLE_CLIENT_ID,
          WORKSPACE_GOOGLE_CLIENT_SECRET
        );

        const senderName = workspaceEmailAccount.display_name || 'Équipe Projet';
        const senderEmail = workspaceEmailAccount.gmail_email;
        const from = `${senderName} <${senderEmail}>`;

        for (const recipient of recipients) {
          const subject = `[${projectName}] Convocation - ${meetingTitle}`;
          const html = buildEmailHtml(recipient.name);
          
          try {
            await sendViaGmail(accessToken, from, recipient.email, subject, html);
            results.push({ email: recipient.email, status: 'fulfilled' });
          } catch (error) {
            console.error(`Gmail send failed for ${recipient.email}:`, error);
            results.push({ 
              email: recipient.email, 
              status: 'rejected', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }
      } catch (error) {
        console.error('Error with workspace Gmail:', error);
        // Fall through to Resend as fallback
      }
    }

    // Fallback to Resend if no results yet or all failed via Gmail
    const successfulGmail = results.filter(r => r.status === 'fulfilled').length;
    if (successfulGmail === 0) {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      
      if (RESEND_API_KEY) {
        const { Resend } = await import("https://esm.sh/resend@2.0.0");
        const resend = new Resend(RESEND_API_KEY);

        for (const recipient of recipients) {
          const subject = `[${projectName}] Convocation - ${meetingTitle}`;
          const html = buildEmailHtml(recipient.name);
          
          try {
            await resend.emails.send({
              from: "Projet <onboarding@resend.dev>",
              to: [recipient.email],
              subject,
              html,
            });
            results.push({ email: recipient.email, status: 'fulfilled' });
          } catch (error) {
            results.push({ 
              email: recipient.email, 
              status: 'rejected', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }
      }
    }

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Convocation sent: ${successful} success, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        failed,
        details: results.map((r) => ({
          email: r.email,
          status: r.status,
          error: r.error || null,
        }))
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-meeting-convocation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);