import { useAgencyInfo } from "./useAgencyInfo";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to get the workspace icon URL with proper fallback chain:
 * 1. favicon_url from settings
 * 2. logo_url from settings  
 * 3. logo_url from activeWorkspace
 * 4. null (use text fallback)
 */
export function useWorkspaceIcon() {
  const { agencyInfo } = useAgencyInfo();
  const { activeWorkspace } = useAuth();

  const iconUrl = agencyInfo?.favicon_url || agencyInfo?.logo_url || activeWorkspace?.logo_url || null;
  const workspaceName = activeWorkspace?.name || "Linea";
  const fallbackLetter = workspaceName.slice(0, 1).toUpperCase();

  return {
    iconUrl,
    workspaceName,
    fallbackLetter,
  };
}
