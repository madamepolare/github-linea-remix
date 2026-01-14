import {
  TrendingUp,
  TrendingDown,
  Euro,
  Receipt,
  FileText,
  CreditCard,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BudgetSummaryCardsProps {
  // Project budget
  projectBudget: number;
  totalClientCost: number; // Time spent value
  
  // Purchases
  provisionsTotal: number;
  invoicesTotal: number;
  paidTotal: number;
  pendingTotal: number;
  
  // Margin
  totalMargin: number;
  totalSellingPrice: number;
  
  // Alerts
  overdueCount: number;
  upcomingCount: number;
  
  isAdmin?: boolean;
}

export function BudgetSummaryCards({
  projectBudget,
  totalClientCost,
  provisionsTotal,
  invoicesTotal,
  paidTotal,
  pendingTotal,
  totalMargin,
  totalSellingPrice,
  overdueCount,
  upcomingCount,
  isAdmin = false,
}: BudgetSummaryCardsProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // Calculate totals
  const totalCosts = totalClientCost + invoicesTotal;
  const netResult = projectBudget - totalCosts;
  const budgetUsedPercent = projectBudget > 0 
    ? Math.min(100, Math.round((totalCosts / projectBudget) * 100)) 
    : 0;
  
  const marginPercent = totalSellingPrice > 0
    ? Math.round((totalMargin / totalSellingPrice) * 100)
    : 0;

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {/* Budget Overview */}
      <Card className="col-span-1">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Euro className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Budget projet</span>
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(projectBudget)}
          </div>
          {projectBudget > 0 && (
            <>
              <Progress
                value={budgetUsedPercent}
                className={cn(
                  "h-1.5 mt-2",
                  budgetUsedPercent > 90
                    ? "[&>div]:bg-destructive"
                    : budgetUsedPercent > 70
                    ? "[&>div]:bg-amber-500"
                    : "[&>div]:bg-emerald-500"
                )}
              />
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>Consommé</span>
                <span className="font-medium">{budgetUsedPercent}%</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Provisions */}
      <Card className="col-span-1">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <FileText className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Provisions</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {formatCurrency(provisionsTotal)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Estimations en attente
          </p>
        </CardContent>
      </Card>

      {/* Supplier Invoices */}
      <Card className="col-span-1">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Receipt className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Factures</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(invoicesTotal)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              {formatCurrency(paidTotal)}
            </span>
            {pendingTotal > 0 && (
              <span className="text-xs text-orange-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatCurrency(pendingTotal)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Result / Margin */}
      {isAdmin && (
        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              {netResult >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className="text-xs text-muted-foreground">Résultat</span>
            </div>
            <div className={cn(
              "text-2xl font-bold",
              netResult >= 0 ? "text-emerald-600" : "text-destructive"
            )}>
              {formatCurrency(netResult)}
            </div>
            {totalSellingPrice > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Marge revente : {marginPercent}%
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alerts (if any) */}
      {(overdueCount > 0 || upcomingCount > 0) && (
        <Card className={cn(
          "col-span-1",
          overdueCount > 0 && "border-destructive/50"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className={cn(
                "h-4 w-4",
                overdueCount > 0 ? "text-destructive" : "text-amber-500"
              )} />
              <span className="text-xs text-muted-foreground">Échéances</span>
            </div>
            {overdueCount > 0 && (
              <p className="text-sm text-destructive font-medium">
                {overdueCount} en retard
              </p>
            )}
            {upcomingCount > 0 && (
              <p className="text-sm text-amber-600">
                {upcomingCount} cette semaine
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
