import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignRequest {
  token: string;
  signerName: string;
  signerEmail: string;
  signatureData: string; // Base64 signature image
  optionsSelected: Record<string, boolean>;
  finalAmount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, signerName, signerEmail, signatureData, optionsSelected, finalAmount } = await req.json() as SignRequest;

    if (!token || !signerName || !signerEmail || !signatureData) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get link and validate
    const { data: link, error: linkError } = await supabase
      .from('quote_public_links')
      .select('*, document:commercial_documents(id, workspace_id, document_number, title, requires_deposit)')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (linkError || !link) {
      return new Response(JSON.stringify({ error: 'Invalid or expired link' }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (link.signed_at) {
      return new Response(JSON.stringify({ error: 'Quote already signed' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';

    const signedAt = new Date().toISOString();

    // Update link with signature info
    const { error: updateLinkError } = await supabase
      .from('quote_public_links')
      .update({
        signed_at: signedAt,
        signer_name: signerName,
        signer_email: signerEmail,
        signer_ip: clientIp,
        signature_data: signatureData,
        options_selected: optionsSelected,
        final_amount: finalAmount,
        updated_at: signedAt,
      })
      .eq('id', link.id);

    if (updateLinkError) {
      throw updateLinkError;
    }

    // Update document status to signed
    const { error: updateDocError } = await supabase
      .from('commercial_documents')
      .update({
        status: 'signed',
        signed_at: signedAt,
        total_amount: finalAmount,
      })
      .eq('id', link.document_id);

    if (updateDocError) {
      console.error('Error updating document:', updateDocError);
    }

    // Send confirmation email to client
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Archimind <noreply@archimind.io>",
            to: [signerEmail],
            subject: `Confirmation de signature - ${(link.document as any)?.document_number || 'Devis'}`,
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 50%; margin-bottom: 16px;">
        <span style="font-size: 32px; color: white;">✓</span>
      </div>
      <h1 style="margin: 0; font-size: 24px;">Signature confirmée</h1>
    </div>
    
    <p>Bonjour ${signerName},</p>
    <p>Votre signature du devis <strong>${(link.document as any)?.document_number}</strong> pour le projet <strong>${(link.document as any)?.title}</strong> a bien été enregistrée.</p>
    
    <div style="background: #f8f8f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Montant final :</strong> ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(finalAmount)}</p>
      <p style="margin: 0;"><strong>Date de signature :</strong> ${new Date(signedAt).toLocaleString('fr-FR')}</p>
    </div>
    
    <p>Vous recevrez prochainement le document signé par email.</p>
    <p>Merci pour votre confiance.</p>
  </div>
</body>
</html>
            `,
          }),
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }
    }

    // Check if deposit is required
    const requiresDeposit = (link.document as any)?.requires_deposit;

    return new Response(JSON.stringify({
      success: true,
      signed_at: signedAt,
      requires_deposit: requiresDeposit,
      document_id: link.document_id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in public-quote-sign:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
