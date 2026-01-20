import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Crown, Shield, User, Eye, Info } from "lucide-react";
import { PermissionMatrixEditor } from "./PermissionMatrixEditor";
import { AppRole, ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/permissions";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ROLE_ICONS: Record<AppRole, React.ReactNode> = {
  owner: <Crown className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  member: <User className="h-4 w-4" />,
  viewer: <Eye className="h-4 w-4" />,
};

const ROLE_COLORS: Record<AppRole, string> = {
  owner: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  member: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function PermissionsSettings() {
  const { role: currentRole, can } = usePermissions();
  const canManageRoles = can("team.manage_roles");

  return (
    <div className="space-y-6">
      {/* Current user role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Votre rôle
          </CardTitle>
          <CardDescription>
            Votre niveau d'accès dans ce workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentRole && (
            <div className="flex items-center gap-4">
              <Badge className={`gap-1.5 text-sm py-1.5 px-3 ${ROLE_COLORS[currentRole]}`}>
                {ROLE_ICONS[currentRole]}
                {ROLE_LABELS[currentRole]}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {ROLE_DESCRIPTIONS[currentRole]}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles overview */}
      <Card>
        <CardHeader>
          <CardTitle>Hiérarchie des rôles</CardTitle>
          <CardDescription>
            Vue d'ensemble des différents niveaux d'accès disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(["owner", "admin", "member", "viewer"] as AppRole[]).map((role) => (
              <div 
                key={role}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  currentRole === role 
                    ? "border-primary bg-primary/5" 
                    : "border-border"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={ROLE_COLORS[role]}>
                    {ROLE_ICONS[role]}
                    <span className="ml-1">{ROLE_LABELS[role]}</span>
                  </Badge>
                  {currentRole === role && (
                    <span className="text-xs text-primary font-medium">(vous)</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Permission Matrix Editor */}
      <PermissionGate permission="team.manage_roles" fallback={
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Seuls les administrateurs peuvent modifier les permissions.
            Consultez la matrice ci-dessous pour voir les permissions de chaque rôle.
          </AlertDescription>
        </Alert>
      } hideOnDeny={false}>
        <div /> {/* Empty div to satisfy PermissionGate children requirement */}
      </PermissionGate>

      <PermissionMatrixEditor />
    </div>
  );
}
