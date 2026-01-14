import { AlertTriangle, TrendingUp, ArrowRight, Settings, Percent, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BudgetVsCAAlertProps {
  totalCA: number;
  projectBudget: number;
  onAdjustBudget?: () => void;
  onAdjustCA?: () => void;
  onRedistribute?: () => void;
  className?: string;
}

export function BudgetVsCAAlert({
  totalCA,
  projectBudget,
  onAdjustBudget,
  onAdjustCA,
  onRedistribute,
  className,
}: BudgetVsCAAlertProps) {
  const difference = totalCA - projectBudget;
  const percentageOver = projectBudget > 0 ? ((difference / projectBudget) * 100).toFixed(1) : 0;
  
  // No alert if CA <= Budget
  if (totalCA <= projectBudget) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
            CA prévu supérieur au budget
            <span className="text-xs font-normal bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded-full">
              +{percentageOver}%
            </span>
          </h4>
          
          <div className="mt-2 flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-medium">{formatCurrency(projectBudget)}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <span className="text-muted-foreground">CA prévu:</span>
              <span className="font-medium text-amber-700 dark:text-amber-400">
                {formatCurrency(totalCA)}
              </span>
            </div>
            <span className="text-amber-600 dark:text-amber-500 font-medium">
              (+{formatCurrency(difference)})
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {onAdjustBudget && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAdjustBudget}
                className="bg-white dark:bg-transparent hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-300 dark:border-amber-800"
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Ajuster budget
              </Button>
            )}
            {onAdjustCA && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAdjustCA}
                className="bg-white dark:bg-transparent hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-300 dark:border-amber-800"
              >
                <Percent className="h-3.5 w-3.5 mr-1.5" />
                Ajuster CA
              </Button>
            )}
            {onRedistribute && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRedistribute}
                className="bg-white dark:bg-transparent hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-300 dark:border-amber-800"
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Répartir
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
