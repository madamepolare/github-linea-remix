import { useEffect, useState } from "react";
import { Navigate, Outlet, useParams, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * WorkspaceRouter - Handles workspace-based URL routing
 * 
 * URL structure: /:workspaceSlug/...
 * Example: /domini/projects, /my-agency/crm
 * 
 * This component:
 * 1. Extracts workspaceSlug from URL
 * 2. Validates user has access to that workspace
 * 3. Sets it as active workspace
 * 4. Renders child routes via <Outlet />
 */
export function WorkspaceRouter() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { user, workspaces, activeWorkspace, setActiveWorkspace, loading } = useAuth();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [targetWorkspace, setTargetWorkspace] = useState<typeof workspaces[0] | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!workspaceSlug) {
      setIsValidating(false);
      return;
    }

    // Find workspace by slug in user's workspaces
    const workspace = workspaces.find(
      (w) => w.slug.toLowerCase() === workspaceSlug.toLowerCase()
    );

    if (workspace) {
      setTargetWorkspace(workspace);
      setNotFound(false);
      
      // Set as active workspace if not already
      if (activeWorkspace?.id !== workspace.id) {
        setActiveWorkspace(workspace.id).then(() => {
          setIsValidating(false);
        });
      } else {
        setIsValidating(false);
      }
    } else {
      // Workspace not found in user's workspaces
      setNotFound(true);
      setIsValidating(false);
    }
  }, [workspaceSlug, workspaces, activeWorkspace, setActiveWorkspace, loading]);

  // Show loader while auth is loading or validating workspace
  if (loading || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Workspace not found - redirect to first available workspace or create one
  if (notFound) {
    if (workspaces.length > 0) {
      // Redirect to user's first workspace with same path
      const firstWorkspace = workspaces.find(w => !w.is_hidden) || workspaces[0];
      const pathWithoutWorkspace = location.pathname.replace(`/${workspaceSlug}`, "") || "/";
      return <Navigate to={`/${firstWorkspace.slug}${pathWithoutWorkspace}`} replace />;
    } else {
      // No workspaces - go to onboarding to create one
      return <Navigate to="/onboarding" replace />;
    }
  }

  // Valid workspace - render child routes
  return <Outlet />;
}

/**
 * Hook to get current workspace slug from URL
 */
export function useWorkspaceSlug(): string | undefined {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  return workspaceSlug;
}

/**
 * Hook to build workspace-aware paths
 */
export function useWorkspacePath() {
  const { activeWorkspace } = useAuth();
  
  const buildPath = (path: string): string => {
    if (!activeWorkspace?.slug) return path;
    // Remove leading slash for concatenation
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `/${activeWorkspace.slug}/${cleanPath}`;
  };

  return { buildPath, workspaceSlug: activeWorkspace?.slug };
}
