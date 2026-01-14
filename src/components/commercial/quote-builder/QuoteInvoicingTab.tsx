import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  CalendarIcon, 
  Wand2, 
  AlertCircle,
  GripVertical,
  Receipt,
  PieChart,
  Euro,
  Percent
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { PlannedInvoice } from '@/lib/commercialTypes';
import { QuoteSharingSettings } from './QuoteSharingSettings';

interface QuoteInvoicingTabProps {
  document: Partial<QuoteDocument>;
  onDocumentChange: (updates: Partial<QuoteDocument>) => void;
  lines: QuoteLine[];
}

export function QuoteInvoicingTab({ document, onDocumentChange, lines }: QuoteInvoicingTabProps) {
  const [plannedInvoices, setPlannedInvoices] = useState<PlannedInvoice[]>([]);
  
  const totalAmount = document.total_amount || 0;
  const vatRate = document.vat_rate || 20;
  
  // Load existing schedule from document
  useEffect(() => {
    if (document.invoice_schedule && Array.isArray(document.invoice_schedule)) {
      setPlannedInvoices(document.invoice_schedule as PlannedInvoice[]);
    }
  }, [document.invoice_schedule]);
  
  // Update document when schedule changes
  const updateSchedule = (newSchedule: PlannedInvoice[]) => {
    setPlannedInvoices(newSchedule);
    onDocumentChange({ invoice_schedule: newSchedule as unknown[] });
  };
  
  // Generate schedule from phases
  const generateFromPhases = () => {
    const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount');
    
    if (includedLines.length === 0) {
      const invoice: PlannedInvoice = {
        id: crypto.randomUUID(),
        schedule_number: 1,
        title: 'Acompte global',
        percentage: 100,
        amount_ht: totalAmount,
        amount_ttc: totalAmount * (1 + vatRate / 100),
        vat_rate: vatRate,
        milestone: 'Signature du contrat'
      };
      updateSchedule([invoice]);
      return;
    }
    
    const majorPhases = includedLines.filter(l => l.line_type === 'phase');
    const newInvoices: PlannedInvoice[] = majorPhases.map((phase, index) => ({
      id: crypto.randomUUID(),
      schedule_number: index + 1,
      title: `Acompte ${phase.phase_name}`,
      description: phase.phase_description,
      percentage: phase.percentage_fee,
      amount_ht: phase.amount || 0,
      amount_ttc: (phase.amount || 0) * (1 + vatRate / 100),
      vat_rate: vatRate,
      milestone: phase.phase_name,
      phase_ids: [phase.id]
    }));
    
    updateSchedule(newInvoices);
  };
  
  // Generate equal split
  const generateEqualSplit = (count: number) => {
    const percentage = Math.floor(100 / count);
    const remainder = 100 - (percentage * count);
    
    const newInvoices: PlannedInvoice[] = Array.from({ length: count }, (_, index) => {
      const pct = index === 0 ? percentage + remainder : percentage;
      return {
        id: crypto.randomUUID(),
        schedule_number: index + 1,
        title: `Acompte ${index + 1}`,
        percentage: pct,
        amount_ht: totalAmount * (pct / 100),
        amount_ttc: totalAmount * (pct / 100) * (1 + vatRate / 100),
        vat_rate: vatRate
      };
    });
    
    updateSchedule(newInvoices);
  };
  
  // Add new invoice
  const addInvoice = () => {
    const newInvoice: PlannedInvoice = {
      id: crypto.randomUUID(),
      schedule_number: plannedInvoices.length + 1,
      title: `Acompte ${plannedInvoices.length + 1}`,
      percentage: 0,
      amount_ht: 0,
      amount_ttc: 0,
      vat_rate: vatRate
    };
    updateSchedule([...plannedInvoices, newInvoice]);
  };
  
  // Remove invoice
  const removeInvoice = (id: string) => {
    const updated = plannedInvoices
      .filter(i => i.id !== id)
      .map((inv, idx) => ({ ...inv, schedule_number: idx + 1 }));
    updateSchedule(updated);
  };
  
  // Update single invoice
  const updateInvoice = (id: string, updates: Partial<PlannedInvoice>) => {
    const updated = plannedInvoices.map(inv => {
      if (inv.id !== id) return inv;
      
      const newInv = { ...inv, ...updates };
      
      // Recalculate amounts if percentage changed
      if (updates.percentage !== undefined) {
        newInv.amount_ht = totalAmount * (updates.percentage / 100);
        newInv.amount_ttc = newInv.amount_ht * (1 + vatRate / 100);
      }
      
      // Recalculate TTC if HT changed
      if (updates.amount_ht !== undefined) {
        newInv.percentage = totalAmount > 0 ? (updates.amount_ht / totalAmount) * 100 : 0;
        newInv.amount_ttc = updates.amount_ht * (1 + vatRate / 100);
      }
      
      return newInv;
    });
    updateSchedule(updated);
  };
  
  // Calculate totals
  const totalPercentage = plannedInvoices.reduce((sum, inv) => sum + (inv.percentage || 0), 0);
  const totalHT = plannedInvoices.reduce((sum, inv) => sum + (inv.amount_ht || 0), 0);
  const totalTTC = plannedInvoices.reduce((sum, inv) => sum + (inv.amount_ttc || 0), 0);
  const isBalanced = Math.abs(totalPercentage - 100) < 0.01;
  
  // Check coverage: all quote lines should be covered by invoicing
  const includedLinesTotal = lines
    .filter(l => l.is_included && l.line_type !== 'discount')
    .reduce((sum, l) => sum + (l.amount || 0), 0);
  const missingAmount = Math.max(0, includedLinesTotal - totalHT);
  const hasCoverageGap = missingAmount > 1; // Tolerance of 1€
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  return (
    <div className="space-y-6">
      {/* Coverage alert */}
      {hasCoverageGap && (
        <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Couverture de facturation incomplète</p>
            <p className="text-sm opacity-90">
              {formatCurrency(missingAmount)} du devis ne sont pas couverts par l'échéancier.
              Tout ce qui est dans le devis doit être facturé.
            </p>
          </div>
        </div>
      )}
      
      {/* No schedule alert */}
      {plannedInvoices.length === 0 && totalAmount > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Aucun échéancier défini</p>
            <p className="text-sm opacity-90">
              Définissez un échéancier de facturation pour ce devis de {formatCurrency(totalAmount)}.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Euro className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total HT du devis</p>
                <p className="text-xl font-semibold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Receipt className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Échéances planifiées</p>
                <p className="text-xl font-semibold">{plannedInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(!isBalanced && plannedInvoices.length > 0 && "border-amber-500")}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                isBalanced ? "bg-green-500/10" : "bg-amber-500/10"
              )}>
                <PieChart className={cn(
                  "h-5 w-5",
                  isBalanced ? "text-green-500" : "text-amber-500"
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Répartition</p>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-xl font-semibold",
                    !isBalanced && plannedInvoices.length > 0 && "text-amber-500"
                  )}>
                    {totalPercentage.toFixed(1)}%
                  </p>
                  {!isBalanced && plannedInvoices.length > 0 && (
                    <Badge variant="outline" className="text-amber-500 border-amber-500">
                      {totalPercentage > 100 ? 'Excédent' : 'Incomplet'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Generation actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Génération automatique
          </CardTitle>
          <CardDescription>
            Créez un échéancier basé sur les phases du devis ou en répartition égale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={generateFromPhases}>
              <Wand2 className="h-4 w-4 mr-2" />
              Depuis les phases
            </Button>
            <Button variant="outline" size="sm" onClick={() => generateEqualSplit(2)}>
              50/50
            </Button>
            <Button variant="outline" size="sm" onClick={() => generateEqualSplit(3)}>
              3 tiers
            </Button>
            <Button variant="outline" size="sm" onClick={() => generateEqualSplit(4)}>
              4 quarts
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Invoice schedule - Card-based layout */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Échéancier de facturation</CardTitle>
              <CardDescription>
                Définissez les acomptes et échéances de facturation du projet
              </CardDescription>
            </div>
            <Button size="sm" onClick={addInvoice}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {plannedInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune échéance définie</p>
              <p className="text-sm">Utilisez la génération automatique ou ajoutez manuellement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plannedInvoices.map((invoice, index) => (
                <div 
                  key={invoice.id}
                  className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  {/* Header row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <Badge variant="outline" className="font-mono">
                        #{invoice.schedule_number}
                      </Badge>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Input 
                        value={invoice.title}
                        onChange={(e) => updateInvoice(invoice.id, { title: e.target.value })}
                        className="font-medium h-9 bg-background"
                        placeholder="Titre de l'échéance..."
                      />
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive shrink-0"
                      onClick={() => removeInvoice(invoice.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Fields grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Milestone */}
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Jalon</label>
                      <Input 
                        value={invoice.milestone || ''}
                        onChange={(e) => updateInvoice(invoice.id, { milestone: e.target.value })}
                        placeholder="Ex: Validation APD"
                        className="h-9 bg-background"
                      />
                    </div>
                    
                    {/* Percentage */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Pourcentage</label>
                      <div className="relative">
                        <Input 
                          type="number"
                          value={invoice.percentage || 0}
                          onChange={(e) => updateInvoice(invoice.id, { percentage: parseFloat(e.target.value) || 0 })}
                          className="h-9 pr-8 bg-background"
                          min={0}
                          max={100}
                        />
                        <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    {/* Amount HT */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Montant HT</label>
                      <div className="relative">
                        <Input 
                          type="number"
                          value={Math.round(invoice.amount_ht) || 0}
                          onChange={(e) => updateInvoice(invoice.id, { amount_ht: parseFloat(e.target.value) || 0 })}
                          className="h-9 pr-8 bg-background"
                        />
                        <Euro className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    {/* Planned date */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Date planifiée</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className={cn(
                              "w-full h-9 justify-start font-normal bg-background",
                              !invoice.planned_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="h-4 w-4 mr-2 shrink-0" />
                            <span className="truncate">
                              {invoice.planned_date 
                                ? format(new Date(invoice.planned_date), 'dd MMM yyyy', { locale: fr })
                                : 'Choisir...'}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={invoice.planned_date ? new Date(invoice.planned_date) : undefined}
                            onSelect={(date) => updateInvoice(invoice.id, { 
                              planned_date: date?.toISOString().split('T')[0] 
                            })}
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  {/* Amount TTC display */}
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Montant TTC (TVA {vatRate}%)</span>
                    <span className="font-semibold text-lg">{formatCurrency(invoice.amount_ttc || 0)}</span>
                  </div>
                </div>
              ))}
              
              {/* Totals */}
              <Separator className="my-4" />
              <div className="flex flex-wrap items-center justify-end gap-4 text-sm">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                  isBalanced ? "bg-green-500/10 text-green-700" : "bg-amber-500/10 text-amber-700"
                )}>
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">{totalPercentage.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                  <span className="text-muted-foreground">HT:</span>
                  <span className="font-medium">{formatCurrency(totalHT)}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
                  <span className="text-muted-foreground">TTC:</span>
                  <span className="font-bold text-lg">{formatCurrency(totalTTC)}</span>
                </div>
              </div>
              
              {!isBalanced && (
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm mt-4">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Le total des pourcentages doit être égal à 100% 
                    (actuellement {totalPercentage.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quote sharing settings */}
      <QuoteSharingSettings 
        document={document}
        onDocumentChange={onDocumentChange}
      />
    </div>
  );
}
