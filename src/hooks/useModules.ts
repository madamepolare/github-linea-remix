import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Module {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  category: string;
  price_monthly: number;
  price_yearly: number;
  is_core: boolean;
  is_active: boolean;
  features: string[];
  required_plan: string | null;
  sort_order: number;
}

export interface WorkspaceModule {
  id: string;
  workspace_id: string;
  module_id: string;
  enabled_at: string;
  enabled_by: string | null;
  settings: Record<string, any>;
  module?: Module;
}

export function useModules() {
  return useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("is_active", true)
        .order("sort_order") as any;

      if (error) throw error;
      return (data || []) as Module[];
    },
  });
}

export function useWorkspaceModules() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["workspace-modules", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("workspace_modules")
        .select("*, module:modules(*)")
        .eq("workspace_id", activeWorkspace.id) as any;

      if (error) throw error;
      return (data || []) as WorkspaceModule[];
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useModuleMutations() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const enableModule = useMutation({
    mutationFn: async (moduleId: string) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { error } = await supabase
        .from("workspace_modules")
        .insert({
          workspace_id: activeWorkspace.id,
          module_id: moduleId,
          enabled_by: user?.id,
        }) as any;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-modules"] });
      toast({ title: "Module activé" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const disableModule = useMutation({
    mutationFn: async (moduleId: string) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { error } = await supabase
        .from("workspace_modules")
        .delete()
        .eq("workspace_id", activeWorkspace.id)
        .eq("module_id", moduleId) as any;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-modules"] });
      toast({ title: "Module désactivé" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  return { enableModule, disableModule };
}

// Hook to check if a specific module is enabled
export function useIsModuleEnabled(moduleSlug: string) {
  const { data: workspaceModules } = useWorkspaceModules();
  const { data: modules } = useModules();

  const module = modules?.find((m) => m.slug === moduleSlug);
  
  // Core modules are always enabled
  if (module?.is_core) return true;
  
  // Check if module is in workspace_modules
  return workspaceModules?.some((wm) => wm.module?.slug === moduleSlug) ?? false;
}
