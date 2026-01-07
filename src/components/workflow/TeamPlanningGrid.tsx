import { useState, useMemo, useCallback } from "react";
import { format, addDays, startOfWeek, isSameDay, isWeekend, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, differenceInMinutes, startOfDay, setHours } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TaskSchedule, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamPlanningGridProps {
  onEventClick?: (schedule: TaskSchedule) => void;
  onCellClick?: (date: Date, member: TeamMember) => void;
  onTaskDrop?: (taskId: string, userId: string, date: Date) => void;
}

type ViewMode = "week" | "2weeks" | "month";

const CELL_WIDTH = 80; // Plus large
const ROW_HEIGHT = 120; // Plus haut pour plus de tâches
const HOURS_PER_DAY = 8;

export function TeamPlanningGrid({ onEventClick, onCellClick, onTaskDrop }: TeamPlanningGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("2weeks");
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  
  const { schedules, isLoading: schedulesLoading, createSchedule } = useTaskSchedules();
  const { data: members, isLoading: membersLoading } = useTeamMembers();

  const isLoading = schedulesLoading || membersLoading;

  // Calculer les jours à afficher
  const days = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    
    if (viewMode === "week") {
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    } else if (viewMode === "2weeks") {
      return Array.from({ length: 14 }, (_, i) => addDays(start, i));
    } else {
      const monthStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      const monthEnd = addDays(endOfMonth(currentDate), 7);
      return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
  }, [currentDate, viewMode]);

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
    const weeks = viewMode === "week" ? 1 : viewMode === "2weeks" ? 2 : 4;
    setCurrentDate(prev => direction === "prev" ? subWeeks(prev, weeks) : addWeeks(prev, weeks));
  };

  const goToToday = () => setCurrentDate(new Date());

  const getSchedulesForMemberAndDay = useCallback((memberId: string, day: Date) => {
    if (!schedules) return [];
    
    return schedules.filter(schedule => {
      if (schedule.user_id !== memberId) return false;
      
      const scheduleStart = new Date(schedule.start_datetime);
      const scheduleEnd = new Date(schedule.end_datetime);
      const dayStart = startOfDay(day);
      const dayEnd = addDays(dayStart, 1);
      
      return scheduleStart < dayEnd && scheduleEnd > dayStart;
    });
  }, [schedules]);

  const getOccupancyRate = useCallback((memberId: string, day: Date) => {
    const daySchedules = getSchedulesForMemberAndDay(memberId, day);
    
    let totalMinutes = 0;
    daySchedules.forEach(schedule => {
      const start = new Date(schedule.start_datetime);
      const end = new Date(schedule.end_datetime);
      const dayStart = startOfDay(day);
      const dayEnd = addDays(dayStart, 1);
      
      const effectiveStart = start < dayStart ? dayStart : start;
      const effectiveEnd = end > dayEnd ? dayEnd : end;
      
      totalMinutes += Math.max(0, differenceInMinutes(effectiveEnd, effectiveStart));
    });
    
    const maxMinutes = HOURS_PER_DAY * 60;
    return Math.min(100, Math.round((totalMinutes / maxMinutes) * 100));
  }, [getSchedulesForMemberAndDay]);

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
      const taskData = e.dataTransfer.getData("application/json");
      if (!taskData) return;
      
      const task = JSON.parse(taskData);
      const estimatedHours = task.estimated_hours || 2; // Default 2h si pas d'estimation
      
      // Créer le schedule : début à 9h, fin selon estimation
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
  }, [createSchedule, onTaskDrop]);

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

        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            {[
              { key: "week", label: "7 jours" },
              { key: "2weeks", label: "14 jours" },
              { key: "month", label: "Mois" },
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={viewMode === key ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 px-3 text-xs rounded-md",
                  viewMode === key && "shadow-sm"
                )}
                onClick={() => setViewMode(key as ViewMode)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Grille principale */}
      <div className="flex-1 overflow-hidden flex">
        {/* Colonne des membres (fixe) */}
        <div className="flex-shrink-0 w-60 border-r bg-card/30">
          {/* Header aligné */}
          <div className="h-[72px] border-b flex items-center px-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Équipe</span>
              <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
                {members?.length || 0}
              </span>
            </div>
          </div>
          
          {/* Liste des membres */}
          <ScrollArea className="h-[calc(100%-72px)]">
            {(!members || members.length === 0) ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucun membre dans l'équipe
              </div>
            ) : (
              members.map(member => (
                <div
                  key={member.user_id}
                  className="px-4 flex items-center gap-3 border-b hover:bg-muted/30 transition-colors"
                  style={{ height: ROW_HEIGHT }}
                >
                  <Avatar className="h-11 w-11 ring-2 ring-background shadow-md">
                    <AvatarImage src={member.profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-medium">
                      {(member.profile?.full_name || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {member.profile?.full_name || "Membre"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {member.profile?.job_title || member.role}
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Grille des jours (scrollable) */}
        <ScrollArea className="flex-1">
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

            {/* Corps de la grille */}
            <div>
              {(!members || members.length === 0) ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  Ajoutez des membres à votre équipe pour voir le planning
                </div>
              ) : (
                members.map(member => (
                  <MemberRow
                    key={member.user_id}
                    member={member}
                    days={days}
                    getSchedulesForMemberAndDay={getSchedulesForMemberAndDay}
                    getOccupancyRate={getOccupancyRate}
                    onEventClick={onEventClick}
                    onCellClick={onCellClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    dragOverCell={dragOverCell}
                    cellWidth={CELL_WIDTH}
                    rowHeight={ROW_HEIGHT}
                  />
                ))
              )}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}

interface MemberRowProps {
  member: TeamMember;
  days: Date[];
  getSchedulesForMemberAndDay: (memberId: string, day: Date) => TaskSchedule[];
  getOccupancyRate: (memberId: string, day: Date) => number;
  onEventClick?: (schedule: TaskSchedule) => void;
  onCellClick?: (date: Date, member: TeamMember) => void;
  onDragOver: (e: React.DragEvent, cellKey: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, day: Date, member: TeamMember) => void;
  dragOverCell: string | null;
  cellWidth: number;
  rowHeight: number;
}

function MemberRow({
  member,
  days,
  getSchedulesForMemberAndDay,
  getOccupancyRate,
  onEventClick,
  onCellClick,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverCell,
  cellWidth,
  rowHeight,
}: MemberRowProps) {
  return (
    <div className="flex border-b" style={{ height: rowHeight }}>
      {days.map(day => {
        const cellKey = `${member.user_id}-${day.toISOString()}`;
        const schedules = getSchedulesForMemberAndDay(member.user_id, day);
        const occupancy = getOccupancyRate(member.user_id, day);
        const isToday = isSameDay(day, new Date());
        const weekend = isWeekend(day);
        const isDragOver = dragOverCell === cellKey;
        
        return (
          <DayCell
            key={cellKey}
            cellKey={cellKey}
            day={day}
            member={member}
            schedules={schedules}
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
  schedules: TaskSchedule[];
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
}

function DayCell({
  cellKey,
  day,
  member,
  schedules,
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

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "relative border-r p-1.5 flex flex-col cursor-pointer transition-all duration-150",
          "hover:bg-accent/50",
          isWeekend && "bg-muted/30",
          isToday && "bg-primary/5 ring-1 ring-inset ring-primary/30",
          occupancy > 0 && getOccupancyBg(occupancy),
          isDragOver && "bg-primary/20 ring-2 ring-inset ring-primary shadow-inner"
        )}
        style={{ width: cellWidth }}
        onClick={() => onCellClick?.(day, member)}
        onDragOver={(e) => onDragOver(e, cellKey)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, day, member)}
      >
        {/* Tâches planifiées */}
        <div className="flex-1 space-y-1 overflow-hidden">
          {schedules.slice(0, 4).map(schedule => {
            const color = schedule.color || schedule.task?.project?.color || "#6366f1";
            
            return (
              <Tooltip key={schedule.id}>
                <TooltipTrigger asChild>
                  <div
                    className="rounded text-[10px] leading-tight px-1.5 py-1 truncate cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02] transition-all font-medium"
                    style={{
                      backgroundColor: color,
                      color: "white",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(schedule);
                    }}
                  >
                    {schedule.task?.title || "Tâche"}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <div className="font-medium">{schedule.task?.title}</div>
                    {schedule.task?.project?.name && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: schedule.task.project.color || "#6366f1" }}
                        />
                        {schedule.task.project.name}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(schedule.start_datetime), "HH:mm")} - {format(new Date(schedule.end_datetime), "HH:mm")}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
          {schedules.length > 4 && (
            <div className="text-[10px] text-muted-foreground text-center font-medium bg-muted/50 rounded px-1 py-0.5">
              +{schedules.length - 4} autres
            </div>
          )}
        </div>

        {/* Indicateur de drop zone */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-xs font-medium text-primary bg-background/90 rounded px-2 py-1 shadow">
              Déposer ici
            </div>
          </div>
        )}

        {/* Taux d'occupation */}
        {occupancy > 0 && !isDragOver && (
          <div className={cn(
            "text-[11px] font-semibold text-center mt-auto pt-0.5",
            getOccupancyColor(occupancy)
          )}>
            {occupancy}%
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
