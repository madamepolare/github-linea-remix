import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export function useWorkspaceRole() {
  const { activeWorkspace, user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["workspace-role", activeWorkspace?.id, user?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id || !user?.id) return null;

      const { data, error } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", activeWorkspace.id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching workspace role:", error);
        return null;
      }

      return data?.role as WorkspaceRole | null;
    },
    enabled: !!activeWorkspace?.id && !!user?.id,
  });

  const isAdmin = role === "owner" || role === "admin";
  const canViewSensitiveData = isAdmin;
  const canEditContacts = isAdmin;
  const canDeleteContacts = isAdmin;

  return {
    role,
    isLoading,
    isAdmin,
    canViewSensitiveData,
    canEditContacts,
    canDeleteContacts,
  };
}
