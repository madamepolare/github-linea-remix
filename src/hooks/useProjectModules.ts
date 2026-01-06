import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProjectModule {
  id: string;
  project_id: string;
  module_key: string;
  enabled_at: string;
  enabled_by: string | null;
  workspace_id: string;
}

export type ModuleKey = "chantier" | "concours" | "documents";

export interface AvailableModule {
  key: ModuleKey;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const AVAILABLE_MODULES: AvailableModule[] = [
  {
    key: "chantier",
    name: "Chantier",
    description: "Gestion de chantier, réunions et comptes-rendus",
    icon: "HardHat",
    color: "orange",
  },
  {
    key: "concours",
    name: "Appels d'Offre",
    description: "Suivi des appels d'offres",
    icon: "Trophy",
    color: "amber",
  },
  {
    key: "documents",
    name: "Documents",
    description: "Gestion documentaire du projet",
    icon: "FileStack",
    color: "blue",
  },
];

export function useProjectModules(projectId: string | null) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: enabledModules = [], isLoading } = useQuery({
    queryKey: ["project-modules", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("project_enabled_modules")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data as ProjectModule[];
    },
    enabled: !!projectId,
  });

  const enableModule = useMutation({
    mutationFn: async (moduleKey: ModuleKey) => {
      if (!projectId || !activeWorkspace) throw new Error("Missing project or workspace");
      
      const { data, error } = await supabase
        .from("project_enabled_modules")
        .insert({
          project_id: projectId,
          module_key: moduleKey,
          workspace_id: activeWorkspace.id,
          enabled_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-modules", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects-with-module"] });
    },
  });

  const disableModule = useMutation({
    mutationFn: async (moduleKey: ModuleKey) => {
      if (!projectId) throw new Error("Missing project");
      
      const { error } = await supabase
        .from("project_enabled_modules")
        .delete()
        .eq("project_id", projectId)
        .eq("module_key", moduleKey);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-modules", projectId] });
    },
  });

  const isModuleEnabled = (moduleKey: ModuleKey): boolean => {
    return enabledModules.some((m) => m.module_key === moduleKey);
  };

  const toggleModule = async (moduleKey: ModuleKey) => {
    if (isModuleEnabled(moduleKey)) {
      await disableModule.mutateAsync(moduleKey);
    } else {
      await enableModule.mutateAsync(moduleKey);
    }
  };

  return {
    enabledModules,
    isLoading,
    enableModule,
    disableModule,
    isModuleEnabled,
    toggleModule,
    availableModules: AVAILABLE_MODULES,
  };
}

// Hook to get all projects with a specific module enabled
export function useProjectsWithModule(moduleKey: ModuleKey) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["projects-with-module", moduleKey, activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];

      const { data, error } = await supabase
        .from("project_enabled_modules")
        .select(`
          *,
          project:projects(
            *,
            crm_company:crm_companies(*),
            phases:project_phases!project_phases_project_id_fkey(*)
          )
        `)
        .eq("module_key", moduleKey)
        .eq("workspace_id", activeWorkspace.id);

      if (error) throw error;
      return data;
    },
    enabled: !!activeWorkspace,
  });
}
