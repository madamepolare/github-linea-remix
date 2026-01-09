import { useState, useCallback, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Users, Eye, Copy, ExternalLink, Move, CheckCircle2, Trash2, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { TaskSchedule } from "@/hooks/useTaskSchedules";
import { DurationInput } from "@/components/tasks/DurationInput";

// Types pour les items affichés dans le planning
export type PlanningItem = {
  id: string;
  type: "task" | "event" | "absence" | "timeEntry";
  title: string;
  start: Date;
  end: Date | null;
  color: string;
  projectName?: string;
  projectColor?: string;
  eventType?: string;
  durationHours?: number;
  isBillable?: boolean;
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
  onResizeTimeEntry?: (entryId: string, newDurationMinutes: number) => void;
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
  onResizeTimeEntry,
}: ResizablePlanningItemProps) {
  const schedule = item.type === "task" ? item.originalData as TaskSchedule : null;
  const isAbsence = item.type === "absence";
  const isTimeEntry = item.type === "timeEntry";
  
  const hours = item.durationHours || 1;
  const initialHeight = Math.max(minHeight, hours * pixelsPerHour);
  
  const [height, setHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [editingDuration, setEditingDuration] = useState(hours.toString());
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
  const currentHours = Math.max(0.25, Math.round((height / pixelsPerHour) * 4) / 4); // Arrondi à 0.25h
  const currentHoursLabel = currentHours >= 1 ? `${currentHours}h` : `${Math.round(currentHours * 60)}m`;

  const handleOpenDurationEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingDuration(hours.toString());
    setIsEditingDuration(true);
  }, [hours]);

  const handleSaveDuration = useCallback(() => {
    const newHours = parseFloat(editingDuration);
    if (!isNaN(newHours) && newHours > 0 && schedule && onResize) {
      onResize(schedule.id, newHours);
    }
    setIsEditingDuration(false);
  }, [editingDuration, schedule, onResize]);

  const canResize = item.type === "task" || item.type === "timeEntry";

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!canResize) return;
    e.stopPropagation();
    e.preventDefault();
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    resizeRef.current = { startY: clientY, startHeight: height };
    setIsResizing(true);
  }, [canResize, height]);

  const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!resizeRef.current || !isResizing) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = clientY - resizeRef.current.startY;
    const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeRef.current.startHeight + delta));
    setHeight(newHeight);
  }, [isResizing, minHeight, maxHeight]);

  const handleResizeEnd = useCallback(() => {
    if (!isResizing) return;
    
    setIsResizing(false);
    resizeRef.current = null;
    
    // Calculer la nouvelle durée (arrondi à 0.25h pour permettre 15min)
    const newDurationHours = Math.max(0.25, Math.round((height / pixelsPerHour) * 4) / 4);
    
    if (newDurationHours !== hours) {
      if (item.type === "task" && schedule && onResize) {
        onResize(schedule.id, newDurationHours);
      } else if (item.type === "timeEntry" && onResizeTimeEntry) {
        onResizeTimeEntry(item.id, Math.round(newDurationHours * 60));
      }
    }
  }, [isResizing, height, pixelsPerHour, hours, item.type, item.id, schedule, onResize, onResizeTimeEntry]);

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
                "rounded-lg text-[11px] leading-tight px-2 py-1.5 shadow-sm hover:shadow-lg transition-all duration-200 font-medium flex flex-col relative group select-none backdrop-blur-sm",
                item.type === "event" && "border-l-2",
                isAbsence && "opacity-60 cursor-not-allowed",
                isTimeEntry && "border-l-2 border-l-white/30",
                item.type === "task" && "cursor-grab active:cursor-grabbing",
                canResize && "cursor-ns-resize",
                isResizing && "ring-2 ring-white/60 z-10 scale-[1.02]"
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
              {/* Badge durée avec bouton d'édition */}
              {item.type === "task" && schedule ? (
                <Popover open={isEditingDuration} onOpenChange={setIsEditingDuration}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "absolute -top-1 -right-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold shadow-sm border transition-all flex items-center gap-0.5 hover:scale-110",
                        isResizing ? "bg-primary text-primary-foreground border-primary" : "bg-white text-gray-700 hover:bg-gray-100"
                      )}
                      onClick={handleOpenDurationEdit}
                    >
                      {isResizing ? currentHoursLabel : hoursLabel}
                      <Pencil className="h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="end" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Modifier la durée</div>
                      <DurationInput
                        value={editingDuration}
                        onChange={setEditingDuration}
                      />
                      <div className="flex justify-between items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setIsEditingDuration(false);
                            onUnschedule(schedule.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Retirer
                        </Button>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setIsEditingDuration(false)}>
                            <X className="h-3 w-3 mr-1" />
                            Annuler
                          </Button>
                          <Button size="sm" onClick={handleSaveDuration}>
                            <Check className="h-3 w-3 mr-1" />
                            OK
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className={cn(
                  "absolute -top-1 -right-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold shadow-sm border transition-colors",
                  isResizing ? "bg-primary text-primary-foreground border-primary" : "bg-white text-gray-700"
                )}>
                  {isResizing ? currentHoursLabel : hoursLabel}
                </div>
              )}
              
              {/* Content - avec padding-right pour éviter le chevauchement avec le badge */}
              <div className="flex items-start gap-1.5 flex-1 min-w-0 overflow-hidden pr-6">
                {/* Icon */}
                {item.type === "event" && <Calendar className="h-3 w-3 flex-shrink-0 mt-0.5" />}
                {item.type === "task" && <Clock className="h-3 w-3 flex-shrink-0 mt-0.5" />}
                {isAbsence && <Users className="h-3 w-3 flex-shrink-0 mt-0.5" />}
                {isTimeEntry && <Clock className="h-3 w-3 flex-shrink-0 mt-0.5" />}
                
                <div className="flex-1 min-w-0 overflow-hidden">
                  {item.projectName && (
                    <span className="block text-[9px] opacity-70 truncate leading-tight">
                      {item.projectName}
                    </span>
                  )}
                  <span className="block truncate leading-tight">{item.title}</span>
                </div>
              </div>
              
              {/* Resize handle - pour tâches et temps manuels */}
              {canResize && (
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-3 flex items-center justify-center cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity",
                    isResizing && "opacity-100"
                  )}
                  onMouseDown={handleResizeStart}
                  onTouchStart={handleResizeStart}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-10 h-1 bg-white/70 rounded-full shadow-sm" />
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
                ) : item.type === "timeEntry" ? (
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
              {item.type === "timeEntry" && (
                <div className="text-xs text-muted-foreground mt-1 pt-1 border-t border-border/50">
                  {item.isBillable ? "✓ Facturable" : "Temps interne (non facturable)"}
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
