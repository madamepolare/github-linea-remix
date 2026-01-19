import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Percent, Calculator, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface HonorairesBlockProps {
  tender: any;
}

export function HonorairesBlock({ tender }: HonorairesBlockProps) {
  const feePercentage = tender.moe_fee_percentage;
  const feeAmount = tender.moe_fee_amount;
  const budget = tender.estimated_budget;
  
  // Calculer si non fourni
  const calculatedAmount = feeAmount || (budget && feePercentage ? budget * feePercentage / 100 : null);

  if (!feePercentage && !feeAmount) return null;

  const formatAmount = (amount: number | null | undefined) => {
    if (!amount) return "—";
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)} M€`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)} k€`;
    return `${amount.toLocaleString()} €`;
  };

  // Déterminer le niveau de marge (pour l'indicateur visuel)
  const getMarginLevel = (pct: number): { label: string; color: string } => {
    if (pct >= 12) return { label: 'Élevé', color: 'text-green-600 bg-green-100' };
    if (pct >= 8) return { label: 'Standard', color: 'text-blue-600 bg-blue-100' };
    if (pct >= 5) return { label: 'Serré', color: 'text-amber-600 bg-amber-100' };
    return { label: 'Très bas', color: 'text-red-600 bg-red-100' };
  };

  const marginLevel = feePercentage ? getMarginLevel(feePercentage) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Coins className="h-4 w-4 text-blue-600" />
          Honoraires MOE
          {marginLevel && (
            <Badge className={cn("ml-auto text-xs", marginLevel.color)}>
              {marginLevel.label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Affichage principal */}
          <div className="grid grid-cols-2 gap-4">
            {/* Pourcentage */}
            {feePercentage && (
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Percent className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {feePercentage}%
                </p>
                <p className="text-xs text-muted-foreground">Taux d'honoraires</p>
              </div>
            )}

            {/* Montant */}
            {calculatedAmount && (
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calculator className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {formatAmount(calculatedAmount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {feeAmount ? 'Montant indiqué' : 'Montant estimé'}
                </p>
              </div>
            )}
          </div>

          {/* Barre de progression comparative */}
          {feePercentage && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>15%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                {/* Zones de référence */}
                <div className="absolute inset-y-0 left-0 w-1/3 bg-red-200/50" />
                <div className="absolute inset-y-0 left-1/3 w-1/3 bg-amber-200/50" />
                <div className="absolute inset-y-0 left-2/3 w-1/3 bg-green-200/50" />
                {/* Indicateur */}
                <div 
                  className="absolute h-4 w-1 bg-primary -top-1 rounded-full transition-all"
                  style={{ left: `${Math.min(feePercentage / 15 * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
