import { useState, useRef, useCallback, useMemo } from "react";
import { ProjectLot } from "@/hooks/useChantier";
import { format, parseISO, differenceInDays, addDays, eachDayOfInterval, isToday, isSameMonth, startOfMonth, endOfMonth, addMonths, subMonths, eachWeekOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LOT_STATUS } from "@/lib/projectTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ChantierGanttProps {
  lots: ProjectLot[];
  onUpdateLot: (id: string, updates: { start_date?: string | null; end_date?: string | null }) => void;
  onCreateLot?: (name: string, start_date: string, end_date: string) => void;
  onDeleteLot?: (id: string) => void;
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

export function ChantierGantt({ lots, onUpdateLot, onCreateLot, onDeleteLot, companies }: ChantierGanttProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [tempDates, setTempDates] = useState<Record<string, { start: Date | null; end: Date | null }>>({});
  const [quickAddRow, setQuickAddRow] = useState<{ visible: boolean; name: string; startDate: Date | null; endDate: Date | null }>({
    visible: false,
    name: "",
    startDate: null,
    endDate: null,
  });
  const [hoveredLotId, setHoveredLotId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible date range (3 months around current)
  const visibleStart = startOfMonth(subMonths(currentMonth, 1));
  const visibleEnd = endOfMonth(addMonths(currentMonth, 2));
  
  // Use weeks for a cleaner timeline
  const weeks = eachWeekOfInterval({ start: visibleStart, end: visibleEnd }, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: visibleStart, end: visibleEnd });
  
  // Simplified day width for faster rendering
  const dayWidth = 24;
  const totalWidth = days.length * dayWidth;

  const getPositionForDate = useCallback((date: Date): number => {
    const diff = differenceInDays(date, visibleStart);
    return diff * dayWidth;
  }, [visibleStart, dayWidth]);

  const getDateForPosition = useCallback((x: number): Date => {
    const dayIndex = Math.round(x / dayWidth);
    return addDays(visibleStart, Math.max(0, dayIndex));
  }, [visibleStart, dayWidth]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, lotId: string, type: DragType) => {
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
      if (newEnd && newStart > newEnd) newStart = newEnd;
    } else if (type === "resize-end" && originalEndDate) {
      newEnd = addDays(originalEndDate, deltaDays);
      if (newStart && newEnd < newStart) newEnd = newStart;
    }

    setTempDates(prev => ({ ...prev, [lotId]: { start: newStart, end: newEnd } }));
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
      toast.success("Planning mis à jour");
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

  // Quick add lot via timeline click
  const handleTimelineClick = useCallback((e: React.MouseEvent, rowIndex: number) => {
    if (dragState) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedDate = getDateForPosition(x);
    
    setQuickAddRow({
      visible: true,
      name: "",
      startDate: clickedDate,
      endDate: addDays(clickedDate, 14), // Default 2 weeks duration
    });
  }, [dragState, getDateForPosition]);

  const handleQuickAdd = useCallback(() => {
    if (!quickAddRow.name.trim() || !quickAddRow.startDate || !quickAddRow.endDate || !onCreateLot) return;
    
    onCreateLot(
      quickAddRow.name.trim(),
      format(quickAddRow.startDate, "yyyy-MM-dd"),
      format(quickAddRow.endDate, "yyyy-MM-dd")
    );
    
    setQuickAddRow({ visible: false, name: "", startDate: null, endDate: null });
    toast.success("Lot créé");
  }, [quickAddRow, onCreateLot]);

  // Month groups for header
  const monthGroups = useMemo(() => {
    const groups: { month: Date; startIndex: number; count: number }[] = [];
    let currentMonthStart: Date | null = null;
    let startIndex = 0;
    let count = 0;

    days.forEach((day, index) => {
      if (!currentMonthStart || !isSameMonth(day, currentMonthStart)) {
        if (currentMonthStart) groups.push({ month: currentMonthStart, startIndex, count });
        currentMonthStart = day;
        startIndex = index;
        count = 1;
      } else {
        count++;
      }
    });
    if (currentMonthStart) groups.push({ month: currentMonthStart, startIndex, count });
    return groups;
  }, [days]);

  // Sort lots by start date
  const sortedLots = useMemo(() => {
    return [...lots].sort((a, b) => {
      if (!a.start_date && !b.start_date) return (a.sort_order || 0) - (b.sort_order || 0);
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    });
  }, [lots]);

  const lotsWithDates = sortedLots.filter(lot => lot.start_date && lot.end_date);
  const lotsWithoutDates = sortedLots.filter(lot => !lot.start_date || !lot.end_date);

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-3 py-1.5 font-medium text-sm min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8" onClick={() => setCurrentMonth(new Date())}>
            <CalendarIcon className="h-3.5 w-3.5 mr-1" />
            Aujourd'hui
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{lotsWithDates.length} planifié(s)</span>
          {lotsWithoutDates.length > 0 && (
            <span className="text-orange-500">• {lotsWithoutDates.length} sans dates</span>
          )}
        </div>
      </div>

      {/* Gantt Chart */}
      <div 
        ref={containerRef}
        className="border rounded-lg overflow-auto bg-card"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ maxHeight: "60vh" }}
      >
        <div style={{ minWidth: totalWidth + 180 }}>
          {/* Month Header */}
          <div className="flex border-b bg-muted/40 sticky top-0 z-20">
            <div className="w-[180px] min-w-[180px] px-2 py-1.5 text-xs font-medium border-r sticky left-0 bg-muted/40 z-30">
              Lots
            </div>
            <div className="flex">
              {monthGroups.map((group, idx) => (
                <div
                  key={idx}
                  className="border-r text-center py-1.5 font-medium text-xs capitalize"
                  style={{ width: group.count * dayWidth }}
                >
                  {format(group.month, "MMM yyyy", { locale: fr })}
                </div>
              ))}
            </div>
          </div>

          {/* Week numbers row */}
          <div className="flex border-b sticky top-[33px] z-20">
            <div className="w-[180px] min-w-[180px] border-r sticky left-0 bg-card z-30 text-xs text-muted-foreground px-2 py-1">
              Semaine
            </div>
            <div className="flex">
              {weeks.map((weekStart, idx) => {
                const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                const daysInWeek = differenceInDays(Math.min(weekEnd.getTime(), visibleEnd.getTime()), Math.max(weekStart.getTime(), visibleStart.getTime())) + 1;
                const weekNum = format(weekStart, "w");
                return (
                  <div
                    key={idx}
                    className={cn(
                      "text-center text-xs py-1 border-r bg-card",
                      isToday(weekStart) && "bg-primary/10"
                    )}
                    style={{ width: Math.max(daysInWeek, 1) * dayWidth }}
                  >
                    S{weekNum}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lot Rows */}
          {lotsWithDates.length === 0 && lotsWithoutDates.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Aucun lot - cliquez sur la timeline pour en créer un
            </div>
          ) : (
            <>
              {sortedLots.map((lot) => {
                const temp = tempDates[lot.id];
                const startDate = temp?.start || (lot.start_date ? parseISO(lot.start_date) : null);
                const endDate = temp?.end || (lot.end_date ? parseISO(lot.end_date) : null);
                const statusConfig = LOT_STATUS.find(s => s.value === lot.status) || LOT_STATUS[0];
                const company = companies.find(c => c.id === lot.crm_company_id);
                const isDragging = dragState?.lotId === lot.id;
                const isHovered = hoveredLotId === lot.id;
                const hasDates = startDate && endDate;

                const left = hasDates ? getPositionForDate(startDate) : 0;
                const width = hasDates ? Math.max((differenceInDays(endDate, startDate) + 1) * dayWidth - 2, dayWidth) : 0;

                return (
                  <div 
                    key={lot.id} 
                    className={cn(
                      "flex border-b transition-colors",
                      isHovered && "bg-muted/30"
                    )}
                    onMouseEnter={() => setHoveredLotId(lot.id)}
                    onMouseLeave={() => setHoveredLotId(null)}
                  >
                    {/* Lot Info */}
                    <div className="w-[180px] min-w-[180px] px-2 py-1.5 border-r sticky left-0 bg-card z-10 flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: lot.color || statusConfig.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{lot.name}</div>
                        {company && <div className="text-[10px] text-muted-foreground truncate">{company.name}</div>}
                      </div>
                      {onDeleteLot && isHovered && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-destructive hover:text-destructive"
                          onClick={() => onDeleteLot(lot.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Timeline */}
                    <div 
                      className="relative flex-1 cursor-crosshair"
                      style={{ height: 36 }}
                      onClick={(e) => !hasDates && handleTimelineClick(e, 0)}
                    >
                      {/* Today marker */}
                      {days.map((day, idx) => (
                        isToday(day) && (
                          <div
                            key={idx}
                            className="absolute top-0 bottom-0 w-0.5 bg-primary/60 z-5"
                            style={{ left: idx * dayWidth }}
                          />
                        )
                      ))}

                      {/* Lot Bar */}
                      {hasDates && (
                        <div
                          className={cn(
                            "absolute top-1 h-7 rounded flex items-center justify-center text-[10px] font-medium select-none transition-shadow cursor-grab active:cursor-grabbing",
                            isDragging && "shadow-lg ring-2 ring-primary/50 z-10"
                          )}
                          style={{
                            left: left + 1,
                            width: Math.max(width, 20),
                            backgroundColor: lot.color || statusConfig.color,
                            color: "#fff",
                          }}
                          onMouseDown={(e) => handleMouseDown(e, lot.id, "move")}
                        >
                          {/* Resize handles */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-l"
                            onMouseDown={(e) => handleMouseDown(e, lot.id, "resize-start")}
                          />
                          
                          {width > 60 && (
                            <span className="truncate px-1">{lot.name}</span>
                          )}
                          
                          <div
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r"
                            onMouseDown={(e) => handleMouseDown(e, lot.id, "resize-end")}
                          />
                        </div>
                      )}

                      {/* No dates indicator */}
                      {!hasDates && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                          <span className="bg-muted/50 px-2 py-0.5 rounded text-[10px]">
                            Cliquez pour planifier
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Quick Add Row */}
          {quickAddRow.visible && (
            <div className="flex border-b bg-primary/5">
              <div className="w-[180px] min-w-[180px] px-2 py-1.5 border-r sticky left-0 bg-primary/5 z-10">
                <Input
                  value={quickAddRow.name}
                  onChange={(e) => setQuickAddRow(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom du lot..."
                  className="h-7 text-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleQuickAdd();
                    if (e.key === "Escape") setQuickAddRow({ visible: false, name: "", startDate: null, endDate: null });
                  }}
                />
              </div>
              <div className="relative flex-1 flex items-center gap-2 px-2" style={{ height: 36 }}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 text-xs">
                      {quickAddRow.startDate ? format(quickAddRow.startDate, "d MMM", { locale: fr }) : "Début"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={quickAddRow.startDate || undefined}
                      onSelect={(date) => setQuickAddRow(prev => ({ ...prev, startDate: date || null }))}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-xs text-muted-foreground">→</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 text-xs">
                      {quickAddRow.endDate ? format(quickAddRow.endDate, "d MMM", { locale: fr }) : "Fin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={quickAddRow.endDate || undefined}
                      onSelect={(date) => setQuickAddRow(prev => ({ ...prev, endDate: date || null }))}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                <Button size="sm" className="h-6 text-xs" onClick={handleQuickAdd} disabled={!quickAddRow.name.trim()}>
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs" 
                  onClick={() => setQuickAddRow({ visible: false, name: "", startDate: null, endDate: null })}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Add button at bottom */}
          {!quickAddRow.visible && onCreateLot && (
            <div className="flex border-b hover:bg-muted/20 transition-colors">
              <div className="w-[180px] min-w-[180px] px-2 py-1.5 border-r sticky left-0 bg-card z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full justify-start text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setQuickAddRow({
                    visible: true,
                    name: "",
                    startDate: new Date(),
                    endDate: addDays(new Date(), 14),
                  })}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter un lot
                </Button>
              </div>
              <div className="flex-1" style={{ height: 36 }} />
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>• Glissez pour déplacer</span>
        <span>• Bordures pour redimensionner</span>
        <span>• Double-clic sur lot sans date pour planifier</span>
      </div>
    </div>
  );
}
