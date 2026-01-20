import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppRole, Permission, PERMISSION_MATRIX } from "@/lib/permissions";
import { toast } from "sonner";

interface PermissionRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  sort_order: number;
  is_system: boolean;
}

interface WorkspaceRolePermission {
  id: string;
  workspace_id: string;
  role: AppRole;
  permission_code: string;
  granted: boolean;
}

/**
 * Fetch all available permissions from the database
 */
export function useAllPermissions() {
  return useQuery({
    queryKey: ["permissions-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("category")
        .order("sort_order");

      if (error) throw error;
      return data as PermissionRecord[];
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
  });
}

/**
 * Fetch workspace-specific permission overrides
 */
export function useWorkspaceRolePermissions() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["workspace-role-permissions", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("workspace_role_permissions")
        .select("*")
        .eq("workspace_id", activeWorkspace.id);

      if (error) throw error;
      return data as WorkspaceRolePermission[];
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get the effective permission matrix for this workspace
 * Combines default matrix with workspace overrides
 */
export function useEffectivePermissionMatrix() {
  const { data: allPermissions = [] } = useAllPermissions();
  const { data: workspaceOverrides = [] } = useWorkspaceRolePermissions();

  const roles: AppRole[] = ["owner", "admin", "member", "viewer"];

  // Build effective matrix
  const effectiveMatrix: Record<string, Record<AppRole, boolean>> = {};

  allPermissions.forEach((permission) => {
    const code = permission.code as Permission;
    effectiveMatrix[code] = {} as Record<AppRole, boolean>;

    roles.forEach((role) => {
      // Check for workspace override
      const override = workspaceOverrides.find(
        (o) => o.permission_code === code && o.role === role
      );

      if (override !== undefined) {
        effectiveMatrix[code][role] = override.granted;
      } else {
        // Use default matrix
        effectiveMatrix[code][role] = PERMISSION_MATRIX[code]?.includes(role) ?? false;
      }
    });
  });

  return {
    matrix: effectiveMatrix,
    permissions: allPermissions,
    overrides: workspaceOverrides,
  };
}

/**
 * Mutation to update a permission for a role in this workspace
 */
export function useUpdateRolePermission() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      role,
      permissionCode,
      granted,
    }: {
      role: AppRole;
      permissionCode: string;
      granted: boolean;
    }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      // Check if default already matches - if so, delete override
      const defaultGranted = PERMISSION_MATRIX[permissionCode as Permission]?.includes(role) ?? false;

      if (granted === defaultGranted) {
        // Remove override to use default
        const { error } = await supabase
          .from("workspace_role_permissions")
          .delete()
          .eq("workspace_id", activeWorkspace.id)
          .eq("role", role)
          .eq("permission_code", permissionCode);

        if (error) throw error;
        return { action: "deleted" };
      }

      // Upsert the override
      const { error } = await supabase
        .from("workspace_role_permissions")
        .upsert(
          {
            workspace_id: activeWorkspace.id,
            role,
            permission_code: permissionCode,
            granted,
            granted_by: user?.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "workspace_id,role,permission_code" }
        );

      if (error) throw error;
      return { action: "updated" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-role-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["user-role"] });
      toast.success("Permission mise à jour");
    },
    onError: (error) => {
      console.error("Error updating permission:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });
}

/**
 * Mutation to reset all permissions to defaults
 */
export function useResetPermissions() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { error } = await supabase
        .from("workspace_role_permissions")
        .delete()
        .eq("workspace_id", activeWorkspace.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-role-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["user-role"] });
      toast.success("Permissions réinitialisées");
    },
    onError: (error) => {
      console.error("Error resetting permissions:", error);
      toast.error("Erreur lors de la réinitialisation");
    },
  });
}

/**
 * Get permissions grouped by category
 */
export function usePermissionsByCategory() {
  const { data: allPermissions = [] } = useAllPermissions();

  const grouped = allPermissions.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    },
    {} as Record<string, PermissionRecord[]>
  );

  return grouped;
}
