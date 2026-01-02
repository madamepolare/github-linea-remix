import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { format, parseISO, differenceInDays, addDays, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, endOfYear, eachWeekOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ProjectPhase } from "@/hooks/useProjectPhases";
import { PhaseDependency } from "@/hooks/usePhaseDependencies";
import { PHASE_STATUS_CONFIG, PhaseStatus } from "@/lib/projectTypes";
import { CheckCircle2, GripVertical, Calendar, ZoomIn, ZoomOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ZoomLevel = "day" | "week" | "month" | "year";

interface PhaseGanttTimelineProps {
  phases: ProjectPhase[];
  dependencies: PhaseDependency[];
  onPhaseClick?: (phase: ProjectPhase) => void;
  onPhaseUpdate?: (phaseId: string, updates: { start_date?: string | null; end_date?: string | null }) => void;
}

type DragType = "move" | "resize-start" | "resize-end" | null;

interface DragState {
  phaseId: string;
  type: DragType;
  startX: number;
  originalStartDate: Date | null;
  originalEndDate: Date | null;
}

const ZOOM_CONFIG: Record<ZoomLevel, { label: string; unitWidth: number }> = {
  day: { label: "Jour", unitWidth: 30 },
  week: { label: "Semaine", unitWidth: 20 },
  month: { label: "Mois", unitWidth: 8 },
  year: { label: "Année", unitWidth: 2 },
};

export function PhaseGanttTimeline({ phases, dependencies, onPhaseClick, onPhaseUpdate }: PhaseGanttTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [previewDates, setPreviewDates] = useState<Record<string, { start_date?: Date; end_date?: Date }>>({});
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("month");

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-scroll to today indicator
  useEffect(() => {
    if (todayRef.current && chartContainerRef.current) {
      const todayLeft = todayRef.current.offsetLeft;
      const containerWidth = chartContainerRef.current.offsetWidth;
      chartContainerRef.current.scrollLeft = Math.max(0, todayLeft - containerWidth / 2);
    }
  }, [containerWidth, phases]);

  // Calculate timeline bounds based on phase deadlines and zoom level
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    const phasesWithDates = phases.filter((p) => p.start_date || p.end_date);
    
    if (phasesWithDates.length === 0) {
      const now = new Date();
      const bufferDays = zoomLevel === "year" ? 365 : zoomLevel === "month" ? 120 : 60;
      return {
        timelineStart: zoomLevel === "year" ? startOfYear(addDays(now, -180)) : startOfMonth(addDays(now, -30)),
        timelineEnd: zoomLevel === "year" ? endOfYear(addDays(now, 365)) : endOfMonth(addDays(now, bufferDays)),
        totalDays: zoomLevel === "year" ? 730 : 150,
      };
    }

    const allDates: Date[] = [];
    phasesWithDates.forEach((p) => {
      if (p.start_date) allDates.push(parseISO(p.start_date));
      if (p.end_date) allDates.push(parseISO(p.end_date));
    });
    
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    // Adjust buffer based on zoom level
    const bufferBefore = zoomLevel === "year" ? 60 : zoomLevel === "month" ? 30 : 14;
    const bufferAfter = zoomLevel === "year" ? 90 : zoomLevel === "month" ? 60 : 30;
    
    const start = zoomLevel === "year" 
      ? startOfYear(addDays(minDate, -bufferBefore))
      : startOfMonth(addDays(minDate, -bufferBefore));
    const end = zoomLevel === "year"
      ? endOfYear(addDays(maxDate, bufferAfter))
      : endOfMonth(addDays(maxDate, bufferAfter));
    const days = differenceInDays(end, start) || 150;

    return { timelineStart: start, timelineEnd: end, totalDays: days };
  }, [phases, zoomLevel]);

  // Generate time periods for header based on zoom level
  const months = useMemo(() => {
    return eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
  }, [timelineStart, timelineEnd]);

  const years = useMemo(() => {
    const yearList: Date[] = [];
    let current = startOfYear(timelineStart);
    while (current <= timelineEnd) {
      yearList.push(current);
      current = addDays(endOfYear(current), 1);
    }
    return yearList;
  }, [timelineStart, timelineEnd]);

  const dayWidth = ZOOM_CONFIG[zoomLevel].unitWidth;
  const chartWidth = totalDays * dayWidth;

  // Calculate positions for each phase (with preview support)
  const phasePositions = useMemo(() => {
    const positions: Record<string, { left: number; width: number; startDate: Date | null; endDate: Date | null }> = {};
    
    phases.forEach((phase, index) => {
      const preview = previewDates[phase.id];
      const startDate = preview?.start_date || (phase.start_date ? parseISO(phase.start_date) : null);
      const endDate = preview?.end_date || (phase.end_date ? parseISO(phase.end_date) : null);
      
      if (startDate && endDate) {
        const startDays = differenceInDays(startDate, timelineStart);
        const endDays = differenceInDays(endDate, timelineStart);
        
        positions[phase.id] = {
          left: Math.max(0, startDays * dayWidth),
          width: Math.max((endDays - startDays + 1) * dayWidth, 30),
          startDate,
          endDate,
        };
      } else if (endDate) {
        // Only end date - estimate start 14 days before
        const endDays = differenceInDays(endDate, timelineStart);
        const startDays = Math.max(0, endDays - 14);
        
        positions[phase.id] = {
          left: startDays * dayWidth,
          width: Math.max((endDays - startDays + 1) * dayWidth, 30),
          startDate: addDays(endDate, -14),
          endDate,
        };
      } else if (startDate) {
        // Only start date - extend 14 days
        const startDays = differenceInDays(startDate, timelineStart);
        
        positions[phase.id] = {
          left: Math.max(0, startDays * dayWidth),
          width: 14 * dayWidth,
          startDate,
          endDate: addDays(startDate, 14),
        };
      } else {
        // No dates - position at start
        positions[phase.id] = {
          left: index * 30,
          width: 80,
          startDate: null,
          endDate: null,
        };
      }
    });

    return positions;
  }, [phases, timelineStart, dayWidth, previewDates]);

  // Build dependency map for visual connections
  const dependencyLines = useMemo(() => {
    return dependencies.map((dep) => {
      const fromPos = phasePositions[dep.depends_on_phase_id];
      const toPos = phasePositions[dep.phase_id];
      const fromIndex = phases.findIndex((p) => p.id === dep.depends_on_phase_id);
      const toIndex = phases.findIndex((p) => p.id === dep.phase_id);

      if (!fromPos || !toPos || fromIndex === -1 || toIndex === -1) return null;

      return {
        x1: fromPos.left + fromPos.width,
        y1: fromIndex * 48 + 24,
        x2: toPos.left,
        y2: toIndex * 48 + 24,
        lagDays: dep.lag_days || 0,
      };
    }).filter(Boolean);
  }, [dependencies, phasePositions, phases]);

  // Calculate today position
  const todayPosition = useMemo(() => {
    const today = new Date();
    const daysFromStart = differenceInDays(today, timelineStart);
    if (daysFromStart < 0 || daysFromStart > totalDays) return null;
    return daysFromStart * dayWidth;
  }, [timelineStart, totalDays, dayWidth]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, phaseId: string, type: DragType) => {
    e.preventDefault();
    e.stopPropagation();
    
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    setDragState({
      phaseId,
      type,
      startX: e.clientX,
      originalStartDate: phase.start_date ? parseISO(phase.start_date) : null,
      originalEndDate: phase.end_date ? parseISO(phase.end_date) : null,
    });
  }, [phases]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState) return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaDays = Math.round(deltaX / dayWidth);
    
    if (deltaDays === 0) return;
    
    const { phaseId, type, originalStartDate, originalEndDate } = dragState;
    
    let newStartDate = originalStartDate;
    let newEndDate = originalEndDate;
    
    if (type === "move") {
      if (originalStartDate) newStartDate = addDays(originalStartDate, deltaDays);
      if (originalEndDate) newEndDate = addDays(originalEndDate, deltaDays);
    } else if (type === "resize-start" && originalStartDate) {
      newStartDate = addDays(originalStartDate, deltaDays);
      // Ensure start doesn't go past end
      if (newEndDate && newStartDate >= newEndDate) {
        newStartDate = addDays(newEndDate, -1);
      }
    } else if (type === "resize-end" && originalEndDate) {
      newEndDate = addDays(originalEndDate, deltaDays);
      // Ensure end doesn't go before start
      if (newStartDate && newEndDate <= newStartDate) {
        newEndDate = addDays(newStartDate, 1);
      }
    }
    
    setPreviewDates({
      [phaseId]: {
        start_date: newStartDate || undefined,
        end_date: newEndDate || undefined,
      }
    });
  }, [dragState, dayWidth]);

  const handleMouseUp = useCallback(() => {
    if (!dragState) return;
    
    const preview = previewDates[dragState.phaseId];
    if (preview && onPhaseUpdate) {
      onPhaseUpdate(dragState.phaseId, {
        start_date: preview.start_date ? format(preview.start_date, "yyyy-MM-dd") : undefined,
        end_date: preview.end_date ? format(preview.end_date, "yyyy-MM-dd") : undefined,
      });
    }
    
    setDragState(null);
    setPreviewDates({});
  }, [dragState, previewDates, onPhaseUpdate]);

  useEffect(() => {
    if (dragState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  // Double-click edit handlers
  const handleDoubleClick = useCallback((phase: ProjectPhase) => {
    setEditingPhase(phase.id);
    setEditStartDate(phase.start_date ? parseISO(phase.start_date) : undefined);
    setEditEndDate(phase.end_date ? parseISO(phase.end_date) : undefined);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingPhase && onPhaseUpdate) {
      onPhaseUpdate(editingPhase, {
        start_date: editStartDate ? format(editStartDate, "yyyy-MM-dd") : null,
        end_date: editEndDate ? format(editEndDate, "yyyy-MM-dd") : null,
      });
    }
    setEditingPhase(null);
    setEditStartDate(undefined);
    setEditEndDate(undefined);
  }, [editingPhase, editStartDate, editEndDate, onPhaseUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditingPhase(null);
    setEditStartDate(undefined);
    setEditEndDate(undefined);
  }, []);

  if (phases.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune phase à afficher
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-card", dragState && "cursor-grabbing select-none")}>
      {/* Zoom controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <span className="text-sm font-medium">Timeline des phases</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ZoomOut className="h-3.5 w-3.5" />
          </div>
          <Select value={zoomLevel} onValueChange={(v) => setZoomLevel(v as ZoomLevel)}>
            <SelectTrigger className="w-[110px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="year">Année</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ZoomIn className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* Header with time periods */}
      <div className="flex border-b bg-muted/50">
        <div className="w-[200px] flex-shrink-0 px-3 py-2 font-medium text-sm border-r">
          Phases
        </div>
        <div className="flex-1 overflow-x-auto" ref={containerRef}>
          <div style={{ width: chartWidth, minWidth: "100%" }} className="flex">
            {zoomLevel === "year" ? (
              years.map((year) => {
                const yearEnd = endOfYear(year);
                const yearDays = differenceInDays(yearEnd, year) + 1;
                
                return (
                  <div
                    key={year.toISOString()}
                    className="text-xs text-muted-foreground py-2 px-2 border-r font-medium"
                    style={{ width: yearDays * dayWidth }}
                  >
                    {format(year, "yyyy")}
                  </div>
                );
              })
            ) : (
              months.map((month) => {
                const monthEnd = endOfMonth(month);
                const monthDays = differenceInDays(monthEnd, month) + 1;
                
                return (
                  <div
                    key={month.toISOString()}
                    className="text-xs text-muted-foreground py-2 px-2 border-r"
                    style={{ width: monthDays * dayWidth }}
                  >
                    {zoomLevel === "day" || zoomLevel === "week" 
                      ? format(month, "MMMM yyyy", { locale: fr })
                      : format(month, "MMM yyyy", { locale: fr })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Gantt rows */}
      <div className="relative">
        <div className="flex">
          {/* Phase names column */}
          <div className="w-[200px] flex-shrink-0 border-r">
            {phases.map((phase, index) => {
              const statusConfig = PHASE_STATUS_CONFIG[phase.status as PhaseStatus] || PHASE_STATUS_CONFIG.pending;
              
              return (
                <div
                  key={phase.id}
                  className={cn(
                    "h-12 flex items-center gap-2 px-3 border-b cursor-pointer hover:bg-muted/50 transition-colors",
                    phase.status === "in_progress" && "bg-primary/5"
                  )}
                  onClick={() => onPhaseClick?.(phase)}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0"
                    style={{ backgroundColor: phase.color || "#3B82F6" }}
                  >
                    {phase.status === "completed" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={cn(
                    "text-sm truncate",
                    phase.status === "completed" && "line-through text-muted-foreground"
                  )}>
                    {phase.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chart area */}
          <div className="flex-1 overflow-x-auto" ref={chartContainerRef}>
            <div style={{ width: chartWidth, minWidth: "100%" }} className="relative">
              {/* Grid lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {months.map((month) => {
                  const daysFromStart = differenceInDays(month, timelineStart);
                  return (
                    <line
                      key={month.toISOString()}
                      x1={daysFromStart * dayWidth}
                      y1={0}
                      x2={daysFromStart * dayWidth}
                      y2="100%"
                      stroke="currentColor"
                      strokeOpacity={0.1}
                    />
                  );
                })}
              </svg>

              {/* Today indicator */}
              {todayPosition !== null && (
                <div
                  ref={todayRef}
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: todayPosition }}
                >
                  <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-b font-medium whitespace-nowrap">
                    Aujourd'hui
                  </div>
                </div>
              )}

              {/* Dependency lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                {dependencyLines.map((line, i) => {
                  if (!line) return null;
                  const midX = (line.x1 + line.x2) / 2;
                  
                  return (
                    <g key={i}>
                      <path
                        d={`M ${line.x1} ${line.y1} 
                           C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        opacity={0.5}
                      />
                      <circle
                        cx={line.x2}
                        cy={line.y2}
                        r={4}
                        fill="hsl(var(--primary))"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Phase bars */}
              {phases.map((phase, index) => {
                const pos = phasePositions[phase.id];
                if (!pos) return null;

                const isDragging = dragState?.phaseId === phase.id;
                const canDrag = !!onPhaseUpdate;

                return (
                  <div
                    key={phase.id}
                    className="h-12 flex items-center border-b relative"
                  >
                    <Popover 
                      open={editingPhase === phase.id} 
                      onOpenChange={(open) => {
                        if (!open) handleCancelEdit();
                      }}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <PopoverTrigger asChild>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "absolute h-7 rounded-md transition-all group",
                                  phase.status === "completed" && "opacity-60",
                                  isDragging ? "shadow-lg ring-2 ring-primary z-20" : "hover:shadow-md",
                                  editingPhase === phase.id && "ring-2 ring-primary z-20",
                                  canDrag ? "cursor-grab" : "cursor-pointer"
                                )}
                                style={{
                                  left: pos.left,
                                  width: pos.width,
                                  backgroundColor: phase.color || "#3B82F6",
                                }}
                                onClick={(e) => {
                                  if (!isDragging && editingPhase !== phase.id) {
                                    onPhaseClick?.(phase);
                                  }
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  if (canDrag) handleDoubleClick(phase);
                                }}
                                onMouseDown={(e) => canDrag && !editingPhase && handleMouseDown(e, phase.id, "move")}
                              >
                                {/* Left resize handle */}
                                {canDrag && !editingPhase && (
                                  <div
                                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                    onMouseDown={(e) => handleMouseDown(e, phase.id, "resize-start")}
                                  >
                                    <div className="w-0.5 h-4 bg-white/50 rounded-full" />
                                  </div>
                                )}
                                
                                {/* Content */}
                                <div className="h-full flex items-center justify-between px-2 overflow-hidden gap-1">
                                  <div className="flex items-center min-w-0">
                                    {canDrag && !editingPhase && (
                                      <GripVertical className="h-3 w-3 text-white/50 mr-1 flex-shrink-0" />
                                    )}
                                    {pos.startDate && (
                                      <span className="text-[10px] text-white/90 font-medium whitespace-nowrap">
                                        {format(pos.startDate, "d MMM", { locale: fr })}
                                      </span>
                                    )}
                                  </div>
                                  {pos.width > 100 && (
                                    <span className="text-[10px] text-white/70 truncate px-1 hidden sm:block">
                                      {phase.name}
                                    </span>
                                  )}
                                  {pos.endDate && (
                                    <span className="text-[10px] text-white/90 font-medium whitespace-nowrap">
                                      {format(pos.endDate, "d MMM", { locale: fr })}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Right resize handle */}
                                {canDrag && !editingPhase && (
                                  <div
                                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                    onMouseDown={(e) => handleMouseDown(e, phase.id, "resize-end")}
                                  >
                                    <div className="w-0.5 h-4 bg-white/50 rounded-full" />
                                  </div>
                                )}
                              </div>
                            </TooltipTrigger>
                          </PopoverTrigger>
                          <TooltipContent side="top">
                            <div className="text-sm">
                              <p className="font-medium">{phase.name}</p>
                              <p className="text-muted-foreground">
                                {PHASE_STATUS_CONFIG[phase.status as PhaseStatus]?.label || phase.status}
                              </p>
                              {pos.startDate && (
                                <p>Début: {format(pos.startDate, "d MMMM yyyy", { locale: fr })}</p>
                              )}
                              {pos.endDate && (
                                <p>Fin: {format(pos.endDate, "d MMMM yyyy", { locale: fr })}</p>
                              )}
                              {canDrag && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Double-clic pour éditer les dates
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <PopoverContent className="w-auto p-4" align="start" side="bottom">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-medium">Modifier les dates</h4>
                          </div>
                          
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-sm">Date de début</Label>
                              <CalendarComponent
                                mode="single"
                                selected={editStartDate}
                                onSelect={setEditStartDate}
                                disabled={(date) => editEndDate ? date > editEndDate : false}
                                locale={fr}
                                className="rounded-md border"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm">Date de fin</Label>
                              <CalendarComponent
                                mode="single"
                                selected={editEndDate}
                                onSelect={setEditEndDate}
                                disabled={(date) => editStartDate ? date < editStartDate : false}
                                locale={fr}
                                className="rounded-md border"
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                              Annuler
                            </Button>
                            <Button size="sm" onClick={handleSaveEdit}>
                              Enregistrer
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
