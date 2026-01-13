// Combined Fees and Lines Tab for quote builder
// Merges QuoteFeesTab and QuoteLinesEditor into one unified interface

import { useState, useMemo } from 'react';
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
  const [activeSubTab, setActiveSubTab] = useState<'fees' | 'lines'>(showFeesSubTab ? 'fees' : 'lines');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  // Calculate totals for summary
  const totals = useMemo(() => {
    const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');
    const discountLines = lines.filter(l => l.line_type === 'discount');
    const subtotal = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
    const totalDiscount = discountLines.reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);
    return {
      subtotal,
      discount: totalDiscount,
      total: subtotal - totalDiscount
    };
  }, [lines]);

  if (!showFeesSubTab) {
    // Just show lines editor directly
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
      {/* Summary header */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
        <div className="text-sm text-muted-foreground">
          {lines.length} ligne{lines.length > 1 ? 's' : ''} • Budget: {formatCurrency(document.construction_budget || 0)}
        </div>
        <div className="text-lg font-semibold">
          Total HT: {formatCurrency(totals.total)}
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as 'fees' | 'lines')}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="fees" className="gap-2">
            <Calculator className="h-4 w-4" />
            Répartition %
          </TabsTrigger>
          <TabsTrigger value="lines" className="gap-2">
            <List className="h-4 w-4" />
            Lignes détaillées
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fees" className="mt-4">
          <QuoteFeesTab
            document={document}
            onDocumentChange={onDocumentChange}
            lines={lines}
            onLinesChange={onLinesChange}
          />
        </TabsContent>

        <TabsContent value="lines" className="mt-4">
          <QuoteLinesEditor
            lines={lines}
            onLinesChange={onLinesChange}
            document={document}
            onDocumentChange={onDocumentChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
