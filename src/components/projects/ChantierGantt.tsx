import { useState, useRef, useCallback, useMemo } from "react";
import { ProjectLot } from "@/hooks/useChantier";
import { format, parseISO, differenceInDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameMonth, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LOT_STATUS } from "@/lib/projectTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface ChantierGanttProps {
  lots: ProjectLot[];
  onUpdateLot: (id: string, updates: { start_date?: string | null; end_date?: string | null }) => void;
  companies: Array<{ id: string; name: string }>;
}

type DragType = "move" | "resize-start" | "resize-end" | null;

interface DragState {
  lotId: string;
  type: DragType;
  startX: number;
  originalStartDate: Date | null;
  originalEndDate: Date | null;
}

export function ChantierGantt({ lots, onUpdateLot, companies }: ChantierGanttProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [tempDates, setTempDates] = useState<Record<string, { start: Date | null; end: Date | null }>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible date range (current month + buffer)
  const visibleStart = startOfMonth(subMonths(currentMonth, 1));
  const visibleEnd = endOfMonth(addMonths(currentMonth, 2));
  const days = eachDayOfInterval({ start: visibleStart, end: visibleEnd });
  const totalDays = days.length;

  // Calculate day width based on container
  const dayWidth = 40; // pixels per day

  const getPositionForDate = useCallback((date: Date): number => {
    const diff = differenceInDays(date, visibleStart);
    return diff * dayWidth;
  }, [visibleStart, dayWidth]);

  const getDateForPosition = useCallback((x: number): Date => {
    const dayIndex = Math.round(x / dayWidth);
    return addDays(visibleStart, dayIndex);
  }, [visibleStart, dayWidth]);

  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    lotId: string,
    type: DragType
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    setDragState({
      lotId,
      type,
      startX: e.clientX,
      originalStartDate: lot.start_date ? parseISO(lot.start_date) : null,
      originalEndDate: lot.end_date ? parseISO(lot.end_date) : null,
    });
  }, [lots]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaDays = Math.round(deltaX / dayWidth);

    if (deltaDays === 0) return;

    const { lotId, type, originalStartDate, originalEndDate } = dragState;

    let newStart = originalStartDate;
    let newEnd = originalEndDate;

    if (type === "move" && originalStartDate && originalEndDate) {
      newStart = addDays(originalStartDate, deltaDays);
      newEnd = addDays(originalEndDate, deltaDays);
    } else if (type === "resize-start" && originalStartDate) {
      newStart = addDays(originalStartDate, deltaDays);
      if (newEnd && newStart > newEnd) {
        newStart = newEnd;
      }
    } else if (type === "resize-end" && originalEndDate) {
      newEnd = addDays(originalEndDate, deltaDays);
      if (newStart && newEnd < newStart) {
        newEnd = newStart;
      }
    }

    setTempDates(prev => ({
      ...prev,
      [lotId]: { start: newStart, end: newEnd }
    }));
  }, [dragState, dayWidth]);

  const handleMouseUp = useCallback(() => {
    if (!dragState) return;

    const { lotId } = dragState;
    const temp = tempDates[lotId];

    if (temp) {
      onUpdateLot(lotId, {
        start_date: temp.start ? format(temp.start, "yyyy-MM-dd") : null,
        end_date: temp.end ? format(temp.end, "yyyy-MM-dd") : null,
      });
      toast.success("Dates mises à jour");
    }

    setDragState(null);
    setTempDates({});
  }, [dragState, tempDates, onUpdateLot]);

  const handleMouseLeave = useCallback(() => {
    if (dragState) {
      setDragState(null);
      setTempDates({});
    }
  }, [dragState]);

  // Group days by month for header
  const monthGroups = useMemo(() => {
    const groups: { month: Date; startIndex: number; count: number }[] = [];
    let currentMonthStart: Date | null = null;
    let startIndex = 0;
    let count = 0;

    days.forEach((day, index) => {
      if (!currentMonthStart || !isSameMonth(day, currentMonthStart)) {
        if (currentMonthStart) {
          groups.push({ month: currentMonthStart, startIndex, count });
        }
        currentMonthStart = day;
        startIndex = index;
        count = 1;
      } else {
        count++;
      }
    });

    if (currentMonthStart) {
      groups.push({ month: currentMonthStart, startIndex, count });
    }

    return groups;
  }, [days]);

  // Sort lots by start date for display
  const sortedLots = useMemo(() => {
    return [...lots].sort((a, b) => {
      if (!a.start_date && !b.start_date) return 0;
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    });
  }, [lots]);

  const lotsWithDates = sortedLots.filter(lot => lot.start_date && lot.end_date);
  const lotsWithoutDates = sortedLots.filter(lot => !lot.start_date || !lot.end_date);

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 py-2 font-medium">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Aujourd'hui
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {lotsWithDates.length} lot(s) planifié(s)
        </div>
      </div>

      {/* Gantt Chart */}
      <div 
        ref={containerRef}
        className="border rounded-lg overflow-auto bg-card"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ minWidth: totalDays * dayWidth + 200 }}>
          {/* Month Header */}
          <div className="flex border-b bg-muted/30 sticky top-0 z-20">
            <div className="w-[200px] min-w-[200px] px-3 py-2 font-medium border-r sticky left-0 bg-muted/30 z-30">
              Lots
            </div>
            <div className="flex">
              {monthGroups.map((group, idx) => (
                <div
                  key={idx}
                  className="border-r text-center py-2 font-medium text-sm"
                  style={{ width: group.count * dayWidth }}
                >
                  {format(group.month, "MMMM yyyy", { locale: fr })}
                </div>
              ))}
            </div>
          </div>

          {/* Day Header */}
          <div className="flex border-b sticky top-[41px] z-20">
            <div className="w-[200px] min-w-[200px] border-r sticky left-0 bg-card z-30" />
            <div className="flex">
              {days.map((day, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "text-center text-xs py-1 border-r",
                    isToday(day) && "bg-primary/10 font-bold text-primary",
                    day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/50" : "bg-card"
                  )}
                  style={{ width: dayWidth }}
                >
                  <div>{format(day, "d")}</div>
                  <div className="text-muted-foreground">{format(day, "EEE", { locale: fr })}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {lotsWithDates.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Aucun lot avec des dates planifiées
            </div>
          ) : (
            lotsWithDates.map((lot) => {
              const temp = tempDates[lot.id];
              const startDate = temp?.start || (lot.start_date ? parseISO(lot.start_date) : null);
              const endDate = temp?.end || (lot.end_date ? parseISO(lot.end_date) : null);

              if (!startDate || !endDate) return null;

              const left = getPositionForDate(startDate);
              const width = Math.max((differenceInDays(endDate, startDate) + 1) * dayWidth - 4, 20);
              const statusConfig = LOT_STATUS.find(s => s.value === lot.status) || LOT_STATUS[0];
              const company = companies.find(c => c.id === lot.crm_company_id);
              const isDragging = dragState?.lotId === lot.id;

              return (
                <div key={lot.id} className="flex border-b hover:bg-muted/20 transition-colors">
                  {/* Lot Info */}
                  <div className="w-[200px] min-w-[200px] px-3 py-2 border-r sticky left-0 bg-card z-10">
                    <div className="font-medium text-sm truncate">{lot.name}</div>
                    {company && (
                      <div className="text-xs text-muted-foreground truncate">{company.name}</div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="relative flex-1" style={{ height: 50 }}>
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {days.map((day, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "border-r h-full",
                            isToday(day) && "bg-primary/5",
                            (day.getDay() === 0 || day.getDay() === 6) && "bg-muted/30"
                          )}
                          style={{ width: dayWidth }}
                        />
                      ))}
                    </div>

                    {/* Lot Bar */}
                    <div
                      className={cn(
                        "absolute top-2 h-8 rounded-md flex items-center gap-1 px-2 cursor-move select-none transition-shadow",
                        isDragging && "shadow-lg ring-2 ring-primary/50"
                      )}
                      style={{
                        left: left + 2,
                        width,
                        backgroundColor: lot.color || statusConfig.color,
                        color: "#fff",
                      }}
                      onMouseDown={(e) => handleMouseDown(e, lot.id, "move")}
                    >
                      {/* Resize handle left */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-l-md"
                        onMouseDown={(e) => handleMouseDown(e, lot.id, "resize-start")}
                      />

                      {/* Content */}
                      <GripVertical className="h-3 w-3 opacity-60 flex-shrink-0" />
                      <span className="text-xs font-medium truncate flex-1">
                        {lot.name}
                      </span>

                      {/* Resize handle right */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r-md"
                        onMouseDown={(e) => handleMouseDown(e, lot.id, "resize-end")}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Lots without dates */}
      {lotsWithoutDates.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">
            Lots sans dates planifiées ({lotsWithoutDates.length}) :
          </p>
          <div className="flex flex-wrap gap-2">
            {lotsWithoutDates.map(lot => {
              const statusConfig = LOT_STATUS.find(s => s.value === lot.status) || LOT_STATUS[0];
              return (
                <Badge
                  key={lot.id}
                  variant="outline"
                  className="text-sm"
                  style={{ borderColor: statusConfig.color, color: statusConfig.color }}
                >
                  {lot.name}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
