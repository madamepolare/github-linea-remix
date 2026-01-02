import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PhaseDependency {
  id: string;
  phase_id: string;
  depends_on_phase_id: string;
  lag_days: number | null;
  created_at: string | null;
}

export function usePhaseDependencies(projectId: string | null) {
  const queryClient = useQueryClient();

  const { data: dependencies, isLoading } = useQuery({
    queryKey: ["phase-dependencies", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      // Get all phases for this project first
      const { data: phases, error: phasesError } = await supabase
        .from("project_phases")
        .select("id")
        .eq("project_id", projectId);

      if (phasesError) throw phasesError;
      if (!phases || phases.length === 0) return [];

      const phaseIds = phases.map((p) => p.id);

      const { data, error } = await supabase
        .from("phase_dependencies")
        .select("*")
        .in("phase_id", phaseIds);

      if (error) throw error;
      return data as PhaseDependency[];
    },
    enabled: !!projectId,
  });

  const addDependency = useMutation({
    mutationFn: async ({
      phaseId,
      dependsOnPhaseId,
      lagDays = 0,
    }: {
      phaseId: string;
      dependsOnPhaseId: string;
      lagDays?: number;
    }) => {
      const { data, error } = await supabase
        .from("phase_dependencies")
        .insert({
          phase_id: phaseId,
          depends_on_phase_id: dependsOnPhaseId,
          lag_days: lagDays,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-dependencies", projectId] });
      toast.success("Dépendance ajoutée");
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Cette dépendance existe déjà");
      } else {
        toast.error("Erreur lors de l'ajout de la dépendance");
      }
      console.error(error);
    },
  });

  const removeDependency = useMutation({
    mutationFn: async (dependencyId: string) => {
      const { error } = await supabase
        .from("phase_dependencies")
        .delete()
        .eq("id", dependencyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-dependencies", projectId] });
      toast.success("Dépendance supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  const updateLagDays = useMutation({
    mutationFn: async ({ id, lagDays }: { id: string; lagDays: number }) => {
      const { data, error } = await supabase
        .from("phase_dependencies")
        .update({ lag_days: lagDays })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-dependencies", projectId] });
    },
  });

  return {
    dependencies: dependencies || [],
    isLoading,
    addDependency,
    removeDependency,
    updateLagDays,
  };
}
