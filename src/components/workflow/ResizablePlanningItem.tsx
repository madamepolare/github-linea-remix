import { useState, useCallback, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Users, Eye, Copy, ExternalLink, Move, CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { TaskSchedule } from "@/hooks/useTaskSchedules";

// Types pour les items affichés dans le planning
export type PlanningItem = {
  id: string;
  type: "task" | "event" | "absence";
  title: string;
  start: Date;
  end: Date | null;
  color: string;
  projectName?: string;
  projectColor?: string;
  eventType?: string;
  durationHours?: number;
  originalData: TaskSchedule | any;
};

interface ResizablePlanningItemProps {
  item: PlanningItem;
  minHeight: number;
  maxHeight: number;
  pixelsPerHour: number;
  onViewTask: (schedule: TaskSchedule) => void;
  onUnschedule: (scheduleId: string) => void;
  onScheduleDragStart: (e: React.DragEvent, scheduleId: string, taskTitle: string) => void;
  onResize?: (scheduleId: string, newDurationHours: number) => void;
}

export function ResizablePlanningItem({
  item,
  minHeight,
  maxHeight,
  pixelsPerHour,
  onViewTask,
  onUnschedule,
  onScheduleDragStart,
  onResize,
}: ResizablePlanningItemProps) {
  const schedule = item.type === "task" ? item.originalData as TaskSchedule : null;
  const isAbsence = item.type === "absence";
  
  const hours = item.durationHours || 1;
  const initialHeight = Math.max(minHeight, hours * pixelsPerHour);
  
  const [height, setHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Synchroniser avec la durée externe
  useEffect(() => {
    const newHeight = Math.max(minHeight, hours * pixelsPerHour);
    if (!isResizing) {
      setHeight(newHeight);
    }
  }, [hours, pixelsPerHour, minHeight, isResizing]);
  
  const hoursLabel = hours >= 1 ? `${Math.round(hours * 10) / 10}h` : `${Math.round(hours * 60)}m`;
  const currentHours = Math.max(0.5, Math.round((height / pixelsPerHour) * 2) / 2); // Arrondi à 0.5h
  const currentHoursLabel = currentHours >= 1 ? `${currentHours}h` : `${Math.round(currentHours * 60)}m`;

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (item.type !== "task" || !schedule) return;
    e.stopPropagation();
    e.preventDefault();
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    resizeRef.current = { startY: clientY, startHeight: height };
    setIsResizing(true);
  }, [item.type, schedule, height]);

  const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!resizeRef.current || !isResizing) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = clientY - resizeRef.current.startY;
    const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeRef.current.startHeight + delta));
    setHeight(newHeight);
  }, [isResizing, minHeight, maxHeight]);

  const handleResizeEnd = useCallback(() => {
    if (!isResizing || !schedule) return;
    
    setIsResizing(false);
    resizeRef.current = null;
    
    // Calculer la nouvelle durée (arrondi à 0.5h)
    const newDurationHours = Math.max(0.5, Math.round((height / pixelsPerHour) * 2) / 2);
    
    if (newDurationHours !== hours && onResize) {
      onResize(schedule.id, newDurationHours);
    }
  }, [isResizing, schedule, height, pixelsPerHour, hours, onResize]);

  // Listeners globaux pour le resize
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      window.addEventListener("touchmove", handleResizeMove);
      window.addEventListener("touchend", handleResizeEnd);
      
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
        window.removeEventListener("touchmove", handleResizeMove);
        window.removeEventListener("touchend", handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={containerRef}
              className={cn(
                "rounded text-[11px] leading-tight px-2 py-1.5 shadow-sm hover:shadow-md transition-all font-medium flex flex-col relative group select-none",
                item.type === "event" && "border-l-2",
                isAbsence && "opacity-60 cursor-not-allowed",
                item.type === "task" && "cursor-grab active:cursor-grabbing",
                isResizing && "ring-2 ring-white/50 z-10"
              )}
              style={{
                backgroundColor: item.color,
                color: "white",
                borderLeftColor: item.type === "event" ? "rgba(255,255,255,0.5)" : undefined,
                height: height,
                maxHeight: maxHeight,
              }}
              draggable={item.type === "task" && !isAbsence && !isResizing}
              onDragStart={(e) => {
                if (item.type === "task" && schedule && !isResizing) {
                  e.stopPropagation();
                  onScheduleDragStart(e, schedule.id, item.title);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (item.type === "task" && schedule && !isResizing) {
                  onViewTask(schedule);
                }
              }}
            >
              {/* Badge durée - mis à jour pendant le resize */}
              <div className={cn(
                "absolute -top-1 -right-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold shadow-sm border transition-colors",
                isResizing ? "bg-primary text-primary-foreground border-primary" : "bg-white text-gray-700"
              )}>
                {isResizing ? currentHoursLabel : hoursLabel}
              </div>
              
              {/* Content */}
              <div className="flex items-start gap-1.5 flex-1 min-w-0 overflow-hidden">
                {/* Icon */}
                {item.type === "event" && <Calendar className="h-3 w-3 flex-shrink-0 mt-0.5" />}
                {item.type === "task" && <Clock className="h-3 w-3 flex-shrink-0 mt-0.5" />}
                {isAbsence && <Users className="h-3 w-3 flex-shrink-0 mt-0.5" />}
                
                <div className="flex-1 min-w-0 overflow-hidden">
                  <span className="block truncate">{item.title}</span>
                  {item.projectName && height > 40 && (
                    <span className="block text-[9px] opacity-80 truncate mt-0.5">
                      {item.projectName}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Resize handle - uniquement pour les tâches */}
              {item.type === "task" && schedule && (
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-2 flex items-center justify-center cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity",
                    isResizing && "opacity-100"
                  )}
                  onMouseDown={handleResizeStart}
                  onTouchStart={handleResizeStart}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-8 h-1 bg-white/60 rounded-full" />
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-1.5">
                {item.type === "event" ? (
                  <Calendar className="h-3.5 w-3.5" />
                ) : item.type === "task" ? (
                  <Clock className="h-3.5 w-3.5" />
                ) : (
                  <Users className="h-3.5 w-3.5" />
                )}
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
                {format(item.start, "HH:mm")} {item.end && `- ${format(item.end, "HH:mm")}`}
                <span className="ml-2 font-medium">({hoursLabel})</span>
              </div>
              {item.type === "task" && (
                <div className="text-xs text-muted-foreground mt-1 pt-1 border-t border-border/50">
                  ↕ Étirer pour modifier la durée
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </ContextMenuTrigger>
      {item.type === "task" && schedule && (
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onViewTask(schedule)}>
            <Eye className="h-4 w-4 mr-2" />
            Voir la tâche
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => {
            navigator.clipboard.writeText(item.title);
          }}>
            <Copy className="h-4 w-4 mr-2" />
            Copier le nom
          </ContextMenuItem>
          {item.projectName && (
            <ContextMenuItem onClick={() => {
              const projectId = (schedule.task as any)?.project_id;
              if (projectId) window.open(`/projects/${projectId}`, '_blank');
            }}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir le projet
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem className="text-muted-foreground">
            <Move className="h-4 w-4 mr-2" />
            Glisser-déposer pour déplacer
          </ContextMenuItem>
          <ContextMenuItem onClick={() => {
            if (schedule.task) {
              // Mark as complete
            }
          }}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Marquer terminée
          </ContextMenuItem>
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
