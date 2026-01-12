import { useState, useMemo, useCallback, useEffect } from "react";
import { format, addDays, startOfWeek, isSameDay, isWeekend, addWeeks, subWeeks, setHours, setMinutes, startOfDay, addMinutes, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TaskSchedule, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { useWorkspaceEvents, UnifiedWorkspaceEvent, WorkspaceEvent, TenderWorkspaceEvent } from "@/hooks/useWorkspaceEvents";
import { useAllProjectMembers, useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamAbsences, absenceTypeLabels } from "@/hooks/useTeamAbsences";
import { useTeamTimeEntries, TeamTimeEntry } from "@/hooks/useTeamTimeEntries";
import { useTeams } from "@/hooks/useTeams";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Task } from "@/hooks/useTasks";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { PlanningItem } from "./ResizablePlanningItem";
import { DayTimelineCell, TimelineHourLabels, DAY_START_HOUR, DAY_END_HOUR, TOTAL_HOURS, PIXELS_PER_MINUTE } from "./DayTimelineCell";
import { AddTimeEntryDialog } from "./AddTimeEntryDialog";
import { EditTimeEntryDialog } from "./EditTimeEntryDialog";
import { CreateScheduleDialog } from "./CreateScheduleDialog";
import { MemberFocusSwitcher } from "./MemberFocusSwitcher";
import { CalendarSyncPanel } from "./CalendarSyncPanel";

// Configuration - Use flex-grow to maximize width
const DAYS_TO_SHOW = 7; // 1 week
const MEMBER_COLUMN_WIDTH = 200;
const MIN_DAY_COLUMN_WIDTH = 180; // Minimum width per day, will grow to fill space

const EVENT_TYPE_COLORS: Record<string, string> = {
  meeting: "#3b82f6",
  milestone: "#f59e0b",
  reminder: "#8b5cf6",
  rendu: "#10b981",
  site_visit: "#f97316",
  deadline: "#ef4444",
};

interface TimelinePlanningGridProps {
  onEventClick?: (schedule: TaskSchedule) => void;
  onTaskDrop?: (taskId: string, userId: string, date: Date) => void;
}

export function TimelinePlanningGrid({ onEventClick, onTaskDrop }: TimelinePlanningGridProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  // In agenda view, we always focus on a single member (forced focus mode)
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null);

  // Create schedule dialog state
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false);
  const [createScheduleDate, setCreateScheduleDate] = useState<Date | null>(null);
  const [createScheduleHour, setCreateScheduleHour] = useState<number>(9);
  const [createScheduleMember, setCreateScheduleMember] = useState<TeamMember | null>(null);
  const [createScheduleItems, setCreateScheduleItems] = useState<PlanningItem[]>([]);

  // Time entry dialogs
  const [timeEntryDialogOpen, setTimeEntryDialogOpen] = useState(false);
  const [selectedCellDate, setSelectedCellDate] = useState<Date | null>(null);
  const [selectedCellMember, setSelectedCellMember] = useState<TeamMember | null>(null);
  const [editTimeEntryDialogOpen, setEditTimeEntryDialogOpen] = useState(false);
  const [selectedTimeEntry, setSelectedTimeEntry] = useState<TeamTimeEntry | null>(null);

  const { schedules, isLoading: schedulesLoading, createSchedule, deleteSchedule, updateSchedule } = useTaskSchedules();
  const { data: members, isLoading: membersLoading } = useTeamMembers();
  const { data: events, isLoading: eventsLoading } = useWorkspaceEvents();
  const { data: userProjectsMap } = useAllProjectMembers();
  const { data: absences } = useTeamAbsences({ status: "approved" });
  const { data: timeEntries } = useTeamTimeEntries();
  const { projects } = useProjects();
  const { teams, userTeamsMap } = useTeams();

  const isLoading = schedulesLoading || membersLoading || eventsLoading;

  // Auto-select current logged-in user as default ("Mon agenda")
  useEffect(() => {
    if (!focusedMemberId && members && members.length > 0 && user) {
      // First, try to find the logged-in user in members
      const currentUserMember = members.find(m => m.user_id === user.id);
      if (currentUserMember) {
        setFocusedMemberId(currentUserMember.user_id);
      } else {
        // Fallback to first member if current user not found
        setFocusedMemberId(members[0].user_id);
      }
    }
  }, [members, focusedMemberId, user]);

  // In agenda mode, we ALWAYS show only one member (single focus mode)
  const displayedMember = useMemo(() => {
    if (!members) return null;
    if (focusedMemberId) {
      return members.find(m => m.user_id === focusedMemberId) || members[0];
    }
    return members[0] || null;
  }, [members, focusedMemberId]);

  // Calculate days to show
  const days = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const navigate = (direction: "prev" | "next") => {
    setCurrentDate(prev => direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  // Get items for member and day
  const getItemsForMemberAndDay = useCallback((memberId: string, memberEmail: string | null, day: Date): PlanningItem[] => {
    const items: PlanningItem[] = [];
    const dayStart = startOfDay(day);
    const dayEnd = addDays(dayStart, 1);

    // Add absences
    absences?.forEach(absence => {
      if (absence.user_id !== memberId) return;
      const absenceStart = parseISO(absence.start_date);
      const absenceEnd = parseISO(absence.end_date);
      if (absenceStart <= day && absenceEnd >= day) {
        items.push({
          id: absence.id,
          type: "absence",
          title: absenceTypeLabels[absence.absence_type] || "Absence",
          start: setHours(dayStart, DAY_START_HOUR),
          end: setHours(dayStart, DAY_END_HOUR),
          color: "#9ca3af",
          durationHours: TOTAL_HOURS,
          originalData: absence,
        });
      }
    });

    // Add scheduled tasks
    schedules?.forEach(schedule => {
      if (schedule.user_id !== memberId) return;
      const scheduleStart = new Date(schedule.start_datetime);
      const scheduleEnd = new Date(schedule.end_datetime);
      
      if (scheduleStart < dayEnd && scheduleEnd > dayStart) {
        const durationMs = scheduleEnd.getTime() - scheduleStart.getTime();
        const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;
        
        items.push({
          id: schedule.id,
          type: "task",
          title: schedule.task?.title || "Tâche",
          start: scheduleStart,
          end: scheduleEnd,
          color: schedule.color || schedule.task?.project?.color || "#6366f1",
          projectName: schedule.task?.project?.name,
          projectColor: schedule.task?.project?.color || undefined,
          durationHours,
          originalData: schedule,
        });
      }
    });

    // Add events
    if (showEvents && events) {
      const memberProjectIds = userProjectsMap?.get(memberId) || new Set<string>();

      events.forEach(event => {
        const isAttendee = event.attendees?.some(a => 
          (memberEmail && a.email?.toLowerCase() === memberEmail.toLowerCase()) ||
          a.user_id === memberId
        );
        const isAssignedToProject = event.source === "project" && 
          (event as WorkspaceEvent).project_id && 
          memberProjectIds.has((event as WorkspaceEvent).project_id);
        
        if (!isAttendee && !isAssignedToProject) return;

        const eventStart = new Date(event.start_datetime);
        const eventEnd = event.end_datetime ? new Date(event.end_datetime) : addMinutes(eventStart, 60);
        
        if (eventStart < dayEnd && eventEnd > dayStart) {
          const durationMs = eventEnd.getTime() - eventStart.getTime();
          const durationHours = Math.max(0.5, Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10);
          
          const displayName = event.source === "project" 
            ? (event as WorkspaceEvent).project?.name
            : (event as TenderWorkspaceEvent).tender?.title;
          
          items.push({
            id: event.id,
            type: "event",
            title: event.title,
            start: eventStart,
            end: eventEnd,
            color: EVENT_TYPE_COLORS[event.event_type] || "#6366f1",
            projectName: displayName,
            eventType: event.event_type,
            durationHours,
            originalData: event,
          });
        }
      });
    }

    // Add time entries
    timeEntries?.forEach(entry => {
      if (entry.user_id !== memberId) return;
      const entryDate = parseISO(entry.date);
      
      if (isSameDay(entryDate, day)) {
        const durationHours = entry.duration_minutes / 60;
        const entryStart = setHours(startOfDay(entryDate), 9);
        const entryEnd = new Date(entryStart.getTime() + entry.duration_minutes * 60 * 1000);
        
        items.push({
          id: entry.id,
          type: "timeEntry",
          title: entry.description || entry.task?.title || entry.project?.name || "Temps manuel",
          start: entryStart,
          end: entryEnd,
          color: entry.is_billable ? "#10b981" : "#6b7280",
          projectName: entry.project?.name,
          durationHours,
          isBillable: entry.is_billable,
          originalData: entry,
        });
      }
    });

    return items.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [schedules, events, showEvents, userProjectsMap, absences, timeEntries]);

  // Handlers
  const handleViewTask = useCallback((schedule: TaskSchedule) => {
    if (schedule.task) {
      setSelectedTask(schedule.task as Task);
      setTaskSheetOpen(true);
    }
  }, []);

  const handleUnschedule = useCallback((scheduleId: string) => {
    deleteSchedule.mutate(scheduleId);
  }, [deleteSchedule]);

  const handleCellClick = useCallback((date: Date, hour: number, member: TeamMember, items: PlanningItem[]) => {
    setCreateScheduleDate(date);
    setCreateScheduleHour(hour);
    setCreateScheduleMember(member);
    setCreateScheduleItems(items);
    setCreateScheduleOpen(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, day: Date, member: TeamMember, hour?: number) => {
    try {
      const dataString = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
      if (!dataString) return;

      const data = JSON.parse(dataString);
      
      // If it's a move operation (has scheduleId), update the schedule
      if (data.scheduleId && data.itemType === "task") {
        const startHour = hour ?? 9;
        const newStart = setHours(setMinutes(startOfDay(day), 0), startHour);
        const durationMinutes = (data.durationHours || 1) * 60;
        const newEnd = addMinutes(newStart, durationMinutes);
        
        updateSchedule.mutate({
          id: data.scheduleId,
          user_id: member.user_id,
          start_datetime: newStart.toISOString(),
          end_datetime: newEnd.toISOString(),
        });
        return;
      }
      
      // Otherwise it's a new task being scheduled
      const task = data;
      const startHour = hour ?? 9;
      const estimatedHours = task.estimated_hours || 2;
      
      const startDate = setHours(startOfDay(day), startHour);
      const endDate = addMinutes(startDate, estimatedHours * 60);
      
      createSchedule.mutate({
        task_id: task.id,
        user_id: member.user_id,
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
      });
      
      onTaskDrop?.(task.id, member.user_id, day);
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  }, [createSchedule, updateSchedule, onTaskDrop]);

  const handleViewTimeEntry = useCallback((entry: TeamTimeEntry) => {
    setSelectedTimeEntry(entry);
    setEditTimeEntryDialogOpen(true);
  }, []);

  const containerHeight = useMemo(() => TOTAL_HOURS * 60 * PIXELS_PER_MINUTE, []);

  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="w-60 border-r p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("prev")} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-3 text-xs">
            Aujourd'hui
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("next")} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="h-6 w-px bg-border mx-2" />
          
          <span className="text-sm font-semibold capitalize">
            {format(days[0], "d MMM", { locale: fr })} - {format(days[days.length - 1], "d MMM yyyy", { locale: fr })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Member focus switcher */}
          <MemberFocusSwitcher
            members={members || []}
            focusedMemberId={focusedMemberId}
            onFocusChange={setFocusedMemberId}
          />

          {/* Calendar sync panel */}
          <CalendarSyncPanel />

          {/* Show events toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="show-events"
              checked={showEvents}
              onCheckedChange={setShowEvents}
            />
            <Label htmlFor="show-events" className="text-xs cursor-pointer">
              Événements
            </Label>
          </div>
        </div>
      </div>

      {/* Main grid - Single member view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Member info column (sticky) */}
        {displayedMember && (
          <div 
            className="flex-shrink-0 border-r bg-muted/30"
            style={{ width: MEMBER_COLUMN_WIDTH }}
          >
            {/* Header with member info */}
            <div className="h-16 border-b flex items-center gap-3 px-3 bg-card/50">
              <Avatar className="h-10 w-10">
                <AvatarImage src={displayedMember.profile?.avatar_url || ""} />
                <AvatarFallback className="text-sm">
                  {(displayedMember.profile?.full_name || "?").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {displayedMember.profile?.full_name || "Sans nom"}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {displayedMember.role || "Membre"}
                </div>
              </div>
            </div>
            
            {/* Hour labels integrated into member column */}
            <div className="h-[calc(100%-4rem)]">
              <TimelineHourLabels />
            </div>
          </div>
        )}

        {/* Timeline area - full width distribution */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex h-full" style={{ minWidth: DAYS_TO_SHOW * MIN_DAY_COLUMN_WIDTH }}>
            {/* Days columns - distribute evenly */}
            {days.map(day => {
              const isToday = isSameDay(day, new Date());
              const weekend = isWeekend(day);

              return (
                <div
                  key={day.toISOString()}
                  className="flex flex-col flex-1"
                  style={{ minWidth: MIN_DAY_COLUMN_WIDTH }}
                >
                  {/* Day header */}
                  <div
                    className={cn(
                      "h-16 border-b flex flex-col items-center justify-center gap-0.5 sticky top-0 bg-background z-10",
                      weekend && "bg-muted/40",
                      isToday && "bg-primary/10"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] uppercase text-muted-foreground font-medium"
                    )}>
                      {format(day, "EEEE", { locale: fr })}
                    </span>
                    <span className={cn(
                      "text-lg font-bold",
                      isToday && "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Single member timeline for this day */}
                  {displayedMember && (
                    <DayTimelineCell
                      key={`${displayedMember.user_id}-${day.toISOString()}`}
                      day={day}
                      member={displayedMember}
                      items={getItemsForMemberAndDay(displayedMember.user_id, displayedMember.profile?.email || null, day)}
                      isDragOver={dragOverCell === `${displayedMember.user_id}-${day.toISOString()}`}
                      isToday={isToday}
                      isWeekend={weekend}
                      onDragOver={() => setDragOverCell(`${displayedMember.user_id}-${day.toISOString()}`)}
                      onDragLeave={() => setDragOverCell(null)}
                      onDrop={(e, hour) => {
                        setDragOverCell(null);
                        handleDrop(e, day, displayedMember, hour);
                      }}
                      onViewTask={handleViewTask}
                      onUnschedule={handleUnschedule}
                      onCellClick={(date, hour) => handleCellClick(date, hour, displayedMember, getItemsForMemberAndDay(displayedMember.user_id, displayedMember.profile?.email || null, day))}
                      onViewTimeEntry={handleViewTimeEntry}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        task={selectedTask}
        open={taskSheetOpen}
        onOpenChange={setTaskSheetOpen}
      />

      {/* Create Schedule Dialog */}
      {createScheduleOpen && createScheduleDate && createScheduleMember && (
        <CreateScheduleDialog
          open={createScheduleOpen}
          onOpenChange={setCreateScheduleOpen}
          date={createScheduleDate}
          hour={createScheduleHour}
          member={createScheduleMember}
          existingItems={createScheduleItems}
        />
      )}

      {/* Edit Time Entry Dialog */}
      <EditTimeEntryDialog
        open={editTimeEntryDialogOpen}
        onOpenChange={setEditTimeEntryDialogOpen}
        entry={selectedTimeEntry}
      />
    </div>
  );
}
