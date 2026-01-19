import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface EmployeeObjective {
  id: string;
  workspace_id: string;
  user_id: string;
  evaluator_id: string | null;
  title: string;
  description: string | null;
  category: string;
  target_value: string | null;
  current_value: string | null;
  progress: number;
  weight: number;
  due_date: string | null;
  status: "active" | "completed" | "cancelled" | "on_hold";
  evaluation_id: string | null;
  created_at: string;
  updated_at: string;
}

export const objectiveCategoryLabels: Record<string, string> = {
  performance: "Performance",
  development: "Développement",
  behavior: "Comportement",
  project: "Projet",
  training: "Formation",
  other: "Autre",
};

export const objectiveStatusLabels: Record<EmployeeObjective["status"], string> = {
  active: "En cours",
  completed: "Atteint",
  cancelled: "Annulé",
  on_hold: "En pause",
};

export function useEmployeeObjectives(filters?: { userId?: string; evaluationId?: string; status?: string }) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["employee-objectives", activeWorkspace?.id, filters],
    queryFn: async (): Promise<EmployeeObjective[]> => {
      if (!activeWorkspace) return [];

      let query = supabase
        .from("employee_objectives")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (filters?.userId) {
        query = query.eq("user_id", filters.userId);
      }
      if (filters?.evaluationId) {
        query = query.eq("evaluation_id", filters.evaluationId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EmployeeObjective[];
    },
    enabled: !!activeWorkspace,
  });
}

export function useCreateObjective() {
  const queryClient = useQueryClient();
  const { activeWorkspace, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (objective: Partial<EmployeeObjective>) => {
      if (!activeWorkspace || !user) throw new Error("No workspace");

      const { data, error } = await (supabase
        .from("employee_objectives") as any)
        .insert({
          ...objective,
          workspace_id: activeWorkspace.id,
          evaluator_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-objectives"] });
      toast({ title: "Objectif créé" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer l'objectif", variant: "destructive" });
    },
  });
}

export function useUpdateObjective() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmployeeObjective> & { id: string }) => {
      const { data, error } = await supabase
        .from("employee_objectives")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-objectives"] });
      toast({ title: "Objectif mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

export function useDeleteObjective() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employee_objectives")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-objectives"] });
      toast({ title: "Objectif supprimé" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}
