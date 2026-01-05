import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  AppRole, 
  Permission, 
  hasPermission, 
  hasRoleOrHigher,
  getPermissionsForRole,
  ROLE_HIERARCHY
} from "@/lib/permissions";

export function usePermissions() {
  const { user, activeWorkspace } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role", activeWorkspace?.id, user?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id || !user?.id) return null;

      // First try user_roles table (new system)
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("workspace_id", activeWorkspace.id)
        .eq("user_id", user.id)
        .single();

      if (!roleError && userRole?.role) {
        return userRole.role as AppRole;
      }

      // Fallback to workspace_members table (legacy)
      const { data: member, error: memberError } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", activeWorkspace.id)
        .eq("user_id", user.id)
        .single();

      if (memberError) {
        console.error("Error fetching user role:", memberError);
        return null;
      }

      return (member?.role as AppRole) || null;
    },
    enabled: !!activeWorkspace?.id && !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Permission check function
  const can = (permission: Permission): boolean => {
    return hasPermission(role, permission);
  };

  // Check multiple permissions (AND)
  const canAll = (...permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(role, p));
  };

  // Check multiple permissions (OR)
  const canAny = (...permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(role, p));
  };

  // Check if user has at least a certain role level
  const isAtLeast = (minRole: AppRole): boolean => {
    return hasRoleOrHigher(role, minRole);
  };

  // Convenience checks
  const isOwner = role === "owner";
  const isAdmin = role === "owner" || role === "admin";
  const isMember = role === "owner" || role === "admin" || role === "member";
  const isViewer = role === "viewer";

  // Get all permissions for current role
  const permissions = role ? getPermissionsForRole(role) : [];

  return {
    role,
    isLoading,
    can,
    canAll,
    canAny,
    isAtLeast,
    isOwner,
    isAdmin,
    isMember,
    isViewer,
    permissions,
    roleLevel: role ? ROLE_HIERARCHY[role] : 0,
  };
}
