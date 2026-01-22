// Combined Fees and Lines Tab for quote builder
// Two distinct sections: Honoraires % (phases) + Prestations forfaitaires (fixed lines)

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { QuoteFeesTab } from './QuoteFeesTab';
import { QuoteLinesEditor } from './QuoteLinesEditor';
import { Calculator, List, Percent, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  // Section visibility states
  const [showHonoraires, setShowHonoraires] = useState(true);
  const [showPrestations, setShowPrestations] = useState(true);
  const [honorairesCollapsed, setHonorairesCollapsed] = useState(false);
  const [prestationsCollapsed, setPrestationsCollapsed] = useState(false);

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
    return (showHonoraires ? honorairesTotals.total : 0) + 
           (showPrestations ? prestationsTotals.total : 0);
  }, [showHonoraires, showPrestations, honorairesTotals.total, prestationsTotals.total]);

  // Handler for fixed lines changes (preserves phase lines)
  const handleFixedLinesChange = (newFixedLines: QuoteLine[]) => {
    // Keep phase lines, replace fixed lines
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
      {/* Summary header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {showHonoraires && (
            <span className="flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5" />
              Honoraires: {formatCurrency(honorairesTotals.total)}
            </span>
          )}
          {showHonoraires && showPrestations && <span>+</span>}
          {showPrestations && (
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Prestations: {formatCurrency(prestationsTotals.total)}
            </span>
          )}
        </div>
        <div className="text-base font-semibold">
          Total HT: {formatCurrency(grandTotal)}
        </div>
      </div>

      {/* Section toggles */}
      <div className="flex items-center gap-6 px-1">
        <div className="flex items-center gap-2">
          <Switch
            id="show-honoraires"
            checked={showHonoraires}
            onCheckedChange={setShowHonoraires}
          />
          <Label htmlFor="show-honoraires" className="text-sm cursor-pointer">
            Honoraires %
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="show-prestations"
            checked={showPrestations}
            onCheckedChange={setShowPrestations}
          />
          <Label htmlFor="show-prestations" className="text-sm cursor-pointer">
            Prestations forfaitaires
          </Label>
        </div>
      </div>

      {/* Section 1: Honoraires % (phases basées sur le budget travaux) */}
      {showHonoraires && (
        <section className="rounded-lg border bg-card overflow-hidden">
          <button
            onClick={() => setHonorairesCollapsed(!honorairesCollapsed)}
            className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 border-b hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Honoraires sur budget travaux</span>
              <Badge variant="secondary" className="text-xs">
                {honorairesTotals.count} phase{honorairesTotals.count > 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm">{formatCurrency(honorairesTotals.total)}</span>
              {honorairesCollapsed ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
          
          {!honorairesCollapsed && (
            <div className="p-4">
              <QuoteFeesTab
                document={document}
                onDocumentChange={onDocumentChange}
                lines={lines}
                onLinesChange={onLinesChange}
              />
            </div>
          )}
        </section>
      )}

      {/* Section 2: Prestations forfaitaires (lignes à montant fixe) */}
      {showPrestations && (
        <section className="rounded-lg border bg-card overflow-hidden">
          <button
            onClick={() => setPrestationsCollapsed(!prestationsCollapsed)}
            className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 border-b hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Prestations forfaitaires</span>
              <Badge variant="secondary" className="text-xs">
                {prestationsTotals.count} ligne{prestationsTotals.count > 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm">{formatCurrency(prestationsTotals.total)}</span>
              {prestationsCollapsed ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
          
          {!prestationsCollapsed && (
            <div className="p-4">
              <QuoteLinesEditor
                lines={fixedLines}
                onLinesChange={handleFixedLinesChange}
                document={document}
                onDocumentChange={onDocumentChange}
              />
            </div>
          )}
        </section>
      )}

      {/* Empty state when both sections are disabled */}
      {!showHonoraires && !showPrestations && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Package className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">Activez au moins une section pour commencer</p>
        </div>
      )}
    </div>
  );
}
