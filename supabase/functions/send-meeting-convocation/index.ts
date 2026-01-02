import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Send emails to each recipient
    const results = await Promise.allSettled(
      recipients.map(async (recipient) => {
        const html = `
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
              .badge { display: inline-block; background: #3B82F6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Convocation - Réunion de chantier${meetingNumber ? ` n°${meetingNumber}` : ""}</h1>
                <p>${projectName}</p>
              </div>
              <div class="content">
                <p>Bonjour ${recipient.name},</p>
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
                  <p>Cet email a été envoyé automatiquement via l'application de gestion de projet.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        return resend.emails.send({
          from: "Projet <onboarding@resend.dev>",
          to: [recipient.email],
          subject: `[${projectName}] Convocation - ${meetingTitle}`,
          html,
        });
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Convocation sent: ${successful} success, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        failed,
        details: results.map((r, i) => ({
          email: recipients[i].email,
          status: r.status,
          error: r.status === "rejected" ? (r as PromiseRejectedResult).reason?.message : null,
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
