import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  AppRole, 
  Permission, 
  hasPermission, 
  hasRoleOrHigher,
  getPermissionsForRole,
  ROLE_HIERARCHY,
  PERMISSION_MATRIX
} from "@/lib/permissions";

interface WorkspaceRolePermission {
  role: AppRole;
  permission_code: string;
  granted: boolean;
}

export function usePermissions() {
  const { user, activeWorkspace } = useAuth();

  // Fetch user role
  const { data: role, isLoading: roleLoading } = useQuery({
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

  // Fetch workspace permission overrides
  const { data: permissionOverrides = [], isLoading: overridesLoading } = useQuery({
    queryKey: ["workspace-role-permissions", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("workspace_role_permissions")
        .select("role, permission_code, granted")
        .eq("workspace_id", activeWorkspace.id);

      if (error) {
        console.error("Error fetching permission overrides:", error);
        return [];
      }

      return data as WorkspaceRolePermission[];
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = roleLoading || overridesLoading;

  // Permission check function with workspace overrides
  const can = (permission: Permission): boolean => {
    if (!role) return false;

    // Check for workspace-specific override
    const override = permissionOverrides.find(
      (o) => o.role === role && o.permission_code === permission
    );

    if (override !== undefined) {
      return override.granted;
    }

    // Fall back to default permission matrix
    return hasPermission(role, permission);
  };

  // Check multiple permissions (AND)
  const canAll = (...permissions: Permission[]): boolean => {
    return permissions.every(p => can(p));
  };

  // Check multiple permissions (OR)
  const canAny = (...permissions: Permission[]): boolean => {
    return permissions.some(p => can(p));
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

  // Get all permissions for current role (considering overrides)
  const permissions = role 
    ? Object.keys(PERMISSION_MATRIX).filter(p => can(p as Permission)) as Permission[]
    : [];

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
    permissionOverrides,
    roleLevel: role ? ROLE_HIERARCHY[role] : 0,
  };
}
