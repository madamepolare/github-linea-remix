import { useState, useMemo, useCallback, useRef } from "react";
import { format, addDays, startOfWeek, isSameDay, isWeekend, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, differenceInMinutes, startOfDay, setHours, parseISO, addHours } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Users, Calendar, Clock, Trash2, Eye, GripVertical, CheckCircle2, ExternalLink, Copy, Move, Plus, PanelLeftClose, PanelLeft, FolderKanban, Check, X, UsersRound, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { TaskSchedule, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { useWorkspaceEvents, UnifiedWorkspaceEvent, WorkspaceEvent, TenderWorkspaceEvent } from "@/hooks/useWorkspaceEvents";
import { useAllProjectMembers, useProjects } from "@/hooks/useProjects";
import { useTeamAbsences, TeamAbsence, absenceTypeLabels } from "@/hooks/useTeamAbsences";
import { useTeamTimeEntries, useUpdateTimeEntry, TeamTimeEntry } from "@/hooks/useTeamTimeEntries";
import { useTeams } from "@/hooks/useTeams";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Task } from "@/hooks/useTasks";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { ResizablePlanningItem, PlanningItem } from "./ResizablePlanningItem";
import { AddTimeEntryDialog } from "./AddTimeEntryDialog";
import { EditTimeEntryDialog } from "./EditTimeEntryDialog";

interface TeamPlanningGridProps {
  onEventClick?: (schedule: TaskSchedule) => void;
  onCellClick?: (date: Date, member: TeamMember) => void;
  onTaskDrop?: (taskId: string, userId: string, date: Date) => void;
}

// Infinite scroll - always show 21 days (3 weeks) from start
const DAYS_TO_SHOW = 21;

// Configuration des dimensions - colonnes plus larges
const CELL_WIDTH = 110;
const ROW_HEIGHT = 160;
const HOURS_PER_DAY = 8;
const MIN_ITEM_HEIGHT = 38;
const PIXELS_PER_HOUR = 16;

const EVENT_TYPE_COLORS: Record<string, string> = {
  meeting: "#3b82f6", // blue
  milestone: "#f59e0b", // amber
  reminder: "#8b5cf6", // violet
  rendu: "#10b981", // emerald
  // Tender-specific event types
  site_visit: "#f97316", // orange
  deadline: "#ef4444", // red
};

export function TeamPlanningGrid({ onEventClick, onCellClick, onTaskDrop }: TeamPlanningGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [teamColumnCollapsed, setTeamColumnCollapsed] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [showNonAssigned, setShowNonAssigned] = useState(false);
  const [memberFilterOpen, setMemberFilterOpen] = useState(false);
  const [projectFilterOpen, setProjectFilterOpen] = useState(false);
  const [teamFilterOpen, setTeamFilterOpen] = useState(false);
  
  // Time entry dialog state (add)
  const [timeEntryDialogOpen, setTimeEntryDialogOpen] = useState(false);
  const [selectedCellDate, setSelectedCellDate] = useState<Date | null>(null);
  const [selectedCellMember, setSelectedCellMember] = useState<TeamMember | null>(null);
  
  // Time entry edit dialog state
  const [editTimeEntryDialogOpen, setEditTimeEntryDialogOpen] = useState(false);
  const [selectedTimeEntry, setSelectedTimeEntry] = useState<TeamTimeEntry | null>(null);
  
  const { schedules, isLoading: schedulesLoading, createSchedule, deleteSchedule, updateSchedule } = useTaskSchedules();
  const { data: members, isLoading: membersLoading } = useTeamMembers();
  const { data: events, isLoading: eventsLoading } = useWorkspaceEvents();
  const { data: userProjectsMap, isLoading: projectMembersLoading } = useAllProjectMembers();
  const { data: absences, isLoading: absencesLoading } = useTeamAbsences({ status: "approved" });
  const { data: timeEntries, isLoading: timeEntriesLoading } = useTeamTimeEntries();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { teams, userTeamsMap } = useTeams();
  const updateTimeEntry = useUpdateTimeEntry();

  const isLoading = schedulesLoading || membersLoading || eventsLoading || projectMembersLoading || absencesLoading || timeEntriesLoading || projectsLoading;

  // Handler pour voir les détails d'une tâche
  const handleViewTask = useCallback((schedule: TaskSchedule) => {
    if (schedule.task) {
      setSelectedTask(schedule.task as Task);
      setTaskSheetOpen(true);
    }
  }, []);

  // Handler pour déplanifier une tâche
  const handleUnschedule = useCallback((scheduleId: string) => {
    deleteSchedule.mutate(scheduleId);
  }, [deleteSchedule]);

  // Handler pour voir/éditer un temps manuel
  const handleViewTimeEntry = useCallback((entry: TeamTimeEntry) => {
    setSelectedTimeEntry(entry);
    setEditTimeEntryDialogOpen(true);
  }, []);

  // Handler pour démarrer le drag d'une tâche planifiée
  const handleScheduleDragStart = useCallback((e: React.DragEvent, scheduleId: string, taskTitle: string) => {
    const payload = JSON.stringify({ scheduleId });
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  // Map des emails vers user_ids
  const emailToUserMap = useMemo(() => {
    const map = new Map<string, string>();
    members?.forEach(m => {
      if (m.profile?.email) {
        map.set(m.profile.email.toLowerCase(), m.user_id);
      }
    });
    return map;
  }, [members]);

  // Calculer les jours à afficher - toujours 21 jours (scroll infini)
  const days = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(start, i));
  }, [currentDate]);

  // Get project member user IDs for filtering
  const projectAssignedUserIds = useMemo(() => {
    if (selectedProjectIds.size === 0) return null;
    
    const userIds = new Set<string>();
    userProjectsMap?.forEach((projectIds, userId) => {
      for (const projectId of selectedProjectIds) {
        if (projectIds.has(projectId)) {
          userIds.add(userId);
          break;
        }
      }
    });
    return userIds;
  }, [selectedProjectIds, userProjectsMap]);

  // Filter members based on selection (member filter, team filter, project assignment)
  const filteredMembers = useMemo(() => {
    let result = members || [];
    
    // If member filter is active, use ONLY those members (bypass project filter for selected members)
    if (selectedMemberIds.size > 0) {
      result = result.filter(m => selectedMemberIds.has(m.user_id));
      return result;
    }
    
    // Filter by selected teams
    if (selectedTeamIds.size > 0) {
      result = result.filter(m => {
        const memberTeams = userTeamsMap.get(m.user_id);
        if (!memberTeams) return false;
        for (const teamId of selectedTeamIds) {
          if (memberTeams.has(teamId)) return true;
        }
        return false;
      });
    }
    
    // Filter by project assignment when project filter is active (unless showNonAssigned is true)
    if (selectedProjectIds.size > 0 && !showNonAssigned && projectAssignedUserIds) {
      result = result.filter(m => projectAssignedUserIds.has(m.user_id));
    }
    
    return result;
  }, [members, selectedMemberIds, selectedTeamIds, userTeamsMap, selectedProjectIds, showNonAssigned, projectAssignedUserIds]);

  // Count of hidden non-assigned members
  const hiddenNonAssignedCount = useMemo(() => {
    if (selectedProjectIds.size === 0 || showNonAssigned || !projectAssignedUserIds) return 0;
    
    let baseMembers = members || [];
    
    // Apply member filter if any
    if (selectedMemberIds.size > 0) {
      baseMembers = baseMembers.filter(m => selectedMemberIds.has(m.user_id));
    }
    
    // Apply team filter if any
    if (selectedTeamIds.size > 0) {
      baseMembers = baseMembers.filter(m => {
        const memberTeams = userTeamsMap.get(m.user_id);
        if (!memberTeams) return false;
        for (const teamId of selectedTeamIds) {
          if (memberTeams.has(teamId)) return true;
        }
        return false;
      });
    }
    
    return baseMembers.filter(m => !projectAssignedUserIds.has(m.user_id)).length;
  }, [members, selectedMemberIds, selectedTeamIds, userTeamsMap, selectedProjectIds, showNonAssigned, projectAssignedUserIds]);

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

  const toggleProjectFilter = useCallback((projectId: string) => {
    setSelectedProjectIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
    // Reset showNonAssigned when changing project filter
    setShowNonAssigned(false);
  }, []);

  const clearProjectFilter = useCallback(() => {
    setSelectedProjectIds(new Set());
    setShowNonAssigned(false);
  }, []);

  const toggleTeamFilter = useCallback((teamId: string) => {
    setSelectedTeamIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  }, []);

  const clearTeamFilter = useCallback(() => {
    setSelectedTeamIds(new Set());
  }, []);

  // Grouper les jours par mois
  const monthGroups = useMemo(() => {
    const groups: { month: string; year: number; days: Date[] }[] = [];
    let currentGroup: { month: string; year: number; days: Date[] } | null = null;

    days.forEach(day => {
      const monthKey = format(day, "MMMM", { locale: fr });
      const year = day.getFullYear();
      if (!currentGroup || currentGroup.month !== monthKey || currentGroup.year !== year) {
        currentGroup = { month: monthKey, year, days: [] };
        groups.push(currentGroup);
      }
      currentGroup.days.push(day);
    });

    return groups;
  }, [days]);

  const navigate = (direction: "prev" | "next") => {
    setCurrentDate(prev => direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  // Récupérer les items (tâches + événements + absences) pour un membre et un jour
  const getItemsForMemberAndDay = useCallback((memberId: string, memberEmail: string | null, day: Date): PlanningItem[] => {
    const items: PlanningItem[] = [];
    const dayStart = startOfDay(day);
    const dayEnd = addDays(dayStart, 1);

    // Ajouter les absences
    absences?.forEach(absence => {
      if (absence.user_id !== memberId) return;
      
      const absenceStart = parseISO(absence.start_date);
      const absenceEnd = parseISO(absence.end_date);
      
      if (absenceStart <= day && absenceEnd >= day) {
        items.push({
          id: absence.id,
          type: "absence",
          title: absenceTypeLabels[absence.absence_type] || "Absence",
          start: absenceStart,
          end: absenceEnd,
          color: "#9ca3af", // gray
          durationHours: 8,
          originalData: absence,
        });
      }
    });

    // Ajouter les tâches planifiées
    schedules?.forEach(schedule => {
      if (schedule.user_id !== memberId) return;
      
      // Filter by project if any project is selected
      if (selectedProjectIds.size > 0) {
        const taskProjectId = schedule.task?.project_id || schedule.task?.project?.id;
        if (!taskProjectId || !selectedProjectIds.has(taskProjectId)) return;
      }
      
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

    // Ajouter les événements (si activés)
    if (showEvents && events) {
      // Get project IDs the member is assigned to
      const memberProjectIds = userProjectsMap?.get(memberId) || new Set<string>();

      events.forEach(event => {
        // Check if member is in attendees (works for both project and tender events)
        const isAttendee = event.attendees?.some(a => 
          (memberEmail && a.email?.toLowerCase() === memberEmail.toLowerCase()) ||
          a.user_id === memberId
        );
        
        // For project events, also check project assignment
        const isAssignedToProject = event.source === "project" && 
          (event as WorkspaceEvent).project_id && 
          memberProjectIds.has((event as WorkspaceEvent).project_id);
        
        if (!isAttendee && !isAssignedToProject) return;

        const eventStart = new Date(event.start_datetime);
        const eventEnd = event.end_datetime ? new Date(event.end_datetime) : addDays(eventStart, 0);
        
        if (eventStart < dayEnd && eventEnd > dayStart) {
          const durationMs = eventEnd.getTime() - eventStart.getTime();
          const durationHours = Math.max(1, Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10);
          
          // Determine display name based on event source
          const displayName = event.source === "project" 
            ? (event as WorkspaceEvent).project?.name
            : (event as TenderWorkspaceEvent).tender?.title;
          
          const displayColor = event.source === "project"
            ? (event as WorkspaceEvent).project?.color
            : undefined; // Tender events use event type color
          
          items.push({
            id: event.id,
            type: "event",
            title: event.title,
            start: eventStart,
            end: eventEnd,
            color: EVENT_TYPE_COLORS[event.event_type] || "#6366f1",
            projectName: displayName,
            projectColor: displayColor || undefined,
            eventType: event.event_type,
            durationHours,
            originalData: event,
          });
        }
      });
    }

    // Ajouter les temps manuels
    timeEntries?.forEach(entry => {
      if (entry.user_id !== memberId) return;
      
      const entryDate = parseISO(entry.date);
      
      if (isSameDay(entryDate, day)) {
        const durationHours = entry.duration_minutes / 60;
        // Use 9h as default start time for display
        const entryStart = setHours(startOfDay(entryDate), 9);
        const entryEnd = new Date(entryStart.getTime() + entry.duration_minutes * 60 * 1000);
        
        items.push({
          id: entry.id,
          type: "timeEntry",
          title: entry.description || entry.task?.title || entry.project?.name || "Temps manuel",
          start: entryStart,
          end: entryEnd,
          color: entry.is_billable ? "#10b981" : "#6b7280", // emerald for billable, gray for non-billable
          projectName: entry.project?.name,
          durationHours,
          isBillable: entry.is_billable,
          originalData: entry,
        });
      }
    });

    return items.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [schedules, events, showEvents, userProjectsMap, absences, timeEntries, selectedProjectIds]);

  const getOccupancyRate = useCallback((memberId: string, memberEmail: string | null, day: Date) => {
    const items = getItemsForMemberAndDay(memberId, memberEmail, day);
    
    let totalMinutes = 0;
    const dayStart = startOfDay(day);
    const dayEnd = addDays(dayStart, 1);
    
    items.forEach(item => {
      const effectiveStart = item.start < dayStart ? dayStart : item.start;
      const effectiveEnd = item.end && item.end > dayEnd ? dayEnd : (item.end || dayEnd);
      totalMinutes += Math.max(0, differenceInMinutes(effectiveEnd, effectiveStart));
    });
    
    const maxMinutes = HOURS_PER_DAY * 60;
    return Math.min(100, Math.round((totalMinutes / maxMinutes) * 100));
  }, [getItemsForMemberAndDay]);

  // Handler pour déplacer une tâche planifiée
  const handleMoveSchedule = useCallback((scheduleId: string, newUserId: string, newDay: Date) => {
    const schedule = schedules?.find(s => s.id === scheduleId);
    if (!schedule) return;
    
    const oldStart = new Date(schedule.start_datetime);
    const oldEnd = new Date(schedule.end_datetime);
    const durationMs = oldEnd.getTime() - oldStart.getTime();
    
    // Garder la même heure de début
    const newStart = setHours(startOfDay(newDay), oldStart.getHours());
    newStart.setMinutes(oldStart.getMinutes());
    const newEnd = new Date(newStart.getTime() + durationMs);
    
    updateSchedule.mutate({
      id: scheduleId,
      user_id: newUserId,
      start_datetime: newStart.toISOString(),
      end_datetime: newEnd.toISOString(),
    });
  }, [schedules, updateSchedule]);

  // Handler pour redimensionner une tâche planifiée (modifier la durée)
  const handleResizeSchedule = useCallback((scheduleId: string, newDurationHours: number) => {
    const schedule = schedules?.find(s => s.id === scheduleId);
    if (!schedule) return;
    
    const oldStart = new Date(schedule.start_datetime);
    const newEnd = new Date(oldStart.getTime() + newDurationHours * 60 * 60 * 1000);
    
    updateSchedule.mutate({
      id: scheduleId,
      end_datetime: newEnd.toISOString(),
    });
  }, [schedules, updateSchedule]);

  // Handler pour redimensionner un temps manuel
  const handleResizeTimeEntry = useCallback((entryId: string, newDurationMinutes: number) => {
    updateTimeEntry.mutate({
      id: entryId,
      duration_minutes: newDurationMinutes,
    });
  }, [updateTimeEntry]);

  // Gestion du drag & drop
  const handleDragOver = useCallback((e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCell(cellKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCell(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, day: Date, member: TeamMember) => {
    e.preventDefault();
    setDragOverCell(null);
    
    try {
      const dataString =
        e.dataTransfer.getData("application/json") ||
        e.dataTransfer.getData("text/plain");
      if (!dataString) return;

      const data = JSON.parse(dataString);
      
      // Check if this is a scheduled task being moved
      if (data.scheduleId) {
        handleMoveSchedule(data.scheduleId, member.user_id, day);
        return;
      }
      
      // Otherwise it's a new task being scheduled
      const task = data;
      const estimatedHours = task.estimated_hours || 2;
      
      const startDate = setHours(startOfDay(day), 9);
      const endDate = new Date(startDate.getTime() + estimatedHours * 60 * 60 * 1000);
      
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
  }, [createSchedule, onTaskDrop, handleMoveSchedule]);

  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="w-60 border-r p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
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
      {/* Header avec navigation */}
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
          {/* Filtre par membre - Dropdown multiselect */}
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
                  <CommandGroup heading={selectedProjectIds.size > 0 ? "Ajouter des membres" : undefined}>
                    {members?.map(member => {
                      const isAssignedToProject = selectedProjectIds.size > 0 && projectAssignedUserIds?.has(member.user_id);
                      return (
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
                          <span className="text-sm truncate flex-1">{member.profile?.full_name || "Sans nom"}</span>
                          {isAssignedToProject && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                              projet
                            </Badge>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  {selectedMemberIds.size > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem onSelect={clearMemberFilter} className="justify-center text-center text-muted-foreground">
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

          {/* Filtre par équipe - Dropdown multiselect */}
          <Popover open={teamFilterOpen} onOpenChange={setTeamFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <UsersRound className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Équipes</span>
                {selectedTeamIds.size > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {selectedTeamIds.size}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <Command>
                <CommandInput placeholder="Rechercher une équipe..." />
                <CommandList>
                  <CommandEmpty>Aucune équipe trouvée</CommandEmpty>
                  <CommandGroup>
                    {teams.map(team => (
                      <CommandItem
                        key={team.id}
                        onSelect={() => toggleTeamFilter(team.id)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border",
                          selectedTeamIds.has(team.id)
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        )}>
                          {selectedTeamIds.has(team.id) && <Check className="h-3 w-3" />}
                        </div>
                        <div 
                          className="h-3 w-3 rounded-full shrink-0" 
                          style={{ backgroundColor: team.color || "#6366f1" }}
                        />
                        <span className="text-sm truncate">{team.name}</span>
                        <Badge variant="outline" className="ml-auto text-[10px]">
                          {team.members?.length || 0}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {selectedTeamIds.size > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem onSelect={clearTeamFilter} className="justify-center text-center text-muted-foreground">
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

          {/* Filtre par projet - Dropdown multiselect */}
          <Popover open={projectFilterOpen} onOpenChange={setProjectFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <FolderKanban className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Projets</span>
                {selectedProjectIds.size > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {selectedProjectIds.size}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end">
              <Command>
                <CommandInput placeholder="Rechercher un projet..." />
                <CommandList>
                  <CommandEmpty>Aucun projet trouvé</CommandEmpty>
                  <CommandGroup>
                    {projects?.map(project => (
                      <CommandItem
                        key={project.id}
                        onSelect={() => toggleProjectFilter(project.id)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border",
                          selectedProjectIds.has(project.id)
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        )}>
                          {selectedProjectIds.has(project.id) && <Check className="h-3 w-3" />}
                        </div>
                        <div 
                          className="h-3 w-3 rounded-full shrink-0" 
                          style={{ backgroundColor: project.color || "#6366f1" }}
                        />
                        <span className="text-sm truncate">{project.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {selectedProjectIds.size > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem onSelect={clearProjectFilter} className="justify-center text-center text-muted-foreground">
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

          <div className="h-6 w-px bg-border" />

          {/* Toggle événements */}
          <div className="flex items-center gap-2">
            <Switch
              id="show-events"
              checked={showEvents}
              onCheckedChange={setShowEvents}
            />
            <Label htmlFor="show-events" className="text-xs flex items-center gap-1.5 cursor-pointer">
              <Calendar className="h-3.5 w-3.5" />
              Événements
            </Label>
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b bg-muted/20 text-xs flex-wrap">
        <span className="text-muted-foreground font-medium">Légende :</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#6366f1" }} />
          <span className="text-muted-foreground">Tâche planifiée</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#10b981" }} />
          <span className="text-muted-foreground">Temps (facturable)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#6b7280" }} />
          <span className="text-muted-foreground">Temps (interne)</span>
        </div>
        {showEvents && (
          <>
            <div className="w-px h-3 bg-border mx-1" />
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: EVENT_TYPE_COLORS.meeting }} />
              <span className="text-muted-foreground">Réunion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: EVENT_TYPE_COLORS.milestone }} />
              <span className="text-muted-foreground">Jalon</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: EVENT_TYPE_COLORS.rendu }} />
              <span className="text-muted-foreground">Rendu</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/40" />
          <span className="text-muted-foreground">Absence</span>
        </div>
      </div>

      {/* Grille principale */}
      <div className="flex-1 overflow-hidden flex">
        {/* Colonne des membres (fixe) + grille synchronisée */}
        <div className="flex flex-1 overflow-hidden">
          {/* Colonne des membres (fixe) */}
          <div className={`flex-shrink-0 ${teamColumnCollapsed ? 'w-16' : 'w-60'} border-r bg-card/30 flex flex-col transition-all duration-200`}>
            {/* Header aligné */}
            <div className="h-[72px] border-b flex items-center justify-between px-2 shrink-0">
              {!teamColumnCollapsed ? (
                <div className="flex flex-col gap-1 px-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Équipe</span>
                    <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
                      {filteredMembers.length}{(selectedMemberIds.size > 0 || selectedTeamIds.size > 0) ? `/${members?.length || 0}` : ''}
                    </span>
                  </div>
                  {/* Show non-assigned button when project filter is active */}
                  {selectedProjectIds.size > 0 && hiddenNonAssignedCount > 0 && !showNonAssigned && (
                    <button
                      onClick={() => setShowNonAssigned(true)}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline"
                    >
                      + {hiddenNonAssignedCount} non assigné{hiddenNonAssignedCount > 1 ? 's' : ''}
                    </button>
                  )}
                  {showNonAssigned && selectedProjectIds.size > 0 && (
                    <button
                      onClick={() => setShowNonAssigned(false)}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline"
                    >
                      Masquer non assignés
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
                    {filteredMembers.length}
                  </span>
                </div>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 shrink-0"
                onClick={() => setTeamColumnCollapsed(!teamColumnCollapsed)}
                title={teamColumnCollapsed ? "Développer" : "Réduire"}
              >
                {teamColumnCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Liste des membres - overflow hidden, sync via same container */}
            <div className="flex-1 overflow-hidden">
              <div id="members-scroll-content">
                {filteredMembers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {teamColumnCollapsed ? '' : 'Aucun membre'}
                  </div>
                ) : (
                  filteredMembers.map(member => (
                    <div
                      key={member.user_id}
                      className={`flex items-center border-b hover:bg-muted/30 transition-colors ${teamColumnCollapsed ? 'justify-center px-2' : 'px-4 gap-3'}`}
                      style={{ height: ROW_HEIGHT }}
                    >
                      <Avatar className={`${teamColumnCollapsed ? 'h-10 w-10' : 'h-11 w-11'} ring-2 ring-background shadow-md shrink-0`}>
                        <AvatarImage src={member.profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-medium">
                          {(member.profile?.full_name || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {!teamColumnCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {member.profile?.full_name || "Membre"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {member.profile?.job_title || member.role}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Grille des jours (scrollable) */}
          <ScrollArea 
            className="flex-1"
            onScrollCapture={(e) => {
              // Sync vertical scroll with members column
              const scrollTop = (e.target as HTMLElement).scrollTop;
              const membersContent = document.getElementById('members-scroll-content');
              if (membersContent) {
                membersContent.style.transform = `translateY(-${scrollTop}px)`;
              }
            }}
          >
            <div className="min-w-max">
              {/* Header des mois et jours */}
              <div className="sticky top-0 bg-background z-10 border-b">
                {/* Ligne des mois */}
                <div className="flex h-9 border-b">
                  {monthGroups.map((group, idx) => (
                    <div
                      key={`${group.month}-${group.year}-${idx}`}
                      className="flex items-center justify-center text-xs font-semibold capitalize bg-muted/30"
                      style={{ width: group.days.length * CELL_WIDTH }}
                    >
                      {group.month} {group.year}
                    </div>
                  ))}
                </div>
                
                {/* Ligne des jours */}
                <div className="flex h-9">
                  {days.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    const weekend = isWeekend(day);
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "flex items-center justify-center gap-1.5 border-r text-xs transition-colors",
                          weekend && "bg-muted/40",
                          isToday && "bg-primary/10"
                        )}
                        style={{ width: CELL_WIDTH }}
                      >
                        <span className={cn(
                          "uppercase text-[11px]",
                          weekend ? "text-muted-foreground" : "text-muted-foreground"
                        )}>
                          {format(day, "EEE", { locale: fr }).slice(0, 3)}
                        </span>
                        <span className={cn(
                          "font-semibold text-sm",
                          isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        )}>
                          {format(day, "d")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                {filteredMembers.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                    {selectedMemberIds.size > 0 ? 'Aucun membre sélectionné' : 'Ajoutez des membres à votre équipe pour voir le planning'}
                  </div>
                ) : (
                  filteredMembers.map(member => (
                    <MemberRow
                      key={member.user_id}
                      member={member}
                      days={days}
                      getItemsForMemberAndDay={getItemsForMemberAndDay}
                      getOccupancyRate={getOccupancyRate}
                      onEventClick={onEventClick}
                      onCellClick={(date, member) => {
                        setSelectedCellDate(date);
                        setSelectedCellMember(member);
                        setTimeEntryDialogOpen(true);
                        onCellClick?.(date, member);
                      }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      dragOverCell={dragOverCell}
                      cellWidth={CELL_WIDTH}
                      rowHeight={ROW_HEIGHT}
                      onViewTask={handleViewTask}
                      onUnschedule={handleUnschedule}
                      onScheduleDragStart={handleScheduleDragStart}
                      onResizeSchedule={handleResizeSchedule}
                      onResizeTimeEntry={handleResizeTimeEntry}
                      onViewTimeEntry={handleViewTimeEntry}
                    />
                  ))
                )}
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        task={selectedTask}
        open={taskSheetOpen}
        onOpenChange={setTaskSheetOpen}
      />

      {/* Add Time Entry Dialog */}
      <AddTimeEntryDialog
        open={timeEntryDialogOpen}
        onOpenChange={setTimeEntryDialogOpen}
        date={selectedCellDate}
        member={selectedCellMember}
      />

      {/* Edit Time Entry Dialog */}
      <EditTimeEntryDialog
        open={editTimeEntryDialogOpen}
        onOpenChange={setEditTimeEntryDialogOpen}
        entry={selectedTimeEntry}
      />
    </div>
  );
}

interface MemberRowProps {
  member: TeamMember;
  days: Date[];
  getItemsForMemberAndDay: (memberId: string, memberEmail: string | null, day: Date) => PlanningItem[];
  getOccupancyRate: (memberId: string, memberEmail: string | null, day: Date) => number;
  onEventClick?: (schedule: TaskSchedule) => void;
  onCellClick?: (date: Date, member: TeamMember) => void;
  onDragOver: (e: React.DragEvent, cellKey: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, day: Date, member: TeamMember) => void;
  dragOverCell: string | null;
  cellWidth: number;
  rowHeight: number;
  onViewTask: (schedule: TaskSchedule) => void;
  onUnschedule: (scheduleId: string) => void;
  onScheduleDragStart: (e: React.DragEvent, scheduleId: string, taskTitle: string) => void;
  onResizeSchedule: (scheduleId: string, newDurationHours: number) => void;
  onResizeTimeEntry: (entryId: string, newDurationMinutes: number) => void;
  onViewTimeEntry: (entry: TeamTimeEntry) => void;
}

function MemberRow({
  member,
  days,
  getItemsForMemberAndDay,
  getOccupancyRate,
  onEventClick,
  onCellClick,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverCell,
  cellWidth,
  rowHeight,
  onViewTask,
  onUnschedule,
  onScheduleDragStart,
  onResizeSchedule,
  onResizeTimeEntry,
  onViewTimeEntry,
}: MemberRowProps) {
  const memberEmail = member.profile?.email || null;
  
  return (
    <div className="flex border-b" style={{ height: rowHeight }}>
      {days.map(day => {
        const cellKey = `${member.user_id}-${day.toISOString()}`;
        const items = getItemsForMemberAndDay(member.user_id, memberEmail, day);
        const occupancy = getOccupancyRate(member.user_id, memberEmail, day);
        const isToday = isSameDay(day, new Date());
        const weekend = isWeekend(day);
        const isDragOver = dragOverCell === cellKey;
        
        return (
          <DayCell
            key={cellKey}
            cellKey={cellKey}
            day={day}
            member={member}
            items={items}
            occupancy={occupancy}
            isToday={isToday}
            isWeekend={weekend}
            isDragOver={isDragOver}
            onEventClick={onEventClick}
            onCellClick={onCellClick}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            cellWidth={cellWidth}
            onViewTask={onViewTask}
            onUnschedule={onUnschedule}
            onScheduleDragStart={onScheduleDragStart}
            onResizeSchedule={onResizeSchedule}
            onResizeTimeEntry={onResizeTimeEntry}
            onViewTimeEntry={onViewTimeEntry}
          />
        );
      })}
    </div>
  );
}

interface DayCellProps {
  cellKey: string;
  day: Date;
  member: TeamMember;
  items: PlanningItem[];
  occupancy: number;
  isToday: boolean;
  isWeekend: boolean;
  isDragOver: boolean;
  onEventClick?: (schedule: TaskSchedule) => void;
  onCellClick?: (date: Date, member: TeamMember) => void;
  onDragOver: (e: React.DragEvent, cellKey: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, day: Date, member: TeamMember) => void;
  cellWidth: number;
  onViewTask: (schedule: TaskSchedule) => void;
  onUnschedule: (scheduleId: string) => void;
  onScheduleDragStart: (e: React.DragEvent, scheduleId: string, taskTitle: string) => void;
  onResizeSchedule: (scheduleId: string, newDurationHours: number) => void;
  onResizeTimeEntry: (entryId: string, newDurationMinutes: number) => void;
  onViewTimeEntry: (entry: TeamTimeEntry) => void;
}

function DayCell({
  cellKey,
  day,
  member,
  items,
  occupancy,
  isToday,
  isWeekend,
  isDragOver,
  onEventClick,
  onCellClick,
  onDragOver,
  onDragLeave,
  onDrop,
  cellWidth,
  onViewTask,
  onUnschedule,
  onScheduleDragStart,
  onResizeSchedule,
  onResizeTimeEntry,
  onViewTimeEntry,
}: DayCellProps) {
  const getOccupancyColor = (rate: number) => {
    if (rate === 0) return "";
    if (rate < 50) return "text-amber-600 dark:text-amber-400";
    if (rate < 80) return "text-blue-600 dark:text-blue-400";
    if (rate <= 100) return "text-emerald-600 dark:text-emerald-400";
    return "text-red-600 dark:text-red-400";
  };

  const getOccupancyBg = (rate: number) => {
    if (rate === 0) return "";
    if (rate < 50) return "bg-amber-50 dark:bg-amber-950/20";
    if (rate < 80) return "bg-blue-50 dark:bg-blue-950/20";
    if (rate <= 100) return "bg-emerald-50 dark:bg-emerald-950/20";
    return "bg-red-50 dark:bg-red-950/20";
  };

  // Handler for cell background click (add time entry)
  const handleCellBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only trigger if clicking the cell background directly, not items
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-cell-background]')) {
      onCellClick?.(day, member);
    }
  }, [day, member, onCellClick]);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "relative border-r p-1 flex flex-col transition-all duration-200 ease-out",
          isWeekend && "bg-muted/20",
          isToday && "bg-primary/5 ring-1 ring-inset ring-primary/20",
          occupancy > 0 && getOccupancyBg(occupancy),
          isDragOver && "bg-primary/15 ring-2 ring-inset ring-primary/50 shadow-lg scale-[1.02]"
        )}
        style={{ width: cellWidth }}
        onDragOver={(e) => onDragOver(e, cellKey)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, day, member)}
      >
        {/* Items planifiés avec hauteur proportionnelle et resize */}
        <div className="flex-1 space-y-0.5 overflow-hidden">
          {items.slice(0, 5).map(item => (
            <ResizablePlanningItem
              key={item.id}
              item={item}
              minHeight={MIN_ITEM_HEIGHT}
              maxHeight={ROW_HEIGHT - 40}
              pixelsPerHour={PIXELS_PER_HOUR}
              onViewTask={onViewTask}
              onUnschedule={onUnschedule}
              onScheduleDragStart={onScheduleDragStart}
              onResize={onResizeSchedule}
              onResizeTimeEntry={onResizeTimeEntry}
              onViewTimeEntry={onViewTimeEntry}
            />
          ))}
          {items.length > 5 && (
            <div className="text-[10px] text-muted-foreground text-center font-medium bg-muted/50 rounded px-1 py-0.5">
              +{items.length - 5} autres
            </div>
          )}
        </div>

        {/* Clickable background zone for adding time entry */}
        <div 
          data-cell-background
          className="absolute inset-0 cursor-pointer hover:bg-accent/30 transition-colors -z-0"
          onClick={handleCellBackgroundClick}
        />

        {/* Indicateur de drop zone */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-pulse z-20">
            <div className="text-xs font-medium text-primary bg-background/95 rounded-lg px-3 py-1.5 shadow-lg border border-primary/20">
              Déposer ici
            </div>
          </div>
        )}

        {/* Taux d'occupation */}
        {occupancy > 0 && !isDragOver && (
          <div className={cn(
            "text-[10px] font-semibold text-center mt-auto opacity-80 pointer-events-none z-10",
            getOccupancyColor(occupancy)
          )}>
            {occupancy}%
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
