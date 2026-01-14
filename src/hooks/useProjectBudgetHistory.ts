import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BudgetHistoryEntry {
  id: string;
  workspace_id: string;
  project_id: string;
  previous_budget: number | null;
  new_budget: number | null;
  change_type: 'initial' | 'amendment' | 'supplement' | 'adjustment';
  change_reason: string | null;
  reference_document_id: string | null;
  changed_by: string | null;
  created_at: string;
  changed_by_user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  reference_document?: {
    document_number: string;
    title: string;
  };
}

export interface AddBudgetChangeInput {
  project_id: string;
  previous_budget: number;
  new_budget: number;
  change_type: 'initial' | 'amendment' | 'supplement' | 'adjustment';
  change_reason?: string;
  reference_document_id?: string;
}

export function useProjectBudgetHistory(projectId: string) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["project-budget-history", projectId];

  // Fetch budget history
  const { data: history = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeWorkspace || !projectId) return [];

      const { data, error } = await supabase
        .from("project_budget_history")
        .select(`
          *,
          reference_document:commercial_documents(document_number, title)
        `)
        .eq("project_id", projectId)
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user info for changed_by
      const userIds = [...new Set((data || []).map(e => e.changed_by).filter(Boolean))] as string[];
      let usersMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        usersMap = new Map(
          (profiles || []).map(p => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }])
        );
      }

      return (data || []).map(entry => ({
        ...entry,
        changed_by_user: entry.changed_by ? usersMap.get(entry.changed_by) || null : null,
      })) as BudgetHistoryEntry[];
    },
    enabled: !!activeWorkspace && !!projectId,
  });

  // Add budget change
  const addBudgetChange = useMutation({
    mutationFn: async (input: AddBudgetChangeInput) => {
      if (!activeWorkspace || !user) throw new Error("Not authenticated");

      // Insert history entry
      const { data: historyData, error: historyError } = await supabase
        .from("project_budget_history")
        .insert({
          workspace_id: activeWorkspace.id,
          project_id: input.project_id,
          previous_budget: input.previous_budget,
          new_budget: input.new_budget,
          change_type: input.change_type,
          change_reason: input.change_reason,
          reference_document_id: input.reference_document_id,
          changed_by: user.id,
        })
        .select()
        .single();

      if (historyError) throw historyError;

      // Update project budget
      const { error: projectError } = await supabase
        .from("projects")
        .update({ budget: input.new_budget })
        .eq("id", input.project_id);

      if (projectError) throw projectError;

      return historyData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Budget mis à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Calculate totals
  const totals = {
    totalIncrease: history
      .filter(h => (h.new_budget || 0) > (h.previous_budget || 0))
      .reduce((sum, h) => sum + ((h.new_budget || 0) - (h.previous_budget || 0)), 0),
    totalDecrease: history
      .filter(h => (h.new_budget || 0) < (h.previous_budget || 0))
      .reduce((sum, h) => sum + ((h.previous_budget || 0) - (h.new_budget || 0)), 0),
    changesCount: history.length,
  };

  return {
    history,
    isLoading,
    error,
    totals,
    addBudgetChange,
  };
}
