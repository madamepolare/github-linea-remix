import { useMemo } from "react";
import { AlertTriangle, FileText, Info, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tender } from "@/lib/tenderTypes";

interface TenderCriticalAlertsProps {
  tender: Tender;
}

export function TenderCriticalAlerts({ tender }: TenderCriticalAlertsProps) {
  const criticalAlerts = useMemo(() => {
    const extTender = tender as any;
    if (!extTender.critical_alerts) return [];
    if (Array.isArray(extTender.critical_alerts)) return extTender.critical_alerts;
    return [];
  }, [tender]);

  if (criticalAlerts.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800";
      case "warning":
        return "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800";
      default:
        return "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800";
    }
  };

  const criticalCount = criticalAlerts.filter((a: any) => a.severity === "critical").length;
  const warningCount = criticalAlerts.filter((a: any) => a.severity === "warning").length;

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-3 bg-amber-50/50 dark:bg-amber-950/20">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Points d'attention
          </span>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalCount} critique{criticalCount > 1 ? "s" : ""}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                {warningCount} attention
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid gap-2 md:grid-cols-2">
          {criticalAlerts.map((alert: any, index: number) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                getSeverityStyles(alert.severity)
              )}
            >
              <div className="shrink-0 mt-0.5">
                {getSeverityIcon(alert.severity)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{alert.message}</p>
                {alert.source && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {alert.source}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
