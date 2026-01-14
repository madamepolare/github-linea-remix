import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ChorusProConfig {
  id: string;
  workspace_id: string;
  siret: string;
  chorus_login: string | null;
  technical_id: string | null;
  service_code_default: string | null;
  is_active: boolean;
  is_sandbox: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChorusSubmission {
  id: string;
  workspace_id: string;
  invoice_id: string;
  submission_id: string | null;
  status: string;
  request_payload: Record<string, unknown> | null;
  response_payload: Record<string, unknown> | null;
  error_message: string | null;
  submitted_at: string | null;
  processed_at: string | null;
  created_at: string;
}

export function useChorusProConfig() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["chorus-pro-config", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return null;

      const { data, error } = await supabase
        .from("chorus_pro_config")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .maybeSingle();

      if (error) throw error;
      return data as ChorusProConfig | null;
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useChorusSubmissions(invoiceId?: string) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["chorus-submissions", activeWorkspace?.id, invoiceId],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from("chorus_submissions")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (invoiceId) {
        query = query.eq("invoice_id", invoiceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ChorusSubmission[];
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useSaveChorusConfig() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useAuth();

  return useMutation({
    mutationFn: async (config: Partial<ChorusProConfig> & { siret: string }) => {
      if (!activeWorkspace?.id) throw new Error("No active workspace");

      const { data: existing } = await supabase
        .from("chorus_pro_config")
        .select("id")
        .eq("workspace_id", activeWorkspace.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("chorus_pro_config")
          .update({
            ...config,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("chorus_pro_config")
          .insert({
            workspace_id: activeWorkspace.id,
            ...config,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chorus-pro-config"] });
      toast.success("Configuration Chorus Pro enregistrée");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'enregistrement: " + error.message);
    },
  });
}

export function useSubmitToChorus() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useAuth();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      if (!activeWorkspace?.id) throw new Error("No active workspace");

      const { data, error } = await supabase.functions.invoke("chorus-pro-submit", {
        body: { invoiceId, workspaceId: activeWorkspace.id },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chorus-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Facture soumise à Chorus Pro");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la soumission: " + error.message);
    },
  });
}

export function useCheckChorusStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      const { data, error } = await supabase.functions.invoke("chorus-pro-submit", {
        body: { action: "check_status", submissionId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chorus-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
