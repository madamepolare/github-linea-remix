import { useState, useMemo, useCallback } from "react";
import { format, addDays, startOfWeek, isSameDay, isWeekend, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, getMonth, getYear, differenceInMinutes, addMinutes, startOfDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, Clock, List, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TaskSchedule, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TeamPlanningGridProps {
  onEventClick?: (schedule: TaskSchedule) => void;
  onCellClick?: (date: Date, member: TeamMember) => void;
}

type ViewMode = "day" | "week" | "month";

const CELL_WIDTH = 48; // pixels per day
const HOURS_PER_DAY = 8; // heures de travail par jour

export function TeamPlanningGrid({ onEventClick, onCellClick }: TeamPlanningGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  
  const { schedules } = useTaskSchedules();
  const { data: members } = useTeamMembers();

  // Calculer les jours à afficher
  const days = useMemo(() => {
    if (viewMode === "day") {
      return [currentDate];
    } else if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    } else {
      // Month view - show a wider range
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      const end = addDays(endOfMonth(currentDate), 14);
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, viewMode]);

  // Grouper les jours par mois pour l'affichage
  const monthGroups = useMemo(() => {
    const groups: { month: string; days: Date[] }[] = [];
    let currentGroup: { month: string; days: Date[] } | null = null;

    days.forEach(day => {
      const monthKey = format(day, "MMMM yyyy", { locale: fr });
      if (!currentGroup || currentGroup.month !== monthKey) {
        currentGroup = { month: monthKey, days: [] };
        groups.push(currentGroup);
      }
      currentGroup.days.push(day);
    });

    return groups;
  }, [days]);

  // Navigation
  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "day") {
      setCurrentDate(prev => direction === "prev" ? addDays(prev, -1) : addDays(prev, 1));
    } else if (viewMode === "week") {
      setCurrentDate(prev => direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1));
    } else {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + (direction === "prev" ? -1 : 1));
        return newDate;
      });
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  // Calculer les schedules pour un membre et un jour
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

  // Calculer le taux d'occupation pour un membre et un jour (en %)
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

  // Vérifier si c'est un jour de congé (placeholder - à connecter avec vraies données)
  const isOffDay = (memberId: string, day: Date) => {
    // À implémenter avec les vraies données d'absences
    return false;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Aujourd'hui
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <span className="ml-4 text-lg font-semibold capitalize">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "day" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("day")}
            >
              Jour
            </Button>
            <Button
              variant={viewMode === "week" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none border-x"
              onClick={() => setViewMode("week")}
            >
              Semaine
            </Button>
            <Button
              variant={viewMode === "month" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("month")}
            >
              Mois
            </Button>
          </div>
        </div>
      </div>

      {/* Grille principale */}
      <div className="flex-1 overflow-hidden flex">
        {/* Colonne des membres (fixe) */}
        <div className="flex-shrink-0 w-52 border-r bg-muted/30">
          {/* Header vide pour aligner avec les jours */}
          <div className="h-16 border-b flex items-end justify-center pb-2">
            <span className="text-xs text-muted-foreground font-medium">Équipe</span>
          </div>
          
          {/* Liste des membres */}
          <div className="overflow-y-auto" style={{ height: "calc(100% - 4rem)" }}>
            {(members || []).map(member => (
              <div
                key={member.user_id}
                className="h-24 px-3 flex items-center gap-3 border-b hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-10 w-10 ring-2 ring-background shadow">
                  <AvatarImage src={member.profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {(member.profile?.full_name || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {member.profile?.full_name || member.profile?.email || "Membre"}
                  </div>
                  {member.profile?.job_title && (
                    <div className="text-xs text-muted-foreground truncate">
                      {member.profile.job_title}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grille des jours (scrollable) */}
        <ScrollArea className="flex-1">
          <div className="min-w-max">
            {/* Header des mois et jours */}
            <div className="sticky top-0 bg-background z-10 border-b">
              {/* Ligne des mois */}
              <div className="flex h-8">
                {monthGroups.map((group, idx) => (
                  <div
                    key={`${group.month}-${idx}`}
                    className="flex items-center justify-center border-r text-xs font-semibold text-muted-foreground capitalize"
                    style={{ width: group.days.length * CELL_WIDTH }}
                  >
                    {group.month}
                  </div>
                ))}
              </div>
              
              {/* Ligne des jours */}
              <div className="flex h-8">
                {days.map((day, idx) => {
                  const isToday = isSameDay(day, new Date());
                  const weekend = isWeekend(day);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "flex flex-col items-center justify-center border-r text-xs",
                        weekend && "bg-muted/50",
                        isToday && "bg-primary/10"
                      )}
                      style={{ width: CELL_WIDTH }}
                    >
                      <span className={cn(
                        "uppercase",
                        weekend ? "text-muted-foreground" : "text-foreground",
                        isToday && "text-primary font-bold"
                      )}>
                        {format(day, "EEE", { locale: fr }).slice(0, 3)}
                      </span>
                      <span className={cn(
                        "font-semibold",
                        isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
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
              {(members || []).map(member => (
                <MemberRow
                  key={member.user_id}
                  member={member}
                  days={days}
                  getSchedulesForMemberAndDay={getSchedulesForMemberAndDay}
                  getOccupancyRate={getOccupancyRate}
                  onEventClick={onEventClick}
                  onCellClick={onCellClick}
                  cellWidth={CELL_WIDTH}
                />
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}

// Composant pour une ligne de membre
interface MemberRowProps {
  member: TeamMember;
  days: Date[];
  getSchedulesForMemberAndDay: (memberId: string, day: Date) => TaskSchedule[];
  getOccupancyRate: (memberId: string, day: Date) => number;
  onEventClick?: (schedule: TaskSchedule) => void;
  onCellClick?: (date: Date, member: TeamMember) => void;
  cellWidth: number;
}

function MemberRow({
  member,
  days,
  getSchedulesForMemberAndDay,
  getOccupancyRate,
  onEventClick,
  onCellClick,
  cellWidth,
}: MemberRowProps) {
  return (
    <div className="flex h-24 border-b">
      {days.map(day => {
        const schedules = getSchedulesForMemberAndDay(member.user_id, day);
        const occupancy = getOccupancyRate(member.user_id, day);
        const isToday = isSameDay(day, new Date());
        const weekend = isWeekend(day);
        
        return (
          <DayCell
            key={day.toISOString()}
            day={day}
            member={member}
            schedules={schedules}
            occupancy={occupancy}
            isToday={isToday}
            isWeekend={weekend}
            onEventClick={onEventClick}
            onCellClick={onCellClick}
            cellWidth={cellWidth}
          />
        );
      })}
    </div>
  );
}

// Composant pour une cellule jour
interface DayCellProps {
  day: Date;
  member: TeamMember;
  schedules: TaskSchedule[];
  occupancy: number;
  isToday: boolean;
  isWeekend: boolean;
  onEventClick?: (schedule: TaskSchedule) => void;
  onCellClick?: (date: Date, member: TeamMember) => void;
  cellWidth: number;
}

function DayCell({
  day,
  member,
  schedules,
  occupancy,
  isToday,
  isWeekend,
  onEventClick,
  onCellClick,
  cellWidth,
}: DayCellProps) {
  const getOccupancyColor = (rate: number) => {
    if (rate === 0) return "text-muted-foreground";
    if (rate < 50) return "text-yellow-600 dark:text-yellow-400";
    if (rate < 80) return "text-blue-600 dark:text-blue-400";
    if (rate <= 100) return "text-green-600 dark:text-green-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "relative border-r p-1 flex flex-col cursor-pointer hover:bg-muted/30 transition-colors",
          isWeekend && "bg-muted/40",
          isToday && "bg-primary/5 ring-1 ring-inset ring-primary/20"
        )}
        style={{ width: cellWidth }}
        onClick={() => onCellClick?.(day, member)}
      >
        {/* Tâches planifiées */}
        <div className="flex-1 space-y-0.5 overflow-hidden">
          {schedules.slice(0, 3).map(schedule => (
            <Tooltip key={schedule.id}>
              <TooltipTrigger asChild>
                <div
                  className="rounded text-[9px] px-1 py-0.5 truncate cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: schedule.color || schedule.task?.project?.color || "#6366f1",
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
                <div className="text-sm font-medium">{schedule.task?.title}</div>
                {schedule.task?.project?.name && (
                  <div className="text-xs text-muted-foreground">{schedule.task.project.name}</div>
                )}
                <div className="text-xs mt-1">
                  {format(new Date(schedule.start_datetime), "HH:mm")} - {format(new Date(schedule.end_datetime), "HH:mm")}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {schedules.length > 3 && (
            <div className="text-[9px] text-muted-foreground text-center">
              +{schedules.length - 3}
            </div>
          )}
        </div>

        {/* Taux d'occupation */}
        <div className={cn(
          "text-[10px] font-medium text-center mt-auto",
          getOccupancyColor(occupancy)
        )}>
          {occupancy > 0 ? `${occupancy}%` : ""}
        </div>
      </div>
    </TooltipProvider>
  );
}
