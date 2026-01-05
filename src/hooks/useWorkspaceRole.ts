import { usePermissions } from "@/hooks/usePermissions";

/**
 * @deprecated Use usePermissions() instead for more granular permission control
 */
export function useWorkspaceRole() {
  const { role, isLoading, isAdmin, can } = usePermissions();

  return {
    role,
    isLoading,
    isAdmin,
    canViewSensitiveData: can("crm.view_sensitive"),
    canEditContacts: can("crm.edit"),
    canDeleteContacts: can("crm.delete"),
  };
}
