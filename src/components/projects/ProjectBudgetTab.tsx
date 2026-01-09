import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
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
  Calculator,
  Pencil,
  ArrowUpDown,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { useProject, useProjectMembers } from "@/hooks/useProjects";
import { useTeamTimeEntries } from "@/hooks/useTeamTimeEntries";
import { useTaskSchedules } from "@/hooks/useTaskSchedules";
import { useAllMemberEmploymentInfo } from "@/hooks/useMemberEmploymentInfo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { MemberClientRateDialog } from "./MemberClientRateDialog";

// Monthly hours based on 35h/week
const MONTHLY_HOURS = 35 * 52 / 12; // ~151.67 hours/month

interface ProjectBudgetTabProps {
  projectId: string;
}

type SortField = "date" | "member" | "hours" | "description";
type SortDirection = "asc" | "desc";

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

  // State for editing member rates
  const [editingMember, setEditingMember] = useState<{
    id: string;
    name: string;
    rate: number | null;
    userId: string;
  } | null>(null);

  // Detail view state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterMember, setFilterMember] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState("");

  // Get employment info for real cost calculation
  const { data: employmentInfo, isLoading: employmentLoading } = useAllMemberEmploymentInfo();

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
  
  // Create a map of user_id -> hourly cost based on salary
  const employmentCostMap = useMemo(() => {
    const map = new Map<string, number>();
    employmentInfo?.forEach((info) => {
      if (info.salary_monthly) {
        // Calculate hourly cost from monthly salary (35h/week)
        const hourlyFromSalary = info.salary_monthly / MONTHLY_HOURS;
        map.set(info.user_id, hourlyFromSalary);
      }
    });
    return map;
  }, [employmentInfo]);

  // Create a map of user_id -> custom client daily rate
  const memberClientRatesMap = useMemo(() => {
    const map = new Map<string, { memberId: string; rate: number | null }>();
    projectMembers.forEach((m) => {
      map.set(m.user_id, { memberId: m.id, rate: m.client_daily_rate });
    });
    return map;
  }, [projectMembers]);

  // Helper to get hourly rate for a member (custom or default)
  const getMemberHourlyRate = (userId: string) => {
    const customRate = memberClientRatesMap.get(userId)?.rate;
    return (customRate ?? dailyRate) / 8;
  };

  // Filter schedules for this project
  const projectSchedules = useMemo(() => {
    return (
      schedules?.filter((s) => s.task?.project?.id === projectId) || []
    );
  }, [schedules, projectId]);

  // Detailed time entries with all info
  const detailedEntries = useMemo(() => {
    const entries: Array<{
      id: string;
      userId: string;
      memberName: string;
      avatarUrl: string | null;
      date: string;
      startedAt: string | null;
      endedAt: string | null;
      durationMinutes: number;
      description: string;
      taskName: string | null;
      type: "entry" | "schedule";
    }> = [];

    // Add time entries
    timeEntries?.forEach((entry) => {
      const profile = profilesMap.get(entry.user_id);
      entries.push({
        id: entry.id,
        userId: entry.user_id,
        memberName: profile?.full_name || "Membre",
        avatarUrl: profile?.avatar_url || null,
        date: entry.date,
        startedAt: entry.started_at,
        endedAt: entry.ended_at,
        durationMinutes: entry.duration_minutes,
        description: entry.description || "",
        taskName: entry.task?.title || null,
        type: "entry",
      });
    });

    // Add scheduled time
    projectSchedules.forEach((schedule) => {
      const profile = profilesMap.get(schedule.user_id);
      const startDate = new Date(schedule.start_datetime);
      const endDate = new Date(schedule.end_datetime);
      const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

      entries.push({
        id: schedule.id,
        userId: schedule.user_id,
        memberName: profile?.full_name || schedule.user?.full_name || "Membre",
        avatarUrl: profile?.avatar_url || schedule.user?.avatar_url || null,
        date: format(startDate, "yyyy-MM-dd"),
        startedAt: schedule.start_datetime,
        endedAt: schedule.end_datetime,
        durationMinutes,
        description: schedule.task?.title || "Temps planifié",
        taskName: schedule.task?.title || null,
        type: "schedule",
      });
    });

    return entries;
  }, [timeEntries, projectSchedules, profilesMap]);

  // Filtered and sorted entries
  const filteredSortedEntries = useMemo(() => {
    let result = [...detailedEntries];

    // Filter by member
    if (filterMember !== "all") {
      result = result.filter((e) => e.userId === filterMember);
    }

    // Filter by search
    if (filterSearch.trim()) {
      const search = filterSearch.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(search) ||
          e.taskName?.toLowerCase().includes(search) ||
          e.memberName.toLowerCase().includes(search)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "member":
          comparison = a.memberName.localeCompare(b.memberName);
          break;
        case "hours":
          comparison = a.durationMinutes - b.durationMinutes;
          break;
        case "description":
          comparison = (a.description || "").localeCompare(b.description || "");
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [detailedEntries, filterMember, filterSearch, sortField, sortDirection]);

  // Filtered totals
  const filteredTotals = useMemo(() => {
    const totalMinutes = filteredSortedEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
    const totalHours = totalMinutes / 60;
    
    const totalClientCost = filteredSortedEntries.reduce((sum, entry) => {
      const memberHourlyRate = getMemberHourlyRate(entry.userId);
      return sum + ((entry.durationMinutes / 60) * memberHourlyRate);
    }, 0);

    const totalRealCost = filteredSortedEntries.reduce((sum, entry) => {
      const realHourlyRate = employmentCostMap.get(entry.userId);
      if (realHourlyRate) {
        return sum + ((entry.durationMinutes / 60) * realHourlyRate);
      }
      return sum;
    }, 0);

    return { totalHours, totalClientCost, totalRealCost };
  }, [filteredSortedEntries, getMemberHourlyRate, employmentCostMap]);

  // Unique members for filter
  const uniqueMembers = useMemo(() => {
    const members = new Map<string, string>();
    detailedEntries.forEach((e) => {
      if (!members.has(e.userId)) {
        members.set(e.userId, e.memberName);
      }
    });
    return Array.from(members.entries()).map(([id, name]) => ({ id, name }));
  }, [detailedEntries]);

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
  
  // Calculate total client cost based on custom rates per member
  const totalClientCost = memberTimeSummary.reduce((sum, member) => {
    const memberHourlyRate = getMemberHourlyRate(member.userId);
    return sum + (member.totalHours * memberHourlyRate);
  }, 0);
  
  // Calculate total real cost based on salaries
  const totalRealCost = memberTimeSummary.reduce((sum, member) => {
    const realHourlyRate = employmentCostMap.get(member.userId);
    if (realHourlyRate) {
      return sum + (member.totalHours * realHourlyRate);
    }
    return sum; // Skip members without salary info
  }, 0);
  
  const projectBudget = project?.budget || 0;
  const budgetUsedPercent =
    projectBudget > 0 ? Math.min(100, Math.round((totalClientCost / projectBudget) * 100)) : 0;

  const isLoading = projectLoading || entriesLoading || schedulesLoading || employmentLoading;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 -ml-2 hover:bg-transparent"
      onClick={() => toggleSort(field)}
    >
      {children}
      <ArrowUpDown className={cn(
        "h-3 w-3 ml-1",
        sortField === field && "text-primary"
      )} />
    </Button>
  );

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

        {/* Client Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût client</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(totalClientCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              Base {dailyRate}€/jour
            </p>
          </CardContent>
        </Card>

        {/* Real Cost (Admin only) */}
        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coût réel</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(totalRealCost)}
              </div>
              <p className="text-xs text-muted-foreground">
                Basé sur salaires (35h/sem)
              </p>
            </CardContent>
          </Card>
        )}
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
                  }).format(Math.max(0, projectBudget - totalClientCost))}
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

      {/* Time by member - Summary */}
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
                  {isAdmin && <TableHead className="text-right">Tarif/jour</TableHead>}
                  <TableHead className="text-right">Coût client</TableHead>
                  {isAdmin && <TableHead className="text-right">Coût réel</TableHead>}
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
                    const memberHourlyRate = getMemberHourlyRate(member.userId);
                    const memberClientCost = member.totalHours * memberHourlyRate;
                    const realHourlyRate = employmentCostMap.get(member.userId);
                    const memberRealCost = realHourlyRate ? member.totalHours * realHourlyRate : null;
                    const memberRateInfo = memberClientRatesMap.get(member.userId);
                    const hasCustomRate = memberRateInfo?.rate !== null && memberRateInfo?.rate !== undefined;

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
                          <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-[200px]">
                            <Briefcase className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                              {member.workDescription || "Travail sur le projet"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {Math.round(member.totalHours * 10) / 10}h
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className={cn(
                                    "font-medium",
                                    hasCustomRate && "text-primary"
                                  )}>
                                    {memberHourlyRate * 8}€
                                    {hasCustomRate && " *"}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {hasCustomRate 
                                    ? `Tarif personnalisé (défaut: ${dailyRate}€/jour)`
                                    : `Tarif par défaut de l'agence`}
                                </TooltipContent>
                              </Tooltip>
                              {memberRateInfo?.memberId && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => setEditingMember({
                                    id: memberRateInfo.memberId,
                                    name: member.name,
                                    rate: memberRateInfo.rate,
                                    userId: member.userId,
                                  })}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(memberClientCost)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            {memberRealCost !== null ? (
                              <span className="text-emerald-600 font-medium">
                                {new Intl.NumberFormat("fr-FR", {
                                  style: "currency",
                                  currency: "EUR",
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(memberRealCost)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                        )}
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
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold">
                    {Math.round(totalHours * 10) / 10}h
                  </TableCell>
                  {isAdmin && <TableCell />}
                  <TableCell className="text-right font-semibold">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(totalClientCost)}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right font-semibold text-emerald-600">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(totalRealCost)}
                    </TableCell>
                  )}
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed time entries */}
      {detailedEntries.length > 0 && (
        <Card>
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Détail des temps
                    </CardTitle>
                    <CardDescription>
                      {detailedEntries.length} entrées de temps
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    {detailsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={filterMember} onValueChange={setFilterMember}>
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue placeholder="Tous les membres" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les membres</SelectItem>
                        {uniqueMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Rechercher..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-[200px] h-8"
                  />
                  {(filterMember !== "all" || filterSearch) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterMember("all");
                        setFilterSearch("");
                      }}
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>

                {/* Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <SortButton field="date">
                            <Calendar className="h-4 w-4 mr-1" />
                            Date
                          </SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="member">Membre</SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="description">Description</SortButton>
                        </TableHead>
                        <TableHead className="text-right">Horaires</TableHead>
                        <TableHead className="text-right">
                          <SortButton field="hours">Durée</SortButton>
                        </TableHead>
                        <TableHead className="text-right">Coût</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSortedEntries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Aucun temps correspondant aux filtres
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSortedEntries.map((entry) => {
                          const hourlyRate = getMemberHourlyRate(entry.userId);
                          const cost = (entry.durationMinutes / 60) * hourlyRate;
                          
                          return (
                            <TableRow key={`${entry.type}-${entry.id}`}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {format(parseISO(entry.date), "dd MMM yyyy", { locale: fr })}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(parseISO(entry.date), "EEEE", { locale: fr })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={entry.avatarUrl || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      {entry.memberName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{entry.memberName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[250px]">
                                  <span className="truncate block text-sm">
                                    {entry.description || entry.taskName || "—"}
                                  </span>
                                  {entry.taskName && entry.description && entry.taskName !== entry.description && (
                                    <Badge variant="secondary" className="mt-1 text-xs">
                                      {entry.taskName}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {entry.startedAt && entry.endedAt ? (
                                  <span className="text-sm text-muted-foreground">
                                    {format(parseISO(entry.startedAt), "HH:mm")} - {format(parseISO(entry.endedAt), "HH:mm")}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {Math.round(entry.durationMinutes / 60 * 10) / 10}h
                              </TableCell>
                              <TableCell className="text-right">
                                {new Intl.NumberFormat("fr-FR", {
                                  style: "currency",
                                  currency: "EUR",
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(cost)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={4} className="font-semibold">
                          Total {filterMember !== "all" || filterSearch ? "(filtré)" : ""}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {Math.round(filteredTotals.totalHours * 10) / 10}h
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(filteredTotals.totalClientCost)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Dialog for editing member client rate */}
      {editingMember && (
        <MemberClientRateDialog
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
          memberId={editingMember.id}
          memberName={editingMember.name}
          currentRate={editingMember.rate}
          defaultRate={dailyRate}
          projectId={projectId}
        />
      )}
    </div>
  );
}
