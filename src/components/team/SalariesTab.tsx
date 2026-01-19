import { useState } from "react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAllMemberEmploymentInfo, MemberEmploymentInfo } from "@/hooks/useMemberEmploymentInfo";
import { MemberEmploymentDialog } from "@/components/settings/MemberEmploymentDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Pencil,
  Users,
  TrendingUp,
  Briefcase,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const CONTRACT_TYPES: Record<string, { label: string; color: string }> = {
  cdi: { label: "CDI", color: "bg-success/10 text-success border-success/20" },
  cdd: { label: "CDD", color: "bg-warning/10 text-warning border-warning/20" },
  freelance: { label: "Freelance", color: "bg-info/10 text-info border-info/20" },
  internship: { label: "Stage", color: "bg-accent/10 text-accent border-accent/20" },
  apprenticeship: { label: "Alternance", color: "bg-primary/10 text-primary border-primary/20" },
};

export function SalariesTab() {
  const [selectedMember, setSelectedMember] = useState<{
    user_id: string;
    profile: {
      full_name: string | null;
      avatar_url: string | null;
      job_title: string | null;
    } | null;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { user } = useAuth();
  const { data: members, isLoading: membersLoading } = useTeamMembers();
  const { data: employmentInfo, isLoading: employmentLoading } = useAllMemberEmploymentInfo();

  const currentUserRole = members?.find((m) => m.user_id === user?.id)?.role;
  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

  const isLoading = membersLoading || employmentLoading;

  // Create a map for quick lookup
  const employmentMap = employmentInfo?.reduce((acc, info) => {
    acc[info.user_id] = info;
    return acc;
  }, {} as Record<string, MemberEmploymentInfo>) || {};

  // Calculate statistics
  const totalSalaries = employmentInfo?.reduce((sum, info) => sum + (info.salary_monthly || 0), 0) || 0;
  const avgSalary = employmentInfo?.length ? totalSalaries / employmentInfo.filter(e => e.salary_monthly).length : 0;
  const memberCount = members?.length || 0;
  
  // Find trials ending soon (within 30 days)
  const trialsEndingSoon = members?.filter((member) => {
    const info = employmentMap[member.user_id];
    if (!info?.trial_end_date) return false;
    const daysRemaining = differenceInDays(parseISO(info.trial_end_date), new Date());
    return daysRemaining >= 0 && daysRemaining <= 30;
  }) || [];

  const handleEditMember = (member: typeof members[0]) => {
    setSelectedMember({
      user_id: member.user_id,
      profile: {
        full_name: member.profile?.full_name || null,
        avatar_url: member.profile?.avatar_url || null,
        job_title: member.profile?.job_title || null,
      },
    });
    setDialogOpen(true);
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!members || members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucun membre"
        description="Ajoutez des membres à votre équipe pour gérer leurs informations salariales."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Effectif</p>
                  <p className="text-2xl font-bold">{memberCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Masse salariale</p>
                  <p className="text-2xl font-bold">
                    {totalSalaries.toLocaleString("fr-FR")} €
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <TrendingUp className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Salaire moyen</p>
                  <p className="text-2xl font-bold">
                    {avgSalary ? Math.round(avgSalary).toLocaleString("fr-FR") : "-"} €
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(trialsEndingSoon.length > 0 && "border-warning")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  trialsEndingSoon.length > 0 ? "bg-warning/10" : "bg-muted"
                )}>
                  <AlertTriangle className={cn(
                    "h-5 w-5",
                    trialsEndingSoon.length > 0 ? "text-warning" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fins de PE</p>
                  <p className="text-2xl font-bold">{trialsEndingSoon.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Members Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Informations contractuelles
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collaborateur</TableHead>
                  <TableHead>Contrat</TableHead>
                  {isAdmin && <TableHead className="text-right">Salaire</TableHead>}
                  {isAdmin && <TableHead className="text-right">TJM Client</TableHead>}
                  <TableHead>Date d'entrée</TableHead>
                  <TableHead>Fin PE</TableHead>
                  {isAdmin && <TableHead className="w-[60px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const info = employmentMap[member.user_id];
                  const contractType = info?.contract_type ? CONTRACT_TYPES[info.contract_type] : null;
                  
                  // Check if trial is ending soon
                  let trialStatus: "ending" | "ended" | null = null;
                  if (info?.trial_end_date) {
                    const daysRemaining = differenceInDays(parseISO(info.trial_end_date), new Date());
                    if (daysRemaining < 0) trialStatus = "ended";
                    else if (daysRemaining <= 30) trialStatus = "ending";
                  }

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {member.profile?.full_name?.split(" ").map((n) => n[0]).join("") || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{member.profile?.full_name}</p>
                            <p className="text-xs text-muted-foreground">{member.profile?.job_title || member.role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contractType ? (
                          <Badge variant="outline" className={cn("font-medium", contractType.color)}>
                            {contractType.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right font-medium">
                          {info?.salary_monthly ? (
                            <span>{info.salary_monthly.toLocaleString("fr-FR")} €</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      {isAdmin && (
                        <TableCell className="text-right">
                          {info?.client_daily_rate ? (
                            <span className="text-sm">{info.client_daily_rate.toLocaleString("fr-FR")} €</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {info?.start_date ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {format(parseISO(info.start_date), "d MMM yyyy", { locale: fr })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {info?.trial_end_date ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              trialStatus === "ending" && "border-warning text-warning bg-warning/10",
                              trialStatus === "ended" && "border-success text-success bg-success/10"
                            )}
                          >
                            {trialStatus === "ended" ? "Validée" : format(parseISO(info.trial_end_date), "d MMM yyyy", { locale: fr })}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditMember(member)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Employment Dialog */}
      <MemberEmploymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={selectedMember}
      />
    </div>
  );
}
