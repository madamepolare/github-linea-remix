// Combined Fees and Lines Tab for quote builder
// Internal tabs: Honoraires % (phases) | Prestations forfaitaires (fixed lines)

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { QuoteFeesTab } from './QuoteFeesTab';
import { QuoteLinesEditor } from './QuoteLinesEditor';
import { Calculator, List } from 'lucide-react';

interface QuoteFeesAndLinesTabProps {
  document: Partial<QuoteDocument>;
  onDocumentChange: (doc: Partial<QuoteDocument>) => void;
  lines: QuoteLine[];
  onLinesChange: (lines: QuoteLine[]) => void;
  showFeesSubTab?: boolean;
}

export function QuoteFeesAndLinesTab({
  document,
  onDocumentChange,
  lines,
  onLinesChange,
  showFeesSubTab = true
}: QuoteFeesAndLinesTabProps) {

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  // Separate phase lines (percentage-based) from fixed lines
  const phaseLines = useMemo(() => 
    lines.filter(l => l.line_type === 'phase' || l.phase_code), 
    [lines]
  );
  
  const fixedLines = useMemo(() => 
    lines.filter(l => l.line_type !== 'phase' && !l.phase_code), 
    [lines]
  );

  // Calculate totals for each section
  const honorairesTotals = useMemo(() => {
    const included = phaseLines.filter(l => l.is_included);
    return {
      count: phaseLines.length,
      total: included.reduce((sum, l) => sum + (l.amount || 0), 0)
    };
  }, [phaseLines]);

  const prestationsTotals = useMemo(() => {
    const includedLines = fixedLines.filter(l => l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');
    const discountLines = fixedLines.filter(l => l.line_type === 'discount');
    const subtotal = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
    const totalDiscount = discountLines.reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);
    return {
      count: fixedLines.filter(l => l.line_type !== 'group').length,
      subtotal,
      discount: totalDiscount,
      total: subtotal - totalDiscount
    };
  }, [fixedLines]);

  // Grand total
  const grandTotal = useMemo(() => {
    return honorairesTotals.total + prestationsTotals.total;
  }, [honorairesTotals.total, prestationsTotals.total]);

  // Handler for fixed lines changes (preserves phase lines)
  const handleFixedLinesChange = (newFixedLines: QuoteLine[]) => {
    const updatedLines = [...phaseLines, ...newFixedLines];
    onLinesChange(updatedLines);
  };

  // If fees tab is disabled, just show lines editor
  if (!showFeesSubTab) {
    return (
      <QuoteLinesEditor
        lines={lines}
        onLinesChange={onLinesChange}
        document={document}
        onDocumentChange={onDocumentChange}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary header - plain text */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calculator className="h-3.5 w-3.5" strokeWidth={1.25} />
            Honoraires: {formatCurrency(honorairesTotals.total)}
          </span>
          <span>+</span>
          <span className="flex items-center gap-1.5">
            <List className="h-3.5 w-3.5" strokeWidth={1.25} />
            Prestations: {formatCurrency(prestationsTotals.total)}
          </span>
        </div>
        <div className="text-base font-semibold">
          Total HT: {formatCurrency(grandTotal)}
        </div>
      </div>

      {/* Internal tabs for switching between the two modes */}
      <Tabs defaultValue="honoraires" className="w-full">
        <TabsList className="w-full h-9 p-0.5 bg-muted/50 rounded-lg">
          <TabsTrigger 
            value="honoraires" 
            className="flex-1 h-8 gap-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <Calculator className="h-3.5 w-3.5" strokeWidth={1.25} />
            <span>Honoraires</span>
            <span className="text-[10px] text-muted-foreground ml-0.5">
              ({honorairesTotals.count})
            </span>
            <span className="hidden sm:inline text-[10px] font-normal text-muted-foreground border-l pl-1.5 ml-1">
              {formatCurrency(honorairesTotals.total)}
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="prestations" 
            className="flex-1 h-8 gap-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <List className="h-3.5 w-3.5" strokeWidth={1.25} />
            <span>Prestations</span>
            <span className="text-[10px] text-muted-foreground ml-0.5">
              ({prestationsTotals.count})
            </span>
            <span className="hidden sm:inline text-[10px] font-normal text-muted-foreground border-l pl-1.5 ml-1">
              {formatCurrency(prestationsTotals.total)}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="honoraires" className="mt-4">
          <QuoteFeesTab
            document={document}
            onDocumentChange={onDocumentChange}
            lines={lines}
            onLinesChange={onLinesChange}
          />
        </TabsContent>

        <TabsContent value="prestations" className="mt-4">
          <QuoteLinesEditor
            lines={fixedLines}
            onLinesChange={handleFixedLinesChange}
            document={document}
            onDocumentChange={onDocumentChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
