import { useMemo } from "react";
import { useTaskSchedules } from "./useTaskSchedules";
import { useWorkspaceEvents, UnifiedWorkspaceEvent } from "./useWorkspaceEvents";
import { usePostItTasks, QuickTask } from "./usePostItTasks";
import { useMyTimeEntries, TeamTimeEntry } from "./useTeamTimeEntries";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, parseISO, differenceInMinutes, isBefore, addDays } from "date-fns";

interface PlanningGap {
  start: string;
  end: string;
  durationMinutes: number;
}

interface VigilancePoint {
  type: "late_task" | "deadline_tomorrow" | "no_time_logged" | "overdue";
  message: string;
  taskId?: string;
  severity: "warning" | "critical";
}

export interface TodayData {
  // Scheduled tasks for today
  todaySchedules: ReturnType<typeof useTaskSchedules>["schedules"];
  
  // Events for today
  todayEvents: UnifiedWorkspaceEvent[];
  
  // Pending post-its
  pendingPostIts: QuickTask[];
  
  // Planning gaps > 1 hour
  planningGaps: PlanningGap[];
  
  // Time entries for today
  todayTimeEntries: TeamTimeEntry[];
  totalTimeLoggedMinutes: number;
  
  // Vigilance points
  vigilancePoints: VigilancePoint[];
  
  // Yesterday's notes
  yesterdayNotes: string | null;
  
  // Loading states
  isLoading: boolean;
}

export function useTodayData(yesterdayCheckinNotes?: string | null): TodayData {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  // Get today's schedules
  const { schedules, isLoading: schedulesLoading } = useTaskSchedules({
    userId: user?.id,
    startDate: `${today}T00:00:00`,
    endDate: `${today}T23:59:59`,
  });

  // Get all events
  const { data: allEvents, isLoading: eventsLoading } = useWorkspaceEvents();

  // Get post-its
  const { quickTasks, isLoading: postItsLoading } = usePostItTasks();

  // Get today's time entries
  const { data: timeEntries, isLoading: timeEntriesLoading } = useMyTimeEntries(today, today);

  // Filter today's events
  const todayEvents = useMemo(() => {
    if (!allEvents) return [];
    return allEvents.filter(event => {
      const eventDate = parseISO(event.start_datetime);
      return isToday(eventDate);
    });
  }, [allEvents]);

  // Filter pending post-its
  const pendingPostIts = useMemo(() => {
    if (!quickTasks) return [];
    return quickTasks.filter(t => t.status === "pending");
  }, [quickTasks]);

  // Calculate planning gaps (>1 hour)
  const planningGaps = useMemo(() => {
    if (!schedules || schedules.length === 0) return [];

    const gaps: PlanningGap[] = [];
    const workStart = parseISO(`${today}T09:00:00`);
    const workEnd = parseISO(`${today}T18:00:00`);

    // Sort schedules by start time
    const sorted = [...schedules].sort((a, b) => 
      new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );

    // Check gap before first schedule
    if (sorted.length > 0) {
      const firstStart = parseISO(sorted[0].start_datetime);
      if (isBefore(workStart, firstStart)) {
        const gapMinutes = differenceInMinutes(firstStart, workStart);
        if (gapMinutes >= 60) {
          gaps.push({
            start: workStart.toISOString(),
            end: sorted[0].start_datetime,
            durationMinutes: gapMinutes,
          });
        }
      }
    }

    // Check gaps between schedules
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = parseISO(sorted[i].end_datetime);
      const nextStart = parseISO(sorted[i + 1].start_datetime);
      const gapMinutes = differenceInMinutes(nextStart, currentEnd);

      if (gapMinutes >= 60) {
        gaps.push({
          start: sorted[i].end_datetime,
          end: sorted[i + 1].start_datetime,
          durationMinutes: gapMinutes,
        });
      }
    }

    // Check gap after last schedule
    if (sorted.length > 0) {
      const lastEnd = parseISO(sorted[sorted.length - 1].end_datetime);
      if (isBefore(lastEnd, workEnd)) {
        const gapMinutes = differenceInMinutes(workEnd, lastEnd);
        if (gapMinutes >= 60) {
          gaps.push({
            start: sorted[sorted.length - 1].end_datetime,
            end: workEnd.toISOString(),
            durationMinutes: gapMinutes,
          });
        }
      }
    }

    return gaps;
  }, [schedules, today]);

  // Calculate total time logged
  const totalTimeLoggedMinutes = useMemo(() => {
    if (!timeEntries) return 0;
    return timeEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
  }, [timeEntries]);

  // Calculate vigilance points
  const vigilancePoints = useMemo(() => {
    const points: VigilancePoint[] = [];

    // Check for overdue tasks in schedules
    schedules?.forEach(schedule => {
      if (schedule.task?.status === "todo" && schedule.task.due_date) {
        const dueDate = parseISO(schedule.task.due_date);
        if (isBefore(dueDate, new Date())) {
          points.push({
            type: "overdue",
            message: `"${schedule.task.title}" est en retard`,
            taskId: schedule.task.id,
            severity: "critical",
          });
        } else if (format(dueDate, "yyyy-MM-dd") === tomorrow) {
          points.push({
            type: "deadline_tomorrow",
            message: `"${schedule.task.title}" à rendre demain`,
            taskId: schedule.task.id,
            severity: "warning",
          });
        }
      }
    });

    // Check if no time logged and it's afternoon
    const now = new Date();
    if (now.getHours() >= 14 && totalTimeLoggedMinutes < 60) {
      points.push({
        type: "no_time_logged",
        message: "Aucun temps saisi aujourd'hui",
        severity: "warning",
      });
    }

    return points;
  }, [schedules, tomorrow, totalTimeLoggedMinutes]);

  return {
    todaySchedules: schedules || [],
    todayEvents,
    pendingPostIts,
    planningGaps,
    todayTimeEntries: timeEntries || [],
    totalTimeLoggedMinutes,
    vigilancePoints,
    yesterdayNotes: yesterdayCheckinNotes || null,
    isLoading: schedulesLoading || eventsLoading || postItsLoading || timeEntriesLoading,
  };
}
