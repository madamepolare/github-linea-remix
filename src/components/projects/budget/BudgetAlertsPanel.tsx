import { AlertTriangle, AlertCircle, TrendingUp, Clock, Euro, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectBudgetEnvelopes, BudgetEnvelope } from "@/hooks/useProjectBudgetEnvelopes";
import { useProject } from "@/hooks/useProjects";
import { useBillableTime } from "@/hooks/useBillableTime";
import { cn } from "@/lib/utils";

interface BudgetAlertsPanelProps {
  projectId: string;
  onIncreaseBudget?: () => void;
  onNavigateToInvoicing?: () => void;
}

interface BudgetAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  envelope?: BudgetEnvelope;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function BudgetAlertsPanel({ 
  projectId, 
  onIncreaseBudget,
  onNavigateToInvoicing 
}: BudgetAlertsPanelProps) {
  const { data: project } = useProject(projectId);
  const { envelopes, summary } = useProjectBudgetEnvelopes(projectId);
  const { summary: billableSummary } = useBillableTime(projectId);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // Generate alerts
  const alerts: BudgetAlert[] = [];

  // 1. Envelopes nearing or exceeding threshold
  summary.alertEnvelopes.forEach(envelope => {
    const consumedPct = (envelope.consumed_amount / envelope.budget_amount) * 100;
    const isCritical = consumedPct >= 100;
    
    alerts.push({
      id: `envelope-${envelope.id}`,
      type: isCritical ? 'critical' : 'warning',
      title: isCritical ? `Enveloppe épuisée: ${envelope.name}` : `Alerte enveloppe: ${envelope.name}`,
      message: isCritical 
        ? `Budget dépassé de ${formatCurrency(envelope.consumed_amount - envelope.budget_amount)}`
        : `${consumedPct.toFixed(0)}% consommé (seuil: ${envelope.alert_threshold}%)`,
      envelope,
      action: onIncreaseBudget ? {
        label: "Ajuster budget",
        onClick: onIncreaseBudget,
      } : undefined,
    });
  });

  // 2. Global budget alert
  const projectBudget = project?.budget || 0;
  if (projectBudget > 0) {
    const totalConsumed = summary.totalConsumed;
    const globalPct = (totalConsumed / projectBudget) * 100;
    
    if (globalPct >= 90) {
      alerts.push({
        id: 'global-budget',
        type: globalPct >= 100 ? 'critical' : 'warning',
        title: globalPct >= 100 ? "Budget projet dépassé" : "Budget projet critique",
        message: `${globalPct.toFixed(0)}% du budget global consommé (${formatCurrency(totalConsumed)} / ${formatCurrency(projectBudget)})`,
        action: onIncreaseBudget ? {
          label: "Augmenter budget",
          onClick: onIncreaseBudget,
        } : undefined,
      });
    }
  }

  // 3. Unbilled time alert
  if (billableSummary.totalAmount > 0) {
    alerts.push({
      id: 'unbilled-time',
      type: 'info',
      title: "Temps non facturé",
      message: `${billableSummary.totalHours.toFixed(1)}h de travail (${formatCurrency(billableSummary.totalAmount)}) en attente de facturation`,
      action: onNavigateToInvoicing ? {
        label: "Facturer",
        onClick: onNavigateToInvoicing,
      } : undefined,
    });
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-800">Tout est sous contrôle</p>
              <p className="text-sm text-emerald-600">Aucune alerte budgétaire pour ce projet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Alertes budgétaires
          </div>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive">{criticalCount} critique{criticalCount > 1 ? 's' : ''}</Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                {warningCount} attention
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map(alert => (
          <Alert 
            key={alert.id}
            variant={alert.type === 'critical' ? 'destructive' : 'default'}
            className={cn(
              alert.type === 'warning' && "border-amber-500 bg-amber-50 [&>svg]:text-amber-500",
              alert.type === 'info' && "border-blue-500 bg-blue-50 [&>svg]:text-blue-500"
            )}
          >
            {alert.type === 'critical' ? (
              <AlertCircle className="h-4 w-4" />
            ) : alert.type === 'warning' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <AlertTitle className="flex items-center justify-between">
              <span>{alert.title}</span>
              {alert.envelope && (
                <span className="text-xs font-normal">
                  {formatCurrency(alert.envelope.remaining_amount)} restant
                </span>
              )}
            </AlertTitle>
            <AlertDescription className="mt-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm">{alert.message}</span>
                {alert.action && (
                  <Button 
                    size="sm" 
                    variant={alert.type === 'critical' ? 'destructive' : 'outline'}
                    onClick={alert.action.onClick}
                  >
                    {alert.action.label}
                  </Button>
                )}
              </div>
              {alert.envelope && (
                <Progress
                  value={Math.min(100, (alert.envelope.consumed_amount / alert.envelope.budget_amount) * 100)}
                  className={cn(
                    "h-1.5 mt-2",
                    alert.type === 'critical' 
                      ? "[&>div]:bg-destructive"
                      : "[&>div]:bg-amber-500"
                  )}
                />
              )}
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
