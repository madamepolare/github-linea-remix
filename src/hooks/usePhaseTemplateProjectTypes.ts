import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PhaseTemplateProjectType {
  id: string;
  phase_template_id: string;
  project_type: string;
  workspace_id: string;
  sort_order: number;
  created_at: string;
}

export function usePhaseTemplateProjectTypes(phaseTemplateId?: string) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  // Get all project types for a specific phase template
  const projectTypesQuery = useQuery({
    queryKey: ["phase-template-project-types", activeWorkspace?.id, phaseTemplateId],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from("phase_template_project_types")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("sort_order", { ascending: true });

      if (phaseTemplateId) {
        query = query.eq("phase_template_id", phaseTemplateId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PhaseTemplateProjectType[];
    },
    enabled: !!activeWorkspace?.id,
  });

  // Link a phase to a project type
  const linkToProjectType = useMutation({
    mutationFn: async ({ phaseTemplateId, projectType, sortOrder = 0 }: { 
      phaseTemplateId: string; 
      projectType: string; 
      sortOrder?: number 
    }) => {
      if (!activeWorkspace?.id) throw new Error("No active workspace");

      const { data, error } = await supabase
        .from("phase_template_project_types")
        .insert({
          phase_template_id: phaseTemplateId,
          project_type: projectType,
          workspace_id: activeWorkspace.id,
          sort_order: sortOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-template-project-types"] });
      queryClient.invalidateQueries({ queryKey: ["phase-templates"] });
    },
    onError: (error) => {
      console.error("Error linking phase to project type:", error);
      toast.error("Erreur lors de l'ajout du type de projet");
    },
  });

  // Unlink a phase from a project type
  const unlinkFromProjectType = useMutation({
    mutationFn: async ({ phaseTemplateId, projectType }: { 
      phaseTemplateId: string; 
      projectType: string 
    }) => {
      const { error } = await supabase
        .from("phase_template_project_types")
        .delete()
        .eq("phase_template_id", phaseTemplateId)
        .eq("project_type", projectType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-template-project-types"] });
      queryClient.invalidateQueries({ queryKey: ["phase-templates"] });
    },
    onError: (error) => {
      console.error("Error unlinking phase from project type:", error);
      toast.error("Erreur lors de la suppression du type de projet");
    },
  });

  // Update project types for a phase (replace all)
  const updateProjectTypes = useMutation({
    mutationFn: async ({ phaseTemplateId, projectTypes }: { 
      phaseTemplateId: string; 
      projectTypes: string[] 
    }) => {
      if (!activeWorkspace?.id) throw new Error("No active workspace");

      // Delete existing links
      await supabase
        .from("phase_template_project_types")
        .delete()
        .eq("phase_template_id", phaseTemplateId);

      // Insert new links
      if (projectTypes.length > 0) {
        const { error } = await supabase
          .from("phase_template_project_types")
          .insert(
            projectTypes.map((pt, index) => ({
              phase_template_id: phaseTemplateId,
              project_type: pt,
              workspace_id: activeWorkspace.id,
              sort_order: index,
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-template-project-types"] });
      queryClient.invalidateQueries({ queryKey: ["phase-templates"] });
      toast.success("Types de projet mis à jour");
    },
    onError: (error) => {
      console.error("Error updating project types:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  return {
    projectTypes: projectTypesQuery.data || [],
    isLoading: projectTypesQuery.isLoading,
    error: projectTypesQuery.error,
    linkToProjectType,
    unlinkFromProjectType,
    updateProjectTypes,
  };
}

// Hook to get phases for a specific project type using the junction table
export function usePhasesForProjectType(projectType?: string) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["phases-for-project-type", activeWorkspace?.id, projectType],
    queryFn: async () => {
      if (!activeWorkspace?.id || !projectType) return [];

      // Get phase IDs linked to this project type
      const { data: links, error: linksError } = await supabase
        .from("phase_template_project_types")
        .select("phase_template_id, sort_order")
        .eq("workspace_id", activeWorkspace.id)
        .eq("project_type", projectType)
        .order("sort_order", { ascending: true });

      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      const phaseIds = links.map(l => l.phase_template_id);

      // Get the actual phase templates
      const { data: phases, error: phasesError } = await supabase
        .from("phase_templates")
        .select("*")
        .in("id", phaseIds);

      if (phasesError) throw phasesError;

      // Sort by the junction table's sort_order
      const sortOrderMap = new Map(links.map(l => [l.phase_template_id, l.sort_order]));
      return (phases || [])
        .map(p => ({
          ...p,
          deliverables: Array.isArray(p.deliverables) ? p.deliverables : [],
          sort_order: sortOrderMap.get(p.id) ?? 0,
        }))
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    enabled: !!activeWorkspace?.id && !!projectType,
  });
}
