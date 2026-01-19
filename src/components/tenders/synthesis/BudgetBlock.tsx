import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BudgetBlockProps {
  tender: any;
}

export function BudgetBlock({ tender }: BudgetBlockProps) {
  const budget = tender.estimated_budget;
  const budgetDisclosed = tender.budget_disclosed;
  
  if (!budget && !budgetDisclosed) return null;

  const formatBudget = (amount: number | null | undefined) => {
    if (!amount) return "—";
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1).replace(".0", "")} M€`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)} k€`;
    return `${amount.toLocaleString()} €`;
  };

  // Calculer le ratio honoraires/budget si possible
  const feePercentage = tender.moe_fee_percentage;
  const feeAmount = tender.moe_fee_amount || (budget && feePercentage ? budget * feePercentage / 100 : null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Euro className="h-4 w-4 text-green-600" />
          Budget travaux
          {budgetDisclosed === false && (
            <Badge variant="secondary" className="ml-auto text-xs bg-amber-100 text-amber-700">
              Non communiqué
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Montant principal */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-700 dark:text-green-400">
              {formatBudget(budget)}
            </span>
            <span className="text-sm text-muted-foreground">HT</span>
          </div>

          {/* Barre de progression visuelle */}
          {budget && (
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
              
              {/* Ratio honoraires si disponible */}
              {feePercentage && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Honoraires MOE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{feePercentage}%</span>
                    {feeAmount && (
                      <Badge variant="outline" className="text-xs">
                        {formatBudget(feeAmount)}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info enveloppe */}
          {budgetDisclosed === false && budget && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>Enveloppe estimée (non officielle)</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Le budget n'est pas communiqué dans le DCE.<br />Cette estimation provient de l'analyse IA.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
