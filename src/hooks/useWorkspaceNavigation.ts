import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

/**
 * Hook for workspace-aware navigation
 * Automatically prefixes paths with the current workspace slug
 */
export function useWorkspaceNavigation() {
  const routerNavigate = useNavigate();
  const { activeWorkspace } = useAuth();

  const workspaceNavigate = useCallback(
    (path: string | number, options?: { replace?: boolean }) => {
      // Handle numeric navigation (e.g., -1 for back)
      if (typeof path === "number") {
        routerNavigate(path);
        return;
      }

      if (!activeWorkspace?.slug) {
        // Fallback to regular navigation if no workspace
        routerNavigate(path, options);
        return;
      }

      // Handle paths that already include workspace slug
      if (path.startsWith(`/${activeWorkspace.slug}`)) {
        routerNavigate(path, options);
        return;
      }

      // Build workspace-prefixed path
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;
      const workspacePath = cleanPath ? `/${activeWorkspace.slug}/${cleanPath}` : `/${activeWorkspace.slug}`;
      
      routerNavigate(workspacePath, options);
    },
    [routerNavigate, activeWorkspace?.slug]
  );

  const buildWorkspacePath = useCallback(
    (path: string): string => {
      if (!activeWorkspace?.slug) return path;
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;
      return cleanPath ? `/${activeWorkspace.slug}/${cleanPath}` : `/${activeWorkspace.slug}`;
    },
    [activeWorkspace?.slug]
  );

  return {
    navigate: workspaceNavigate,
    buildPath: buildWorkspacePath,
    workspaceSlug: activeWorkspace?.slug,
  };
}
