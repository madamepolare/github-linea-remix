import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

/**
 * Hook for workspace-aware navigation
 * Automatically prefixes paths with the current workspace slug
 */
export function useWorkspaceNavigation() {
  const navigate = useNavigate();
  const { activeWorkspace } = useAuth();

  const workspaceNavigate = useCallback(
    (path: string, options?: { replace?: boolean }) => {
      if (!activeWorkspace?.slug) {
        // Fallback to regular navigation if no workspace
        navigate(path, options);
        return;
      }

      // Handle paths that already include workspace slug
      if (path.startsWith(`/${activeWorkspace.slug}`)) {
        navigate(path, options);
        return;
      }

      // Build workspace-prefixed path
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;
      const workspacePath = cleanPath ? `/${activeWorkspace.slug}/${cleanPath}` : `/${activeWorkspace.slug}`;
      
      navigate(workspacePath, options);
    },
    [navigate, activeWorkspace?.slug]
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
