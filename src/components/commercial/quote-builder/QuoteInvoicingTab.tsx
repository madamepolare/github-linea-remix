import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  CalendarIcon, 
  Wand2, 
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Receipt,
  PieChart,
  Euro
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { PlannedInvoice } from '@/lib/commercialTypes';

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
      setPlannedInvoices(document.invoice_schedule);
    }
  }, [document.invoice_schedule]);
  
  // Update document when schedule changes
  const updateSchedule = (newSchedule: PlannedInvoice[]) => {
    setPlannedInvoices(newSchedule);
    onDocumentChange({ invoice_schedule: newSchedule });
  };
  
  // Generate schedule from phases
  const generateFromPhases = () => {
    const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount');
    
    if (includedLines.length === 0) {
      // No phases, create single invoice
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
    
    // Create one invoice per major phase
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
  
  // Move invoice up/down
  const moveInvoice = (id: string, direction: 'up' | 'down') => {
    const index = plannedInvoices.findIndex(i => i.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= plannedInvoices.length) return;
    
    const updated = [...plannedInvoices];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    // Update schedule numbers
    updated.forEach((inv, idx) => {
      inv.schedule_number = idx + 1;
    });
    
    updateSchedule(updated);
  };
  
  // Calculate totals
  const totalPercentage = plannedInvoices.reduce((sum, inv) => sum + (inv.percentage || 0), 0);
  const totalHT = plannedInvoices.reduce((sum, inv) => sum + (inv.amount_ht || 0), 0);
  const totalTTC = plannedInvoices.reduce((sum, inv) => sum + (inv.amount_ttc || 0), 0);
  const isBalanced = Math.abs(totalPercentage - 100) < 0.01;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  return (
    <div className="space-y-6">
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
      
      {/* Invoice schedule table */}
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Jalon</TableHead>
                    <TableHead className="w-24 text-right">%</TableHead>
                    <TableHead className="w-32 text-right">Montant HT</TableHead>
                    <TableHead className="w-32 text-right">Montant TTC</TableHead>
                    <TableHead className="w-40">Date planifiée</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plannedInvoices.map((invoice, index) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-5 w-5"
                            disabled={index === 0}
                            onClick={() => moveInvoice(invoice.id, 'up')}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <span className="text-center text-sm">{invoice.schedule_number}</span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-5 w-5"
                            disabled={index === plannedInvoices.length - 1}
                            onClick={() => moveInvoice(invoice.id, 'down')}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={invoice.title}
                          onChange={(e) => updateInvoice(invoice.id, { title: e.target.value })}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={invoice.milestone || ''}
                          onChange={(e) => updateInvoice(invoice.id, { milestone: e.target.value })}
                          placeholder="Ex: Validation APD"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          value={invoice.percentage || 0}
                          onChange={(e) => updateInvoice(invoice.id, { percentage: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-right"
                          min={0}
                          max={100}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input 
                          type="number"
                          value={Math.round(invoice.amount_ht) || 0}
                          onChange={(e) => updateInvoice(invoice.id, { amount_ht: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.amount_ttc || 0)}
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full h-8 justify-start">
                              <CalendarIcon className="h-3 w-3 mr-2" />
                              {invoice.planned_date 
                                ? format(new Date(invoice.planned_date), 'dd/MM/yyyy', { locale: fr })
                                : 'Date...'}
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
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeInvoice(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Totals row */}
              <Separator className="my-2" />
              <div className="flex items-center justify-end gap-6 px-4 py-2 text-sm">
                <div className={cn(!isBalanced && "text-amber-500 font-medium")}>
                  Total: {totalPercentage.toFixed(1)}%
                </div>
                <div className="font-medium">
                  {formatCurrency(totalHT)} HT
                </div>
                <div className="font-bold text-lg">
                  {formatCurrency(totalTTC)} TTC
                </div>
              </div>
              
              {!isBalanced && (
                <div className="flex items-center gap-2 px-4 py-2 text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
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
    </div>
  );
}
