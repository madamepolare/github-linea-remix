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
    const { to, subject, body, tenderId, memberId } = await req.json();
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!to || !subject || !body) {
      throw new Error("Missing required fields: to, subject, body");
    }

    console.log(`Sending partner invitation to ${to} for tender ${tenderId}`);

    // If RESEND_API_KEY is available, send real email
    if (RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Archimind <noreply@archimind.io>",
          to: [to],
          subject: subject,
          html: formatEmailHtml(body),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Resend error:", response.status, text);
        throw new Error(`Failed to send email: ${response.status}`);
      }

      const data = await response.json();
      console.log("Email sent successfully:", data);
    } else {
      // Log for development
      console.log("RESEND_API_KEY not configured. Email would be sent to:", to);
      console.log("Subject:", subject);
      console.log("Body:", body);
    }

    // Record the invitation in database
    if (tenderId) {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      
      await supabase
        .from('tender_partner_invitations')
        .insert({
          tender_id: tenderId,
          email_subject: subject,
          email_body: body,
          sent_at: new Date().toISOString(),
          response: 'pending',
        });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: RESEND_API_KEY ? "Email sent successfully" : "Email logged (no API key)",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in send-partner-invitation:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function formatEmailHtml(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 2px solid #1a1a1a;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      font-size: 12px;
      color: #666;
    }
    .button {
      display: inline-block;
      background: #1a1a1a;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Archimind</div>
  </div>
  <div class="content">${body.replace(/\n/g, '<br>')}</div>
  <div class="footer">
    <p>Cet email a été envoyé via Archimind.</p>
    <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
  </div>
</body>
</html>
  `;
}
