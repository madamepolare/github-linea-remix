import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Intervention } from "./useInterventions";
import { ProjectLot } from "./useChantier";
import { Json } from "@/integrations/supabase/types";

export interface PlanningVersion {
  id: string;
  project_id: string;
  workspace_id: string;
  version_number: number;
  name: string;
  description: string | null;
  snapshot: {
    lots: ProjectLot[];
    interventions: Intervention[];
  };
  created_by: string | null;
  created_at: string;
}

export interface CreatePlanningVersionInput {
  name: string;
  description?: string;
  lots: ProjectLot[];
  interventions: Intervention[];
}

export function usePlanningVersions(projectId: string | null) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: versions, isLoading } = useQuery({
    queryKey: ["planning-versions", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_planning_versions")
        .select("*")
        .eq("project_id", projectId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      
      // Map the data to ensure snapshot is properly typed
      return (data || []).map(item => ({
        ...item,
        snapshot: item.snapshot as unknown as PlanningVersion['snapshot'],
      })) as PlanningVersion[];
    },
    enabled: !!projectId,
  });

  const createVersion = useMutation({
    mutationFn: async (input: CreatePlanningVersionInput) => {
      if (!projectId || !activeWorkspace?.id) {
        throw new Error("Missing project or workspace");
      }

      // Get next version number
      const { data: existing } = await supabase
        .from("project_planning_versions")
        .select("version_number")
        .eq("project_id", projectId)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion = (existing?.[0]?.version_number || 0) + 1;

      const snapshotData = {
        lots: input.lots,
        interventions: input.interventions,
      } as unknown as Json;

      const { data, error } = await supabase
        .from("project_planning_versions")
        .insert({
          project_id: projectId,
          workspace_id: activeWorkspace.id,
          version_number: nextVersion,
          name: input.name,
          description: input.description || null,
          snapshot: snapshotData,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        snapshot: data.snapshot as unknown as PlanningVersion['snapshot'],
      } as PlanningVersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning-versions", projectId] });
      toast.success("Version du planning sauvegardée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la sauvegarde");
      console.error(error);
    },
  });

  const deleteVersion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_planning_versions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning-versions", projectId] });
      toast.success("Version supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  return {
    versions: versions || [],
    isLoading,
    createVersion,
    deleteVersion,
  };
}
