import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  Euro,
  Briefcase,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useProject, useProjectMembers } from "@/hooks/useProjects";
import { useTeamTimeEntries } from "@/hooks/useTeamTimeEntries";
import { useTaskSchedules } from "@/hooks/useTaskSchedules";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProjectBudgetTabProps {
  projectId: string;
}

export function ProjectBudgetTab({ projectId }: ProjectBudgetTabProps) {
  const { activeWorkspace, user } = useAuth();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { members: projectMembers } = useProjectMembers(projectId);
  const { data: timeEntries, isLoading: entriesLoading } = useTeamTimeEntries({
    projectId,
  });
  const { schedules, isLoading: schedulesLoading } = useTaskSchedules({
    taskId: undefined,
  });

  // Check if current user is admin/owner
  const { data: currentUserRole } = useQuery({
    queryKey: ["workspace-member-role", activeWorkspace?.id, user?.id],
    queryFn: async () => {
      if (!activeWorkspace || !user) return null;
      const { data, error } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", activeWorkspace.id)
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data.role;
    },
    enabled: !!activeWorkspace && !!user,
  });

  // Get workspace daily rate
  const { data: workspaceData } = useQuery({
    queryKey: ["workspace-daily-rate", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return null;
      const { data, error } = await supabase
        .from("workspaces")
        .select("daily_rate")
        .eq("id", activeWorkspace.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!activeWorkspace,
  });

  // Get all profiles for users who have time entries
  const userIds = useMemo(() => {
    const ids = new Set<string>();
    timeEntries?.forEach((e) => ids.add(e.user_id));
    schedules?.forEach((s) => ids.add(s.user_id));
    return Array.from(ids);
  }, [timeEntries, schedules]);

  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-budget", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      if (error) return [];
      return data;
    },
    enabled: userIds.length > 0,
  });

  const profilesMap = useMemo(() => {
    const map = new Map<string, { full_name: string | null; avatar_url: string | null }>();
    profiles?.forEach((p) => map.set(p.user_id, p));
    return map;
  }, [profiles]);

  const isAdmin = currentUserRole === "admin" || currentUserRole === "owner";
  const dailyRate = workspaceData?.daily_rate || 0;
  const hourlyRate = dailyRate / 8;

  // Filter schedules for this project
  const projectSchedules = useMemo(() => {
    return (
      schedules?.filter((s) => s.task?.project?.id === projectId) || []
    );
  }, [schedules, projectId]);

  // Calculate time by member with work descriptions
  const memberTimeSummary = useMemo(() => {
    const memberMap = new Map<
      string,
      {
        userId: string;
        name: string;
        avatarUrl: string | null;
        timeEntryMinutes: number;
        scheduledMinutes: number;
        totalHours: number;
        workDescriptions: string[];
        tasksWorkedOn: Set<string>;
      }
    >();

    // Add time entries
    timeEntries?.forEach((entry) => {
      const profile = profilesMap.get(entry.user_id);
      const existing = memberMap.get(entry.user_id) || {
        userId: entry.user_id,
        name: profile?.full_name || "Membre",
        avatarUrl: profile?.avatar_url || null,
        timeEntryMinutes: 0,
        scheduledMinutes: 0,
        totalHours: 0,
        workDescriptions: [],
        tasksWorkedOn: new Set<string>(),
      };
      existing.timeEntryMinutes += entry.duration_minutes;
      
      // Add work description
      if (entry.description && !existing.workDescriptions.includes(entry.description)) {
        existing.workDescriptions.push(entry.description);
      }
      if (entry.task?.title) {
        existing.tasksWorkedOn.add(entry.task.title);
      }
      
      // Update name from profile
      if (profile?.full_name) {
        existing.name = profile.full_name;
        existing.avatarUrl = profile.avatar_url;
      }
      
      memberMap.set(entry.user_id, existing);
    });

    // Add scheduled time
    projectSchedules.forEach((schedule) => {
      const profile = profilesMap.get(schedule.user_id);
      const durationMs =
        new Date(schedule.end_datetime).getTime() -
        new Date(schedule.start_datetime).getTime();
      const durationMinutes = durationMs / (1000 * 60);

      const existing = memberMap.get(schedule.user_id) || {
        userId: schedule.user_id,
        name: profile?.full_name || schedule.user?.full_name || "Membre",
        avatarUrl: profile?.avatar_url || schedule.user?.avatar_url || null,
        timeEntryMinutes: 0,
        scheduledMinutes: 0,
        totalHours: 0,
        workDescriptions: [],
        tasksWorkedOn: new Set<string>(),
      };
      existing.scheduledMinutes += durationMinutes;
      
      // Add task name to worked on
      if (schedule.task?.title) {
        existing.tasksWorkedOn.add(schedule.task.title);
      }
      
      // Update from profile
      if (profile?.full_name) {
        existing.name = profile.full_name;
        existing.avatarUrl = profile.avatar_url;
      } else if (schedule.user?.full_name) {
        existing.name = schedule.user.full_name;
        existing.avatarUrl = schedule.user.avatar_url;
      }
      
      memberMap.set(schedule.user_id, existing);
    });

    // Enrich with member info
    projectMembers.forEach((m) => {
      const existing = memberMap.get(m.user_id);
      if (existing) {
        if (m.profile?.full_name) {
          existing.name = m.profile.full_name;
        }
        if (m.profile?.avatar_url) {
          existing.avatarUrl = m.profile.avatar_url;
        }
      }
    });

    // Calculate total hours and format work description
    return Array.from(memberMap.values()).map((m) => ({
      ...m,
      totalHours: (m.timeEntryMinutes + m.scheduledMinutes) / 60,
      workDescription: m.workDescriptions.length > 0 
        ? m.workDescriptions.slice(0, 3).join(", ") + (m.workDescriptions.length > 3 ? "..." : "")
        : Array.from(m.tasksWorkedOn).slice(0, 3).join(", ") + (m.tasksWorkedOn.size > 3 ? "..." : ""),
    }));
  }, [timeEntries, projectSchedules, projectMembers, profilesMap]);

  const totalHours = memberTimeSummary.reduce((sum, m) => sum + m.totalHours, 0);
  const totalCost = totalHours * hourlyRate;
  const projectBudget = project?.budget || 0;
  const budgetUsedPercent =
    projectBudget > 0 ? Math.min(100, Math.round((totalCost / projectBudget) * 100)) : 0;

  const isLoading = projectLoading || entriesLoading || schedulesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards - Visible to all */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heures totales</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(totalHours * 10) / 10}h
            </div>
            <p className="text-xs text-muted-foreground">
              Temps passé sur le projet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributeurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberTimeSummary.length}</div>
            <p className="text-xs text-muted-foreground">
              Membres ayant contribué
            </p>
          </CardContent>
        </Card>

        {/* Cost is now visible to everyone */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût estimé</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(totalCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              Base {dailyRate}€/jour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget vs Actual (Admin only) */}
      {isAdmin && projectBudget > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Budget vs Réalisé
            </CardTitle>
            <CardDescription>
              Comparaison entre le budget projet et le coût réalisé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget projet</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(projectBudget)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Consommé</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    budgetUsedPercent > 90
                      ? "text-destructive"
                      : budgetUsedPercent > 70
                      ? "text-amber-600"
                      : "text-emerald-600"
                  )}
                >
                  {budgetUsedPercent}%
                </p>
              </div>
            </div>

            <Progress
              value={budgetUsedPercent}
              className={cn(
                "h-3",
                budgetUsedPercent > 90
                  ? "[&>div]:bg-destructive"
                  : budgetUsedPercent > 70
                  ? "[&>div]:bg-amber-500"
                  : "[&>div]:bg-emerald-500"
              )}
            />

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {budgetUsedPercent > 90 ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                <span>
                  Restant:{" "}
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(Math.max(0, projectBudget - totalCost))}
                </span>
              </div>
              <Badge
                variant={
                  budgetUsedPercent > 90
                    ? "destructive"
                    : budgetUsedPercent > 70
                    ? "secondary"
                    : "default"
                }
              >
                {budgetUsedPercent > 100
                  ? "Dépassement"
                  : budgetUsedPercent > 90
                  ? "Attention"
                  : "Dans le budget"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time by member - Fully public with descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Temps par membre
          </CardTitle>
          <CardDescription>
            Répartition du temps passé sur le projet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {memberTimeSummary.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun temps enregistré sur ce projet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead>
                  <TableHead>Travail réalisé</TableHead>
                  <TableHead className="text-right">Heures</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                  <TableHead className="text-right">Part</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberTimeSummary
                  .sort((a, b) => b.totalHours - a.totalHours)
                  .map((member) => {
                    const memberPercent =
                      totalHours > 0
                        ? Math.round((member.totalHours / totalHours) * 100)
                        : 0;
                    const memberCost = member.totalHours * hourlyRate;

                    return (
                      <TableRow key={member.userId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatarUrl || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {member.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-[250px]">
                            <Briefcase className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                              {member.workDescription || "Travail sur le projet"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {Math.round(member.totalHours * 10) / 10}h
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(memberCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress
                              value={memberPercent}
                              className="w-16 h-2"
                            />
                            <span className="text-sm text-muted-foreground w-10 text-right">
                              {memberPercent}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
