import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendQuoteEmailRequest {
  documentId: string;
  to: string;
  cc?: string[];
  subject: string;
  body: string;
  attachPdf?: boolean;
  generatePublicLink?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, to, cc, subject, body, attachPdf, generatePublicLink } = await req.json() as SendQuoteEmailRequest;
    
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!to || !subject || !body || !documentId) {
      throw new Error("Missing required fields: to, subject, body, documentId");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('commercial_documents')
      .select(`
        *,
        client_company:crm_companies(name),
        client_contact:contacts!commercial_documents_client_contact_id_fkey(name, email)
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    let publicLinkUrl: string | null = null;

    // Generate public link if requested
    if (generatePublicLink) {
      const token = crypto.randomUUID() + '-' + Date.now().toString(36);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (document.validity_days || 30));

      const { data: linkData, error: linkError } = await supabase
        .from('quote_public_links')
        .insert({
          document_id: documentId,
          workspace_id: document.workspace_id,
          token,
          expires_at: expiresAt.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (linkError) {
        console.error('Error creating public link:', linkError);
      } else {
        // Get the app URL from environment or use default
        const appUrl = Deno.env.get('APP_URL') || 'https://archigood.lovable.app';
        publicLinkUrl = `${appUrl}/q/${token}`;
      }
    }

    // Replace variables in body
    let processedBody = body
      .replace(/\{\{client_name\}\}/g, document.client_company?.name || 'Client')
      .replace(/\{\{contact_name\}\}/g, document.client_contact?.name || '')
      .replace(/\{\{quote_number\}\}/g, document.document_number || '')
      .replace(/\{\{project_title\}\}/g, document.title || '')
      .replace(/\{\{total_amount\}\}/g, new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(document.total_amount || 0))
      .replace(/\{\{validity_date\}\}/g, document.valid_until ? new Date(document.valid_until).toLocaleDateString('fr-FR') : '')
      .replace(/\{\{public_link\}\}/g, publicLinkUrl || '');

    // Send email via Resend
    if (RESEND_API_KEY) {
      const emailPayload: Record<string, unknown> = {
        from: "Archimind <noreply@archimind.io>",
        to: [to],
        subject: subject
          .replace(/\{\{quote_number\}\}/g, document.document_number || '')
          .replace(/\{\{project_title\}\}/g, document.title || ''),
        html: formatEmailHtml(processedBody, publicLinkUrl),
      };

      if (cc && cc.length > 0) {
        emailPayload.cc = cc;
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Resend error:", response.status, text);
        throw new Error(`Failed to send email: ${response.status}`);
      }

      const data = await response.json();
      console.log("Quote email sent successfully:", data);

      // Update document sent_at and status
      await supabase
        .from('commercial_documents')
        .update({
          sent_at: new Date().toISOString(),
          status: document.status === 'draft' ? 'sent' : document.status,
        })
        .eq('id', documentId);

    } else {
      console.log("RESEND_API_KEY not configured. Email would be sent to:", to);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: RESEND_API_KEY ? "Email sent successfully" : "Email logged (no API key)",
      publicLink: publicLinkUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in send-quote-email:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function formatEmailHtml(body: string, publicLink: string | null): string {
  const ctaButton = publicLink ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${publicLink}" style="display: inline-block; background: linear-gradient(135deg, #c9a55c, #b8956f); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Consulter et signer le devis
      </a>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f8f6;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #eee;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #c9a55c, #b8956f); border-radius: 10px; margin-bottom: 12px;">
        <span style="font-size: 24px; color: white;">⬡</span>
      </div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #1a1a1a;">ARCHIMIND</h1>
    </div>
    
    <div style="white-space: pre-wrap; color: #333;">${body.replace(/\n/g, '<br>')}</div>
    
    ${ctaButton}
  </div>
  
  <div style="margin-top: 24px; text-align: center; color: #999; font-size: 12px;">
    <p>Cet email a été envoyé via Archimind.</p>
    <p>© ${new Date().getFullYear()} Archimind. Tous droits réservés.</p>
  </div>
</body>
</html>
  `;
}
