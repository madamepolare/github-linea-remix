import { useState, useRef, useCallback, useMemo } from "react";
import { ProjectLot } from "@/hooks/useChantier";
import { format, parseISO, differenceInDays, addDays, eachDayOfInterval, isToday, isSameMonth, startOfMonth, endOfMonth, addMonths, subMonths, eachWeekOfInterval, startOfWeek, endOfWeek, isPast, getISOWeek } from "date-fns";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
  Maximize2,
  ZoomIn,
  ZoomOut,
  GanttChart,
  Pencil,
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

interface DragState {
  lotId: string;
  type: DragType;
  startX: number;
  originalStartDate: Date | null;
  originalEndDate: Date | null;
}

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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("week");
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
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<HTMLDivElement>(null);

  // Calculate visible date range based on zoom
  const visibleStart = startOfMonth(subMonths(currentMonth, zoomLevel === "month" ? 3 : 1));
  const visibleEnd = endOfMonth(addMonths(currentMonth, zoomLevel === "month" ? 9 : 4));
  
  const weeks = eachWeekOfInterval({ start: visibleStart, end: visibleEnd }, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: visibleStart, end: visibleEnd });
  
  // Day width based on zoom level
  const dayWidth = zoomLevel === "day" ? 32 : zoomLevel === "week" ? 18 : 6;
  const totalWidth = days.length * dayWidth;
  const rowHeight = 42;
  const headerHeight = 80;
  const sidebarWidth = 260;

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

  // Quick add lot
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

  // Export A1 Landscape PDF
  const handleExportA1 = useCallback(async () => {
    if (!ganttRef.current) return;
    setIsExporting(true);

    try {
      // A1 dimensions in mm: 841 x 594 (landscape)
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [841, 594]
      });

      const pageWidth = 841;
      const pageHeight = 594;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2 - 60; // Leave space for header/footer

      // Header
      pdf.setFillColor(17, 24, 39); // Dark background
      pdf.rect(0, 0, pageWidth, 45, "F");
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Planning Chantier - ${projectName || "Projet"}`, margin, 28);
      
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Généré le ${format(new Date(), "d MMMM yyyy à HH:mm", { locale: fr })}`, margin, 38);

      // Stats bar
      const statsY = 55;
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(10);
      pdf.text(`${stats.total} lots | ${stats.withDates} planifiés | ${stats.inProgress} en cours | ${stats.completed} terminés${stats.delayed > 0 ? ` | ${stats.delayed} en retard` : ""}`, margin, statsY);

      // Calculate dimensions for gantt
      const lotRowHeight = 18;
      const ganttStartY = 70;
      const ganttHeight = Math.min(sortedLots.length * lotRowHeight + 40, contentHeight);
      const lotNameWidth = 80;
      const companyWidth = 60;
      const ganttAreaWidth = contentWidth - lotNameWidth - companyWidth;

      // Find date range from all lots
      const lotsWithDates = sortedLots.filter(l => l.start_date && l.end_date);
      let minDate = new Date();
      let maxDate = addMonths(new Date(), 6);

      if (lotsWithDates.length > 0) {
        const startDates = lotsWithDates.map(l => parseISO(l.start_date!));
        const endDates = lotsWithDates.map(l => parseISO(l.end_date!));
        minDate = subMonths(new Date(Math.min(...startDates.map(d => d.getTime()))), 1);
        maxDate = addMonths(new Date(Math.max(...endDates.map(d => d.getTime()))), 1);
      }

      const totalDays = differenceInDays(maxDate, minDate) || 180;
      const dayWidthPdf = ganttAreaWidth / totalDays;

      // Draw header row with months
      const headerY = ganttStartY;
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, headerY, contentWidth, 20, "F");
      
      pdf.setDrawColor(229, 231, 235);
      pdf.line(margin, headerY + 20, margin + contentWidth, headerY + 20);

      // Lot header
      pdf.setFillColor(249, 250, 251);
      pdf.setTextColor(55, 65, 81);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("LOT", margin + 4, headerY + 12);
      pdf.text("ENTREPRISE", margin + lotNameWidth + 4, headerY + 12);

      // Month headers
      const pdfMonths = eachDayOfInterval({ start: minDate, end: maxDate });
      const pdfMonthGroups: { month: Date; startDay: number; count: number }[] = [];
      let currentM: Date | null = null;
      let startD = 0;
      let countD = 0;

      pdfMonths.forEach((day, idx) => {
        if (!currentM || !isSameMonth(day, currentM)) {
          if (currentM) pdfMonthGroups.push({ month: currentM, startDay: startD, count: countD });
          currentM = day;
          startD = idx;
          countD = 1;
        } else {
          countD++;
        }
      });
      if (currentM) pdfMonthGroups.push({ month: currentM, startDay: startD, count: countD });

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdfMonthGroups.forEach(group => {
        const x = margin + lotNameWidth + companyWidth + group.startDay * dayWidthPdf;
        const w = group.count * dayWidthPdf;
        pdf.setTextColor(55, 65, 81);
        const monthLabel = format(group.month, "MMM yyyy", { locale: fr }).toUpperCase();
        pdf.text(monthLabel, x + w / 2, headerY + 12, { align: "center" });
        
        pdf.setDrawColor(229, 231, 235);
        pdf.line(x, headerY, x, headerY + 20);
      });

      // Today line position
      const todayDiff = differenceInDays(new Date(), minDate);
      const todayX = margin + lotNameWidth + companyWidth + todayDiff * dayWidthPdf;

      // Draw lot rows
      sortedLots.forEach((lot, idx) => {
        const y = ganttStartY + 20 + idx * lotRowHeight;
        const statusConfig = LOT_STATUS.find(s => s.value === lot.status) || LOT_STATUS[0];
        const company = companies.find(c => c.id === lot.crm_company_id);
        const isDelayed = lot.end_date && lot.status !== "completed" && isPast(parseISO(lot.end_date));

        // Alternate row background
        if (idx % 2 === 0) {
          pdf.setFillColor(255, 255, 255);
        } else {
          pdf.setFillColor(250, 250, 250);
        }
        pdf.rect(margin, y, contentWidth, lotRowHeight, "F");

        // Row border
        pdf.setDrawColor(240, 240, 240);
        pdf.line(margin, y + lotRowHeight, margin + contentWidth, y + lotRowHeight);

        // Lot name
        pdf.setTextColor(31, 41, 55);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        const lotName = lot.name.length > 20 ? lot.name.substring(0, 20) + "..." : lot.name;
        pdf.text(lotName, margin + 4, y + 11);

        // Company
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(107, 114, 128);
        const companyName = company?.name || "-";
        const companyDisplay = companyName.length > 15 ? companyName.substring(0, 15) + "..." : companyName;
        pdf.text(companyDisplay, margin + lotNameWidth + 4, y + 11);

        // Gantt bar
        if (lot.start_date && lot.end_date) {
          const startDate = parseISO(lot.start_date);
          const endDate = parseISO(lot.end_date);
          const startDiff = differenceInDays(startDate, minDate);
          const duration = differenceInDays(endDate, startDate) + 1;

          const barX = margin + lotNameWidth + companyWidth + startDiff * dayWidthPdf;
          const barWidth = Math.max(duration * dayWidthPdf, 4);

          // Bar color
          const color = lot.color || statusConfig.color;
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);

          pdf.setFillColor(r, g, b);
          pdf.roundedRect(barX, y + 3, barWidth, lotRowHeight - 6, 2, 2, "F");

          // Duration text on bar if wide enough
          if (barWidth > 25) {
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(6);
            const durationText = `${duration}j`;
            pdf.text(durationText, barX + barWidth / 2, y + 10, { align: "center" });
          }

          // Delayed indicator
          if (isDelayed) {
            pdf.setFillColor(239, 68, 68);
            pdf.circle(barX + barWidth + 4, y + lotRowHeight / 2, 2, "F");
          }
        }
      });

      // Today vertical line
      if (todayDiff >= 0 && todayDiff <= totalDays) {
        pdf.setDrawColor(59, 130, 246);
        pdf.setLineWidth(0.8);
        pdf.line(todayX, ganttStartY + 20, todayX, ganttStartY + 20 + sortedLots.length * lotRowHeight);
        
        // Today label
        pdf.setFillColor(59, 130, 246);
        pdf.roundedRect(todayX - 12, ganttStartY + 20 + sortedLots.length * lotRowHeight + 2, 24, 8, 1, 1, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(6);
        pdf.text("Aujourd'hui", todayX, ganttStartY + 20 + sortedLots.length * lotRowHeight + 8, { align: "center" });
      }

      // Legend
      const legendY = pageHeight - 35;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(55, 65, 81);
      pdf.text("Légende :", margin, legendY);

      let legendX = margin + 30;
      LOT_STATUS.forEach(status => {
        const color = status.color;
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        pdf.setFillColor(r, g, b);
        pdf.roundedRect(legendX, legendY - 4, 12, 6, 1, 1, "F");
        
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(107, 114, 128);
        pdf.text(status.label, legendX + 15, legendY);
        legendX += 60;
      });

      // Footer
      pdf.setTextColor(156, 163, 175);
      pdf.setFontSize(8);
      pdf.text(`Format A1 Paysage (841 × 594 mm)`, pageWidth - margin, pageHeight - 15, { align: "right" });

      // Save
      pdf.save(`planning-chantier-${projectName?.toLowerCase().replace(/\s+/g, "-") || "projet"}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Planning exporté en format A1 paysage");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  }, [sortedLots, projectName, stats, companies]);

  if (lotsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 min-w-[140px] font-medium"
              onClick={() => setCurrentMonth(new Date())}
            >
              {format(currentMonth, "MMMM yyyy", { locale: fr })}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
            <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
            Aujourd'hui
          </Button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant={zoomLevel === "day" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setZoomLevel("day")}
            >
              Jour
            </Button>
            <Button
              variant={zoomLevel === "week" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setZoomLevel("week")}
            >
              Semaine
            </Button>
            <Button
              variant={zoomLevel === "month" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setZoomLevel("month")}
            >
              Mois
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats badges */}
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-normal">
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

          {/* Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                Filtrer
                {statusFilter && <Badge className="ml-1.5 h-4 min-w-[16px] px-1 text-[10px]">1</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52" align="end">
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
                      className="w-2.5 h-2.5 rounded-full mr-2"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Export A1 */}
          <Button 
            variant="default" 
            size="sm"
            onClick={handleExportA1}
            disabled={isExporting || sortedLots.length === 0}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {isExporting ? "Export..." : "Export A1"}
          </Button>

          {/* Add lot */}
          {onCreateLot && (
            <Button 
              size="sm"
              variant="outline"
              onClick={() => setQuickAddRow({ visible: true, name: "", startDate: new Date(), endDate: addDays(new Date(), 14) })}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nouveau lot
            </Button>
          )}
        </div>
      </div>

      {/* Main Gantt Area */}
      {sortedLots.length === 0 && !quickAddRow.visible ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={GanttChart}
              title="Aucun lot à planifier"
              description="Créez des lots pour les voir apparaître dans le planning Gantt"
            />
            {onCreateLot && (
              <div className="flex justify-center mt-4">
                <Button onClick={() => setQuickAddRow({ visible: true, name: "", startDate: new Date(), endDate: addDays(new Date(), 14) })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un lot
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div 
            ref={containerRef}
            className="flex overflow-hidden"
            style={{ height: Math.min(sortedLots.length * rowHeight + headerHeight + 20, 600) }}
          >
            {/* Left Sidebar - Lots List */}
            <div 
              className="flex-shrink-0 border-r bg-muted/20"
              style={{ width: sidebarWidth }}
            >
              {/* Sidebar Header */}
              <div 
                className="border-b bg-muted/40 px-3 flex items-center"
                style={{ height: headerHeight }}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Lots ({sortedLots.length})
                  </span>
                </div>
              </div>

              {/* Lot Rows */}
              <ScrollArea style={{ height: `calc(100% - ${headerHeight}px)` }}>
                {sortedLots.map((lot) => {
                  const statusConfig = LOT_STATUS.find(s => s.value === lot.status) || LOT_STATUS[0];
                  const company = companies.find(c => c.id === lot.crm_company_id);
                  const isDelayed = lot.end_date && lot.status !== "completed" && isPast(parseISO(lot.end_date));
                  
                  return (
                    <div
                      key={lot.id}
                      className={cn(
                        "border-b px-3 flex items-center gap-2 transition-colors cursor-pointer",
                        hoveredLotId === lot.id ? "bg-muted/60" : "hover:bg-muted/30",
                        selectedLot?.id === lot.id && "ring-1 ring-inset ring-primary bg-primary/5"
                      )}
                      style={{ height: rowHeight }}
                      onClick={() => setSelectedLot(lot)}
                      onMouseEnter={() => setHoveredLotId(lot.id)}
                      onMouseLeave={() => setHoveredLotId(null)}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: lot.color || statusConfig.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{lot.name}</span>
                          {isDelayed && (
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                          )}
                        </div>
                        {company && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{company.name}</span>
                          </div>
                        )}
                      </div>
                      {hoveredLotId === lot.id && onEditLot && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditLot(lot);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                
                {/* Quick Add Row in Sidebar */}
                {quickAddRow.visible && (
                  <div 
                    className="border-b px-3 bg-primary/5"
                    style={{ height: rowHeight }}
                  >
                    <div className="flex items-center gap-2 h-full">
                      <Input
                        value={quickAddRow.name}
                        onChange={(e) => setQuickAddRow(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nom du lot..."
                        className="h-7 text-sm flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleQuickAdd();
                          if (e.key === "Escape") setQuickAddRow({ visible: false, name: "", startDate: null, endDate: null });
                        }}
                      />
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Gantt Timeline */}
            <div 
              ref={ganttRef}
              className="flex-1 overflow-auto"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              <div style={{ minWidth: totalWidth }}>
                {/* Month Header */}
                <div 
                  className="flex border-b bg-muted/40 sticky top-0 z-20"
                  style={{ height: headerHeight / 2 }}
                >
                  {monthGroups.map((group, idx) => (
                    <div
                      key={idx}
                      className="border-r flex items-center justify-center font-semibold text-xs capitalize text-muted-foreground"
                      style={{ width: group.count * dayWidth }}
                    >
                      {format(group.month, "MMMM yyyy", { locale: fr })}
                    </div>
                  ))}
                </div>

                {/* Week/Day Header */}
                <div 
                  className="flex border-b sticky z-20 bg-card"
                  style={{ height: headerHeight / 2, top: headerHeight / 2 }}
                >
                  {zoomLevel === "day" ? (
                    days.map((day, idx) => {
                      const hasToday = isToday(day);
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-center text-[10px] border-r",
                            hasToday && "bg-primary/10 font-bold text-primary"
                          )}
                          style={{ width: dayWidth }}
                        >
                          {format(day, "d")}
                        </div>
                      );
                    })
                  ) : (
                    weeks.map((weekStart, idx) => {
                      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                      const daysInWeek = differenceInDays(
                        new Date(Math.min(weekEnd.getTime(), visibleEnd.getTime())), 
                        new Date(Math.max(weekStart.getTime(), visibleStart.getTime()))
                      ) + 1;
                      const weekNum = getISOWeek(weekStart);
                      const hasToday = days.some(d => isToday(d) && d >= weekStart && d <= weekEnd);
                      
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-center text-xs border-r",
                            hasToday && "bg-primary/10 font-semibold text-primary"
                          )}
                          style={{ width: Math.max(daysInWeek, 1) * dayWidth }}
                        >
                          S{weekNum}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Lot Rows with Bars */}
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
                  const width = hasDates ? Math.max((differenceInDays(endDate, startDate) + 1) * dayWidth - 4, 20) : 0;

                  return (
                    <div 
                      key={lot.id} 
                      className={cn(
                        "relative border-b transition-colors",
                        isHovered && "bg-muted/20"
                      )}
                      style={{ height: rowHeight }}
                      onMouseEnter={() => setHoveredLotId(lot.id)}
                      onMouseLeave={() => setHoveredLotId(null)}
                    >
                      {/* Today marker */}
                      {days.map((day, idx) => (
                        isToday(day) && (
                          <div
                            key={`today-${idx}`}
                            className="absolute top-0 bottom-0 w-0.5 bg-primary/70 z-10"
                            style={{ left: idx * dayWidth + dayWidth / 2 }}
                          />
                        )
                      ))}

                      {/* Gantt Bar */}
                      {hasDates && (
                        <div
                          className={cn(
                            "absolute top-2 rounded-md flex items-center justify-center select-none transition-all cursor-grab active:cursor-grabbing",
                            isDragging && "shadow-lg ring-2 ring-primary/50 z-20",
                            isDelayed && "ring-2 ring-destructive/50"
                          )}
                          style={{
                            left: left + 2,
                            width: Math.max(width, 24),
                            height: rowHeight - 16,
                            backgroundColor: lot.color || statusConfig.color,
                          }}
                          onMouseDown={(e) => handleMouseDown(e, lot.id, "move")}
                        >
                          {/* Resize handles */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-l-md"
                            onMouseDown={(e) => handleMouseDown(e, lot.id, "resize-start")}
                          />
                          
                          {width > 60 && (
                            <span className="text-white text-[11px] font-medium truncate px-2">
                              {lot.name}
                            </span>
                          )}
                          
                          <div
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r-md"
                            onMouseDown={(e) => handleMouseDown(e, lot.id, "resize-end")}
                          />
                        </div>
                      )}

                      {/* No dates placeholder */}
                      {!hasDates && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                            Non planifié
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Quick Add Row Timeline */}
                {quickAddRow.visible && (
                  <div 
                    className="flex items-center gap-2 px-3 bg-primary/5 border-b"
                    style={{ height: rowHeight }}
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {quickAddRow.startDate ? format(quickAddRow.startDate, "d MMM", { locale: fr }) : "Début"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={quickAddRow.startDate || undefined}
                          onSelect={(date) => setQuickAddRow(prev => ({ ...prev, startDate: date || null }))}
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-muted-foreground">→</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {quickAddRow.endDate ? format(quickAddRow.endDate, "d MMM", { locale: fr }) : "Fin"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={quickAddRow.endDate || undefined}
                          onSelect={(date) => setQuickAddRow(prev => ({ ...prev, endDate: date || null }))}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button size="sm" className="h-7" onClick={handleQuickAdd} disabled={!quickAddRow.name.trim()}>
                      <Plus className="h-3 w-3 mr-1" />
                      Ajouter
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7"
                      onClick={() => setQuickAddRow({ visible: false, name: "", startDate: null, endDate: null })}
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Lot Detail Sheet */}
      <Sheet open={!!selectedLot} onOpenChange={(open) => !open && setSelectedLot(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedLot?.color || LOT_STATUS.find(s => s.value === selectedLot?.status)?.color }}
              />
              {selectedLot?.name}
            </SheetTitle>
          </SheetHeader>
          {selectedLot && (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Statut</p>
                  <Badge 
                    style={{ 
                      backgroundColor: (LOT_STATUS.find(s => s.value === selectedLot.status)?.color || "#888") + "20",
                      color: LOT_STATUS.find(s => s.value === selectedLot.status)?.color 
                    }}
                  >
                    {LOT_STATUS.find(s => s.value === selectedLot.status)?.label || selectedLot.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Entreprise</p>
                  <p className="text-sm font-medium">
                    {companies.find(c => c.id === selectedLot.crm_company_id)?.name || "Non assignée"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Début</p>
                  <p className="text-sm font-medium">
                    {selectedLot.start_date ? format(parseISO(selectedLot.start_date), "d MMMM yyyy", { locale: fr }) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fin</p>
                  <p className="text-sm font-medium">
                    {selectedLot.end_date ? format(parseISO(selectedLot.end_date), "d MMMM yyyy", { locale: fr }) : "-"}
                  </p>
                </div>
              </div>
              {selectedLot.start_date && selectedLot.end_date && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Durée</p>
                  <p className="text-sm font-medium">
                    {differenceInDays(parseISO(selectedLot.end_date), parseISO(selectedLot.start_date)) + 1} jours
                  </p>
                </div>
              )}
              {selectedLot.budget && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Budget</p>
                  <p className="text-sm font-medium">{selectedLot.budget.toLocaleString("fr-FR")} €</p>
                </div>
              )}
              <div className="pt-4 flex gap-2">
                {onEditLot && (
                  <Button variant="outline" className="flex-1" onClick={() => { onEditLot(selectedLot); setSelectedLot(null); }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
                {onDeleteLot && (
                  <Button 
                    variant="destructive" 
                    size="icon"
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
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
