import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DeliverableEmailRequest {
  to: string;
  subject: string;
  deliverableName: string;
  projectName: string;
  phaseName?: string;
  description?: string;
  fileUrl?: string;
  senderName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      subject, 
      deliverableName, 
      projectName,
      phaseName,
      description,
      fileUrl,
      senderName = "L'équipe projet"
    }: DeliverableEmailRequest = await req.json();

    if (!to || !deliverableName || !projectName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .deliverable-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 16px; font-weight: 500; }
          .btn { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">📄 Nouveau livrable</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${projectName}</p>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            <p>Vous trouverez ci-dessous un livrable du projet <strong>${projectName}</strong>.</p>
            
            <div class="deliverable-box">
              <div class="label">Livrable</div>
              <div class="value">${deliverableName}</div>
              ${phaseName ? `
                <div style="margin-top: 16px;">
                  <div class="label">Phase</div>
                  <div class="value">${phaseName}</div>
                </div>
              ` : ''}
              ${description ? `
                <div style="margin-top: 16px;">
                  <div class="label">Description</div>
                  <div style="color: #374151;">${description}</div>
                </div>
              ` : ''}
            </div>
            
            ${fileUrl ? `
              <a href="${fileUrl}" class="btn" target="_blank">
                📎 Télécharger le fichier
              </a>
            ` : ''}
            
            <p style="margin-top: 30px;">Cordialement,<br><strong>${senderName}</strong></p>
          </div>
          <div class="footer">
            Cet email a été envoyé automatiquement depuis votre plateforme de gestion de projet.
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Projets <onboarding@resend.dev>",
      to: [to],
      subject: subject || `Livrable: ${deliverableName} - ${projectName}`,
      html: emailHtml,
    });

    console.log("Deliverable email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-deliverable-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
