import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  CommercialDocument,
  CommercialDocumentPhase,
  FeeMode,
  FEE_MODE_LABELS
} from '@/lib/commercialTypes';

interface FeeCalculatorProps {
  document: Partial<CommercialDocument>;
  phases: CommercialDocumentPhase[];
  onDocumentChange: (doc: Partial<CommercialDocument>) => void;
}

export function FeeCalculator({
  document,
  phases,
  onDocumentChange
}: FeeCalculatorProps) {
  const includedPhases = phases.filter(p => p.is_included);
  const totalPercentagePhases = includedPhases.reduce((sum, p) => sum + p.percentage_fee, 0);

  const calculateTotal = () => {
    switch (document.fee_mode) {
      case 'percentage':
        if (document.project_budget && document.fee_percentage) {
          const baseFee = document.project_budget * (document.fee_percentage / 100);
          return baseFee * (totalPercentagePhases / 100);
        }
        return 0;
      case 'fixed':
        return document.total_amount || 0;
      case 'hourly':
        if (document.hourly_rate) {
          // Estimate based on phases
          return includedPhases.length * 40 * document.hourly_rate; // 40h estimate per phase
        }
        return 0;
      case 'mixed':
        // For mixed, use total_amount as base
        return document.total_amount || 0;
      default:
        return document.total_amount || 0;
    }
  };

  const baseFee = document.project_budget && document.fee_percentage
    ? document.project_budget * (document.fee_percentage / 100)
    : document.total_amount || 0;

  const total = calculateTotal();

  // Calculate phase amounts based on total
  const getPhaseAmount = (phase: CommercialDocumentPhase) => {
    if (document.fee_mode === 'fixed' || document.fee_mode === 'mixed') {
      return (document.total_amount || 0) * (phase.percentage_fee / 100);
    }
    if (document.fee_mode === 'percentage' && baseFee) {
      return baseFee * (phase.percentage_fee / 100);
    }
    return phase.amount || 0;
  };

  return (
    <div className="space-y-6">
      {/* Fee Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Mode de rémunération</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={document.fee_mode || 'fixed'}
            onValueChange={(v) => onDocumentChange({ ...document, fee_mode: v as FeeMode })}
            className="grid grid-cols-2 gap-4"
          >
            {(['fixed', 'percentage', 'hourly', 'mixed'] as FeeMode[]).map((mode) => (
              <div key={mode} className="flex items-center space-x-2">
                <RadioGroupItem value={mode} id={mode} />
                <Label htmlFor={mode} className="cursor-pointer">
                  {FEE_MODE_LABELS[mode]}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Fee Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Calcul des honoraires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fixed / Forfait Mode */}
          {(document.fee_mode === 'fixed' || document.fee_mode === 'mixed' || !document.fee_mode) && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Montant forfaitaire HT (€)</Label>
                  <Input
                    type="number"
                    value={document.total_amount || ''}
                    onChange={(e) => onDocumentChange({ 
                      ...document, 
                      total_amount: parseFloat(e.target.value) || undefined 
                    })}
                    placeholder="Ex: 12500"
                    className="text-lg font-medium h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Montant total de la mission (hors TVA)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Percentage Mode */}
          {(document.fee_mode === 'percentage') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget travaux (€)</Label>
                  <Input
                    type="number"
                    value={document.project_budget || ''}
                    onChange={(e) => onDocumentChange({ 
                      ...document, 
                      project_budget: parseFloat(e.target.value) || undefined 
                    })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taux d'honoraires (%)</Label>
                  <Input
                    type="number"
                    value={document.fee_percentage || ''}
                    onChange={(e) => onDocumentChange({ 
                      ...document, 
                      fee_percentage: parseFloat(e.target.value) || undefined 
                    })}
                    placeholder="10"
                    step="0.5"
                  />
                </div>
              </div>
              
              {baseFee > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Base de calcul ({document.fee_percentage}% de {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(document.project_budget || 0)})</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(baseFee)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hourly Mode */}
          {(document.fee_mode === 'hourly') && (
            <div className="space-y-2">
              <Label>Taux horaire (€/h)</Label>
              <Input
                type="number"
                value={document.hourly_rate || ''}
                onChange={(e) => onDocumentChange({ 
                  ...document, 
                  hourly_rate: parseFloat(e.target.value) || undefined 
                })}
                placeholder="85"
              />
            </div>
          )}

          <Separator />

          {/* Summary */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Répartition par phase</div>
            
            {includedPhases.map((phase) => {
              const phaseAmount = getPhaseAmount(phase);
              
              return (
                <div key={phase.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {phase.phase_code} - {phase.phase_name}
                    <span className="ml-2 text-xs">({phase.percentage_fee}%)</span>
                  </span>
                  <span>
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(phaseAmount)}
                  </span>
                </div>
              );
            })}

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>Total HT</span>
              <span className="text-lg">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total)}
              </span>
            </div>

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>TVA (20%)</span>
              <span>
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total * 0.2)}
              </span>
            </div>

            <div className="flex justify-between font-bold text-primary">
              <span>Total TTC</span>
              <span className="text-xl">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total * 1.2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validity */}
      <Card>
        <CardHeader>
          <CardTitle>Validité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Durée de validité (jours)</Label>
            <Input
              type="number"
              value={document.validity_days || 30}
              onChange={(e) => onDocumentChange({ 
                ...document, 
                validity_days: parseInt(e.target.value) || 30 
              })}
            />
            <p className="text-xs text-muted-foreground">
              Le document sera valide jusqu'au{' '}
              {new Date(Date.now() + (document.validity_days || 30) * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
