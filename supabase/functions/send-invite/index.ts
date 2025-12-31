import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
  inviteToken: string;
  inviterName: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, workspaceId, workspaceName, role, inviteToken, inviterName }: InviteRequest = await req.json();

    console.log(`Sending invite email to ${email} for workspace ${workspaceName}`);

    // Get the app URL from the request origin or use a default
    const origin = req.headers.get("origin") || "https://archimind.app";
    const inviteUrl = `${origin}/invite?token=${inviteToken}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ARCHIMIND <onboarding@resend.dev>",
        to: [email],
        subject: `You've been invited to join ${workspaceName} on ARCHIMIND`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: linear-gradient(135deg, #c9a55c, #b8956f); border-radius: 12px; margin-bottom: 16px;">
                  <span style="font-size: 28px; color: white;">⬡</span>
                </div>
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">ARCHIMIND</h1>
              </div>
              
              <div style="background: #f8f8f6; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">You're invited!</h2>
                <p style="margin: 0 0 16px 0; color: #666;">
                  <strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> as a <strong>${role}</strong>.
                </p>
                <p style="margin: 0 0 24px 0; color: #666;">
                  ARCHIMIND helps architecture firms manage projects, teams, and clients all in one place.
                </p>
                <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #c9a55c, #b8956f); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; text-align: center;">
                This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
              </p>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
                <p>© ${new Date().getFullYear()} ARCHIMIND. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Resend API error:", errorData);
      throw new Error(errorData.message || "Failed to send email");
    }

    const data = await res.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invite function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
