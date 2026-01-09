import { useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Euro,
  Ruler,
  MapPin,
  Users,
  Calendar,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tender } from "@/lib/tenderTypes";

interface TenderKeyMetricsProps {
  tender: Tender;
}

export function TenderKeyMetrics({ tender }: TenderKeyMetricsProps) {
  const formatBudget = (amount: number | null) => {
    if (!amount) return null;
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1).replace(".0", "")} M€`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)} k€`;
    }
    return `${amount.toLocaleString()} €`;
  };

  const requiredTeam = useMemo(() => {
    if (!tender.required_team) return [];
    if (Array.isArray(tender.required_team)) return tender.required_team;
    return [];
  }, [tender.required_team]);

  const mandatoryCount = requiredTeam.filter((t: any) => t.is_mandatory).length;

  const siteVisitDaysLeft = useMemo(() => {
    if (!tender.site_visit_date) return null;
    return differenceInDays(new Date(tender.site_visit_date), new Date());
  }, [tender.site_visit_date]);

  const metrics = [
    {
      icon: Euro,
      label: "Budget travaux",
      value: formatBudget(tender.estimated_budget),
      subValue: tender.estimated_budget ? "HT" : null,
      color: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
      isEmpty: !tender.estimated_budget,
    },
    {
      icon: Ruler,
      label: "Surface",
      value: tender.surface_area ? `${tender.surface_area.toLocaleString()} m²` : null,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
      isEmpty: !tender.surface_area,
    },
    {
      icon: MapPin,
      label: "Localisation",
      value: tender.location,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
      isEmpty: !tender.location,
    },
    {
      icon: Users,
      label: "Équipe",
      value: mandatoryCount > 0 ? `${mandatoryCount} obligatoire${mandatoryCount > 1 ? "s" : ""}` : null,
      subValue: requiredTeam.length > mandatoryCount ? `+${requiredTeam.length - mandatoryCount} optionnel${requiredTeam.length - mandatoryCount > 1 ? "s" : ""}` : null,
      color: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400",
      isEmpty: requiredTeam.length === 0,
    },
    {
      icon: Building2,
      label: "Maître d'ouvrage",
      value: tender.client_name,
      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400",
      isEmpty: !tender.client_name,
    },
    {
      icon: Calendar,
      label: "Visite de site",
      value: tender.site_visit_required
        ? tender.site_visit_date
          ? format(new Date(tender.site_visit_date), "d MMM", { locale: fr })
          : "À planifier"
        : "Non requise",
      subValue: tender.site_visit_required && siteVisitDaysLeft !== null && siteVisitDaysLeft >= 0
        ? `J-${siteVisitDaysLeft}`
        : null,
      color: tender.site_visit_required
        ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400"
        : "bg-muted text-muted-foreground",
      badge: tender.site_visit_required ? "Obligatoire" : undefined,
      isEmpty: false,
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg shrink-0", metric.color)}>
                  <metric.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">{metric.label}</p>
                  {metric.isEmpty ? (
                    <p className="text-sm text-amber-600 font-medium">—</p>
                  ) : (
                    <>
                      <p className="text-sm font-semibold truncate">{metric.value}</p>
                      {metric.subValue && (
                        <p className="text-xs text-muted-foreground">{metric.subValue}</p>
                      )}
                      {metric.badge && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {metric.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
