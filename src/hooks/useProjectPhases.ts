import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProjectPhase {
  id: string;
  project_id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
  status: "pending" | "in_progress" | "completed";
  color: string | null;
  created_at: string;
  updated_at: string;
}

export type CreatePhaseInput = Omit<ProjectPhase, "id" | "created_at" | "updated_at">;

export function useProjectPhases(projectId: string | null) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: phases, isLoading, error } = useQuery({
    queryKey: ["project-phases", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_phases")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as ProjectPhase[];
    },
    enabled: !!projectId,
  });

  const createPhase = useMutation({
    mutationFn: async (phase: CreatePhaseInput) => {
      const { data, error } = await supabase
        .from("project_phases")
        .insert(phase)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-phases", projectId] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la création de la phase");
      console.error(error);
    },
  });

  const createManyPhases = useMutation({
    mutationFn: async (phases: CreatePhaseInput[]) => {
      const { data, error } = await supabase
        .from("project_phases")
        .insert(phases)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-phases", projectId] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la création des phases");
      console.error(error);
    },
  });

  const updatePhase = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectPhase> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_phases")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-phases", projectId] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour de la phase");
      console.error(error);
    },
  });

  const deletePhase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_phases")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-phases", projectId] });
      toast.success("Phase supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  const reorderPhases = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        sort_order: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("project_phases")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-phases", projectId] });
    },
  });

  return {
    phases: phases || [],
    isLoading,
    error,
    createPhase,
    createManyPhases,
    updatePhase,
    deletePhase,
    reorderPhases,
  };
}
