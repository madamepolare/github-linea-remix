import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Euro, Percent, Calculator, Layers, RefreshCw } from 'lucide-react';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { usePhaseTemplates } from '@/hooks/usePhaseTemplates';
import { getDisciplineBySlug, DisciplinePhase, DISCIPLINE_CONFIGS } from '@/lib/disciplinesConfig';
import { toast } from 'sonner';

interface QuoteFeesTabProps {
  document: Partial<QuoteDocument>;
  onDocumentChange: (doc: Partial<QuoteDocument>) => void;
  lines: QuoteLine[];
  onLinesChange: (lines: QuoteLine[]) => void;
}

interface PhaseConfig {
  code: string;
  name: string;
  percentage: number;
  isIncluded: boolean;
  amount: number;
}

export function QuoteFeesTab({ 
  document, 
  onDocumentChange, 
  lines, 
  onLinesChange 
}: QuoteFeesTabProps) {
  const { templates } = usePhaseTemplates(document.project_type as any);
  
  // Get discipline-based phases as fallback
  const disciplinePhases = useMemo(() => {
    if (document.project_type) {
      const slug = document.project_type as keyof typeof DISCIPLINE_CONFIGS;
      if (DISCIPLINE_CONFIGS[slug]) {
        return DISCIPLINE_CONFIGS[slug].defaultPhases;
      }
    }
    // Default to architecture phases for fee-based contracts
    return DISCIPLINE_CONFIGS.architecture.defaultPhases;
  }, [document.project_type]);

  // Initialize phases from lines or defaults
  const [phases, setPhases] = useState<PhaseConfig[]>(() => {
    // If we have existing lines that look like phases, use them
    const existingPhases = lines.filter(l => l.line_type === 'phase' || l.phase_code);
    if (existingPhases.length > 0) {
      return existingPhases.map(l => ({
        code: l.phase_code || l.id,
        name: l.phase_name,
        percentage: l.percentage_fee || 0,
        isIncluded: l.is_included ?? true,
        amount: l.amount || 0
      }));
    }
    // Otherwise use discipline defaults
    return disciplinePhases.map(p => ({
      code: p.code,
      name: p.name,
      percentage: p.percentage || 0,
      isIncluded: true,
      amount: 0
    }));
  });

  const constructionBudget = document.construction_budget || 0;
  const feePercentage = document.fee_percentage || 12;

  // Calculate total fees based on budget
  const totalFees = useMemo(() => {
    return (constructionBudget * feePercentage) / 100;
  }, [constructionBudget, feePercentage]);

  // Update phase amounts when budget or percentages change
  useEffect(() => {
    const updatedPhases = phases.map(p => ({
      ...p,
      amount: p.isIncluded ? (totalFees * p.percentage) / 100 : 0
    }));
    
    // Only update if amounts actually changed
    const hasChanged = updatedPhases.some((p, i) => p.amount !== phases[i].amount);
    if (hasChanged) {
      setPhases(updatedPhases);
    }
  }, [totalFees, phases]);

  // Sync phases to lines
  useEffect(() => {
    const phaseLines: QuoteLine[] = phases.map((p, index) => ({
      id: `phase-${p.code}`,
      phase_name: p.name,
      phase_code: p.code,
      line_type: 'phase',
      unit: 'forfait',
      quantity: 1,
      unit_price: p.amount,
      amount: p.amount,
      percentage_fee: p.percentage,
      is_included: p.isIncluded,
      is_optional: false,
      billing_type: 'one_time' as const,
      sort_order: index,
      deliverables: []
    }));
    
    // Merge with non-phase lines
    const otherLines = lines.filter(l => l.line_type !== 'phase' && !l.phase_code);
    onLinesChange([...phaseLines, ...otherLines]);
  }, [phases]);

  const handlePhaseToggle = (code: string, checked: boolean) => {
    setPhases(prev => prev.map(p => 
      p.code === code ? { ...p, isIncluded: checked } : p
    ));
  };

  const handlePercentageChange = (code: string, percentage: number) => {
    setPhases(prev => prev.map(p => 
      p.code === code ? { ...p, percentage } : p
    ));
  };

  const handleResetToDefaults = () => {
    const defaultPhases = disciplinePhases.map(p => ({
      code: p.code,
      name: p.name,
      percentage: p.percentage || 0,
      isIncluded: true,
      amount: (totalFees * (p.percentage || 0)) / 100
    }));
    setPhases(defaultPhases);
    toast.success('Phases réinitialisées');
  };

  const includedPhases = phases.filter(p => p.isIncluded);
  const totalPercentage = includedPhases.reduce((sum, p) => sum + p.percentage, 0);
  const totalAmount = includedPhases.reduce((sum, p) => sum + p.amount, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  return (
    <div className="space-y-6">
      {/* Budget & Fee Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Base de calcul des honoraires
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                Budget travaux (€ HT)
              </Label>
              <Input
                type="number"
                value={constructionBudget || ''}
                onChange={(e) => onDocumentChange({ 
                  ...document, 
                  construction_budget: parseFloat(e.target.value) || 0 
                })}
                placeholder="Ex: 150000"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                Taux d'honoraires (%)
              </Label>
              <Input
                type="number"
                value={feePercentage || ''}
                onChange={(e) => onDocumentChange({ 
                  ...document, 
                  fee_percentage: parseFloat(e.target.value) || 0 
                })}
                placeholder="Ex: 12"
                step="0.5"
              />
            </div>
          </div>

          {constructionBudget > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Honoraires totaux estimés</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(totalFees)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {feePercentage}% de {formatCurrency(constructionBudget)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phases Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Répartition par phases
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleResetToDefaults}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-20">Code</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead className="w-24 text-right">%</TableHead>
                <TableHead className="w-32 text-right">Montant HT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phases.map((phase) => (
                <TableRow 
                  key={phase.code}
                  className={!phase.isIncluded ? 'opacity-50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={phase.isIncluded}
                      onCheckedChange={(checked) => 
                        handlePhaseToggle(phase.code, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {phase.code}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{phase.name}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={phase.percentage}
                      onChange={(e) => 
                        handlePercentageChange(phase.code, parseFloat(e.target.value) || 0)
                      }
                      className="w-20 text-right h-8"
                      step="0.5"
                      disabled={!phase.isIncluded}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {phase.isIncluded ? formatCurrency(phase.amount) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Total</span>
              <Badge 
                variant={totalPercentage === 100 ? 'default' : 'destructive'}
                className="font-mono"
              >
                {totalPercentage.toFixed(1)}%
              </Badge>
              {totalPercentage !== 100 && (
                <span className="text-xs text-destructive">
                  (devrait être 100%)
                </span>
              )}
            </div>
            <span className="text-lg font-bold">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Budget Disclosure Option */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="disclose-budget"
              checked={document.construction_budget_disclosed ?? false}
              onCheckedChange={(checked) => 
                onDocumentChange({ 
                  ...document, 
                  construction_budget_disclosed: checked as boolean 
                })
              }
            />
            <Label htmlFor="disclose-budget" className="text-sm">
              Afficher le budget travaux sur le document client
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}