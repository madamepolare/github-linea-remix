import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModules, useWorkspaceModules } from "@/hooks/useModules";
import { getModuleFromPath, MODULE_CONFIG } from "@/lib/navigationConfig";

/**
 * Hook that redirects to homepage if the current module is not enabled in the active workspace.
 * This is useful when switching between workspaces with different modules enabled.
 */
export function useWorkspaceModuleGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeWorkspace } = useAuth();
  const { data: modules = [], isLoading: modulesLoading } = useModules();
  const { data: workspaceModules = [], isLoading: workspaceModulesLoading } = useWorkspaceModules();
  const previousWorkspaceId = useRef<string | null>(null);

  // Check if a module is enabled
  const isModuleEnabled = (slug: string): boolean => {
    const module = modules.find((m) => m.slug === slug);
    // Core modules are always enabled
    if (module?.is_core) return true;
    // Check if module is in workspace_modules
    return workspaceModules.some((wm) => wm.module?.slug === slug);
  };

  useEffect(() => {
    // Skip if still loading or no workspace
    if (modulesLoading || workspaceModulesLoading || !activeWorkspace) {
      return;
    }

    // Detect workspace switch
    const workspaceChanged = previousWorkspaceId.current !== null && 
                             previousWorkspaceId.current !== activeWorkspace.id;
    
    // Update ref
    previousWorkspaceId.current = activeWorkspace.id;

    // Only check after a workspace switch
    if (!workspaceChanged) {
      return;
    }

    // Get current module from path
    const currentModule = getModuleFromPath(location.pathname);
    
    // Skip if on dashboard, settings, or no module found
    if (!currentModule || currentModule.slug === "dashboard" || currentModule.slug === "settings") {
      return;
    }

    // Check if the current module is enabled
    const moduleSlug = currentModule.slug;
    
    // Find if this module exists in our config
    if (!MODULE_CONFIG[moduleSlug]) {
      return;
    }

    // Check if enabled
    if (!isModuleEnabled(moduleSlug)) {
      // Redirect to homepage
      navigate("/", { replace: true });
    }
  }, [activeWorkspace?.id, modules, workspaceModules, modulesLoading, workspaceModulesLoading, location.pathname, navigate]);
}
