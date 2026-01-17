import { useMemo, useRef, useState, useCallback } from "react";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, differenceInDays, addMonths, subMonths, addDays, isToday, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Calendar, Package, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DELIVERABLE_STATUS } from "@/lib/projectTypes";

interface Deliverable {
  id: string;
  name: string;
  description: string | null;
  due_date: string | null;
  status: string;
  phase_id: string | null;
}

interface DeliverablesTimelineProps {
  projectId: string;
  deliverables: Deliverable[];
  onDeliverableClick?: (deliverable: Deliverable) => void;
}

export function DeliverablesTimeline({ projectId, deliverables, onDeliverableClick }: DeliverablesTimelineProps) {
  const { phases } = useProjectPhases(projectId);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible date range (3 months around current)
  const visibleStart = startOfMonth(subMonths(currentMonth, 1));
  const visibleEnd = endOfMonth(addMonths(currentMonth, 2));
  
  const weeks = eachWeekOfInterval({ start: visibleStart, end: visibleEnd }, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: visibleStart, end: visibleEnd });
  
  const dayWidth = 28;
  const rowHeight = 40;
  const headerHeight = 60;

  const getPositionForDate = useCallback((date: Date): number => {
    const diff = differenceInDays(date, visibleStart);
    return diff * dayWidth;
  }, [visibleStart, dayWidth]);

  // Filter deliverables with due dates
  const deliverablesWithDates = useMemo(() => 
    deliverables.filter(d => d.due_date),
    [deliverables]
  );

  // Group deliverables by phase
  const groupedByPhase = useMemo(() => {
    const groups: Record<string, { phase: any; deliverables: Deliverable[] }> = {};
    
    for (const deliverable of deliverablesWithDates) {
      const phaseId = deliverable.phase_id || "no-phase";
      const phase = phases.find(p => p.id === phaseId);
      
      if (!groups[phaseId]) {
        groups[phaseId] = {
          phase: phase || { id: "no-phase", name: "Sans phase", color: "#6b7280" },
          deliverables: [],
        };
      }
      groups[phaseId].deliverables.push(deliverable);
    }

    // Sort deliverables by due date within each group
    for (const group of Object.values(groups)) {
      group.deliverables.sort((a, b) => {
        const dateA = a.due_date ? parseISO(a.due_date).getTime() : 0;
        const dateB = b.due_date ? parseISO(b.due_date).getTime() : 0;
        return dateA - dateB;
      });
    }

    return groups;
  }, [deliverablesWithDates, phases]);

  const orderedPhaseIds = useMemo(() => {
    const phaseOrder = phases.map(p => p.id);
    return Object.keys(groupedByPhase).sort((a, b) => {
      const indexA = phaseOrder.indexOf(a);
      const indexB = phaseOrder.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [groupedByPhase, phases]);

  const getStatusInfo = (status: string) => {
    const statusConfig = DELIVERABLE_STATUS.find(s => s.value === status);
    return statusConfig || { label: status, color: "#6b7280" };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
      case "validated":
        return CheckCircle2;
      case "in_progress":
        return Clock;
      default:
        return Package;
    }
  };

  const isOverdue = (deliverable: Deliverable) => {
    if (!deliverable.due_date) return false;
    if (deliverable.status === "delivered" || deliverable.status === "validated") return false;
    return differenceInDays(parseISO(deliverable.due_date), new Date()) < 0;
  };

  const totalRows = Object.values(groupedByPhase).reduce((sum, g) => sum + 1, 0); // One row per phase
  const totalHeight = totalRows * rowHeight + headerHeight;
  const totalWidth = days.length * dayWidth;

  if (deliverablesWithDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Calendar className="h-12 w-12 mb-4 opacity-50" />
        <p>Aucun livrable avec date d'échéance</p>
        <p className="text-sm mt-1">Ajoutez des dates aux livrables pour les voir ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="font-medium ml-2">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
          Aujourd'hui
        </Button>
      </div>

      {/* Timeline */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <ScrollArea className="w-full">
          <div 
            ref={containerRef}
            className="relative"
            style={{ width: totalWidth, minHeight: totalHeight }}
          >
            {/* Header with months and weeks */}
            <div className="sticky top-0 z-20 bg-background border-b" style={{ height: headerHeight }}>
              {/* Months row */}
              <div className="flex border-b" style={{ height: 30 }}>
                {Array.from(new Set(days.map(d => format(d, "yyyy-MM")))).map(monthKey => {
                  const monthDays = days.filter(d => format(d, "yyyy-MM") === monthKey);
                  const width = monthDays.length * dayWidth;
                  const monthDate = parseISO(`${monthKey}-01`);
                  return (
                    <div 
                      key={monthKey}
                      className={cn(
                        "flex items-center justify-center text-xs font-medium border-r shrink-0",
                        isSameMonth(monthDate, new Date()) && "bg-primary/5"
                      )}
                      style={{ width }}
                    >
                      {format(monthDate, "MMMM yyyy", { locale: fr })}
                    </div>
                  );
                })}
              </div>
              
              {/* Weeks row */}
              <div className="flex" style={{ height: 30 }}>
                {weeks.map((weekStart, i) => {
                  const weekEnd = addDays(weekStart, 6);
                  const daysInWeek = days.filter(d => d >= weekStart && d <= weekEnd);
                  const width = daysInWeek.length * dayWidth;
                  const weekNum = format(weekStart, "w");
                  return (
                    <div 
                      key={weekStart.toISOString()}
                      className="flex items-center justify-center text-xs text-muted-foreground border-r shrink-0"
                      style={{ width }}
                    >
                      S{weekNum}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today marker */}
            {days.some(d => isToday(d)) && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                style={{ 
                  left: getPositionForDate(new Date()) + dayWidth / 2,
                  top: headerHeight,
                }}
              />
            )}

            {/* Phase rows */}
            <div style={{ paddingTop: headerHeight }}>
              {orderedPhaseIds.map((phaseId, rowIndex) => {
                const { phase, deliverables: phaseDeliverables } = groupedByPhase[phaseId];
                
                return (
                  <div 
                    key={phaseId}
                    className={cn(
                      "relative border-b",
                      rowIndex % 2 === 0 ? "bg-muted/20" : "bg-background"
                    )}
                    style={{ height: rowHeight }}
                  >
                    {/* Phase label */}
                    <div 
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 bg-background/80 px-2 py-1 rounded"
                    >
                      <div 
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: phase.color }}
                      />
                      <span className="text-xs font-medium truncate max-w-[120px]">{phase.name}</span>
                    </div>

                    {/* Deliverables as milestones */}
                    <TooltipProvider>
                      {phaseDeliverables.map((deliverable) => {
                        if (!deliverable.due_date) return null;
                        const date = parseISO(deliverable.due_date);
                        const x = getPositionForDate(date);
                        const statusInfo = getStatusInfo(deliverable.status);
                        const StatusIcon = getStatusIcon(deliverable.status);
                        const overdue = isOverdue(deliverable);

                        return (
                          <Tooltip key={deliverable.id}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer transition-transform hover:scale-110",
                                  "flex items-center justify-center"
                                )}
                                style={{ left: x + dayWidth / 2 }}
                                onClick={() => onDeliverableClick?.(deliverable)}
                              >
                                <div 
                                  className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center shadow-sm border-2",
                                    overdue && "ring-2 ring-destructive ring-offset-1"
                                  )}
                                  style={{ 
                                    backgroundColor: `${statusInfo.color}20`,
                                    borderColor: statusInfo.color,
                                  }}
                                >
                                  {overdue ? (
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                  ) : (
                                    <StatusIcon 
                                      className="h-4 w-4" 
                                      style={{ color: statusInfo.color }}
                                    />
                                  )}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">{deliverable.name}</p>
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge 
                                    variant="secondary" 
                                    className="text-2xs"
                                    style={{ 
                                      backgroundColor: `${statusInfo.color}20`,
                                      color: statusInfo.color,
                                    }}
                                  >
                                    {statusInfo.label}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    {format(date, "d MMM yyyy", { locale: fr })}
                                  </span>
                                </div>
                                {overdue && (
                                  <p className="text-xs text-destructive">En retard</p>
                                )}
                                {deliverable.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {deliverable.description}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </TooltipProvider>
                  </div>
                );
              })}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-4 bg-primary" />
          <span>Aujourd'hui</span>
        </div>
        {DELIVERABLE_STATUS.slice(0, 4).map(status => (
          <div key={status.value} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-full border-2"
              style={{ borderColor: status.color, backgroundColor: `${status.color}20` }}
            />
            <span>{status.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}