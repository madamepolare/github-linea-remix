import { useState, useMemo, useCallback } from "react";
import { format, addDays, startOfWeek, isSameDay, parseISO, subWeeks, addWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, MapPin, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { TaskSchedule, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useWorkspaceEvents } from "@/hooks/useWorkspaceEvents";
import { useTeamAbsences, absenceTypeLabels } from "@/hooks/useTeamAbsences";
import { useAuth } from "@/contexts/AuthContext";

interface MobilePlanningViewProps {
  onEventClick?: (schedule: TaskSchedule) => void;
}

export function MobilePlanningView({ onEventClick }: MobilePlanningViewProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  const { schedules, isLoading: schedulesLoading } = useTaskSchedules();
  const { data: members, isLoading: membersLoading } = useTeamMembers();
  const { data: events, isLoading: eventsLoading } = useWorkspaceEvents();
  const { data: absences } = useTeamAbsences({ status: "approved" });

  const isLoading = schedulesLoading || membersLoading || eventsLoading;

  // Generate days for the week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // Get items for a specific day
  const getItemsForDay = useCallback((day: Date) => {
    const items: Array<{
      id: string;
      type: "task" | "event" | "absence";
      title: string;
      time?: string;
      color: string;
      projectName?: string;
      memberName?: string;
      memberId?: string;
    }> = [];

    // Add scheduled tasks
    schedules?.forEach(schedule => {
      const scheduleStart = new Date(schedule.start_datetime);
      if (isSameDay(scheduleStart, day)) {
        const member = members?.find(m => m.user_id === schedule.user_id);
        items.push({
          id: schedule.id,
          type: "task",
          title: schedule.task?.title || "Tâche",
          time: format(scheduleStart, "HH:mm"),
          color: schedule.task?.project?.color || "#6366f1",
          projectName: schedule.task?.project?.name,
          memberName: member?.profile?.full_name,
          memberId: schedule.user_id,
        });
      }
    });

    // Add events
    events?.forEach(event => {
      const eventStart = new Date(event.start_datetime);
      if (isSameDay(eventStart, day)) {
        const isAllDay = event.source === "project" && (event as any).is_all_day;
        items.push({
          id: event.id,
          type: "event",
          title: event.title,
          time: isAllDay ? "Journée" : format(eventStart, "HH:mm"),
          color: "#3b82f6",
          projectName: event.source === "project" ? (event as any).project?.name : undefined,
        });
      }
    });

    // Add absences
    absences?.forEach(absence => {
      const absenceStart = parseISO(absence.start_date);
      const absenceEnd = parseISO(absence.end_date);
      if (day >= absenceStart && day <= absenceEnd) {
        const member = members?.find(m => m.user_id === absence.user_id);
        items.push({
          id: absence.id,
          type: "absence",
          title: absenceTypeLabels[absence.absence_type] || "Absence",
          color: "#9ca3af",
          memberName: member?.profile?.full_name,
          memberId: absence.user_id,
        });
      }
    });

    return items.sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
  }, [schedules, events, absences, members]);

  const selectedDayItems = useMemo(() => getItemsForDay(selectedDate), [getItemsForDay, selectedDate]);

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeekStart(prev => direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    setSelectedDate(today);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-7 gap-1">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Week Navigation */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-3">
          <Button variant="ghost" size="icon" onClick={() => navigateWeek("prev")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <button 
            onClick={goToToday}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            {format(currentWeekStart, "MMMM yyyy", { locale: fr })}
          </button>
          <Button variant="ghost" size="icon" onClick={() => navigateWeek("next")}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Week Days Strip */}
        <div className="grid grid-cols-7 gap-1 px-2 pb-2">
          {weekDays.map(day => {
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const dayItems = getItemsForDay(day);
            const hasItems = dayItems.length > 0;

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "flex flex-col items-center py-2 rounded-xl transition-all",
                  isSelected 
                    ? "bg-foreground text-background" 
                    : isToday 
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                )}
              >
                <span className="text-[10px] uppercase font-medium opacity-60">
                  {format(day, "EEE", { locale: fr }).slice(0, 3)}
                </span>
                <span className={cn(
                  "text-lg font-semibold",
                  isToday && !isSelected && "text-primary"
                )}>
                  {format(day, "d")}
                </span>
                {hasItems && (
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-0.5",
                    isSelected ? "bg-background" : "bg-primary"
                  )} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Selected Date Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold capitalize">
              {format(selectedDate, "EEEE d MMMM", { locale: fr })}
            </h2>
            <Badge variant="secondary" className="text-xs">
              {selectedDayItems.length} élément{selectedDayItems.length > 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Items List */}
          {selectedDayItems.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Aucun élément"
              description="Rien de planifié pour cette journée"
              className="py-12"
            />
          ) : (
            <div className="space-y-2">
              {selectedDayItems.map(item => (
                <Card 
                  key={item.id} 
                  className={cn(
                    "overflow-hidden transition-all active:scale-[0.98]",
                    item.type === "absence" && "opacity-80"
                  )}
                  style={{ borderLeftColor: item.color, borderLeftWidth: "4px" }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Time or Icon */}
                      <div className="flex-shrink-0 w-12 text-center">
                        {item.time ? (
                          <span className="text-sm font-medium">{item.time}</span>
                        ) : (
                          <Clock className="h-4 w-4 mx-auto text-muted-foreground" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {item.projectName && (
                            <Badge variant="secondary" className="text-[10px] h-5">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {item.projectName}
                            </Badge>
                          )}
                          {item.memberName && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.memberName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Type Badge */}
                      <Badge 
                        variant="outline" 
                        className="text-[10px] shrink-0"
                        style={{ 
                          borderColor: item.color,
                          color: item.color 
                        }}
                      >
                        {item.type === "task" ? "Tâche" : item.type === "event" ? "Événement" : "Absence"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
