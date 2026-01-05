import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

const DEFAULT_TEMPLATE = {
  subject: "Vous êtes invité à rejoindre {{workspace_name}} sur ARCHIMIND",
  body_html: `<!DOCTYPE html>
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
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Vous êtes invité !</h2>
      <p style="margin: 0 0 16px 0; color: #666;">
        <strong>{{inviter_name}}</strong> vous a invité à rejoindre <strong>{{workspace_name}}</strong> en tant que <strong>{{role}}</strong>.
      </p>
      <p style="margin: 0 0 24px 0; color: #666;">
        ARCHIMIND aide les agences d'architecture à gérer leurs projets, équipes et clients en un seul endroit.
      </p>
      <a href="{{invite_url}}" style="display: inline-block; background: linear-gradient(135deg, #c9a55c, #b8956f); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Accepter l'invitation
      </a>
    </div>
    
    <p style="color: #999; font-size: 14px; text-align: center;">
      Cette invitation expire dans 7 jours. Si vous n'attendiez pas cet email, vous pouvez l'ignorer.
    </p>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
      <p>© {{year}} ARCHIMIND. Tous droits réservés.</p>
    </div>
  </body>
</html>`,
};

function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
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

    // Variables for template
    const variables = {
      inviter_name: inviterName,
      workspace_name: workspaceName,
      role: role,
      invite_url: inviteUrl,
      year: new Date().getFullYear().toString(),
    };

    // Try to get custom template from database
    let subject = DEFAULT_TEMPLATE.subject;
    let bodyHtml = DEFAULT_TEMPLATE.body_html;

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const { data: template } = await supabase
          .from('email_templates')
          .select('subject, body_html')
          .eq('workspace_id', workspaceId)
          .eq('template_type', 'workspace_invite')
          .eq('is_active', true)
          .single();

        if (template) {
          console.log("Using custom email template");
          subject = template.subject;
          bodyHtml = template.body_html;
        } else {
          console.log("No custom template found, using default");
        }
      } catch (dbError) {
        console.log("Error fetching template, using default:", dbError);
      }
    }

    // Replace variables in template
    const finalSubject = replaceVariables(subject, variables);
    const finalHtml = replaceVariables(bodyHtml, variables);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ARCHIMIND <noreply@domini.archi>",
        to: [email],
        subject: finalSubject,
        html: finalHtml,
      }),
    });

     if (!res.ok) {
       const errorData = await res.json().catch(() => ({} as any));
       console.error("Resend API error:", errorData);
       return new Response(
         JSON.stringify({
           success: false,
           error:
             errorData?.message ||
             `Failed to send email (status ${res.status})`,
         }),
         {
           status: res.status,
           headers: { "Content-Type": "application/json", ...corsHeaders },
         }
       );
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
