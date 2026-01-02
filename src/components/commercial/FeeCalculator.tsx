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
        return phases.reduce((sum, p) => p.is_included ? sum + (p.amount || 0) : sum, 0);
      case 'hourly':
        if (document.hourly_rate) {
          // Estimate based on phases
          return includedPhases.length * 40 * document.hourly_rate; // 40h estimate per phase
        }
        return 0;
      default:
        return 0;
    }
  };

  const baseFee = document.project_budget && document.fee_percentage
    ? document.project_budget * (document.fee_percentage / 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Fee Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Mode de rémunération</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={document.fee_mode || 'percentage'}
            onValueChange={(v) => onDocumentChange({ ...document, fee_mode: v as FeeMode })}
            className="grid grid-cols-2 gap-4"
          >
            {(['percentage', 'fixed', 'hourly', 'mixed'] as FeeMode[]).map((mode) => (
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
          {(document.fee_mode === 'percentage' || document.fee_mode === 'mixed') && (
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
                    <span>Base de calcul</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(baseFee)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {(document.fee_mode === 'hourly' || document.fee_mode === 'mixed') && (
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
            <div className="text-sm font-medium">Récapitulatif</div>
            
            {includedPhases.map((phase) => {
              const phaseAmount = document.fee_mode === 'percentage' && baseFee
                ? baseFee * (phase.percentage_fee / 100)
                : phase.amount || 0;
              
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
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(calculateTotal())}
              </span>
            </div>

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>TVA (20%)</span>
              <span>
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(calculateTotal() * 0.2)}
              </span>
            </div>

            <div className="flex justify-between font-bold text-primary">
              <span>Total TTC</span>
              <span className="text-xl">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(calculateTotal() * 1.2)}
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
