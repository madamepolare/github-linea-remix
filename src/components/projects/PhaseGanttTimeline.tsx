import { useMemo, useRef, useEffect, useState } from "react";
import { format, parseISO, differenceInDays, addDays, startOfMonth, endOfMonth, eachMonthOfInterval, eachWeekOfInterval, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ProjectPhase } from "@/hooks/useProjectPhases";
import { PhaseDependency } from "@/hooks/usePhaseDependencies";
import { PHASE_STATUS_CONFIG, PhaseStatus } from "@/lib/projectTypes";
import { CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PhaseGanttTimelineProps {
  phases: ProjectPhase[];
  dependencies: PhaseDependency[];
  onPhaseClick?: (phase: ProjectPhase) => void;
}

export function PhaseGanttTimeline({ phases, dependencies, onPhaseClick }: PhaseGanttTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

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

  // Calculate timeline bounds based on phase deadlines
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    const phasesWithDates = phases.filter((p) => p.end_date);
    
    if (phasesWithDates.length === 0) {
      const now = new Date();
      return {
        timelineStart: startOfMonth(now),
        timelineEnd: endOfMonth(addDays(now, 90)),
        totalDays: 90,
      };
    }

    const dates = phasesWithDates.map((p) => parseISO(p.end_date!));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const start = startOfMonth(addDays(minDate, -14));
    const end = endOfMonth(addDays(maxDate, 14));
    const days = differenceInDays(end, start) || 90;

    return { timelineStart: start, timelineEnd: end, totalDays: days };
  }, [phases]);

  // Generate months for header
  const months = useMemo(() => {
    return eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
  }, [timelineStart, timelineEnd]);

  const dayWidth = containerWidth > 0 ? Math.max((containerWidth - 200) / totalDays, 2) : 10;
  const chartWidth = totalDays * dayWidth;

  // Calculate positions for each phase
  const phasePositions = useMemo(() => {
    const positions: Record<string, { left: number; width: number }> = {};
    
    phases.forEach((phase, index) => {
      if (phase.end_date) {
        const deadline = parseISO(phase.end_date);
        const daysFromStart = differenceInDays(deadline, timelineStart);
        
        // Estimate phase duration (e.g., based on previous phase or default 14 days)
        const prevPhase = phases[index - 1];
        let startDay = 0;
        
        if (prevPhase && prevPhase.end_date) {
          const prevDeadline = parseISO(prevPhase.end_date);
          startDay = Math.max(0, differenceInDays(prevDeadline, timelineStart));
        } else {
          startDay = Math.max(0, daysFromStart - 14);
        }

        positions[phase.id] = {
          left: startDay * dayWidth,
          width: Math.max((daysFromStart - startDay) * dayWidth, 20),
        };
      } else {
        // Position phases without dates at the start
        positions[phase.id] = {
          left: index * 30,
          width: 80,
        };
      }
    });

    return positions;
  }, [phases, timelineStart, dayWidth]);

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

  if (phases.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune phase à afficher
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Header with months */}
      <div className="flex border-b bg-muted/50">
        <div className="w-[200px] flex-shrink-0 px-3 py-2 font-medium text-sm border-r">
          Phases
        </div>
        <div className="flex-1 overflow-x-auto" ref={containerRef}>
          <div style={{ width: chartWidth, minWidth: "100%" }} className="flex">
            {months.map((month) => {
              const monthStart = month;
              const daysFromTimelineStart = differenceInDays(monthStart, timelineStart);
              const monthEnd = endOfMonth(month);
              const monthDays = differenceInDays(monthEnd, monthStart) + 1;
              
              return (
                <div
                  key={month.toISOString()}
                  className="text-xs text-muted-foreground py-2 px-2 border-r"
                  style={{ width: monthDays * dayWidth }}
                >
                  {format(month, "MMM yyyy", { locale: fr })}
                </div>
              );
            })}
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

                {/* Today indicator */}
                {todayPosition !== null && (
                  <div
                    ref={todayRef}
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: todayPosition }}
                  >
                    <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-2xs px-1.5 py-0.5 rounded-b font-medium whitespace-nowrap">
                      Aujourd'hui
                    </div>
                  </div>
                )}
              </svg>

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

                const statusConfig = PHASE_STATUS_CONFIG[phase.status as PhaseStatus] || PHASE_STATUS_CONFIG.pending;

                return (
                  <div
                    key={phase.id}
                    className="h-12 flex items-center border-b relative"
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "absolute h-7 rounded-md cursor-pointer transition-all hover:opacity-90",
                              phase.status === "completed" && "opacity-60"
                            )}
                            style={{
                              left: pos.left,
                              width: pos.width,
                              backgroundColor: phase.color || "#3B82F6",
                            }}
                            onClick={() => onPhaseClick?.(phase)}
                          >
                            <div className="h-full flex items-center px-2">
                              <span className="text-xs text-white font-medium truncate">
                                {phase.end_date && format(parseISO(phase.end_date), "d MMM", { locale: fr })}
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <div className="text-sm">
                            <p className="font-medium">{phase.name}</p>
                            <p className="text-muted-foreground">{statusConfig.label}</p>
                            {phase.end_date && (
                              <p>Échéance: {format(parseISO(phase.end_date), "d MMMM yyyy", { locale: fr })}</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
