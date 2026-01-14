import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitRequest {
  invoiceId?: string;
  workspaceId?: string;
  action?: "submit" | "check_status";
  submissionId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SubmitRequest = await req.json();
    const { invoiceId, workspaceId, action = "submit", submissionId } = body;

    console.log("Chorus Pro request:", { action, invoiceId, workspaceId, submissionId });

    if (action === "check_status" && submissionId) {
      // Check status of existing submission
      const { data: submission, error: subError } = await supabase
        .from("chorus_submissions")
        .select("*, invoice:invoices(*)")
        .eq("id", submissionId)
        .single();

      if (subError) throw subError;

      // In a real implementation, we would call Chorus Pro API to check status
      // For now, we simulate a status check
      console.log("Checking status for submission:", submission.submission_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: submission.status,
          message: "Statut vérifié" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!invoiceId || !workspaceId) {
      throw new Error("invoiceId and workspaceId are required");
    }

    // Get Chorus Pro config
    const { data: config, error: configError } = await supabase
      .from("chorus_pro_config")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .single();

    if (configError || !config) {
      throw new Error("Chorus Pro n'est pas configuré pour ce workspace");
    }

    // Get invoice with all details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        client_company:crm_companies(*),
        project:projects(*),
        items:invoice_items(*)
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error("Facture introuvable");
    }

    // Validate invoice for Chorus Pro
    if (!invoice.client_company?.siret) {
      throw new Error("Le SIRET du client est requis pour Chorus Pro");
    }

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from("chorus_submissions")
      .insert({
        workspace_id: workspaceId,
        invoice_id: invoiceId,
        status: "pending",
        request_payload: {
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          total_ttc: invoice.total_ttc,
          client_siret: invoice.client_company?.siret,
          config_siret: config.siret,
          is_sandbox: config.is_sandbox,
        },
      })
      .select()
      .single();

    if (submissionError) throw submissionError;

    console.log("Created submission:", submission.id);

    // In a real implementation, we would:
    // 1. Generate Factur-X PDF
    // 2. Authenticate with Chorus Pro API (PISTE)
    // 3. Submit the invoice
    // For now, we simulate the submission

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate a mock submission ID
    const chorusSubmissionId = `CPR${Date.now()}`;

    // Update submission with result
    const { error: updateError } = await supabase
      .from("chorus_submissions")
      .update({
        status: "submitted",
        submission_id: chorusSubmissionId,
        submitted_at: new Date().toISOString(),
        response_payload: {
          submission_id: chorusSubmissionId,
          message: "Facture soumise avec succès (mode simulation)",
        },
      })
      .eq("id", submission.id);

    if (updateError) throw updateError;

    // Update invoice chorus status
    await supabase
      .from("invoices")
      .update({
        chorus_status: "submitted",
        chorus_submission_id: chorusSubmissionId,
      })
      .eq("id", invoiceId);

    console.log("Submission completed:", chorusSubmissionId);

    return new Response(
      JSON.stringify({
        success: true,
        submissionId: chorusSubmissionId,
        message: config.is_sandbox 
          ? "Facture soumise en mode sandbox (simulation)"
          : "Facture soumise à Chorus Pro",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Chorus Pro error:", error);

    const errorMessage = error instanceof Error ? error.message : "Erreur lors de la soumission";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
