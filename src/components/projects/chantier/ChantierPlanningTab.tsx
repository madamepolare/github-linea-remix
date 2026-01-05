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
import { InlineInterventionCreator } from "./planning/InlineInterventionCreator";
import { AIFullPlanningPanel } from "./planning/AIFullPlanningPanel";
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
  Wand2,
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
  const { interventions, isLoading: interventionsLoading, createMultipleInterventions, updateIntervention, deleteIntervention, deleteMultipleInterventions } = useInterventions(projectId);
  
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
  const [inlineCreation, setInlineCreation] = useState<{
    lotId: string;
    startDate: Date;
    endDate: Date;
    left: number;
    width: number;
    color: string;
  } | null>(null);
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

  // Click on timeline to add intervention - inline creation
  const handleTimelineClick = useCallback((e: React.MouseEvent, lotId: string, lotColor: string) => {
    if (dragState || inlineCreation) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedDate = getDateForPosition(x);
    const endDate = addDays(clickedDate, 4); // Default 5 days
    
    const left = getPositionForDate(clickedDate);
    const width = (differenceInDays(endDate, clickedDate) + 1) * dayWidth;
    
    setInlineCreation({
      lotId,
      startDate: clickedDate,
      endDate,
      left,
      width,
      color: lotColor || "#3b82f6",
    });
  }, [dragState, inlineCreation, getDateForPosition, getPositionForDate, dayWidth]);

  // Handle inline creation save
  const handleInlineSave = useCallback((intervention: CreateInterventionInput) => {
    createMultipleInterventions.mutate([intervention]);
    setInlineCreation(null);
  }, [createMultipleInterventions]);

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
      {/* Simplified Toolbar */}
      <div className="flex items-center justify-between gap-4 p-3 border-b bg-background/95 backdrop-blur sticky top-0 z-20">
        {/* Left side - Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday} className="font-medium">
            Aujourd'hui
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <div className="h-5 w-px bg-border mx-1" />
          
          {/* Zoom - compact */}
          <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
            <Button variant={zoomLevel === "day" ? "secondary" : "ghost"} size="sm" className="h-7 px-2 text-xs" onClick={() => setZoomLevel("day")}>
              J
            </Button>
            <Button variant={zoomLevel === "week" ? "secondary" : "ghost"} size="sm" className="h-7 px-2 text-xs" onClick={() => setZoomLevel("week")}>
              S
            </Button>
            <Button variant={zoomLevel === "month" ? "secondary" : "ghost"} size="sm" className="h-7 px-2 text-xs" onClick={() => setZoomLevel("month")}>
              M
            </Button>
          </div>
        </div>

        {/* Center - Stats (minimal) */}
        <div className="hidden md:flex items-center gap-3 text-sm text-muted-foreground">
          <span>{stats.totalInterventions} interventions</span>
          {stats.delayedInterventions > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertTriangle className="w-3 h-3" />
              {stats.delayedInterventions}
            </Badge>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* AI Button - Prominent */}
          <Button 
            variant={showAIPanel ? "default" : "secondary"} 
            size="sm" 
            onClick={() => setShowAIPanel(!showAIPanel)}
            className="gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Planifier avec IA</span>
          </Button>

          {/* Reset button - if interventions exist */}
          {interventions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground">
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => {
                    if (confirm(`Supprimer les ${interventions.length} interventions ?`)) {
                      deleteMultipleInterventions.mutate(interventions.map(i => i.id));
                    }
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Tout supprimer ({interventions.length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setPreselectedLotId(undefined); setPreselectedDates(undefined); setShowAddDialog(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter intervention
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportA1} disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                Exporter PDF
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

      {/* Main content wrapper */}
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
              className="h-full overflow-auto relative"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {/* Fixed left sidebar */}
              <div 
                className="sticky left-0 top-0 z-20 bg-background border-r shadow-sm float-left"
                style={{ width: sidebarWidth, height: headerHeight + totalHeight }}
              >
                {/* Sidebar header */}
                <div
                  className="sticky top-0 z-30 bg-background border-b flex flex-col justify-end px-4 pb-3"
                  style={{ height: headerHeight }}
                >
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Lots / Interventions
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Cliquez sur la grille pour ajouter
                  </p>
                </div>

                {/* Sidebar rows */}
                <div>
                  {sortedLots.map((lot, lotIndex) => {
                    const lotInterventions = interventionsByLot[lot.id] || [];
                    const isCollapsed = collapsedLots.has(lot.id);
                    const showInterventions = viewMode !== "lots" && lotInterventions.length > 0 && !isCollapsed;
                    const statusConfig = LOT_STATUS.find(s => s.value === lot.status) || LOT_STATUS[0];
                    const company = companies.find(c => c.id === lot.crm_company_id);

                    return (
                      <div key={lot.id}>
                        {/* Lot sidebar row */}
                        <div
                          className={cn(
                            "flex items-center gap-2 px-3 border-b transition-colors group",
                            hoveredItemId === lot.id && "bg-primary/5",
                            lotIndex > 0 && "border-t-2 border-t-muted"
                          )}
                          style={{ height: rowHeight }}
                          onMouseEnter={() => setHoveredItemId(lot.id)}
                          onMouseLeave={() => setHoveredItemId(null)}
                        >
                          {/* Collapse toggle */}
                          {lotInterventions.length > 0 && viewMode !== "lots" ? (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => toggleLotCollapse(lot.id)}
                              className="shrink-0"
                            >
                              <ChevronRight
                                className={cn(
                                  "w-4 h-4 transition-transform",
                                  !isCollapsed && "rotate-90"
                                )}
                              />
                            </Button>
                          ) : (
                            <div className="w-6 shrink-0" />
                          )}

                          {/* Color dot */}
                          <div
                            className="w-3 h-3 rounded-full shrink-0 ring-2 ring-background shadow-sm"
                            style={{ backgroundColor: lot.color || statusConfig.color }}
                          />

                          {/* Name & company */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{lot.name}</span>
                              {lotInterventions.length > 0 && (
                                <Badge variant="secondary" className="shrink-0 text-[10px] h-5">
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

                          {/* Quick add button */}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => { setPreselectedLotId(lot.id); setShowAddDialog(true); }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>

                          {/* Actions dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
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

                        {/* Intervention sidebar rows */}
                        {showInterventions && lotInterventions.map((intervention) => (
                          <div
                            key={intervention.id}
                            className={cn(
                              "flex items-center gap-2 px-3 pl-10 border-b bg-muted/30 transition-colors",
                              hoveredItemId === intervention.id && "bg-primary/5"
                            )}
                            style={{ height: interventionRowHeight }}
                            onMouseEnter={() => setHoveredItemId(intervention.id)}
                            onMouseLeave={() => setHoveredItemId(null)}
                          >
                            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-xs truncate flex-1">{intervention.title}</span>
                            {intervention.team_size > 1 && (
                              <Badge variant="outline" className="text-[10px] gap-1 shrink-0 h-5">
                                <Users className="w-3 h-3" />
                                {intervention.team_size}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable timeline area */}
              <div style={{ marginLeft: sidebarWidth, minWidth: totalWidth }}>
                {/* Timeline header */}
                <div className="sticky top-0 z-10 bg-muted/30 border-b" style={{ height: headerHeight }}>
                  {/* Months row */}
                  <div className="flex h-10 border-b">
                    {monthGroups.map((group, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-center border-r text-sm font-medium bg-muted/50"
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

                {/* Timeline rows */}
                <div style={{ height: totalHeight }}>
                  {sortedLots.map((lot, lotIndex) => {
                    const lotInterventions = interventionsByLot[lot.id] || [];
                    const isCollapsed = collapsedLots.has(lot.id);
                    const showInterventions = viewMode !== "lots" && lotInterventions.length > 0 && !isCollapsed;
                    const statusConfig = LOT_STATUS.find(s => s.value === lot.status) || LOT_STATUS[0];
                    const isDelayed = lot.end_date && lot.status !== "completed" && isPast(parseISO(lot.end_date));

                    const lotTempDates = tempDates[lot.id];
                    const lotStartDate = lotTempDates?.start || (lot.start_date ? parseISO(lot.start_date) : null);
                    const lotEndDate = lotTempDates?.end || (lot.end_date ? parseISO(lot.end_date) : null);

                    return (
                      <div key={lot.id}>
                        {/* Lot timeline row */}
                        <div
                          className={cn(
                            "relative border-b cursor-pointer transition-colors",
                            lotIndex % 2 === 0 ? "bg-background" : "bg-muted/10",
                            hoveredItemId === lot.id && "bg-primary/5",
                            lotIndex > 0 && "border-t-2 border-t-muted"
                          )}
                          style={{ height: rowHeight }}
                          onClick={(e) => handleTimelineClick(e, lot.id, lot.color || statusConfig.color)}
                          onMouseEnter={() => setHoveredItemId(lot.id)}
                          onMouseLeave={() => setHoveredItemId(null)}
                        >
                          {/* Today line */}
                          {(() => {
                            const todayPos = getPositionForDate(new Date());
                            if (todayPos >= 0 && todayPos <= totalWidth) {
                              return (
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-primary/60 z-10 pointer-events-none"
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
                                className="absolute top-0 bottom-0 bg-muted/30 pointer-events-none"
                                style={{ left: idx * dayWidth, width: dayWidth }}
                              />
                            )
                          ))}

                          {/* Click hint on hover */}
                          {hoveredItemId === lot.id && !lotStartDate && !inlineCreation && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                                Cliquez pour ajouter une intervention
                              </span>
                            </div>
                          )}

                          {/* Lot bar (only in lots or combined view) */}
                          {viewMode !== "interventions" && lotStartDate && lotEndDate && (
                            <div
                              className={cn(
                                "absolute top-2 h-7 rounded-md flex items-center px-2 cursor-grab active:cursor-grabbing group shadow-sm",
                                isDelayed && "ring-2 ring-destructive"
                              )}
                              style={{
                                left: getPositionForDate(lotStartDate),
                                width: Math.max((differenceInDays(lotEndDate, lotStartDate) + 1) * dayWidth, 24),
                                backgroundColor: lot.color || statusConfig.color,
                              }}
                              onMouseDown={(e) => handleMouseDown(e, lot.id, "lot", "move")}
                            >
                              {/* Resize handles */}
                              <div
                                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-l-md"
                                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, lot.id, "lot", "resize-start"); }}
                              />
                              <div
                                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r-md"
                                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, lot.id, "lot", "resize-end"); }}
                              />

                              {/* Duration */}
                              <span className="text-xs text-white font-medium truncate drop-shadow-sm">
                                {differenceInDays(lotEndDate, lotStartDate) + 1}j
                              </span>
                            </div>
                          )}

                          {/* Inline creation */}
                          {inlineCreation && inlineCreation.lotId === lot.id && (
                            <InlineInterventionCreator
                              lotId={inlineCreation.lotId}
                              startDate={inlineCreation.startDate}
                              endDate={inlineCreation.endDate}
                              left={inlineCreation.left}
                              width={inlineCreation.width}
                              color={inlineCreation.color}
                              onSave={handleInlineSave}
                              onCancel={() => setInlineCreation(null)}
                            />
                          )}
                        </div>

                        {/* Intervention timeline rows */}
                        {showInterventions && lotInterventions.map((intervention) => {
                          const intTempDates = tempDates[intervention.id];
                          const intStartDate = intTempDates?.start || parseISO(intervention.start_date);
                          const intEndDate = intTempDates?.end || parseISO(intervention.end_date);
                          const intStatus = INTERVENTION_STATUS.find(s => s.value === intervention.status) || INTERVENTION_STATUS[0];

                          return (
                            <div
                              key={intervention.id}
                              className={cn(
                                "relative bg-muted/20 transition-colors",
                                hoveredItemId === intervention.id && "bg-primary/5"
                              )}
                              style={{ height: interventionRowHeight }}
                              onMouseEnter={() => setHoveredItemId(intervention.id)}
                              onMouseLeave={() => setHoveredItemId(null)}
                            >
                              {/* Today line */}
                              {(() => {
                                const todayPos = getPositionForDate(new Date());
                                if (todayPos >= 0 && todayPos <= totalWidth) {
                                  return (
                                    <div
                                      className="absolute top-0 bottom-0 w-0.5 bg-primary/60 z-10 pointer-events-none"
                                      style={{ left: todayPos }}
                                    />
                                  );
                                }
                                return null;
                              })()}

                              {/* Intervention bar */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="absolute top-1 h-6 rounded flex items-center px-1.5 cursor-grab active:cursor-grabbing text-white text-xs font-medium shadow-sm"
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
                                      className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/20 rounded-l"
                                      onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, intervention.id, "intervention", "resize-start"); }}
                                    />
                                    <div
                                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/20 rounded-r"
                                      onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, intervention.id, "intervention", "resize-end"); }}
                                    />
                                    <span className="truncate drop-shadow-sm">{differenceInDays(intEndDate, intStartDate) + 1}j</span>
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
          <div className="w-96 border-l bg-background p-4 overflow-y-auto">
            <AIFullPlanningPanel
              projectId={projectId}
              projectName={projectName || "Projet"}
              lots={lots}
              interventions={interventions}
              onAcceptPlanning={handleSaveInterventions}
              onClose={() => setShowAIPanel(false)}
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
