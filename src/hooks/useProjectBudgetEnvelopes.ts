import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BudgetEnvelope {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  description: string | null;
  category: string | null;
  source_type: 'manual' | 'quote_phase' | 'quote_grouped';
  source_document_id: string | null;
  source_phase_ids: string[];
  budget_amount: number;
  consumed_amount: number;
  remaining_amount: number;
  alert_threshold: number;
  status: 'active' | 'exhausted' | 'closed';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEnvelopeInput {
  project_id: string;
  name: string;
  description?: string;
  category?: string;
  source_type?: 'manual' | 'quote_phase' | 'quote_grouped';
  source_document_id?: string;
  source_phase_ids?: string[];
  budget_amount: number;
  alert_threshold?: number;
}

export interface UpdateEnvelopeInput {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  budget_amount?: number;
  alert_threshold?: number;
  status?: 'active' | 'exhausted' | 'closed';
}

export function useProjectBudgetEnvelopes(projectId: string) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["project-budget-envelopes", projectId];

  // Fetch envelopes
  const {
    data: envelopes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeWorkspace || !projectId) return [];

      const { data, error } = await supabase
        .from("project_budget_envelopes")
        .select("*")
        .eq("project_id", projectId)
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching budget envelopes:", error);
        throw error;
      }

      return (data || []).map(e => ({
        ...e,
        source_phase_ids: Array.isArray(e.source_phase_ids) ? e.source_phase_ids : [],
      })) as BudgetEnvelope[];
    },
    enabled: !!activeWorkspace && !!projectId,
  });

  // Create envelope
  const createEnvelope = useMutation({
    mutationFn: async (input: CreateEnvelopeInput) => {
      if (!activeWorkspace || !user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("project_budget_envelopes")
        .insert({
          ...input,
          workspace_id: activeWorkspace.id,
          created_by: user.id,
          source_type: input.source_type || 'manual',
          source_phase_ids: input.source_phase_ids || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Enveloppe budgétaire créée");
    },
    onError: (error: Error) => {
      console.error("Error creating envelope:", error);
      toast.error("Erreur lors de la création de l'enveloppe");
    },
  });

  // Update envelope
  const updateEnvelope = useMutation({
    mutationFn: async ({ id, ...input }: UpdateEnvelopeInput) => {
      const { data, error } = await supabase
        .from("project_budget_envelopes")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Enveloppe mise à jour");
    },
    onError: (error: Error) => {
      console.error("Error updating envelope:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  // Delete envelope
  const deleteEnvelope = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_budget_envelopes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Enveloppe supprimée");
    },
    onError: (error: Error) => {
      console.error("Error deleting envelope:", error);
      toast.error("Erreur lors de la suppression");
    },
  });

  // Calculate summary
  const summary = {
    totalBudget: envelopes.reduce((sum, e) => sum + (e.budget_amount || 0), 0),
    totalConsumed: envelopes.reduce((sum, e) => sum + (e.consumed_amount || 0), 0),
    totalRemaining: envelopes.reduce((sum, e) => sum + (e.remaining_amount || 0), 0),
    count: envelopes.length,
    activeCount: envelopes.filter(e => e.status === 'active').length,
    exhaustedCount: envelopes.filter(e => e.status === 'exhausted').length,
    alertEnvelopes: envelopes.filter(e => {
      const consumedPct = (e.consumed_amount / e.budget_amount) * 100;
      return e.status === 'active' && consumedPct >= e.alert_threshold;
    }),
  };

  return {
    envelopes,
    isLoading,
    error,
    summary,
    createEnvelope,
    updateEnvelope,
    deleteEnvelope,
  };
}
