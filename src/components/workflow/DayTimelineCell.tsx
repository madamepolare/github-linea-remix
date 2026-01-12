import { useState, useCallback, useMemo } from "react";
import { startOfDay, setHours, setMinutes, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { PlanningItem } from "./ResizablePlanningItem";
import { TaskSchedule, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { TeamMember } from "@/hooks/useTeamMembers";
import { AgendaTimelineItem, DAY_START_HOUR, DAY_END_HOUR, TOTAL_HOURS, PIXELS_PER_MINUTE } from "./AgendaTimelineItem";

// Lunch break configuration
const LUNCH_START_HOUR = 13;
const LUNCH_END_HOUR = 14;

interface DayTimelineCellProps {
  day: Date;
  member: TeamMember;
  items: PlanningItem[];
  isDragOver: boolean;
  isToday: boolean;
  isWeekend: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, hour?: number) => void;
  onViewTask: (schedule: TaskSchedule) => void;
  onUnschedule: (scheduleId: string) => void;
  onCellClick?: (date: Date, hour: number) => void;
  onViewEvent?: (event: any) => void;
  onViewTimeEntry?: (entry: any) => void;
}

export function DayTimelineCell({
  day,
  member,
  items,
  isDragOver,
  isToday,
  isWeekend,
  onDragOver,
  onDragLeave,
  onDrop,
  onViewTask,
  onUnschedule,
  onCellClick,
  onViewEvent,
  onViewTimeEntry,
}: DayTimelineCellProps) {
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const { updateSchedule } = useTaskSchedules();

  // Generate hour slots
  const hourSlots = useMemo(() => {
    const slots: number[] = [];
    for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
      slots.push(h);
    }
    return slots;
  }, []);

  // Handle drop at specific hour
  const handleSlotDrop = useCallback((e: React.DragEvent, hour: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverHour(null);
    
    try {
      const dataString = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
      if (!dataString) return;
      
      const data = JSON.parse(dataString);
      
      // If it's a planned task being moved within the timeline
      if (data.itemId && data.itemType === "task") {
        const newStart = setHours(setMinutes(startOfDay(day), 0), hour);
        const durationMinutes = (data.durationHours || 1) * 60;
        const newEnd = addMinutes(newStart, durationMinutes);
        
        updateSchedule.mutate({
          id: data.scheduleId,
          start_datetime: newStart.toISOString(),
          end_datetime: newEnd.toISOString(),
          user_id: member.user_id,
        });
        return;
      }
      
      // Otherwise pass to parent handler with hour info
      onDrop(e, hour);
    } catch (error) {
      console.error("Error handling timeline drop:", error);
      onDrop(e, hour);
    }
  }, [day, member.user_id, updateSchedule, onDrop]);

  const handleItemDragStart = useCallback((e: React.DragEvent, item: PlanningItem) => {
    const schedule = item.originalData as TaskSchedule;
    const payload = JSON.stringify({
      itemId: item.id,
      itemType: item.type,
      scheduleId: schedule?.id,
      taskId: schedule?.task_id,
      durationHours: item.durationHours,
      title: item.title,
    });
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleSlotClick = useCallback((hour: number) => {
    onCellClick?.(day, hour);
  }, [day, onCellClick]);

  // Handle resize from AgendaTimelineItem
  const handleResize = useCallback((scheduleId: string, newStart: Date, newEnd: Date) => {
    updateSchedule.mutate({
      id: scheduleId,
      start_datetime: newStart.toISOString(),
      end_datetime: newEnd.toISOString(),
    });
  }, [updateSchedule]);

  const containerHeight = TOTAL_HOURS * 60 * PIXELS_PER_MINUTE;

  return (
    <div
      className={cn(
        "relative flex-1 border-r transition-colors",
        isWeekend && "bg-muted/20",
        isToday && "bg-primary/5",
        isDragOver && "bg-primary/10"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDragLeave={onDragLeave}
    >
      {/* Hour grid lines */}
      <div className="absolute inset-0">
        {hourSlots.map((hour) => {
          const isLunchBreak = hour >= LUNCH_START_HOUR && hour < LUNCH_END_HOUR;
          
          return (
            <div
              key={hour}
              className={cn(
                "absolute left-0 right-0 border-t border-border/30 hover:bg-accent/30 transition-colors cursor-pointer",
                dragOverHour === hour && "bg-primary/20",
                isLunchBreak && "bg-muted/40"
              )}
              style={{
                top: `${((hour - DAY_START_HOUR) / TOTAL_HOURS) * 100}%`,
                height: `${(1 / TOTAL_HOURS) * 100}%`,
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverHour(hour);
              }}
              onDragLeave={(e) => {
                e.stopPropagation();
                setDragOverHour(null);
              }}
              onDrop={(e) => handleSlotDrop(e, hour)}
              onClick={() => handleSlotClick(hour)}
            >
              {/* Half-hour line */}
              <div 
                className="absolute left-0 right-0 border-t border-border/10"
                style={{ top: "50%" }}
              />
              {/* Lunch break diagonal pattern indicator */}
              {isLunchBreak && (
                <div 
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, currentColor 4px, currentColor 5px)",
                    color: "var(--muted-foreground)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Items positioned by time */}
      <div 
        className="relative"
        style={{ height: containerHeight }}
      >
        {items.map((item) => (
          <AgendaTimelineItem
            key={item.id}
            item={item}
            dayStart={startOfDay(day)}
            onViewTask={onViewTask}
            onUnschedule={onUnschedule}
            onDragStart={handleItemDragStart}
            onResize={handleResize}
            onViewEvent={onViewEvent}
            onViewTimeEntry={onViewTimeEntry}
            containerHeight={containerHeight}
          />
        ))}
      </div>

      {/* Drop indicator */}
      {dragOverHour !== null && (
        <div
          className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-20"
          style={{
            top: `${((dragOverHour - DAY_START_HOUR) / TOTAL_HOURS) * 100}%`,
            height: `${(1 / TOTAL_HOURS) * 100}%`,
          }}
        >
          <div className="bg-primary/90 text-primary-foreground text-xs px-2 py-0.5 rounded shadow-lg">
            {dragOverHour}:00
          </div>
        </div>
      )}
    </div>
  );
}

// Hour labels sidebar component
export function TimelineHourLabels() {
  const hours = useMemo(() => {
    const slots: number[] = [];
    for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
      slots.push(h);
    }
    return slots;
  }, []);

  return (
    <div 
      className="w-12 border-r bg-muted/30 flex-shrink-0"
      style={{ height: TOTAL_HOURS * 60 * PIXELS_PER_MINUTE }}
    >
      {hours.map((hour) => (
        <div
          key={hour}
          className="relative border-t border-border/30"
          style={{ height: 60 * PIXELS_PER_MINUTE }}
        >
          <span className="absolute -top-2.5 left-1 text-[10px] text-muted-foreground font-medium">
            {hour.toString().padStart(2, "0")}:00
          </span>
        </div>
      ))}
    </div>
  );
}

export { DAY_START_HOUR, DAY_END_HOUR, TOTAL_HOURS, PIXELS_PER_MINUTE };
