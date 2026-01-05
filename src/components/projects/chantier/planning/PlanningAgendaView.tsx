import { useMemo } from "react";
import { format, parseISO, isToday, isTomorrow, isThisWeek, isPast, addDays, differenceInDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Intervention } from "@/hooks/useInterventions";
import { ProjectLot } from "@/hooks/useChantier";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  CalendarDays,
  ArrowRight,
  Building2,
} from "lucide-react";

interface PlanningAgendaViewProps {
  interventions: Intervention[];
  lots: ProjectLot[];
  companies: Array<{ id: string; name: string }>;
  onSelectIntervention: (intervention: Intervention) => void;
}

const INTERVENTION_STATUS = [
  { value: "planned", label: "Planifié", color: "#94a3b8", icon: Calendar },
  { value: "in_progress", label: "En cours", color: "#3b82f6", icon: PlayCircle },
  { value: "completed", label: "Terminé", color: "#22c55e", icon: CheckCircle2 },
  { value: "delayed", label: "En retard", color: "#ef4444", icon: AlertTriangle },
  { value: "cancelled", label: "Annulé", color: "#6b7280", icon: Clock },
];

export function PlanningAgendaView({
  interventions,
  lots,
  companies,
  onSelectIntervention,
}: PlanningAgendaViewProps) {
  const today = startOfDay(new Date());

  // Group interventions by timeline period
  const groupedInterventions = useMemo(() => {
    const activeInterventions = interventions.filter(
      (i) => i.status !== "completed" && i.status !== "cancelled"
    );

    const groups = {
      overdue: [] as Intervention[],
      today: [] as Intervention[],
      tomorrow: [] as Intervention[],
      thisWeek: [] as Intervention[],
      upcoming: [] as Intervention[],
    };

    activeInterventions.forEach((intervention) => {
      const startDate = parseISO(intervention.start_date);
      const endDate = parseISO(intervention.end_date);

      // Check if intervention is ongoing (started but not ended)
      const isOngoing = startDate <= today && endDate >= today;

      // Check if overdue
      if (isPast(endDate) && !isToday(endDate)) {
        groups.overdue.push(intervention);
      } else if (isToday(startDate) || isOngoing) {
        groups.today.push(intervention);
      } else if (isTomorrow(startDate)) {
        groups.tomorrow.push(intervention);
      } else if (isThisWeek(startDate, { weekStartsOn: 1 })) {
        groups.thisWeek.push(intervention);
      } else if (startDate > today) {
        groups.upcoming.push(intervention);
      }
    });

    // Sort each group by start date
    Object.keys(groups).forEach((key) => {
      groups[key as keyof typeof groups].sort(
        (a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
      );
    });

    return groups;
  }, [interventions, today]);

  const getLot = (lotId: string) => lots.find((l) => l.id === lotId);
  const getCompany = (companyId: string | null) =>
    companyId ? companies.find((c) => c.id === companyId) : null;

  const renderInterventionCard = (intervention: Intervention, isOverdue = false) => {
    const lot = getLot(intervention.lot_id);
    const company = lot ? getCompany(lot.crm_company_id) : null;
    const statusConfig = INTERVENTION_STATUS.find((s) => s.value === intervention.status) || INTERVENTION_STATUS[0];
    const StatusIcon = statusConfig.icon;
    const startDate = parseISO(intervention.start_date);
    const endDate = parseISO(intervention.end_date);
    const duration = differenceInDays(endDate, startDate) + 1;

    return (
      <div
        key={intervention.id}
        onClick={() => onSelectIntervention(intervention)}
        className={cn(
          "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
          isOverdue
            ? "bg-destructive/5 border-destructive/30 hover:border-destructive/50"
            : "bg-card hover:border-primary/30"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Color indicator */}
          <div
            className="w-1.5 h-12 rounded-full shrink-0"
            style={{ backgroundColor: intervention.color || lot?.color || statusConfig.color }}
          />

          <div className="flex-1 min-w-0">
            {/* Title and status */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{intervention.title}</span>
              <Badge
                variant="secondary"
                className="shrink-0 text-xs h-5 gap-1"
                style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}
              >
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Lot & company */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              {lot && (
                <span className="truncate">{lot.name}</span>
              )}
              {company && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{company.name}</span>
                  </div>
                </>
              )}
            </div>

            {/* Dates */}
            <div className="flex items-center gap-2 text-xs">
              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {format(startDate, "d MMM", { locale: fr })}
              </span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                {format(endDate, "d MMM", { locale: fr })}
              </span>
              <Badge variant="outline" className="text-xs h-5 ml-auto">
                {duration}j
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (
    title: string,
    items: Intervention[],
    icon: React.ReactNode,
    isOverdue = false
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <div
          className={cn(
            "flex items-center gap-2 mb-3 pb-2 border-b",
            isOverdue && "text-destructive border-destructive/30"
          )}
        >
          {icon}
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant={isOverdue ? "destructive" : "secondary"} className="text-xs">
            {items.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {items.map((intervention) => renderInterventionCard(intervention, isOverdue))}
        </div>
      </div>
    );
  };

  const totalActive =
    groupedInterventions.overdue.length +
    groupedInterventions.today.length +
    groupedInterventions.tomorrow.length +
    groupedInterventions.thisWeek.length +
    groupedInterventions.upcoming.length;

  return (
    <div className="h-full flex flex-col">
      {/* Header stats */}
      <div className="p-4 border-b bg-muted/30">
        <h2 className="text-lg font-semibold mb-2">Copilote Chantier</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-muted-foreground">{groupedInterventions.overdue.length} en retard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">{groupedInterventions.today.length} aujourd'hui</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">{totalActive} au total</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {totalActive === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Aucune intervention à venir</p>
              <p className="text-xs mt-1">Toutes les interventions sont terminées ou annulées</p>
            </div>
          ) : (
            <>
              {renderSection(
                "En retard",
                groupedInterventions.overdue,
                <AlertTriangle className="w-4 h-4 text-destructive" />,
                true
              )}
              {renderSection(
                "Aujourd'hui",
                groupedInterventions.today,
                <PlayCircle className="w-4 h-4 text-primary" />
              )}
              {renderSection(
                "Demain",
                groupedInterventions.tomorrow,
                <Calendar className="w-4 h-4 text-muted-foreground" />
              )}
              {renderSection(
                "Cette semaine",
                groupedInterventions.thisWeek,
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
              )}
              {renderSection(
                "À venir",
                groupedInterventions.upcoming.slice(0, 10), // Limit to 10 for performance
                <Clock className="w-4 h-4 text-muted-foreground" />
              )}
              {groupedInterventions.upcoming.length > 10 && (
                <p className="text-center text-xs text-muted-foreground">
                  +{groupedInterventions.upcoming.length - 10} autres interventions
                </p>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
