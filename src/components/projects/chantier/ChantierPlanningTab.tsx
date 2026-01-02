import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { ProjectLot } from "@/hooks/useChantier";
import { useInterventions, Intervention, CreateInterventionInput } from "@/hooks/useInterventions";
import { format, parseISO, differenceInDays, addDays, eachDayOfInterval, isToday, isSameMonth, startOfMonth, endOfMonth, addMonths, subMonths, eachWeekOfInterval, startOfWeek, endOfWeek, isPast, getISOWeek, isWeekend, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LOT_STATUS } from "@/lib/projectTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InterventionDialog } from "./planning/InterventionDialog";
import { AISuggestionPanel } from "./planning/AISuggestionPanel";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Building2,
  Clock,
  AlertTriangle,
  Filter,
  Download,
  ZoomIn,
  ZoomOut,
  GanttChart,
  Pencil,
  MoreVertical,
  Users,
  Layers,
  ArrowRight,
  Check,
  X,
  Eye,
  EyeOff,
  Copy,
  Sparkles,
  RefreshCw,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface ChantierPlanningTabProps {
  projectId: string;
  lots: ProjectLot[];
  lotsLoading: boolean;
  onUpdateLot: (id: string, updates: { start_date?: string | null; end_date?: string | null; status?: string }) => void;
  onCreateLot?: (name: string, start_date: string, end_date: string) => void;
  onDeleteLot?: (id: string) => void;
  onEditLot?: (lot: ProjectLot) => void;
  companies: Array<{ id: string; name: string }>;
  projectName?: string;
}

type DragType = "move" | "resize-start" | "resize-end" | null;
type ZoomLevel = "day" | "week" | "month";
type ViewMode = "lots" | "interventions" | "combined";

interface DragState {
  itemId: string;
  itemType: "lot" | "intervention";
  type: DragType;
  startX: number;
  originalStartDate: Date | null;
  originalEndDate: Date | null;
}

const INTERVENTION_STATUS = [
  { value: "planned", label: "Planifié", color: "#94a3b8" },
  { value: "in_progress", label: "En cours", color: "#3b82f6" },
  { value: "completed", label: "Terminé", color: "#22c55e" },
  { value: "delayed", label: "En retard", color: "#ef4444" },
  { value: "cancelled", label: "Annulé", color: "#6b7280" },
];

export function ChantierPlanningTab({
  projectId,
  lots,
  lotsLoading,
  onUpdateLot,
  onCreateLot,
  onDeleteLot,
  onEditLot,
  companies,
  projectName,
}: ChantierPlanningTabProps) {
  const { interventions, isLoading: interventionsLoading, createMultipleInterventions, updateIntervention, deleteIntervention } = useInterventions(projectId);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("week");
  const [viewMode, setViewMode] = useState<ViewMode>("combined");
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [tempDates, setTempDates] = useState<Record<string, { start: Date | null; end: Date | null }>>({});
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [preselectedLotId, setPreselectedLotId] = useState<string | undefined>();
  const [preselectedDates, setPreselectedDates] = useState<{ start: Date; end: Date } | undefined>();
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [collapsedLots, setCollapsedLots] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<HTMLDivElement>(null);

  // Calculate visible date range based on zoom
  const visibleStart = startOfMonth(subMonths(currentMonth, zoomLevel === "month" ? 3 : 1));
  const visibleEnd = endOfMonth(addMonths(currentMonth, zoomLevel === "month" ? 9 : 4));
  
  const weeks = eachWeekOfInterval({ start: visibleStart, end: visibleEnd }, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: visibleStart, end: visibleEnd });
  
  // Day width based on zoom level
  const dayWidth = zoomLevel === "day" ? 36 : zoomLevel === "week" ? 20 : 8;
  const totalWidth = days.length * dayWidth;
  const rowHeight = 44;
  const interventionRowHeight = 32;
  const headerHeight = 80;
  const sidebarWidth = 280;

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
    let result = lots;
    if (statusFilter) {
      result = result.filter(l => l.status === statusFilter);
    }
    if (companyFilter) {
      result = result.filter(l => l.crm_company_id === companyFilter);
    }
    return result;
  }, [lots, statusFilter, companyFilter]);

  // Sort lots by start date
  const sortedLots = useMemo(() => {
    return [...filteredLots].sort((a, b) => {
      if (!a.start_date && !b.start_date) return (a.sort_order || 0) - (b.sort_order || 0);
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    });
  }, [filteredLots]);

  // Group interventions by lot
  const interventionsByLot = useMemo(() => {
    const map: Record<string, Intervention[]> = {};
    for (const lot of sortedLots) {
      map[lot.id] = interventions.filter(i => i.lot_id === lot.id);
    }
    return map;
  }, [interventions, sortedLots]);

  // Stats
  const stats = useMemo(() => {
    const totalLots = lots.length;
    const totalInterventions = interventions.length;
    const completedInterventions = interventions.filter(i => i.status === "completed").length;
    const delayedInterventions = interventions.filter(i => i.status === "delayed" || (i.end_date && isPast(parseISO(i.end_date)) && i.status !== "completed")).length;
    return { totalLots, totalInterventions, completedInterventions, delayedInterventions };
  }, [lots, interventions]);

  // Toggle lot collapse
  const toggleLotCollapse = (lotId: string) => {
    setCollapsedLots(prev => {
      const next = new Set(prev);
      if (next.has(lotId)) {
        next.delete(lotId);
      } else {
        next.add(lotId);
      }
      return next;
    });
  };

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, itemId: string, itemType: "lot" | "intervention", type: DragType) => {
    e.preventDefault();
    e.stopPropagation();
    
    let originalStartDate: Date | null = null;
    let originalEndDate: Date | null = null;

    if (itemType === "lot") {
      const lot = lots.find(l => l.id === itemId);
      originalStartDate = lot?.start_date ? parseISO(lot.start_date) : null;
      originalEndDate = lot?.end_date ? parseISO(lot.end_date) : null;
    } else {
      const intervention = interventions.find(i => i.id === itemId);
      originalStartDate = intervention?.start_date ? parseISO(intervention.start_date) : null;
      originalEndDate = intervention?.end_date ? parseISO(intervention.end_date) : null;
    }

    if (!originalStartDate || !originalEndDate) return;

    setDragState({
      itemId,
      itemType,
      type,
      startX: e.clientX,
      originalStartDate,
      originalEndDate,
    });
  }, [lots, interventions]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaDays = Math.round(deltaX / dayWidth);
    if (deltaDays === 0 && !tempDates[dragState.itemId]) return;

    const { itemId, type, originalStartDate, originalEndDate } = dragState;
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

    setTempDates(prev => ({ ...prev, [itemId]: { start: newStart, end: newEnd } }));
  }, [dragState, dayWidth, tempDates]);

  const handleMouseUp = useCallback(() => {
    if (!dragState) return;
    const { itemId, itemType } = dragState;
    const temp = tempDates[itemId];

    if (temp) {
      if (itemType === "lot") {
        onUpdateLot(itemId, {
          start_date: temp.start ? format(temp.start, "yyyy-MM-dd") : null,
          end_date: temp.end ? format(temp.end, "yyyy-MM-dd") : null,
        });
      } else {
        updateIntervention.mutate({
          id: itemId,
          start_date: temp.start ? format(temp.start, "yyyy-MM-dd") : undefined,
          end_date: temp.end ? format(temp.end, "yyyy-MM-dd") : undefined,
        });
      }
      toast.success("Planning mis à jour");
    }

    setDragState(null);
    setTempDates({});
  }, [dragState, tempDates, onUpdateLot, updateIntervention]);

  const handleMouseLeave = useCallback(() => {
    if (dragState) {
      setDragState(null);
      setTempDates({});
    }
  }, [dragState]);

  // Click on timeline to add intervention
  const handleTimelineClick = useCallback((e: React.MouseEvent, lotId: string) => {
    if (dragState) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedDate = getDateForPosition(x);
    
    setPreselectedLotId(lotId);
    setPreselectedDates({ start: clickedDate, end: addDays(clickedDate, 2) });
    setShowAddDialog(true);
  }, [dragState, getDateForPosition]);

  // Handle saving interventions
  const handleSaveInterventions = useCallback((newInterventions: CreateInterventionInput[]) => {
    createMultipleInterventions.mutate(newInterventions);
  }, [createMultipleInterventions]);

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

  // Calculate row positions with interventions
  const rowPositions = useMemo(() => {
    const positions: { lotId: string; y: number; height: number }[] = [];
    let currentY = 0;

    for (const lot of sortedLots) {
      const lotInterventions = interventionsByLot[lot.id] || [];
      const isCollapsed = collapsedLots.has(lot.id);
      const showInterventions = viewMode !== "lots" && lotInterventions.length > 0 && !isCollapsed;
      
      const height = rowHeight + (showInterventions ? lotInterventions.length * interventionRowHeight : 0);
      positions.push({ lotId: lot.id, y: currentY, height });
      currentY += height;
    }

    return positions;
  }, [sortedLots, interventionsByLot, viewMode, collapsedLots]);

  const totalHeight = rowPositions.reduce((acc, p) => acc + p.height, 0);

  // Export A1 PDF - keeping simplified version
  const handleExportA1 = useCallback(async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [841, 594] });
      // Header
      pdf.setFillColor(17, 24, 39);
      pdf.rect(0, 0, 841, 45, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Planning Chantier - ${projectName || "Projet"}`, 20, 28);
      pdf.setFontSize(11);
      pdf.text(`Généré le ${format(new Date(), "d MMMM yyyy à HH:mm", { locale: fr })}`, 20, 38);
      
      // Stats
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(10);
      pdf.text(`${stats.totalLots} lots | ${stats.totalInterventions} interventions | ${stats.completedInterventions} terminées${stats.delayedInterventions > 0 ? ` | ${stats.delayedInterventions} en retard` : ""}`, 20, 55);

      pdf.save(`planning-chantier-${projectName?.toLowerCase().replace(/\s+/g, "-") || "projet"}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Planning exporté en A1");
    } catch (error) {
      console.error(error);
      toast.error("Erreur export");
    } finally {
      setIsExporting(false);
    }
  }, [projectName, stats]);

  // Navigate to today
  const goToToday = () => setCurrentMonth(new Date());

  // Loading state
  if (lotsLoading || interventionsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button variant={viewMode === "lots" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("lots")}>
              <Layers className="w-4 h-4 mr-1" />
              Lots
            </Button>
            <Button variant={viewMode === "interventions" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("interventions")}>
              <GanttChart className="w-4 h-4 mr-1" />
              Interventions
            </Button>
            <Button variant={viewMode === "combined" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("combined")}>
              <Maximize2 className="w-4 h-4 mr-1" />
              Combiné
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button variant={zoomLevel === "day" ? "secondary" : "ghost"} size="sm" onClick={() => setZoomLevel("day")}>
              Jour
            </Button>
            <Button variant={zoomLevel === "week" ? "secondary" : "ghost"} size="sm" onClick={() => setZoomLevel("week")}>
              Semaine
            </Button>
            <Button variant={zoomLevel === "month" ? "secondary" : "ghost"} size="sm" onClick={() => setZoomLevel("month")}>
              Mois
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Aujourd'hui
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats badges */}
          <div className="hidden md:flex items-center gap-2 mr-2">
            <Badge variant="secondary" className="gap-1">
              <Layers className="w-3 h-3" />
              {stats.totalLots} lots
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <GanttChart className="w-3 h-3" />
              {stats.totalInterventions} interventions
            </Badge>
            {stats.delayedInterventions > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.delayedInterventions} retard
              </Badge>
            )}
          </div>

          {/* Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-1" />
                Filtres
                {(statusFilter || companyFilter) && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {[statusFilter, companyFilter].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut</label>
                  <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      {LOT_STATUS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Entreprise</label>
                  <Select value={companyFilter || "all"} onValueChange={(v) => setCompanyFilter(v === "all" ? null : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les entreprises" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les entreprises</SelectItem>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(statusFilter || companyFilter) && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => { setStatusFilter(null); setCompanyFilter(null); }}>
                    <X className="w-4 h-4 mr-1" />
                    Réinitialiser
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" onClick={() => setShowAIPanel(!showAIPanel)}>
            <Sparkles className="w-4 h-4 mr-1" />
            IA
          </Button>

          <Button size="sm" onClick={() => { setPreselectedLotId(undefined); setPreselectedDates(undefined); setShowAddDialog(true); }}>
            <Plus className="w-4 h-4 mr-1" />
            Intervention
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportA1} disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                Exporter PDF A1
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCollapsedLots(new Set(sortedLots.map(l => l.id)))}>
                <EyeOff className="w-4 h-4 mr-2" />
                Réduire tout
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCollapsedLots(new Set())}>
                <Eye className="w-4 h-4 mr-2" />
                Développer tout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Gantt chart */}
        <div className="flex-1 overflow-hidden" ref={ganttRef}>
          {sortedLots.length === 0 ? (
            <EmptyState
              icon={GanttChart}
              title="Aucun lot"
              description="Créez des lots dans l'onglet 'Lots & Intervenants' pour planifier les interventions."
            />
          ) : (
            <div
              className="h-full overflow-auto"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              <div style={{ minWidth: sidebarWidth + totalWidth }}>
                {/* Header */}
                <div className="sticky top-0 z-10 flex" style={{ height: headerHeight }}>
                  {/* Sidebar header */}
                  <div
                    className="shrink-0 bg-background border-r border-b flex flex-col justify-end px-3 pb-2"
                    style={{ width: sidebarWidth }}
                  >
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Lots / Interventions
                    </span>
                  </div>

                  {/* Timeline header */}
                  <div className="flex-1 bg-muted/30 border-b">
                    {/* Months row */}
                    <div className="flex h-10 border-b">
                      {monthGroups.map((group, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-center border-r text-sm font-medium"
                          style={{ width: group.count * dayWidth }}
                        >
                          {format(group.month, "MMMM yyyy", { locale: fr })}
                        </div>
                      ))}
                    </div>

                    {/* Weeks/Days row */}
                    <div className="flex h-10">
                      {zoomLevel === "day" ? (
                        days.map((day, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-center justify-center border-r text-xs",
                              isToday(day) && "bg-primary/10 font-bold text-primary",
                              isWeekend(day) && "bg-muted/50"
                            )}
                            style={{ width: dayWidth }}
                          >
                            {format(day, "d")}
                          </div>
                        ))
                      ) : zoomLevel === "week" ? (
                        weeks.map((week, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-center border-r text-xs font-medium"
                            style={{ width: 7 * dayWidth }}
                          >
                            S{getISOWeek(week)}
                          </div>
                        ))
                      ) : (
                        monthGroups.map((group, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-center border-r text-xs"
                            style={{ width: group.count * dayWidth }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Rows */}
                <div style={{ height: totalHeight }}>
                  {sortedLots.map((lot, lotIndex) => {
                    const position = rowPositions[lotIndex];
                    const lotInterventions = interventionsByLot[lot.id] || [];
                    const isCollapsed = collapsedLots.has(lot.id);
                    const showInterventions = viewMode !== "lots" && lotInterventions.length > 0 && !isCollapsed;
                    const statusConfig = LOT_STATUS.find(s => s.value === lot.status) || LOT_STATUS[0];
                    const company = companies.find(c => c.id === lot.crm_company_id);
                    const isDelayed = lot.end_date && lot.status !== "completed" && isPast(parseISO(lot.end_date));

                    const lotTempDates = tempDates[lot.id];
                    const lotStartDate = lotTempDates?.start || (lot.start_date ? parseISO(lot.start_date) : null);
                    const lotEndDate = lotTempDates?.end || (lot.end_date ? parseISO(lot.end_date) : null);

                    return (
                      <div key={lot.id} style={{ height: position.height }}>
                        {/* Lot row */}
                        <div className="flex" style={{ height: rowHeight }}>
                          {/* Sidebar */}
                          <div
                            className={cn(
                              "shrink-0 flex items-center gap-2 px-3 border-r border-b bg-background",
                              hoveredItemId === lot.id && "bg-muted/50"
                            )}
                            style={{ width: sidebarWidth }}
                            onMouseEnter={() => setHoveredItemId(lot.id)}
                            onMouseLeave={() => setHoveredItemId(null)}
                          >
                            {/* Collapse toggle */}
                            {lotInterventions.length > 0 && viewMode !== "lots" && (
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => toggleLotCollapse(lot.id)}
                              >
                                <ChevronRight
                                  className={cn(
                                    "w-4 h-4 transition-transform",
                                    !isCollapsed && "rotate-90"
                                  )}
                                />
                              </Button>
                            )}

                            {/* Color dot */}
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: lot.color || statusConfig.color }}
                            />

                            {/* Name & company */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{lot.name}</span>
                                {lotInterventions.length > 0 && (
                                  <Badge variant="outline" className="shrink-0 text-xs">
                                    {lotInterventions.length}
                                  </Badge>
                                )}
                              </div>
                              {company && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Building2 className="w-3 h-3" />
                                  <span className="truncate">{company.name}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setPreselectedLotId(lot.id); setShowAddDialog(true); }}>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Ajouter intervention
                                </DropdownMenuItem>
                                {onEditLot && (
                                  <DropdownMenuItem onClick={() => onEditLot(lot)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Timeline */}
                          <div
                            className={cn(
                              "flex-1 relative border-b cursor-pointer",
                              lotIndex % 2 === 0 ? "bg-background" : "bg-muted/20"
                            )}
                            onClick={(e) => handleTimelineClick(e, lot.id)}
                          >
                            {/* Today line */}
                            {(() => {
                              const todayPos = getPositionForDate(new Date());
                              if (todayPos >= 0 && todayPos <= totalWidth) {
                                return (
                                  <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-primary/60 z-10"
                                    style={{ left: todayPos }}
                                  />
                                );
                              }
                              return null;
                            })()}

                            {/* Weekend backgrounds */}
                            {zoomLevel !== "month" && days.map((day, idx) => (
                              isWeekend(day) && (
                                <div
                                  key={idx}
                                  className="absolute top-0 bottom-0 bg-muted/30"
                                  style={{ left: idx * dayWidth, width: dayWidth }}
                                />
                              )
                            ))}

                            {/* Lot bar (only in lots or combined view) */}
                            {viewMode !== "interventions" && lotStartDate && lotEndDate && (
                              <div
                                className={cn(
                                  "absolute top-2 h-7 rounded-md flex items-center px-2 cursor-grab active:cursor-grabbing group",
                                  isDelayed && "ring-2 ring-destructive"
                                )}
                                style={{
                                  left: getPositionForDate(lotStartDate),
                                  width: Math.max((differenceInDays(lotEndDate, lotStartDate) + 1) * dayWidth, 24),
                                  backgroundColor: lot.color || statusConfig.color,
                                }}
                                onMouseDown={(e) => handleMouseDown(e, lot.id, "lot", "move")}
                                onMouseEnter={() => setHoveredItemId(lot.id)}
                                onMouseLeave={() => setHoveredItemId(null)}
                              >
                                {/* Resize handles */}
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20"
                                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, lot.id, "lot", "resize-start"); }}
                                />
                                <div
                                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20"
                                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, lot.id, "lot", "resize-end"); }}
                                />

                                {/* Duration */}
                                <span className="text-xs text-white font-medium truncate">
                                  {differenceInDays(lotEndDate, lotStartDate) + 1}j
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Intervention rows */}
                        {showInterventions && lotInterventions.map((intervention) => {
                          const intTempDates = tempDates[intervention.id];
                          const intStartDate = intTempDates?.start || parseISO(intervention.start_date);
                          const intEndDate = intTempDates?.end || parseISO(intervention.end_date);
                          const intStatus = INTERVENTION_STATUS.find(s => s.value === intervention.status) || INTERVENTION_STATUS[0];

                          return (
                            <div key={intervention.id} className="flex" style={{ height: interventionRowHeight }}>
                              {/* Sidebar */}
                              <div
                                className="shrink-0 flex items-center gap-2 px-3 pl-10 border-r bg-muted/10"
                                style={{ width: sidebarWidth }}
                              >
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs truncate">{intervention.title}</span>
                                {intervention.team_size > 1 && (
                                  <Badge variant="outline" className="text-xs gap-1 shrink-0">
                                    <Users className="w-3 h-3" />
                                    {intervention.team_size}
                                  </Badge>
                                )}
                              </div>

                              {/* Timeline */}
                              <div className="flex-1 relative bg-muted/5">
                                {/* Intervention bar */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="absolute top-1 h-6 rounded flex items-center px-1.5 cursor-grab active:cursor-grabbing text-white text-xs font-medium"
                                      style={{
                                        left: getPositionForDate(intStartDate),
                                        width: Math.max((differenceInDays(intEndDate, intStartDate) + 1) * dayWidth, 20),
                                        backgroundColor: intervention.color || intStatus.color,
                                      }}
                                      onMouseDown={(e) => handleMouseDown(e, intervention.id, "intervention", "move")}
                                      onClick={(e) => { e.stopPropagation(); setSelectedIntervention(intervention); }}
                                    >
                                      {/* Resize handles */}
                                      <div
                                        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/20"
                                        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, intervention.id, "intervention", "resize-start"); }}
                                      />
                                      <div
                                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/20"
                                        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, intervention.id, "intervention", "resize-end"); }}
                                      />
                                      <span className="truncate">{differenceInDays(intEndDate, intStartDate) + 1}j</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-sm">
                                      <p className="font-medium">{intervention.title}</p>
                                      <p className="text-muted-foreground">
                                        {format(intStartDate, "d MMM", { locale: fr })} → {format(intEndDate, "d MMM", { locale: fr })}
                                      </p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Panel */}
        {showAIPanel && (
          <div className="w-80 border-l bg-background p-4 overflow-y-auto">
            <AISuggestionPanel
              projectId={projectId}
              projectName={projectName || "Projet"}
              lots={lots}
              interventions={interventions}
              onAcceptSuggestion={handleSaveInterventions}
            />
          </div>
        )}
      </div>

      {/* Add intervention dialog */}
      <InterventionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        lots={lots}
        onSave={handleSaveInterventions}
        preselectedLotId={preselectedLotId}
        preselectedDates={preselectedDates}
      />

      {/* Intervention detail sheet */}
      <Sheet open={!!selectedIntervention} onOpenChange={() => setSelectedIntervention(null)}>
        <SheetContent>
          {selectedIntervention && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedIntervention.title}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm text-muted-foreground">Lot</label>
                  <p className="font-medium">{selectedIntervention.lot?.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Début</label>
                    <p className="font-medium">{format(parseISO(selectedIntervention.start_date), "d MMM yyyy", { locale: fr })}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Fin</label>
                    <p className="font-medium">{format(parseISO(selectedIntervention.end_date), "d MMM yyyy", { locale: fr })}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Statut</label>
                  <Select
                    value={selectedIntervention.status}
                    onValueChange={(v) => {
                      updateIntervention.mutate({ id: selectedIntervention.id, status: v as any });
                      setSelectedIntervention({ ...selectedIntervention, status: v as any });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVENTION_STATUS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedIntervention.description && (
                  <div>
                    <label className="text-sm text-muted-foreground">Description</label>
                    <p className="text-sm">{selectedIntervention.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-muted-foreground">Effectif</label>
                  <p className="font-medium">{selectedIntervention.team_size} personne(s)</p>
                </div>
              </div>
              <SheetFooter>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    deleteIntervention.mutate(selectedIntervention.id);
                    setSelectedIntervention(null);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
