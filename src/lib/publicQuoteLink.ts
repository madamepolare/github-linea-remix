import { supabase } from "@/integrations/supabase/client";

function getPublicBaseUrl() {
  // Preview URLs are protected; use the main published URL fallback.
  // In production (lovable.app or custom domain), window.location.origin is correct.
  const host = window.location.hostname;
  if (host.includes("lovableproject.com")) {
    return "https://archigood.lovable.app";
  }
  return window.location.origin;
}

export async function getOrCreatePublicQuoteLink(params: {
  documentId: string;
  workspaceId: string;
  requiresDeposit?: boolean;
  depositPercentage?: number;
  expiresInDays?: number;
}): Promise<string> {
  const {
    documentId,
    workspaceId,
    requiresDeposit = false,
    depositPercentage = 30,
    expiresInDays = 30,
  } = params;

  // Try to reuse an existing active link
  const { data: existing, error: existingError } = await supabase
    .from("quote_public_links")
    .select("token")
    .eq("document_id", documentId)
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existingError && existing?.token) {
    return `${getPublicBaseUrl()}/q/${existing.token}`;
  }

  // Create a new one
  const token = crypto.randomUUID().replace(/-/g, "").substring(0, 16);

  const { error: insertError } = await supabase.from("quote_public_links").insert({
    document_id: documentId,
    workspace_id: workspaceId,
    token,
    requires_deposit: requiresDeposit,
    deposit_percentage: depositPercentage,
    expires_at: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (insertError) throw insertError;

  return `${getPublicBaseUrl()}/q/${token}`;
}
