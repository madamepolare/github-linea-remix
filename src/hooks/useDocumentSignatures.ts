import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface DocumentSigner {
  id: string;
  signature_id: string;
  signer_email: string;
  signer_name: string;
  signer_role: 'client' | 'agency' | 'witness' | 'other' | null;
  sign_order: number;
  status: 'pending' | 'viewed' | 'signed' | 'rejected';
  token: string;
  signed_at: string | null;
  signature_data: Record<string, unknown> | null;
  signature_image: string | null;
  created_at: string;
}

export interface DocumentSignature {
  id: string;
  workspace_id: string;
  document_id: string;
  requested_by: string;
  signature_type: 'simple' | 'advanced';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'expired' | 'cancelled';
  message: string | null;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  signers?: DocumentSigner[];
  document?: {
    id: string;
    title: string;
    document_type: string;
    pdf_url: string | null;
  };
}

export interface SignatureEvent {
  id: string;
  signature_id: string;
  signer_id: string | null;
  event_type: 'created' | 'sent' | 'viewed' | 'signed' | 'rejected' | 'reminder_sent' | 'expired' | 'cancelled';
  event_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  signer?: DocumentSigner;
}

export interface CreateSignatureInput {
  document_id: string;
  signature_type?: 'simple' | 'advanced';
  message?: string;
  expires_at?: string;
  signers: {
    signer_email: string;
    signer_name: string;
    signer_role?: 'client' | 'agency' | 'witness' | 'other';
    sign_order?: number;
  }[];
}

export function useDocumentSignatures(documentId?: string) {
  const { user, activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  // Get all signatures for a document
  const { data: signatures = [], isLoading } = useQuery({
    queryKey: ["document-signatures", documentId],
    queryFn: async () => {
      if (!documentId) return [];

      const { data, error } = await supabase
        .from("document_signatures")
        .select(`
          *,
          signers:document_signers(*),
          document:agency_documents(id, title, document_type, pdf_url)
        `)
        .eq("document_id", documentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DocumentSignature[];
    },
    enabled: !!documentId,
  });

  // Get signature events for tracking
  const getSignatureEvents = (signatureId: string) => {
    return useQuery({
      queryKey: ["signature-events", signatureId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("document_signature_events")
          .select(`
            *,
            signer:document_signers(id, signer_name, signer_email)
          `)
          .eq("signature_id", signatureId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data as SignatureEvent[];
      },
      enabled: !!signatureId,
    });
  };

  // Get all pending signatures for dashboard
  const { data: pendingSignatures = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ["pending-signatures", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("document_signatures")
        .select(`
          *,
          signers:document_signers(*),
          document:agency_documents(id, title, document_type, pdf_url)
        `)
        .eq("workspace_id", activeWorkspace.id)
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DocumentSignature[];
    },
    enabled: !!activeWorkspace?.id && !documentId,
  });

  // Create signature request
  const createSignature = useMutation({
    mutationFn: async (input: CreateSignatureInput) => {
      if (!activeWorkspace?.id || !user?.id) throw new Error("No workspace or user");

      // Create signature
      const { data: signature, error: sigError } = await supabase
        .from("document_signatures")
        .insert({
          workspace_id: activeWorkspace.id,
          document_id: input.document_id,
          requested_by: user.id,
          signature_type: input.signature_type || 'simple',
          message: input.message,
          expires_at: input.expires_at,
        })
        .select()
        .single();

      if (sigError) throw sigError;

      // Create signers
      const signersData = input.signers.map((s, idx) => ({
        signature_id: signature.id,
        signer_email: s.signer_email,
        signer_name: s.signer_name,
        signer_role: s.signer_role || 'client',
        sign_order: s.sign_order || idx + 1,
      }));

      const { error: signersError } = await supabase
        .from("document_signers")
        .insert(signersData);

      if (signersError) throw signersError;

      // Create event
      await supabase.from("document_signature_events").insert({
        signature_id: signature.id,
        event_type: 'created',
        event_data: { signers_count: input.signers.length },
      });

      return signature;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-signatures"] });
      queryClient.invalidateQueries({ queryKey: ["pending-signatures"] });
      toast.success("Demande de signature créée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création de la demande");
      console.error(error);
    },
  });

  // Cancel signature request
  const cancelSignature = useMutation({
    mutationFn: async (signatureId: string) => {
      const { error } = await supabase
        .from("document_signatures")
        .update({ status: 'cancelled' })
        .eq("id", signatureId);

      if (error) throw error;

      await supabase.from("document_signature_events").insert({
        signature_id: signatureId,
        event_type: 'cancelled',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-signatures"] });
      queryClient.invalidateQueries({ queryKey: ["pending-signatures"] });
      toast.success("Demande de signature annulée");
    },
  });

  return {
    signatures,
    pendingSignatures,
    isLoading: isLoading || isLoadingPending,
    createSignature,
    cancelSignature,
    getSignatureEvents,
  };
}

// Hook for public signing page
export function usePublicSigner(token: string) {
  const queryClient = useQueryClient();

  const { data: signer, isLoading, error } = useQuery({
    queryKey: ["public-signer", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_signers")
        .select(`
          *,
          signature:document_signatures(
            *,
            document:agency_documents(id, title, document_type, pdf_url)
          )
        `)
        .eq("token", token)
        .single();

      if (error) throw error;
      return data as DocumentSigner & { signature: DocumentSignature };
    },
    enabled: !!token,
  });

  const signDocument = useMutation({
    mutationFn: async ({ signatureImage, signatureData }: { signatureImage: string; signatureData: Record<string, unknown> }) => {
      if (!signer) throw new Error("Signer not found");

      // Update signer
      const { error: signerError } = await supabase
        .from("document_signers")
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          signature_image: signatureImage,
          signature_data: signatureData as Json,
        })
        .eq("token", token);

      if (signerError) throw signerError;

      // Record event
      await supabase.from("document_signature_events").insert([{
        signature_id: signer.signature_id,
        signer_id: signer.id,
        event_type: 'signed',
        event_data: signatureData as Json,
        ip_address: signatureData.ip_address as string,
        user_agent: signatureData.user_agent as string,
      }]);

      // Check if all signers have signed
      const { data: allSigners } = await supabase
        .from("document_signers")
        .select("status")
        .eq("signature_id", signer.signature_id);

      const allSigned = allSigners?.every(s => s.status === 'signed');

      if (allSigned) {
        await supabase
          .from("document_signatures")
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq("id", signer.signature_id);
      } else {
        await supabase
          .from("document_signatures")
          .update({ status: 'in_progress' })
          .eq("id", signer.signature_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-signer", token] });
    },
  });

  const rejectDocument = useMutation({
    mutationFn: async (reason?: string) => {
      if (!signer) throw new Error("Signer not found");

      const { error: signerError } = await supabase
        .from("document_signers")
        .update({ status: 'rejected' })
        .eq("token", token);

      if (signerError) throw signerError;

      await supabase.from("document_signature_events").insert({
        signature_id: signer.signature_id,
        signer_id: signer.id,
        event_type: 'rejected',
        event_data: { reason },
      });

      await supabase
        .from("document_signatures")
        .update({ status: 'rejected' })
        .eq("id", signer.signature_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-signer", token] });
    },
  });

  const markAsViewed = useMutation({
    mutationFn: async () => {
      if (!signer || signer.status !== 'pending') return;

      await supabase
        .from("document_signers")
        .update({ status: 'viewed' })
        .eq("token", token);

      await supabase.from("document_signature_events").insert({
        signature_id: signer.signature_id,
        signer_id: signer.id,
        event_type: 'viewed',
      });
    },
  });

  return {
    signer,
    isLoading,
    error,
    signDocument,
    rejectDocument,
    markAsViewed,
  };
}
