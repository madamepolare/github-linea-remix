import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission, AppRole } from "@/lib/permissions";

interface PermissionGateProps {
  children: ReactNode;
  /** Single permission required */
  permission?: Permission;
  /** Multiple permissions required (AND) */
  permissions?: Permission[];
  /** Multiple permissions, at least one required (OR) */
  anyPermission?: Permission[];
  /** Minimum role required */
  minRole?: AppRole;
  /** What to show if permission is denied */
  fallback?: ReactNode;
  /** Show nothing if permission denied (default: true) */
  hideOnDeny?: boolean;
}

/**
 * Component to conditionally render children based on permissions
 * 
 * @example
 * // Single permission
 * <PermissionGate permission="projects.delete">
 *   <DeleteButton />
 * </PermissionGate>
 * 
 * @example
 * // Multiple permissions (all required)
 * <PermissionGate permissions={["projects.edit", "projects.delete"]}>
 *   <AdminActions />
 * </PermissionGate>
 * 
 * @example
 * // Any of the permissions
 * <PermissionGate anyPermission={["commercial.send", "commercial.sign"]}>
 *   <SendButton />
 * </PermissionGate>
 * 
 * @example
 * // Minimum role
 * <PermissionGate minRole="admin">
 *   <AdminPanel />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  anyPermission,
  minRole,
  fallback = null,
  hideOnDeny = true,
}: PermissionGateProps) {
  const { can, canAll, canAny, isAtLeast, isLoading } = usePermissions();

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  let hasAccess = true;

  // Check single permission
  if (permission) {
    hasAccess = hasAccess && can(permission);
  }

  // Check all permissions (AND)
  if (permissions && permissions.length > 0) {
    hasAccess = hasAccess && canAll(...permissions);
  }

  // Check any permission (OR)
  if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAccess && canAny(...anyPermission);
  }

  // Check minimum role
  if (minRole) {
    hasAccess = hasAccess && isAtLeast(minRole);
  }

  if (!hasAccess) {
    return hideOnDeny ? null : <>{fallback}</>;
  }

  return <>{children}</>;
}
