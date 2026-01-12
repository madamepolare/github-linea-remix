import { useState, useMemo, useCallback } from "react";
import { format, addDays, startOfWeek, isSameDay, isWeekend, addWeeks, subWeeks, setHours, setMinutes, startOfDay, addMinutes, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Users, Calendar, Clock, Check, X, UsersRound, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { TaskSchedule, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { useWorkspaceEvents, UnifiedWorkspaceEvent, WorkspaceEvent, TenderWorkspaceEvent } from "@/hooks/useWorkspaceEvents";
import { useAllProjectMembers, useProjects } from "@/hooks/useProjects";
import { useTeamAbsences, absenceTypeLabels } from "@/hooks/useTeamAbsences";
import { useTeamTimeEntries, TeamTimeEntry } from "@/hooks/useTeamTimeEntries";
import { useTeams } from "@/hooks/useTeams";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";
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

// Configuration
const DAYS_TO_SHOW = 7; // 1 week
const MEMBER_COLUMN_WIDTH = 180;
const DAY_COLUMN_WIDTH = 160;

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [memberFilterOpen, setMemberFilterOpen] = useState(false);

  // Create schedule dialog state
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false);
  const [createScheduleDate, setCreateScheduleDate] = useState<Date | null>(null);
  const [createScheduleHour, setCreateScheduleHour] = useState<number>(9);
  const [createScheduleMember, setCreateScheduleMember] = useState<TeamMember | null>(null);

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

  // Filter members
  const filteredMembers = useMemo(() => {
    if (selectedMemberIds.size === 0) return members || [];
    return (members || []).filter(m => selectedMemberIds.has(m.user_id));
  }, [members, selectedMemberIds]);

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

  const handleCellClick = useCallback((date: Date, hour: number, member: TeamMember) => {
    setCreateScheduleDate(date);
    setCreateScheduleHour(hour);
    setCreateScheduleMember(member);
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

  const toggleMemberFilter = useCallback((userId: string) => {
    setSelectedMemberIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  const clearMemberFilter = useCallback(() => {
    setSelectedMemberIds(new Set());
  }, []);

  const containerHeight = TOTAL_HOURS * 60 * PIXELS_PER_MINUTE;

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
          {/* Member filter */}
          <Popover open={memberFilterOpen} onOpenChange={setMemberFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Membres</span>
                {selectedMemberIds.size > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {selectedMemberIds.size}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <Command>
                <CommandInput placeholder="Rechercher un membre..." />
                <CommandList>
                  <CommandEmpty>Aucun membre trouvé</CommandEmpty>
                  <CommandGroup>
                    {members?.map(member => (
                      <CommandItem
                        key={member.user_id}
                        onSelect={() => toggleMemberFilter(member.user_id)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border",
                          selectedMemberIds.has(member.user_id)
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        )}>
                          {selectedMemberIds.has(member.user_id) && <Check className="h-3 w-3" />}
                        </div>
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.profile?.avatar_url || ""} />
                          <AvatarFallback className="text-[8px]">
                            {(member.profile?.full_name || "?").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{member.profile?.full_name || "Sans nom"}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {selectedMemberIds.size > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem onSelect={clearMemberFilter} className="justify-center text-muted-foreground">
                          <X className="h-3 w-3 mr-1" />
                          Effacer les filtres
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

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

      {/* Main grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Members column (sticky) */}
        <div 
          className="flex-shrink-0 border-r bg-muted/30"
          style={{ width: MEMBER_COLUMN_WIDTH }}
        >
          {/* Header spacer */}
          <div className="h-16 border-b flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">Équipe</span>
          </div>
          
          {/* Member rows */}
          <ScrollArea className="h-[calc(100%-4rem)]">
            {filteredMembers.map(member => (
              <div
                key={member.user_id}
                className="flex items-center gap-2 px-3 py-2 border-b"
                style={{ height: containerHeight }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.profile?.avatar_url || ""} />
                  <AvatarFallback className="text-xs">
                    {(member.profile?.full_name || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {member.profile?.full_name || "Sans nom"}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {member.role}
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Timeline area */}
        <ScrollArea className="flex-1">
          <div className="flex min-w-max">
            {/* Hour labels */}
            <TimelineHourLabels />

            {/* Days columns */}
            {days.map(day => {
              const isToday = isSameDay(day, new Date());
              const weekend = isWeekend(day);

              return (
                <div
                  key={day.toISOString()}
                  className="flex flex-col"
                  style={{ width: DAY_COLUMN_WIDTH }}
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

                  {/* Member timelines for this day */}
                  {filteredMembers.map(member => {
                    const cellKey = `${member.user_id}-${day.toISOString()}`;
                    const items = getItemsForMemberAndDay(member.user_id, member.profile?.email || null, day);
                    
                    return (
                      <DayTimelineCell
                        key={cellKey}
                        day={day}
                        member={member}
                        items={items}
                        isDragOver={dragOverCell === cellKey}
                        isToday={isToday}
                        isWeekend={weekend}
                        onDragOver={() => setDragOverCell(cellKey)}
                        onDragLeave={() => setDragOverCell(null)}
                        onDrop={(e, hour) => {
                          setDragOverCell(null);
                          handleDrop(e, day, member, hour);
                        }}
                        onViewTask={handleViewTask}
                        onUnschedule={handleUnschedule}
                        onCellClick={(date, hour) => handleCellClick(date, hour, member)}
                        onViewTimeEntry={handleViewTimeEntry}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
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
