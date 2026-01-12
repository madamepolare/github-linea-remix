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
  Clock,
  Megaphone,
  LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tender } from "@/lib/tenderTypes";
import { useTenderDisciplineConfig } from "@/hooks/useTenderDisciplineConfig";
import type { DisciplineMetricDef } from "@/lib/tenderDisciplineConfig";

interface TenderKeyMetricsProps {
  tender: Tender;
}

// Mapping des icônes par nom
const ICON_MAP: Record<string, LucideIcon> = {
  Euro,
  Ruler,
  MapPin,
  Users,
  Calendar,
  Building2,
  Clock,
  Megaphone,
};

export function TenderKeyMetrics({ tender }: TenderKeyMetricsProps) {
  const { config, disciplineSlug } = useTenderDisciplineConfig(tender.id);

  const formatBudget = (amount: number | null | undefined) => {
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

  const submissionDaysLeft = useMemo(() => {
    if (!tender.submission_deadline) return null;
    return differenceInDays(new Date(tender.submission_deadline), new Date());
  }, [tender.submission_deadline]);

  // Récupère la valeur d'un champ du tender (y compris les données extraites)
  const getFieldValue = (key: string): any => {
    // D'abord chercher dans les champs standard
    if (key in tender) {
      return (tender as any)[key];
    }
    // Ensuite chercher dans extracted_data
    const extractedData = (tender as any).extracted_data;
    if (extractedData && key in extractedData) {
      return extractedData[key];
    }
    return null;
  };

  // Formate une valeur selon le type de métrique
  const formatMetricValue = (metricDef: DisciplineMetricDef, value: any): { displayValue: string | null; subValue?: string } => {
    if (value === null || value === undefined) {
      return { displayValue: null };
    }

    switch (metricDef.formatType) {
      case 'currency':
        return { displayValue: formatBudget(value), subValue: 'HT' };
      
      case 'number':
        return { 
          displayValue: typeof value === 'number' 
            ? `${value.toLocaleString()}${metricDef.unit ? ` ${metricDef.unit}` : ''}` 
            : String(value)
        };
      
      case 'duration':
        return { 
          displayValue: typeof value === 'number' 
            ? `${value} ${metricDef.unit || 'mois'}` 
            : String(value)
        };
      
      case 'date':
        if (metricDef.key === 'site_visit_date') {
          if (!tender.site_visit_required) {
            return { displayValue: 'Non requise' };
          }
          if (value) {
            return { 
              displayValue: format(new Date(value), "d MMM", { locale: fr }),
              subValue: siteVisitDaysLeft !== null && siteVisitDaysLeft >= 0 ? `J-${siteVisitDaysLeft}` : undefined
            };
          }
          return { displayValue: 'À planifier' };
        }
        if (metricDef.key === 'submission_deadline' && value) {
          return { 
            displayValue: format(new Date(value), "d MMM", { locale: fr }),
            subValue: submissionDaysLeft !== null && submissionDaysLeft >= 0 ? `J-${submissionDaysLeft}` : undefined
          };
        }
        return { displayValue: value ? format(new Date(value), "d MMM yyyy", { locale: fr }) : null };
      
      case 'text':
      default:
        // Cas spécial pour l'équipe
        if (metricDef.key === 'required_team') {
          if (requiredTeam.length === 0) return { displayValue: null };
          return {
            displayValue: mandatoryCount > 0 ? `${mandatoryCount} obligatoire${mandatoryCount > 1 ? "s" : ""}` : `${requiredTeam.length} profil${requiredTeam.length > 1 ? "s" : ""}`,
            subValue: requiredTeam.length > mandatoryCount ? `+${requiredTeam.length - mandatoryCount} optionnel${requiredTeam.length - mandatoryCount > 1 ? "s" : ""}` : undefined
          };
        }
        // Cas spécial pour type_campagne (afficher le label)
        if (metricDef.key === 'type_campagne') {
          const field = config.specificFields.find(f => f.key === 'type_campagne');
          const option = field?.options?.find(o => o.value === value);
          return { displayValue: option?.label || value };
        }
        return { displayValue: String(value) };
    }
  };

  // Génère les métriques à partir de la config
  const metrics = useMemo(() => {
    return config.keyMetrics.map(metricDef => {
      const value = getFieldValue(metricDef.key);
      const { displayValue, subValue } = formatMetricValue(metricDef, value);
      const IconComponent = ICON_MAP[metricDef.icon] || Building2;

      // Badge spécial pour la visite de site
      let badge: string | undefined;
      if (metricDef.key === 'site_visit_date' && tender.site_visit_required) {
        badge = 'Obligatoire';
      }

      return {
        icon: IconComponent,
        label: metricDef.label,
        value: displayValue,
        subValue,
        color: metricDef.colorClass,
        isEmpty: displayValue === null,
        badge,
      };
    });
  }, [config, tender, requiredTeam, mandatoryCount, siteVisitDaysLeft, submissionDaysLeft]);

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