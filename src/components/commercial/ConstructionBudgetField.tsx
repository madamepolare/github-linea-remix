import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, EyeOff } from 'lucide-react';

interface ConstructionBudgetFieldProps {
  constructionBudget: number | null | undefined;
  constructionBudgetDisclosed: boolean;
  onChange: (budget: number | null, disclosed: boolean) => void;
}

export function ConstructionBudgetField({
  constructionBudget,
  constructionBudgetDisclosed,
  onChange
}: ConstructionBudgetFieldProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Budget global des travaux
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="budget-disclosed">Budget communiqué</Label>
            <p className="text-sm text-muted-foreground">
              Désactivez si le client n'a pas communiqué de budget
            </p>
          </div>
          <Switch
            id="budget-disclosed"
            checked={constructionBudgetDisclosed}
            onCheckedChange={(checked) => onChange(constructionBudget ?? null, checked)}
          />
        </div>

        {constructionBudgetDisclosed ? (
          <div className="space-y-2">
            <Label htmlFor="construction-budget">Montant estimé (€)</Label>
            <Input
              id="construction-budget"
              type="number"
              value={constructionBudget || ''}
              onChange={(e) => onChange(parseFloat(e.target.value) || null, true)}
              placeholder="Budget prévisionnel des travaux"
            />
            <p className="text-xs text-muted-foreground">
              Ce montant sera affiché dans le PDF du document
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            <EyeOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              "Non communiqué" sera affiché dans le PDF
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
