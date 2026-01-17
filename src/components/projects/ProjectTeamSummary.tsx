import { useProjectTeam } from "@/hooks/useProjectTeam";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, UserCircle, Briefcase } from "lucide-react";

interface ProjectTeamSummaryProps {
  projectId: string;
}

export function ProjectTeamSummary({ projectId }: ProjectTeamSummaryProps) {
  const { members, internalMembers, externalMembers, isLoading, getRoleLabel } = useProjectTeam(projectId);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-4">
        <UserCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">Aucun membre assigné</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Internal members */}
      {internalMembers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Équipe interne
            </span>
            <Badge variant="secondary" className="text-xs h-5">
              {internalMembers.length}
            </Badge>
          </div>
          {internalMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.profile?.avatar_url || ""} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(member.profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {member.profile?.full_name || "Membre"}
                  </span>
                  {member.role === "lead" && (
                    <Crown className="h-3 w-3 text-amber-500" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {getRoleLabel(member.role, false)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* External members */}
      {externalMembers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Collaborateurs externes
            </span>
            <Badge variant="secondary" className="text-xs h-5">
              {externalMembers.length}
            </Badge>
          </div>
          {externalMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.contact?.avatar_url || ""} />
                <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                  {getInitials(member.contact?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">
                  {member.contact?.name || "Contact"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {getRoleLabel(member.role, true)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
