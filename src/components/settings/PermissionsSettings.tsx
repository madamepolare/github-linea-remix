import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Check, X, Crown, UserCog, User, Eye } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { 
  AppRole, 
  Permission, 
  PERMISSION_MATRIX, 
  PERMISSION_CATEGORIES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from "@/lib/permissions";
import { PermissionGate } from "@/components/auth/PermissionGate";

const ROLE_ICONS: Record<AppRole, React.ReactNode> = {
  owner: <Crown className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  member: <User className="h-4 w-4" />,
  viewer: <Eye className="h-4 w-4" />,
};

const ROLE_COLORS: Record<AppRole, string> = {
  owner: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  member: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const PERMISSION_LABELS: Record<string, string> = {
  view: "Voir",
  create: "Créer",
  edit: "Modifier",
  delete: "Supprimer",
  archive: "Archiver",
  send: "Envoyer",
  sign: "Signer",
  view_sensitive: "Données sensibles",
  mark_paid: "Marquer payé",
  assign: "Assigner",
  submit: "Soumettre",
  invite: "Inviter",
  manage_roles: "Gérer les rôles",
  remove: "Retirer",
  view_time: "Voir les temps",
  validate_time: "Valider les temps",
  manage_absences: "Gérer absences",
  manage_evaluations: "Gérer évaluations",
  manage_recruitment: "Gérer recrutement",
  manage_workspace: "Gérer workspace",
  manage_billing: "Gérer facturation",
};

function getPermissionLabel(permission: Permission): string {
  const parts = permission.split(".");
  const action = parts[parts.length - 1];
  return PERMISSION_LABELS[action] || action;
}

export function PermissionsSettings() {
  const { role: currentRole } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<AppRole>("admin");
  const roles: AppRole[] = ["owner", "admin", "member", "viewer"];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Gestion des permissions</h3>
        <p className="text-sm text-muted-foreground">
          Visualisez les permissions accordées à chaque rôle
        </p>
      </div>

      {/* Current user role */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Votre rôle actuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentRole && (
            <div className="flex items-center gap-3">
              <Badge className={ROLE_COLORS[currentRole]}>
                {ROLE_ICONS[currentRole]}
                <span className="ml-1">{ROLE_LABELS[currentRole]}</span>
              </Badge>
              <span className="text-sm text-muted-foreground">
                {ROLE_DESCRIPTIONS[currentRole]}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rôles disponibles</CardTitle>
          <CardDescription>Hiérarchie des rôles et leurs responsabilités</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role) => (
              <div 
                key={role}
                className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                  selectedRole === role 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={ROLE_COLORS[role]}>
                    {ROLE_ICONS[role]}
                    <span className="ml-1">{ROLE_LABELS[role]}</span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permissions matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matrice des permissions</CardTitle>
          <CardDescription>
            Permissions accordées au rôle: <Badge className={ROLE_COLORS[selectedRole]}>{ROLE_LABELS[selectedRole]}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={Object.keys(PERMISSION_CATEGORIES)[0]}>
            <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
              {Object.entries(PERMISSION_CATEGORIES).map(([key, { label }]) => (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="data-[state=active]:bg-muted h-8 px-3 text-xs"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, { label, permissions }]) => (
              <TabsContent key={categoryKey} value={categoryKey}>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {permissions.map((permission) => {
                      const hasPermission = PERMISSION_MATRIX[permission as Permission]?.includes(selectedRole);
                      return (
                        <div 
                          key={permission}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {permission}
                            </code>
                            <span className="text-sm">
                              {getPermissionLabel(permission as Permission)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            {roles.map((role) => {
                              const roleHas = PERMISSION_MATRIX[permission as Permission]?.includes(role);
                              return (
                                <div 
                                  key={role}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    roleHas 
                                      ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400" 
                                      : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                                  }`}
                                  title={ROLE_LABELS[role]}
                                >
                                  {roleHas ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
