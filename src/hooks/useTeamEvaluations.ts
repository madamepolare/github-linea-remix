import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface TeamEvaluation {
  id: string;
  workspace_id: string;
  user_id: string;
  evaluator_id: string;
  evaluation_type: "annual" | "probation" | "objective_review" | "other";
  scheduled_date: string;
  completed_date: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  objectives: any[];
  notes: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export const evaluationTypeLabels: Record<TeamEvaluation["evaluation_type"], string> = {
  annual: "Entretien annuel",
  probation: "Fin de période d'essai",
  objective_review: "Revue des objectifs",
  other: "Autre",
};

export function useTeamEvaluations(filters?: { userId?: string; status?: string }) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["team-evaluations", activeWorkspace?.id, filters],
    queryFn: async (): Promise<TeamEvaluation[]> => {
      if (!activeWorkspace) return [];

      let query = supabase
        .from("team_evaluations")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("scheduled_date", { ascending: true });

      if (filters?.userId) {
        query = query.eq("user_id", filters.userId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TeamEvaluation[];
    },
    enabled: !!activeWorkspace,
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  const { activeWorkspace, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (evaluation: Partial<TeamEvaluation>) => {
      if (!activeWorkspace || !user) throw new Error("No workspace");

      const { data, error } = await (supabase
        .from("team_evaluations") as any)
        .insert({
          ...evaluation,
          workspace_id: activeWorkspace.id,
          evaluator_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-evaluations"] });
      toast({ title: "Évaluation planifiée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de planifier l'évaluation", variant: "destructive" });
    },
  });
}

export function useUpdateEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamEvaluation> & { id: string }) => {
      const { data, error } = await supabase
        .from("team_evaluations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-evaluations"] });
      toast({ title: "Évaluation mise à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

export function useDeleteEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("team_evaluations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-evaluations"] });
      toast({ title: "Évaluation supprimée" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}
