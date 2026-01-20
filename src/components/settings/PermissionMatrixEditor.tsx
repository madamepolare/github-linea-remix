import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Crown,
  Shield,
  User,
  Eye,
  RotateCcw,
  Info,
  Lock,
  Unlock,
  Folder,
  Users,
  FileText,
  Receipt,
  ClipboardList,
  Target,
  Settings,
  Briefcase,
} from "lucide-react";
import { AppRole, PERMISSION_MATRIX, Permission } from "@/lib/permissions";
import {
  useAllPermissions,
  useEffectivePermissionMatrix,
  useUpdateRolePermission,
  useResetPermissions,
} from "@/hooks/useWorkspacePermissions";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<AppRole, { icon: React.ReactNode; label: string; color: string }> = {
  owner: { icon: <Crown className="h-4 w-4" />, label: "Propriétaire", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  admin: { icon: <Shield className="h-4 w-4" />, label: "Admin", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  member: { icon: <User className="h-4 w-4" />, label: "Membre", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  viewer: { icon: <Eye className="h-4 w-4" />, label: "Lecteur", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
};

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  projects: { icon: <Folder className="h-4 w-4" />, label: "Projets" },
  crm: { icon: <Users className="h-4 w-4" />, label: "CRM" },
  commercial: { icon: <Briefcase className="h-4 w-4" />, label: "Commercial" },
  invoicing: { icon: <Receipt className="h-4 w-4" />, label: "Facturation" },
  documents: { icon: <FileText className="h-4 w-4" />, label: "Documents" },
  tasks: { icon: <ClipboardList className="h-4 w-4" />, label: "Tâches" },
  tenders: { icon: <Target className="h-4 w-4" />, label: "Appels d'offres" },
  team: { icon: <Users className="h-4 w-4" />, label: "Équipe" },
  settings: { icon: <Settings className="h-4 w-4" />, label: "Paramètres" },
};

const roles: AppRole[] = ["owner", "admin", "member", "viewer"];

export function PermissionMatrixEditor() {
  const { data: allPermissions, isLoading: loadingPermissions } = useAllPermissions();
  const { matrix, overrides } = useEffectivePermissionMatrix();
  const updatePermission = useUpdateRolePermission();
  const resetPermissions = useResetPermissions();
  const { can, role: currentRole } = usePermissions();
  const [activeCategory, setActiveCategory] = useState("projects");

  const canManagePermissions = can("team.manage_roles");

  // Group permissions by category
  const permissionsByCategory = (allPermissions || []).reduce(
    (acc, perm) => {
      if (!acc[perm.category]) acc[perm.category] = [];
      acc[perm.category].push(perm);
      return acc;
    },
    {} as Record<string, typeof allPermissions>
  );

  const handleToggle = (role: AppRole, permissionCode: string, currentValue: boolean) => {
    // Owner permissions cannot be changed
    if (role === "owner") return;
    
    // Only owner/admin can manage permissions
    if (!canManagePermissions) return;

    updatePermission.mutate({
      role,
      permissionCode,
      granted: !currentValue,
    });
  };

  const isOverridden = (role: AppRole, permissionCode: string): boolean => {
    return overrides.some(
      (o) => o.role === role && o.permission_code === permissionCode
    );
  };

  const getDefaultValue = (role: AppRole, permissionCode: string): boolean => {
    return PERMISSION_MATRIX[permissionCode as Permission]?.includes(role) ?? false;
  };

  if (loadingPermissions) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Matrice des permissions
          </CardTitle>
          <CardDescription>
            Personnalisez les permissions pour chaque rôle dans ce workspace.
            Les modifications s'appliquent uniquement à ce workspace.
          </CardDescription>
        </div>

        {canManagePermissions && overrides.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Réinitialiser ({overrides.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Réinitialiser les permissions ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera toutes les personnalisations et restaurera
                  les permissions par défaut. Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => resetPermissions.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Réinitialiser
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>

      <CardContent>
        {/* Role legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {roles.map((role) => (
            <Badge key={role} variant="outline" className={cn("gap-1", ROLE_CONFIG[role].color)}>
              {ROLE_CONFIG[role].icon}
              {ROLE_CONFIG[role].label}
              {role === currentRole && (
                <span className="ml-1 text-[10px] opacity-70">(vous)</span>
              )}
            </Badge>
          ))}
        </div>

        {/* Category tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <TabsTrigger key={key} value={key} className="gap-1.5">
                {config.icon}
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(permissionsByCategory).map(([category, permissions]) => (
            <TabsContent key={category} value={category}>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {permissions?.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {permission.name}
                          </span>
                          {permission.description && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  {permission.description}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <code className="text-[10px] text-muted-foreground">
                          {permission.code}
                        </code>
                      </div>

                      <div className="flex items-center gap-3">
                        {roles.map((role) => {
                          const granted = matrix[permission.code]?.[role] ?? false;
                          const overridden = isOverridden(role, permission.code);
                          const defaultVal = getDefaultValue(role, permission.code);
                          const isOwner = role === "owner";

                          return (
                            <TooltipProvider key={role}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-[10px] text-muted-foreground hidden lg:block">
                                      {ROLE_CONFIG[role].label.slice(0, 3)}
                                    </span>
                                    <div className="relative">
                                      <Switch
                                        checked={granted}
                                        onCheckedChange={() =>
                                          handleToggle(role, permission.code, granted)
                                        }
                                        disabled={isOwner || !canManagePermissions}
                                        className={cn(
                                          overridden && "ring-2 ring-primary ring-offset-2"
                                        )}
                                      />
                                      {overridden && (
                                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                                      )}
                                      {isOwner && (
                                        <Lock className="absolute -top-1 -right-1 h-3 w-3 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <div className="text-xs">
                                    <p className="font-medium">{ROLE_CONFIG[role].label}</p>
                                    {isOwner ? (
                                      <p className="text-muted-foreground">
                                        Permissions du propriétaire non modifiables
                                      </p>
                                    ) : overridden ? (
                                      <p className="text-primary">
                                        Personnalisé (défaut: {defaultVal ? "Oui" : "Non"})
                                      </p>
                                    ) : (
                                      <p className="text-muted-foreground">Valeur par défaut</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span>Personnalisé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            <span>Non modifiable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Unlock className="h-3 w-3" />
            <span>Modifiable</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
