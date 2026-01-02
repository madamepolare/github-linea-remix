import { useState, useRef, useCallback, useMemo } from "react";
import { ProjectLot } from "@/hooks/useChantier";
import { format, parseISO, differenceInDays, addDays, eachDayOfInterval, isToday, isSameMonth, startOfMonth, endOfMonth, addMonths, subMonths, eachWeekOfInterval, startOfWeek, endOfWeek, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LOT_STATUS } from "@/lib/projectTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  X,
  Maximize2,
  Building2,
  Clock,
  AlertTriangle,
  Filter,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface ChantierPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  lots: ProjectLot[];
  onUpdateLot: (id: string, updates: { start_date?: string | null; end_date?: string | null; status?: string }) => void;
  onCreateLot?: (name: string, start_date: string, end_date: string) => void;
  onDeleteLot?: (id: string) => void;
  onEditLot?: (lot: ProjectLot) => void;
  companies: Array<{ id: string; name: string }>;
  projectName?: string;
}

type DragType = "move" | "resize-start" | "resize-end" | null;

interface DragState {
  lotId: string;
  type: DragType;
  startX: number;
  originalStartDate: Date | null;
  originalEndDate: Date | null;
}

export function ChantierPlanningModal({
  isOpen,
  onClose,
  lots,
  onUpdateLot,
  onCreateLot,
  onDeleteLot,
  onEditLot,
  companies,
  projectName,
}: ChantierPlanningModalProps) {
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
  const [selectedLot, setSelectedLot] = useState<ProjectLot | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible date range (4 months around current)
  const visibleStart = startOfMonth(subMonths(currentMonth, 1));
  const visibleEnd = endOfMonth(addMonths(currentMonth, 3));
  
  const weeks = eachWeekOfInterval({ start: visibleStart, end: visibleEnd }, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: visibleStart, end: visibleEnd });
  
  const dayWidth = 20;
  const totalWidth = days.length * dayWidth;

  const getPositionForDate = useCallback((date: Date): number => {
    const diff = differenceInDays(date, visibleStart);
    return diff * dayWidth;
  }, [visibleStart, dayWidth]);

  const getDateForPosition = useCallback((x: number): Date => {
    const dayIndex = Math.round(x / dayWidth);
    return addDays(visibleStart, Math.max(0, dayIndex));
  }, [visibleStart, dayWidth]);

  // Filter lots
  const filteredLots = useMemo(() => {
    if (!statusFilter) return lots;
    return lots.filter(l => l.status === statusFilter);
  }, [lots, statusFilter]);

  // Sort lots by start date
  const sortedLots = useMemo(() => {
    return [...filteredLots].sort((a, b) => {
      if (!a.start_date && !b.start_date) return (a.sort_order || 0) - (b.sort_order || 0);
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    });
  }, [filteredLots]);

  // Stats
  const stats = useMemo(() => {
    const total = lots.length;
    const withDates = lots.filter(l => l.start_date && l.end_date).length;
    const completed = lots.filter(l => l.status === "completed").length;
    const inProgress = lots.filter(l => l.status === "in_progress").length;
    const delayed = lots.filter(l => {
      if (!l.end_date || l.status === "completed") return false;
      return isPast(parseISO(l.end_date));
    }).length;
    return { total, withDates, completed, inProgress, delayed };
  }, [lots]);

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
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (dragState) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedDate = getDateForPosition(x);
    
    setQuickAddRow({
      visible: true,
      name: "",
      startDate: clickedDate,
      endDate: addDays(clickedDate, 14),
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
          <div className="flex items-center gap-4">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Planning Chantier
              </DialogTitle>
              {projectName && (
                <p className="text-sm text-muted-foreground">{projectName}</p>
              )}
            </div>
            
            {/* Stats badges */}
            <div className="flex items-center gap-2 ml-4">
              <Badge variant="outline" className="text-xs">
                {stats.total} lots
              </Badge>
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {stats.inProgress} en cours
              </Badge>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                {stats.completed} terminés
              </Badge>
              {stats.delayed > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.delayed} en retard
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-2 py-1 font-medium text-sm min-w-[120px] text-center">
                {format(currentMonth, "MMMM yyyy", { locale: fr })}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              Aujourd'hui
            </Button>
            
            {/* Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  Filtrer
                  {statusFilter && <Badge className="ml-1 h-4 w-4 p-0 text-[10px]">1</Badge>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="space-y-1">
                  <Button
                    variant={statusFilter === null ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setStatusFilter(null)}
                  >
                    Tous les lots
                  </Button>
                  {LOT_STATUS.map((status) => (
                    <Button
                      key={status.value}
                      variant={statusFilter === status.value ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setStatusFilter(status.value)}
                    >
                      <div
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Lots List */}
          <div className="w-[220px] border-r flex flex-col bg-muted/30">
            <div className="px-3 py-2 border-b flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Lots ({sortedLots.length})
              </span>
              {onCreateLot && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setQuickAddRow({ visible: true, name: "", startDate: new Date(), endDate: addDays(new Date(), 14) })}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {sortedLots.map((lot) => {
                  const statusConfig = LOT_STATUS.find(s => s.value === lot.status) || LOT_STATUS[0];
                  const company = companies.find(c => c.id === lot.crm_company_id);
                  const isDelayed = lot.end_date && lot.status !== "completed" && isPast(parseISO(lot.end_date));
                  
                  return (
                    <div
                      key={lot.id}
                      className={cn(
                        "p-2 rounded-lg cursor-pointer transition-colors",
                        hoveredLotId === lot.id ? "bg-muted" : "hover:bg-muted/50",
                        selectedLot?.id === lot.id && "ring-1 ring-primary"
                      )}
                      onClick={() => setSelectedLot(lot)}
                      onMouseEnter={() => setHoveredLotId(lot.id)}
                      onMouseLeave={() => setHoveredLotId(null)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: lot.color || statusConfig.color }}
                        />
                        <span className="text-sm font-medium truncate flex-1">{lot.name}</span>
                        {isDelayed && (
                          <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                        )}
                      </div>
                      {company && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                          <Building2 className="h-2.5 w-2.5" />
                          <span className="truncate">{company.name}</span>
                        </div>
                      )}
                      {lot.start_date && lot.end_date && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          <span>
                            {format(parseISO(lot.start_date), "d MMM", { locale: fr })} - {format(parseISO(lot.end_date), "d MMM", { locale: fr })}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {sortedLots.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Aucun lot
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main Gantt Area */}
          <div 
            ref={containerRef}
            className="flex-1 overflow-auto"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div style={{ minWidth: totalWidth + 20 }}>
              {/* Month Header */}
              <div className="flex border-b bg-muted/40 sticky top-0 z-20">
                {monthGroups.map((group, idx) => (
                  <div
                    key={idx}
                    className="border-r text-center py-2 font-medium text-xs capitalize bg-muted/40"
                    style={{ width: group.count * dayWidth }}
                  >
                    {format(group.month, "MMMM yyyy", { locale: fr })}
                  </div>
                ))}
              </div>

              {/* Week numbers row */}
              <div className="flex border-b sticky top-[37px] z-20 bg-card">
                {weeks.map((weekStart, idx) => {
                  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                  const daysInWeek = differenceInDays(Math.min(weekEnd.getTime(), visibleEnd.getTime()), Math.max(weekStart.getTime(), visibleStart.getTime())) + 1;
                  const weekNum = format(weekStart, "w");
                  const hasToday = days.some(d => isToday(d) && d >= weekStart && d <= weekEnd);
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "text-center text-xs py-1.5 border-r",
                        hasToday && "bg-primary/10"
                      )}
                      style={{ width: Math.max(daysInWeek, 1) * dayWidth }}
                    >
                      S{weekNum}
                    </div>
                  );
                })}
              </div>

              {/* Lot Rows */}
              {sortedLots.length === 0 ? (
                <div 
                  className="flex items-center justify-center py-20 text-muted-foreground text-sm cursor-crosshair"
                  onClick={handleTimelineClick}
                >
                  <div className="text-center">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Cliquez sur la timeline pour créer un lot</p>
                  </div>
                </div>
              ) : (
                <>
                  {sortedLots.map((lot) => {
                    const temp = tempDates[lot.id];
                    const startDate = temp?.start || (lot.start_date ? parseISO(lot.start_date) : null);
                    const endDate = temp?.end || (lot.end_date ? parseISO(lot.end_date) : null);
                    const statusConfig = LOT_STATUS.find(s => s.value === lot.status) || LOT_STATUS[0];
                    const isDragging = dragState?.lotId === lot.id;
                    const isHovered = hoveredLotId === lot.id;
                    const hasDates = startDate && endDate;
                    const isDelayed = lot.end_date && lot.status !== "completed" && isPast(parseISO(lot.end_date));

                    const left = hasDates ? getPositionForDate(startDate) : 0;
                    const width = hasDates ? Math.max((differenceInDays(endDate, startDate) + 1) * dayWidth - 2, dayWidth) : 0;

                    return (
                      <div 
                        key={lot.id} 
                        className={cn(
                          "relative border-b transition-colors",
                          isHovered && "bg-muted/30"
                        )}
                        style={{ height: 40 }}
                        onMouseEnter={() => setHoveredLotId(lot.id)}
                        onMouseLeave={() => setHoveredLotId(null)}
                        onClick={(e) => {
                          if (!hasDates && !dragState) {
                            handleTimelineClick(e);
                          }
                        }}
                      >
                        {/* Today marker */}
                        {days.map((day, idx) => (
                          isToday(day) && (
                            <div
                              key={`today-${idx}`}
                              className="absolute top-0 bottom-0 w-0.5 bg-primary/70 z-[5]"
                              style={{ left: idx * dayWidth }}
                            />
                          )
                        ))}

                        {/* Lot Bar */}
                        {hasDates && (
                          <div
                            className={cn(
                              "absolute top-1.5 h-7 rounded flex items-center justify-center text-[10px] font-medium select-none transition-shadow cursor-grab active:cursor-grabbing",
                              isDragging && "shadow-lg ring-2 ring-primary/50 z-10",
                              isDelayed && "ring-1 ring-destructive/50"
                            )}
                            style={{
                              left: left + 1,
                              width: Math.max(width, 20),
                              backgroundColor: lot.color || statusConfig.color,
                              color: "#fff",
                            }}
                            onMouseDown={(e) => handleMouseDown(e, lot.id, "move")}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLot(lot);
                            }}
                          >
                            {/* Resize handles */}
                            <div
                              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-l"
                              onMouseDown={(e) => handleMouseDown(e, lot.id, "resize-start")}
                            />
                            
                            {width > 80 && (
                              <span className="truncate px-2">{lot.name}</span>
                            )}
                            
                            <div
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r"
                              onMouseDown={(e) => handleMouseDown(e, lot.id, "resize-end")}
                            />
                          </div>
                        )}

                        {/* No dates indicator */}
                        {!hasDates && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-muted/70 px-2 py-0.5 rounded text-[10px] text-muted-foreground">
                              Cliquez pour planifier "{lot.name}"
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Quick Add Row */}
              {quickAddRow.visible && (
                <div className="flex items-center gap-2 p-2 bg-primary/5 border-b">
                  <Input
                    value={quickAddRow.name}
                    onChange={(e) => setQuickAddRow(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nom du lot..."
                    className="h-8 text-sm w-48"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleQuickAdd();
                      if (e.key === "Escape") setQuickAddRow({ visible: false, name: "", startDate: null, endDate: null });
                    }}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs">
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
                  <span className="text-muted-foreground">→</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs">
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
                  <Button size="sm" className="h-8" onClick={handleQuickAdd} disabled={!quickAddRow.name.trim()}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Créer
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuickAddRow({ visible: false, name: "", startDate: null, endDate: null })}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lot Detail Sheet */}
        <Sheet open={!!selectedLot} onOpenChange={(open) => !open && setSelectedLot(null)}>
          <SheetContent className="sm:max-w-md">
            {selectedLot && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedLot.color || LOT_STATUS.find(s => s.value === selectedLot.status)?.color }}
                    />
                    {selectedLot.name}
                  </SheetTitle>
                </SheetHeader>
                
                <div className="space-y-4 mt-6">
                  {/* Status */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Statut</label>
                    <div className="flex gap-1 mt-1">
                      {LOT_STATUS.map((status) => (
                        <Button
                          key={status.value}
                          variant={selectedLot.status === status.value ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs"
                          style={selectedLot.status === status.value ? { backgroundColor: status.color } : {}}
                          onClick={() => {
                            onUpdateLot(selectedLot.id, { status: status.value });
                            setSelectedLot({ ...selectedLot, status: status.value });
                          }}
                        >
                          {status.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Company */}
                  {selectedLot.crm_company_id && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Entreprise</label>
                      <p className="text-sm mt-1">
                        {companies.find(c => c.id === selectedLot.crm_company_id)?.name || "-"}
                      </p>
                    </div>
                  )}
                  
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Début</label>
                      <p className="text-sm mt-1">
                        {selectedLot.start_date 
                          ? format(parseISO(selectedLot.start_date), "d MMMM yyyy", { locale: fr })
                          : "-"
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Fin</label>
                      <p className="text-sm mt-1">
                        {selectedLot.end_date 
                          ? format(parseISO(selectedLot.end_date), "d MMMM yyyy", { locale: fr })
                          : "-"
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Budget */}
                  {selectedLot.budget && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Budget</label>
                      <p className="text-sm mt-1">{selectedLot.budget.toLocaleString("fr-FR")} €</p>
                    </div>
                  )}
                  
                  {/* Duration */}
                  {selectedLot.start_date && selectedLot.end_date && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Durée</label>
                      <p className="text-sm mt-1">
                        {differenceInDays(parseISO(selectedLot.end_date), parseISO(selectedLot.start_date)) + 1} jours
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {onEditLot && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          onEditLot(selectedLot);
                          setSelectedLot(null);
                        }}
                      >
                        Modifier
                      </Button>
                    )}
                    {onDeleteLot && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          if (confirm("Supprimer ce lot ?")) {
                            onDeleteLot(selectedLot.id);
                            setSelectedLot(null);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </DialogContent>
    </Dialog>
  );
}
