import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInvoiceLanding, useInvoiceLandingStats } from "@/hooks/useInvoiceLanding";
import { InvoiceLandingChart } from "./InvoiceLandingChart";
import { FileText, Clock, TrendingUp, Target, Calendar, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

export function InvoiceLandingTab() {
  const { data: landingData, isLoading } = useInvoiceLanding(12);
  const { data: stats, isLoading: statsLoading } = useInvoiceLandingStats();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [startOffset, setStartOffset] = useState(0);

  const formatCurrency = (amount: number, compact = false) => {
    if (compact) {
      if (Math.abs(amount) >= 1000000) return `${(amount / 1000000).toFixed(1)}M €`;
      if (Math.abs(amount) >= 1000) return `${Math.round(amount / 1000)}K €`;
      return `${Math.round(amount)} €`;
    }
    return new Intl.NumberFormat("fr-FR", { 
      style: "currency", 
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const visibleMonths = useMemo(() => {
    if (!landingData) return [];
    return landingData.slice(startOffset, startOffset + 6);
  }, [landingData, startOffset]);

  const selectedMonth = useMemo(() => {
    if (selectedMonthIndex === null || !visibleMonths[selectedMonthIndex]) return null;
    return visibleMonths[selectedMonthIndex];
  }, [selectedMonthIndex, visibleMonths]);

  // Calculate cumulative balance for trend line
  const cumulativeData = useMemo(() => {
    if (!landingData) return [];
    let cumulative = stats?.totalProjected || 0;
    return landingData.map(month => {
      cumulative = cumulative - month.total * 0.1; // Simulate decrease as invoices get paid
      return { ...month, cumulative: Math.max(cumulative, month.total) };
    });
  }, [landingData, stats]);

  const maxTotal = useMemo(() => {
    if (!landingData) return 100000;
    return Math.max(...landingData.map(m => m.total), 1);
  }, [landingData]);

  const currentMonthIndex = useMemo(() => {
    const now = new Date();
    const currentMonth = format(now, "MMM", { locale: fr });
    return visibleMonths.findIndex(m => m.month.toLowerCase() === currentMonth.toLowerCase());
  }, [visibleMonths]);

  const handlePrev = () => {
    if (startOffset > 0) {
      setStartOffset(s => s - 1);
      setSelectedMonthIndex(null);
    }
  };

  const handleNext = () => {
    if (landingData && startOffset < landingData.length - 6) {
      setStartOffset(s => s + 1);
      setSelectedMonthIndex(null);
    }
  };

  if (isLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Prévision</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Total prévisionnel:
          </span>
          <span className="text-lg font-semibold">
            {formatCurrency(stats?.totalProjected || 0)}
          </span>
        </div>
      </div>

      {/* Main Chart Area */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-16 w-14 flex flex-col justify-between py-4 text-xs text-muted-foreground">
              <span>{formatCurrency(maxTotal, true)}</span>
              <span>{formatCurrency(maxTotal * 0.75, true)}</span>
              <span>{formatCurrency(maxTotal * 0.5, true)}</span>
              <span>{formatCurrency(maxTotal * 0.25, true)}</span>
              <span>0</span>
            </div>

            {/* Chart container */}
            <div className="ml-14 mr-4">
              {/* Bar chart area */}
              <div className="relative h-[280px] flex items-end">
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="border-b border-dashed border-muted/50" />
                  ))}
                </div>

                {/* Months */}
                <div className="flex-1 flex items-end justify-around gap-2 relative z-10 pb-4">
                  {visibleMonths.map((month, index) => {
                    const heightPercent = (month.total / maxTotal) * 100;
                    const isSelected = selectedMonthIndex === index;
                    const isCurrent = index === currentMonthIndex;
                    
                    // Split into components for stacked bar
                    const scheduledHeight = (month.scheduled / maxTotal) * 100;
                    const draftsHeight = (month.drafts / maxTotal) * 100;
                    const pendingHeight = (month.pending / maxTotal) * 100;

                    return (
                      <div
                        key={month.month}
                        className={cn(
                          "flex-1 flex flex-col items-center cursor-pointer group relative",
                          isSelected && "z-20"
                        )}
                        onClick={() => setSelectedMonthIndex(isSelected ? null : index)}
                      >
                        {/* Selection highlight */}
                        {isSelected && (
                          <div className="absolute -inset-x-2 -top-2 bottom-0 bg-primary/5 rounded-t-xl border-t border-x border-primary/20" />
                        )}

                        {/* Stacked bars */}
                        <div 
                          className="w-full max-w-12 flex flex-col-reverse relative"
                          style={{ height: `${Math.max(heightPercent, 2)}%` }}
                        >
                          {/* Pending (top - blue) */}
                          {pendingHeight > 0 && (
                            <div 
                              className={cn(
                                "w-full bg-primary rounded-t transition-all",
                                isSelected ? "opacity-100" : "opacity-80 group-hover:opacity-100"
                              )}
                              style={{ height: `${(pendingHeight / heightPercent) * 100}%`, minHeight: 4 }}
                            />
                          )}
                          {/* Drafts (middle - gray) */}
                          {draftsHeight > 0 && (
                            <div 
                              className={cn(
                                "w-full bg-muted-foreground/40 transition-all",
                                pendingHeight === 0 && "rounded-t"
                              )}
                              style={{ height: `${(draftsHeight / heightPercent) * 100}%`, minHeight: 4 }}
                            />
                          )}
                          {/* Scheduled (bottom - amber/green) */}
                          {scheduledHeight > 0 && (
                            <div 
                              className={cn(
                                "w-full bg-emerald-500 transition-all",
                                pendingHeight === 0 && draftsHeight === 0 && "rounded-t"
                              )}
                              style={{ height: `${(scheduledHeight / heightPercent) * 100}%`, minHeight: 4 }}
                            />
                          )}
                        </div>

                        {/* Tooltip on hover/select */}
                        {isSelected && (
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border rounded-lg shadow-lg p-4 min-w-[220px] z-30">
                            <p className="font-semibold text-sm capitalize mb-3">
                              {month.fullMonth}
                            </p>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                                  <span className="text-muted-foreground">Échéances</span>
                                </div>
                                <span className="font-medium">{formatCurrency(month.scheduled)}</span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-sm bg-muted-foreground/40" />
                                  <span className="text-muted-foreground">Brouillons</span>
                                </div>
                                <span className="font-medium">{formatCurrency(month.drafts)}</span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-sm bg-primary" />
                                  <span className="text-muted-foreground">En attente</span>
                                </div>
                                <span className="font-medium">{formatCurrency(month.pending)}</span>
                              </div>
                              
                              <div className="border-t pt-2 mt-2 flex items-center justify-between font-medium">
                                <span>Total</span>
                                <span>{formatCurrency(month.total)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Month labels */}
              <div className="flex items-center justify-around border-t py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handlePrev}
                  disabled={startOffset === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {visibleMonths.map((month, index) => {
                  const isCurrent = index === currentMonthIndex;
                  const isSelected = selectedMonthIndex === index;
                  
                  return (
                    <button
                      key={month.month}
                      onClick={() => setSelectedMonthIndex(isSelected ? null : index)}
                      className={cn(
                        "flex-1 text-center py-1 text-sm font-medium uppercase tracking-wide transition-colors",
                        isCurrent && "text-primary",
                        isSelected && "text-primary",
                        !isCurrent && !isSelected && "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {month.month}. {format(month.date, "yy")}
                    </button>
                  );
                })}
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleNext}
                  disabled={!landingData || startOffset >= landingData.length - 6}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-sm font-medium text-muted-foreground p-4 min-w-[160px]">
                    Catégorie
                  </th>
                  {visibleMonths.map((month, index) => (
                    <th 
                      key={month.month}
                      className={cn(
                        "text-center text-sm font-medium p-4 min-w-[120px]",
                        index === currentMonthIndex 
                          ? "text-primary bg-primary/5 border-x border-primary/20" 
                          : "text-muted-foreground"
                      )}
                    >
                      <span className="uppercase">{month.month}. {format(month.date, "yy")}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Total row */}
                <tr className="border-b bg-muted/30">
                  <td className="p-4 font-medium">Total prévisionnel</td>
                  {visibleMonths.map((month, index) => (
                    <td 
                      key={month.month}
                      className={cn(
                        "p-4 text-center font-semibold",
                        index === currentMonthIndex && "bg-primary/5 border-x border-primary/20"
                      )}
                    >
                      {formatCurrency(month.total)}
                    </td>
                  ))}
                </tr>
                
                {/* Scheduled row */}
                <tr className="border-b">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                      <span>Échéances projets</span>
                    </div>
                  </td>
                  {visibleMonths.map((month, index) => (
                    <td 
                      key={month.month}
                      className={cn(
                        "p-4 text-center",
                        index === currentMonthIndex && "bg-primary/5 border-x border-primary/20"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-emerald-600 font-medium">
                          {formatCurrency(month.scheduled)}
                        </span>
                        {month.scheduledCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({month.scheduledCount})
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
                
                {/* Drafts row */}
                <tr className="border-b">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-muted-foreground/40" />
                      <span>Brouillons</span>
                    </div>
                  </td>
                  {visibleMonths.map((month, index) => (
                    <td 
                      key={month.month}
                      className={cn(
                        "p-4 text-center",
                        index === currentMonthIndex && "bg-primary/5 border-x border-primary/20"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-muted-foreground">
                          {formatCurrency(month.drafts)}
                        </span>
                        {month.draftsCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({month.draftsCount})
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
                
                {/* Pending row */}
                <tr>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-primary" />
                      <span>Factures en attente</span>
                    </div>
                  </td>
                  {visibleMonths.map((month, index) => (
                    <td 
                      key={month.month}
                      className={cn(
                        "p-4 text-center",
                        index === currentMonthIndex && "bg-primary/5 border-x border-primary/20"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-primary font-medium">
                          {formatCurrency(month.pending)}
                        </span>
                        {month.pendingCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({month.pendingCount})
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span>Échéances projets</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-muted-foreground/40" />
          <span>Brouillons</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span>Factures en attente</span>
        </div>
      </div>
    </div>
  );
}
