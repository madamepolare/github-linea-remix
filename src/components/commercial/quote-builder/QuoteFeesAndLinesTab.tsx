// Combined Fees and Lines Tab for quote builder
// Internal tabs: Honoraires % (phases) | Prestations forfaitaires (fixed lines)

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
        <TabsList className="w-full grid grid-cols-2 h-10">
          <TabsTrigger value="honoraires" className="gap-2 text-sm">
            <Calculator className="h-4 w-4" strokeWidth={1.25} />
            <span className="hidden sm:inline">Honoraires %</span>
            <span className="sm:hidden">Honoraires</span>
            <Badge variant="secondary" className="text-xs ml-1">
              {honorairesTotals.count}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="prestations" className="gap-2 text-sm">
            <List className="h-4 w-4" strokeWidth={1.25} />
            <span className="hidden sm:inline">Prestations forfaitaires</span>
            <span className="sm:hidden">Prestations</span>
            <Badge variant="secondary" className="text-xs ml-1">
              {prestationsTotals.count}
            </Badge>
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
