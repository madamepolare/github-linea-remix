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
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get link and check validity
    const { data: link, error: linkError } = await supabase
      .from('quote_public_links')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (linkError || !link) {
      return new Response(JSON.stringify({ error: 'Invalid or expired link' }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Link expired' }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update viewed_at
    await supabase
      .from('quote_public_links')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', link.id);

    // Get document with all details
    const { data: document, error: docError } = await supabase
      .from('commercial_documents')
      .select(`
        id,
        document_number,
        document_type,
        title,
        description,
        status,
        total_amount,
        currency,
        validity_days,
        valid_until,
        vat_rate,
        vat_type,
        project_address,
        project_city,
        postal_code,
        project_surface,
        construction_budget,
        fee_mode,
        fee_percentage,
        requires_deposit,
        deposit_percentage,
        header_text,
        footer_text,
        payment_terms,
        created_at,
        client_company:crm_companies(id, name, logo_url, address, city, postal_code),
        client_contact:contacts!commercial_documents_client_contact_id_fkey(id, name, email, phone)
      `)
      .eq('id', link.document_id)
      .single();

    if (docError || !document) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get phases/lines
    const { data: phases } = await supabase
      .from('commercial_document_phases')
      .select('*')
      .eq('document_id', link.document_id)
      .order('sort_order');

    // Get agency info (including style_settings for typography)
    const { data: workspace } = await supabase
      .from('workspaces')
      .select(`
        id,
        name,
        logo_url,
        settings,
        style_settings
      `)
      .eq('id', link.workspace_id)
      .single();

    // Get agency billing profile
    const { data: agencyProfile } = await supabase
      .from('billing_profiles')
      .select('*')
      .eq('workspace_id', link.workspace_id)
      .is('company_id', null)
      .is('contact_id', null)
      .maybeSingle();

    return new Response(JSON.stringify({
      document,
      phases: phases || [],
      agency: {
        name: workspace?.name,
        logo_url: workspace?.logo_url,
        settings: workspace?.settings,
        style_settings: workspace?.style_settings,
        ...agencyProfile
      },
      link: {
        id: link.id,
        signed_at: link.signed_at,
        options_selected: link.options_selected,
        final_amount: link.final_amount,
        deposit_paid: link.deposit_paid,
        signed_pdf_url: link.signed_pdf_url,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in public-quote-view:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
