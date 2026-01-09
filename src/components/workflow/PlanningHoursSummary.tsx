import { useMemo } from "react";
import { format } from "date-fns";
import { Clock, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TeamMember } from "@/hooks/useTeamMembers";
import { TaskSchedule } from "@/hooks/useTaskSchedules";
import { Task } from "@/hooks/useTasks";
import { TeamTimeEntry } from "@/hooks/useTeamTimeEntries";

interface MemberHoursSummary {
  userId: string;
  memberName: string;
  plannedHours: number;
  estimatedHours: number;
  timeEntryHours: number;
  percentComplete: number;
}

interface PlanningHoursSummaryProps {
  members: TeamMember[] | undefined;
  schedules: TaskSchedule[] | undefined;
  timeEntries: TeamTimeEntry[] | undefined;
  tasks: Task[] | undefined;
  days: Date[];
  rowHeight: number;
}

export function PlanningHoursSummary({
  members,
  schedules,
  timeEntries,
  tasks,
  days,
  rowHeight,
}: PlanningHoursSummaryProps) {
  const startDate = days[0];
  const endDate = days[days.length - 1];

  const memberSummaries = useMemo<MemberHoursSummary[]>(() => {
    if (!members) return [];

    return members.map((member) => {
      // Calculate planned hours from schedules in the current view period
      const memberSchedules = schedules?.filter(
        (s) =>
          s.user_id === member.user_id &&
          new Date(s.start_datetime) >= startDate &&
          new Date(s.start_datetime) <= endDate
      ) || [];

      const plannedHours = memberSchedules.reduce((sum, schedule) => {
        const durationMs =
          new Date(schedule.end_datetime).getTime() -
          new Date(schedule.start_datetime).getTime();
        return sum + durationMs / (1000 * 60 * 60);
      }, 0);

      // Calculate time entry hours in the current view period
      const memberTimeEntries = timeEntries?.filter(
        (e) =>
          e.user_id === member.user_id &&
          new Date(e.date) >= startDate &&
          new Date(e.date) <= endDate
      ) || [];

      const timeEntryHours = memberTimeEntries.reduce(
        (sum, entry) => sum + entry.duration_minutes / 60,
        0
      );

      // Calculate estimated hours from assigned tasks
      const memberTasks = tasks?.filter(
        (t) =>
          (Array.isArray(t.assigned_to) 
            ? t.assigned_to.includes(member.user_id) 
            : t.assigned_to === member.user_id) &&
          t.status !== "done" &&
          t.status !== "archived"
      ) || [];

      const estimatedHours = memberTasks.reduce(
        (sum, task) => sum + (task.estimated_hours || 0),
        0
      );

      const totalPlanned = plannedHours + timeEntryHours;
      const percentComplete =
        estimatedHours > 0
          ? Math.min(100, Math.round((totalPlanned / estimatedHours) * 100))
          : totalPlanned > 0
          ? 100
          : 0;

      return {
        userId: member.user_id,
        memberName: member.profile?.full_name || "Membre",
        plannedHours: Math.round(totalPlanned * 10) / 10,
        estimatedHours: Math.round(estimatedHours * 10) / 10,
        timeEntryHours: Math.round(timeEntryHours * 10) / 10,
        percentComplete,
      };
    });
  }, [members, schedules, timeEntries, tasks, startDate, endDate]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalPlanned = memberSummaries.reduce((sum, m) => sum + m.plannedHours, 0);
    const totalEstimated = memberSummaries.reduce((sum, m) => sum + m.estimatedHours, 0);
    const percentComplete =
      totalEstimated > 0
        ? Math.min(100, Math.round((totalPlanned / totalEstimated) * 100))
        : totalPlanned > 0
        ? 100
        : 0;

    return { totalPlanned, totalEstimated, percentComplete };
  }, [memberSummaries]);

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-emerald-500";
    if (percent >= 75) return "bg-blue-500";
    if (percent >= 50) return "bg-amber-500";
    return "bg-muted-foreground/30";
  };

  return (
    <div className="flex-shrink-0 w-44 border-l bg-card/30">
      {/* Header */}
      <div className="h-[72px] border-b flex flex-col items-center justify-center px-2 bg-muted/20">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-xs font-medium uppercase tracking-wider">Synthèse</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          {format(startDate, "d MMM")} - {format(endDate, "d MMM")}
        </div>
      </div>

      {/* Member summaries */}
      <div className="overflow-auto" style={{ height: `calc(100% - 72px)` }}>
        {memberSummaries.map((summary) => (
          <div
            key={summary.userId}
            className="px-3 py-2 border-b flex flex-col justify-center"
            style={{ height: rowHeight }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1 text-xs font-medium">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground">{summary.plannedHours}h</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{summary.estimatedHours}h</span>
              </div>
            </div>

            <Progress
              value={summary.percentComplete}
              className="h-2"
            />

            <div className="flex items-center justify-between mt-1.5">
              <span
                className={cn(
                  "text-[10px] font-medium",
                  summary.percentComplete >= 100
                    ? "text-emerald-600 dark:text-emerald-400"
                    : summary.percentComplete >= 75
                    ? "text-blue-600 dark:text-blue-400"
                    : summary.percentComplete >= 50
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
                )}
              >
                {summary.percentComplete}% planifié
              </span>
            </div>
          </div>
        ))}

        {/* Total row */}
        {memberSummaries.length > 0 && (
          <div className="px-3 py-3 bg-muted/30 border-t">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">Total</span>
              <span className="text-xs font-medium">
                {Math.round(totals.totalPlanned * 10) / 10}h / {Math.round(totals.totalEstimated * 10) / 10}h
              </span>
            </div>
            <Progress value={totals.percentComplete} className="h-2" />
            <div className="text-[10px] text-muted-foreground mt-1 text-center">
              {totals.percentComplete}% de la charge planifiée
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
