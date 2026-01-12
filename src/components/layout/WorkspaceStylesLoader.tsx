import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspaceStyles, applyStyles } from "@/hooks/useWorkspaceStyles";

/**
 * Component that loads and applies workspace-specific styles.
 * Place this inside the authenticated app area (e.g., MainLayout).
 */
export function WorkspaceStylesLoader() {
  const { activeWorkspace } = useAuth();
  const { styleSettings, isLoading } = useWorkspaceStyles();
  
  useEffect(() => {
    if (!isLoading && styleSettings && activeWorkspace) {
      applyStyles(styleSettings);
    }
  }, [styleSettings, isLoading, activeWorkspace]);
  
  // This component renders nothing - it just applies styles
  return null;
}
