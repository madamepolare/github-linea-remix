import { TeamMember } from "@/hooks/useTeamMembers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Mail,
  Phone,
  Shield,
  Trash2,
  GraduationCap,
  Pencil,
  Building2,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  member: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  viewer: "bg-muted text-muted-foreground",
};

interface MemberCardProps {
  member: TeamMember;
  isApprentice?: boolean;
  canManage?: boolean;
  showDepartment?: boolean;
  onUpdateRole?: (role: "admin" | "member" | "viewer") => void;
  onRemove?: () => void;
  onManageApprentice?: () => void;
  onEdit?: () => void;
}

export function MemberCard({
  member,
  isApprentice = false,
  canManage = false,
  showDepartment = true,
  onUpdateRole,
  onRemove,
  onManageApprentice,
  onEdit,
}: MemberCardProps) {
  const initials = member.profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={member.profile?.avatar_url || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium truncate">{member.profile?.full_name || "Sans nom"}</h3>
                {isApprentice && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Alternant
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {member.profile?.job_title || "—"}
              </p>
              {showDepartment && member.profile?.department && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{member.profile.department}</span>
                </div>
              )}
            </div>
          </div>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier le profil
                  </DropdownMenuItem>
                )}
                {onManageApprentice && (
                  <DropdownMenuItem onClick={onManageApprentice}>
                    <GraduationCap className="h-4 w-4 mr-2" />
                    {isApprentice ? "Modifier planning alternance" : "Configurer alternance"}
                  </DropdownMenuItem>
                )}
                {onUpdateRole && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onUpdateRole("admin")}>
                      <Shield className="h-4 w-4 mr-2" />
                      Passer admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateRole("member")}>
                      <Shield className="h-4 w-4 mr-2" />
                      Passer membre
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateRole("viewer")}>
                      <Shield className="h-4 w-4 mr-2" />
                      Passer lecteur
                    </DropdownMenuItem>
                  </>
                )}
                {onRemove && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={onRemove}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Retirer
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Badge className={cn("shrink-0", roleColors[member.role])}>
            {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] || member.role}
          </Badge>
          {member.profile?.email && (
            <a
              href={`mailto:${member.profile.email}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={member.profile.email}
            >
              <Mail className="h-4 w-4" />
            </a>
          )}
          {member.profile?.phone && (
            <a
              href={`tel:${member.profile.phone}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={member.profile.phone}
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
