import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Clock, 
  Euro,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  User,
  Briefcase,
  PenTool
} from 'lucide-react';
import { QuoteLine } from '@/types/quoteTypes';
import { useQuoteTotalsWithCosts } from '@/hooks/useLineCostCalculation';

interface QuoteMarginSummaryProps {
  lines: QuoteLine[];
}

const COST_SOURCE_LABELS = {
  manual: { label: 'Manuel', icon: PenTool, color: 'text-slate-600' },
  skill: { label: 'Compétence', icon: Briefcase, color: 'text-blue-600' },
  member: { label: 'Membre', icon: User, color: 'text-purple-600' },
  average: { label: 'Estimé (TJM moyen)', icon: Calculator, color: 'text-amber-600' },
  none: { label: '-', icon: null, color: 'text-muted-foreground' },
};

export function QuoteMarginSummary({ lines }: QuoteMarginSummaryProps) {
  const {
    subtotal,
    totalHT,
    totalPurchaseCost,
    totalMargin,
    totalMarginPercentage,
    linesCosts,
    averageAgencyTJM,
  } = useQuoteTotalsWithCosts(lines);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  // Get included lines (excluding groups and discounts)
  const includedLines = lines.filter(
    l => l.is_included && l.line_type !== 'discount' && l.line_type !== 'group'
  );

  // Build line details with cost info from hook
  const lineDetails = includedLines.map(line => {
    const costInfo = linesCosts.find(lc => lc.lineId === line.id);
    
    // Use estimated days from cost calculation, or fallback to quantity if day unit
    let estimatedDays = costInfo?.estimatedDays || 0;
    if (estimatedDays === 0 && (line.unit === 'jour' || line.unit === 'jours')) {
      estimatedDays = line.quantity || 0;
    }

    return {
      line,
      revenue: line.amount || 0,
      cost: costInfo?.effectivePurchasePrice || 0,
      margin: costInfo?.margin || 0,
      marginPercent: costInfo?.marginPercentage || 0,
      estimatedDays,
      costSource: costInfo?.costSource || 'none',
    };
  });

  const totalDays = lineDetails.reduce((sum, d) => sum + d.estimatedDays, 0);
  const averageDailyRate = totalDays > 0 ? totalHT / totalDays : 0;
  const averageDailyCost = totalDays > 0 ? totalPurchaseCost / totalDays : 0;

  // Lines with issues
  const lowMarginLines = lineDetails.filter(d => d.marginPercent < 20 && d.marginPercent >= 0 && d.cost > 0);
  const negativeMarginLines = lineDetails.filter(d => d.marginPercent < 0);
  const linesWithCost = lineDetails.filter(d => d.cost > 0);

  // Get margin status
  const getMarginStatus = () => {
    if (totalMarginPercentage < 0) return { label: 'Déficitaire', color: 'text-red-600', bg: 'bg-red-500', icon: TrendingDown };
    if (totalMarginPercentage < 20) return { label: 'Faible', color: 'text-amber-600', bg: 'bg-amber-500', icon: AlertTriangle };
    if (totalMarginPercentage < 40) return { label: 'Correcte', color: 'text-blue-600', bg: 'bg-blue-500', icon: TrendingUp };
    return { label: 'Excellente', color: 'text-green-600', bg: 'bg-green-500', icon: CheckCircle2 };
  };

  const marginStatus = getMarginStatus();
  const StatusIcon = marginStatus.icon;

  // Only show if there's at least some cost information
  if (linesWithCost.length === 0 && totalHT === 0) {
    return null;
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5" />
          Analyse de rentabilité
          <Badge 
            variant="secondary" 
            className={`ml-auto ${marginStatus.color} gap-1`}
          >
            <StatusIcon className="h-3 w-3" />
            {marginStatus.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold">{formatCurrency(totalHT)}</div>
            <div className="text-xs text-muted-foreground">Total vendu HT</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">-{formatCurrency(totalPurchaseCost)}</div>
            <div className="text-xs text-muted-foreground">Coût des ressources</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className={`text-2xl font-bold ${totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalMargin)}
            </div>
            <div className="text-xs text-muted-foreground">Marge brute</div>
          </div>
        </div>

        {/* Margin progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taux de marge</span>
            <span className={`font-medium ${marginStatus.color}`}>
              {totalMarginPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.max(0, Math.min(100, totalMarginPercentage))} 
            className="h-2"
          />
        </div>

        <Separator />

        {/* Time and rate analysis */}
        {totalDays > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-lg font-semibold">{totalDays} jours</div>
                <div className="text-xs text-muted-foreground">Temps total estimé</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Euro className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-semibold">{formatCurrency(averageDailyRate)}/j</div>
                <div className="text-xs text-muted-foreground">
                  Taux moyen (coût: {formatCurrency(averageDailyCost)}/j)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cost breakdown by line (collapsible in future) */}
        {linesWithCost.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Détail des coûts
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {linesWithCost.map((detail) => {
                  const sourceInfo = COST_SOURCE_LABELS[detail.costSource];
                  const SourceIcon = sourceInfo.icon;
                  return (
                    <div 
                      key={detail.line.id} 
                      className="flex items-center justify-between text-sm py-1.5 px-2 bg-muted/20 rounded"
                    >
                      <span className="truncate flex-1 mr-2">
                        {detail.line.phase_name || 'Ligne sans nom'}
                        {detail.estimatedDays > 0 && (
                          <span className="text-muted-foreground ml-1">
                            ({detail.estimatedDays}j)
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        {SourceIcon && (
                          <span className={`flex items-center gap-1 text-xs ${sourceInfo.color}`}>
                            <SourceIcon className="h-3 w-3" />
                            {sourceInfo.label}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          -{formatCurrency(detail.cost)}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            detail.marginPercent >= 30 ? 'border-green-500 text-green-600' :
                            detail.marginPercent >= 0 ? 'border-amber-500 text-amber-600' :
                            'border-red-500 text-red-600'
                          }`}
                        >
                          {detail.marginPercent.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Warnings */}
        {(negativeMarginLines.length > 0 || lowMarginLines.length > 0) && (
          <>
            <Separator />
            <div className="space-y-2">
              {negativeMarginLines.length > 0 && (
                <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-medium text-red-600">
                      {negativeMarginLines.length} ligne{negativeMarginLines.length > 1 ? 's' : ''} déficitaire{negativeMarginLines.length > 1 ? 's' : ''}
                    </span>
                    <p className="text-red-600/80 text-xs">
                      {negativeMarginLines.map(d => d.line.phase_name).join(', ')}
                    </p>
                  </div>
                </div>
              )}
              {lowMarginLines.length > 0 && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-medium text-amber-600">
                      {lowMarginLines.length} ligne{lowMarginLines.length > 1 ? 's' : ''} à marge faible (&lt;20%)
                    </span>
                    <p className="text-amber-600/80 text-xs">
                      {lowMarginLines.map(d => d.line.phase_name).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
