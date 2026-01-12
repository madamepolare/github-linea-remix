import { useState, useCallback, useMemo } from "react";
import { format, addMinutes, startOfDay, setHours, setMinutes, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PlanningItem } from "./ResizablePlanningItem";
import { TaskSchedule, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { TeamMember } from "@/hooks/useTeamMembers";
import { Calendar, Clock, Users, GripVertical, Plus, Trash2, Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

// Constants for the timeline
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const TOTAL_HOURS = DAY_END_HOUR - DAY_START_HOUR;
const MINUTES_PER_SLOT = 15; // 15-minute slots
const PIXELS_PER_MINUTE = 1.5;

interface TimelineItemProps {
  item: PlanningItem;
  dayStart: Date;
  onViewTask: (schedule: TaskSchedule) => void;
  onUnschedule: (scheduleId: string) => void;
  onDragStart: (e: React.DragEvent, item: PlanningItem) => void;
  onViewEvent?: (event: any) => void;
  onViewTimeEntry?: (entry: any) => void;
  containerHeight: number;
}

function TimelineItem({
  item,
  dayStart,
  onViewTask,
  onUnschedule,
  onDragStart,
  onViewEvent,
  onViewTimeEntry,
  containerHeight,
}: TimelineItemProps) {
  const schedule = item.type === "task" ? (item.originalData as TaskSchedule) : null;
  const isAbsence = item.type === "absence";
  const isTimeEntry = item.type === "timeEntry";

  // Calculate position and height based on time
  const dayStartMinutes = DAY_START_HOUR * 60;
  const dayEndMinutes = DAY_END_HOUR * 60;
  const totalDayMinutes = dayEndMinutes - dayStartMinutes;

  const itemStartMinutes = item.start.getHours() * 60 + item.start.getMinutes();
  const itemEndMinutes = item.end 
    ? item.end.getHours() * 60 + item.end.getMinutes()
    : itemStartMinutes + 60;

  // Clamp to day boundaries
  const clampedStart = Math.max(dayStartMinutes, Math.min(itemStartMinutes, dayEndMinutes));
  const clampedEnd = Math.max(dayStartMinutes, Math.min(itemEndMinutes, dayEndMinutes));

  const topPercent = ((clampedStart - dayStartMinutes) / totalDayMinutes) * 100;
  const heightPercent = ((clampedEnd - clampedStart) / totalDayMinutes) * 100;

  const startTimeLabel = format(item.start, "HH:mm");
  const endTimeLabel = item.end ? format(item.end, "HH:mm") : "";
  const durationLabel = item.durationHours 
    ? item.durationHours >= 1 
      ? `${Math.round(item.durationHours * 10) / 10}h`
      : `${Math.round(item.durationHours * 60)}m`
    : "";

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === "task" && schedule) {
      onViewTask(schedule);
    } else if (item.type === "event" && onViewEvent) {
      onViewEvent(item.originalData);
    } else if (item.type === "timeEntry" && onViewTimeEntry) {
      onViewTimeEntry(item.originalData);
    }
  }, [item, schedule, onViewTask, onViewEvent, onViewTimeEntry]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "absolute left-1 right-1 rounded-lg overflow-hidden transition-all duration-200",
                  "cursor-pointer hover:shadow-lg hover:scale-[1.02] group",
                  item.type === "task" && "cursor-grab active:cursor-grabbing",
                  isAbsence && "opacity-60 cursor-not-allowed"
                )}
                style={{
                  top: `${topPercent}%`,
                  height: `${Math.max(heightPercent, 3)}%`,
                  backgroundColor: item.color,
                  minHeight: 24,
                }}
                draggable={item.type === "task" && !isAbsence}
                onDragStart={(e) => item.type === "task" && onDragStart(e, item)}
                onClick={handleClick}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                
                <div className="p-1.5 flex flex-col h-full text-white relative">
                  {/* Drag handle */}
                  {item.type === "task" && (
                    <GripVertical className="absolute top-1 right-1 h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity" />
                  )}
                  
                  {/* Time label */}
                  <div className="text-[9px] font-medium opacity-80 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {startTimeLabel} - {endTimeLabel}
                  </div>
                  
                  {/* Title */}
                  <div className="text-[11px] font-semibold truncate flex-1">
                    {item.title}
                  </div>
                  
                  {/* Project name if available */}
                  {item.projectName && heightPercent > 8 && (
                    <div className="text-[9px] opacity-70 truncate">
                      {item.projectName}
                    </div>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-1.5">
                  {item.type === "event" && <Calendar className="h-3.5 w-3.5" />}
                  {item.type === "task" && <Clock className="h-3.5 w-3.5" />}
                  {item.type === "absence" && <Users className="h-3.5 w-3.5" />}
                  {item.title}
                </div>
                {item.projectName && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: item.projectColor || "#6366f1" }}
                    />
                    {item.projectName}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {startTimeLabel} - {endTimeLabel}
                  <span className="ml-2 font-medium">({durationLabel})</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ContextMenuTrigger>
      {item.type === "task" && schedule && (
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onViewTask(schedule)}>
            <Eye className="h-4 w-4 mr-2" />
            Voir les détails
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem 
            onClick={() => onUnschedule(schedule.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Déplanifier
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}

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
        {hourSlots.map((hour) => (
          <div
            key={hour}
            className={cn(
              "absolute left-0 right-0 border-t border-border/30 hover:bg-accent/30 transition-colors cursor-pointer",
              dragOverHour === hour && "bg-primary/20"
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
          </div>
        ))}
      </div>

      {/* Items positioned by time */}
      <div 
        className="relative"
        style={{ height: containerHeight }}
      >
        {items.map((item) => (
          <TimelineItem
            key={item.id}
            item={item}
            dayStart={startOfDay(day)}
            onViewTask={onViewTask}
            onUnschedule={onUnschedule}
            onDragStart={handleItemDragStart}
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
