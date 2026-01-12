import { useState, useCallback, useRef, useEffect } from "react";
import { format, addMinutes } from "date-fns";
import { Calendar, Clock, Users, GripVertical, Trash2, Eye, Move, Copy, ExternalLink, CheckCircle2, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { PlanningItem } from "./ResizablePlanningItem";
import { TaskSchedule } from "@/hooks/useTaskSchedules";
import { DurationInput } from "@/components/tasks/DurationInput";

// Constants for the timeline
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const TOTAL_HOURS = DAY_END_HOUR - DAY_START_HOUR;
const PIXELS_PER_MINUTE = 1.5;

interface AgendaTimelineItemProps {
  item: PlanningItem;
  dayStart: Date;
  onViewTask: (schedule: TaskSchedule) => void;
  onUnschedule: (scheduleId: string) => void;
  onDragStart: (e: React.DragEvent, item: PlanningItem) => void;
  onResize?: (scheduleId: string, newStart: Date, newEnd: Date) => void;
  onViewEvent?: (event: any) => void;
  onViewTimeEntry?: (entry: any) => void;
  containerHeight: number;
}

export function AgendaTimelineItem({
  item,
  dayStart,
  onViewTask,
  onUnschedule,
  onDragStart,
  onResize,
  onViewEvent,
  onViewTimeEntry,
  containerHeight,
}: AgendaTimelineItemProps) {
  const schedule = item.type === "task" ? (item.originalData as TaskSchedule) : null;
  const isAbsence = item.type === "absence";
  const isTimeEntry = item.type === "timeEntry";
  const canResize = item.type === "task";
  const canDrag = item.type === "task" && !isAbsence;

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
  
  const topPx = (clampedStart - dayStartMinutes) * PIXELS_PER_MINUTE;
  const heightPx = (clampedEnd - clampedStart) * PIXELS_PER_MINUTE;

  const hours = item.durationHours || 1;
  const hoursLabel = hours >= 1 ? `${Math.round(hours * 10) / 10}h` : `${Math.round(hours * 60)}m`;
  
  const startTimeLabel = format(item.start, "HH:mm");
  const endTimeLabel = item.end ? format(item.end, "HH:mm") : "";

  // Resize state
  const [isResizing, setIsResizing] = useState<"top" | "bottom" | null>(null);
  const [resizeOffset, setResizeOffset] = useState({ top: 0, height: 0 });
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [editingDuration, setEditingDuration] = useState(hours.toString());
  const resizeRef = useRef<{ startY: number; initialTop: number; initialHeight: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Vertical drag state (move entire item)
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragRef = useRef<{ startY: number; initialTop: number } | null>(null);
  
  // Track if a drag actually happened (to prevent click after drag)
  const hasDraggedRef = useRef(false);

  // Current dimensions during resize or drag
  const currentTopPx = topPx + resizeOffset.top + dragOffset;
  const currentHeightPx = heightPx + resizeOffset.height;
  
  // Calculate current time from pixels
  const getCurrentTimes = useCallback(() => {
    const startMinutes = dayStartMinutes + (currentTopPx / PIXELS_PER_MINUTE);
    const endMinutes = dayStartMinutes + ((currentTopPx + currentHeightPx) / PIXELS_PER_MINUTE);
    
    const startHour = Math.floor(startMinutes / 60);
    const startMin = Math.round((startMinutes % 60) / 15) * 15;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = Math.round((endMinutes % 60) / 15) * 15;
    
    return {
      start: `${startHour.toString().padStart(2, "0")}:${startMin.toString().padStart(2, "0")}`,
      end: `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`,
      durationMinutes: endMinutes - startMinutes,
    };
  }, [currentTopPx, currentHeightPx, dayStartMinutes]);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, handle: "top" | "bottom") => {
    if (!canResize) return;
    e.stopPropagation();
    e.preventDefault();
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    resizeRef.current = { startY: clientY, initialTop: topPx, initialHeight: heightPx };
    setIsResizing(handle);
  }, [canResize, topPx, heightPx]);

  // Start vertical drag (move entire item)
  const handleVerticalDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!canDrag || isResizing) return;
    e.stopPropagation();
    e.preventDefault();
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = { startY: clientY, initialTop: topPx };
    hasDraggedRef.current = false;
    setIsDraggingVertical(true);
  }, [canDrag, isResizing, topPx]);

  // Handle vertical drag move
  const handleVerticalDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragRef.current || !isDraggingVertical) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = clientY - dragRef.current.startY;
    
    // Mark that a drag has actually occurred (movement > 5px)
    if (Math.abs(delta) > 5) {
      hasDraggedRef.current = true;
    }
    
    // Clamp to day boundaries
    const newTop = Math.max(0, Math.min(containerHeight - heightPx, dragRef.current.initialTop + delta));
    setDragOffset(newTop - topPx);
  }, [isDraggingVertical, containerHeight, heightPx, topPx]);

  // Handle vertical drag end
  const handleVerticalDragEnd = useCallback(() => {
    if (!isDraggingVertical || !schedule) return;
    
    setIsDraggingVertical(false);
    dragRef.current = null;
    
    // Calculate new times (rounded to 15-minute intervals)
    const newTopPx = topPx + dragOffset;
    const startMinutes = dayStartMinutes + (newTopPx / PIXELS_PER_MINUTE);
    const durationMinutes = heightPx / PIXELS_PER_MINUTE;
    const endMinutes = startMinutes + durationMinutes;
    
    const startHour = Math.floor(startMinutes / 60);
    const startMin = Math.round((startMinutes % 60) / 15) * 15;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = Math.round((endMinutes % 60) / 15) * 15;
    
    const newStart = new Date(dayStart);
    newStart.setHours(startHour, startMin, 0, 0);
    
    const newEnd = new Date(dayStart);
    newEnd.setHours(endHour, endMin, 0, 0);
    
    if (onResize && schedule) {
      onResize(schedule.id, newStart, newEnd);
    }
    
    setDragOffset(0);
  }, [isDraggingVertical, dragOffset, topPx, heightPx, dayStartMinutes, dayStart, schedule, onResize]);

  const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!resizeRef.current || !isResizing) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = clientY - resizeRef.current.startY;
    
    if (isResizing === "top") {
      // Resize from top - move start time
      const newTop = Math.max(0, resizeRef.current.initialTop + delta);
      const heightDelta = resizeRef.current.initialTop - newTop;
      const newHeight = resizeRef.current.initialHeight + heightDelta;
      
      if (newHeight >= 15 * PIXELS_PER_MINUTE) { // Minimum 15 minutes
        setResizeOffset({ top: newTop - topPx, height: heightDelta });
      }
    } else {
      // Resize from bottom - move end time
      const maxHeight = containerHeight - topPx;
      const newHeight = Math.max(15 * PIXELS_PER_MINUTE, Math.min(maxHeight, resizeRef.current.initialHeight + delta));
      setResizeOffset({ top: 0, height: newHeight - heightPx });
    }
  }, [isResizing, containerHeight, topPx, heightPx]);

  const handleResizeEnd = useCallback(() => {
    if (!isResizing || !schedule) return;
    
    setIsResizing(null);
    resizeRef.current = null;
    
    // Calculate new times (rounded to 15-minute intervals)
    const startMinutes = dayStartMinutes + (currentTopPx / PIXELS_PER_MINUTE);
    const endMinutes = dayStartMinutes + ((currentTopPx + currentHeightPx) / PIXELS_PER_MINUTE);
    
    const startHour = Math.floor(startMinutes / 60);
    const startMin = Math.round((startMinutes % 60) / 15) * 15;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = Math.round((endMinutes % 60) / 15) * 15;
    
    const newStart = new Date(dayStart);
    newStart.setHours(startHour, startMin, 0, 0);
    
    const newEnd = new Date(dayStart);
    newEnd.setHours(endHour, endMin, 0, 0);
    
    if (onResize && schedule) {
      onResize(schedule.id, newStart, newEnd);
    }
    
    setResizeOffset({ top: 0, height: 0 });
  }, [isResizing, currentTopPx, currentHeightPx, dayStartMinutes, dayStart, schedule, onResize]);

  // Global listeners for resize
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

  // Global listeners for vertical drag
  useEffect(() => {
    if (isDraggingVertical) {
      window.addEventListener("mousemove", handleVerticalDragMove);
      window.addEventListener("mouseup", handleVerticalDragEnd);
      window.addEventListener("touchmove", handleVerticalDragMove);
      window.addEventListener("touchend", handleVerticalDragEnd);
      
      return () => {
        window.removeEventListener("mousemove", handleVerticalDragMove);
        window.removeEventListener("mouseup", handleVerticalDragEnd);
        window.removeEventListener("touchmove", handleVerticalDragMove);
        window.removeEventListener("touchend", handleVerticalDragEnd);
      };
    }
  }, [isDraggingVertical, handleVerticalDragMove, handleVerticalDragEnd]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't open modal if we just finished dragging or resizing
    if (isResizing || isDraggingVertical || hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    e.stopPropagation();
    
    if (item.type === "task" && schedule) {
      onViewTask(schedule);
    } else if (item.type === "event" && item.originalData) {
      // Navigate to the related entity (project or tender)
      const eventData = item.originalData as any;
      if (eventData.project_id) {
        window.location.href = `/projects/${eventData.project_id}`;
      } else if (eventData.tender_id) {
        window.location.href = `/tenders/${eventData.tender_id}`;
      } else if (onViewEvent) {
        onViewEvent(item.originalData);
      }
    } else if (item.type === "timeEntry" && onViewTimeEntry) {
      onViewTimeEntry(item.originalData);
    }
  }, [item, schedule, isResizing, isDraggingVertical, onViewTask, onViewEvent, onViewTimeEntry]);

  const handleSaveDuration = useCallback(() => {
    const newHours = parseFloat(editingDuration);
    if (!isNaN(newHours) && newHours > 0 && schedule && onResize) {
      const newEnd = addMinutes(item.start, newHours * 60);
      onResize(schedule.id, item.start, newEnd);
    }
    setIsEditingDuration(false);
  }, [editingDuration, schedule, item.start, onResize]);

  const isInteracting = isResizing || isDraggingVertical;
  const currentTimes = isInteracting ? getCurrentTimes() : null;
  const displayHeight = isInteracting ? currentHeightPx : heightPx;
  const displayTop = isInteracting ? currentTopPx : topPx;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                ref={containerRef}
                className={cn(
                  "absolute left-1 right-1 rounded-lg overflow-hidden transition-shadow",
                  "cursor-pointer hover:shadow-lg group select-none",
                  isAbsence && "opacity-60 cursor-not-allowed",
                  isInteracting && "ring-2 ring-primary/50 z-30 shadow-xl"
                )}
                style={{
                  top: displayTop,
                  height: Math.max(displayHeight, 24),
                  backgroundColor: item.color,
                  zIndex: isInteracting ? 30 : 10,
                }}
                onClick={handleClick}
              >
                {/* No gradient overlay */}
                
                {/* Horizontal drag handle - for moving between days */}
                {canDrag && (
                  <div
                    data-drag-handle="horizontal"
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      hasDraggedRef.current = true;
                      onDragStart(e, item);
                    }}
                    className={cn(
                      "absolute top-0 left-0 bottom-0 w-6 cursor-grab active:cursor-grabbing z-20",
                      "flex items-center justify-center",
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      "bg-background/15"
                    )}
                  >
                    <GripVertical className="h-3 w-3 text-background/90" />
                  </div>
                )}
                
                {/* Vertical drag area - for moving within same day (time adjustment) */}
                <div
                  className={cn(
                    "absolute inset-0",
                    canDrag && !isResizing && "cursor-ns-resize",
                    isDraggingVertical && "cursor-grabbing"
                  )}
                  style={{ left: canDrag ? 24 : 0 }}
                  onMouseDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('[data-resize-handle]')) return;
                    if (target.closest('[data-drag-handle]')) return;
                    if (canDrag && !isResizing) {
                      handleVerticalDragStart(e);
                    }
                  }}
                  onTouchStart={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('[data-resize-handle]')) return;
                    if (target.closest('[data-drag-handle]')) return;
                    if (canDrag && !isResizing) {
                      handleVerticalDragStart(e);
                    }
                  }}
                />
                
                {/* Top resize handle */}
                {canResize && (
                  <div
                    data-resize-handle="top"
                    className={cn(
                      "absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-20 flex items-center justify-center",
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      isResizing === "top" && "opacity-100 bg-primary/30"
                    )}
                    onMouseDown={(e) => handleResizeStart(e, "top")}
                    onTouchStart={(e) => handleResizeStart(e, "top")}
                  >
                    <div className="w-8 h-0.5 bg-white/70 rounded-full" />
                  </div>
                )}
                
                {/* Content */}
                <div className="p-1.5 flex flex-col h-full text-white relative pointer-events-none" style={{ paddingLeft: canDrag ? 24 : 6 }}>
                  {/* Move indicator */}
                  {isDraggingVertical && (
                    <div className="absolute top-1 right-1">
                      <Move className="h-3 w-3" />
                    </div>
                  )}
                  
                  {/* Time label - show real-time during interaction */}
                  <div className="text-[9px] font-medium opacity-80 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {isInteracting ? (
                      <span className="font-bold text-white">
                        {currentTimes?.start} - {currentTimes?.end}
                      </span>
                    ) : (
                      <>
                        {startTimeLabel} - {endTimeLabel}
                      </>
                    )}
                  </div>
                  
                  {/* Title */}
                  <div className="text-[11px] font-semibold truncate flex-1 mt-0.5">
                    {item.title}
                  </div>
                  
                  {/* Project name */}
                  {item.projectName && displayHeight > 50 && (
                    <div className="text-[9px] opacity-70 truncate">
                      {item.projectName}
                    </div>
                  )}
                  
                  {/* Duration badge */}
                  {item.type === "task" && schedule && (
                    <Popover open={isEditingDuration} onOpenChange={setIsEditingDuration}>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "absolute -top-1 -right-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold shadow-sm border transition-all flex items-center gap-0.5",
                            isResizing 
                              ? "bg-primary text-primary-foreground border-primary" 
                              : "bg-white text-gray-700 hover:bg-gray-100 hover:scale-110"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDuration(hours.toString());
                            setIsEditingDuration(true);
                          }}
                        >
                          {isResizing ? `${Math.round((currentTimes?.durationMinutes || 0) / 6) / 10}h` : hoursLabel}
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
                  )}
                </div>
                
                {/* Bottom resize handle */}
                {canResize && (
                  <div
                    data-resize-handle="bottom"
                    className={cn(
                      "absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20 flex items-center justify-center",
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      isResizing === "bottom" && "opacity-100 bg-primary/30"
                    )}
                    onMouseDown={(e) => handleResizeStart(e, "bottom")}
                    onTouchStart={(e) => handleResizeStart(e, "bottom")}
                  >
                    <div className="w-8 h-0.5 bg-white/70 rounded-full" />
                  </div>
                )}
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
                  <span className="ml-2 font-medium">({hoursLabel})</span>
                </div>
                {item.type === "task" && (
                  <div className="text-xs text-muted-foreground mt-1 pt-1 border-t border-border/50 space-y-0.5">
                    <div>↕ Glisser pour changer l'heure</div>
                    <div>↕ Étirer les bords pour modifier la durée</div>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ContextMenuTrigger>
      {item.type === "task" && schedule && (
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onViewTask(schedule)}>
            <Eye className="h-4 w-4 mr-2" />
            Voir la tâche
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => navigator.clipboard.writeText(item.title)}>
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

export { DAY_START_HOUR, DAY_END_HOUR, TOTAL_HOURS, PIXELS_PER_MINUTE };
