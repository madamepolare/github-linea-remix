import { useMemo } from "react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Euro,
  Calendar,
  Clock,
  AlertTriangle,
  Users,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tender } from "@/lib/tenderTypes";

interface TenderCriticalInfoProps {
  tender: Tender;
}

export function TenderCriticalInfo({ tender }: TenderCriticalInfoProps) {
  // Calculate deadline info
  const deadlineInfo = useMemo(() => {
    if (!tender.submission_deadline) return null;
    
    const deadline = new Date(tender.submission_deadline);
    const now = new Date();
    const daysLeft = differenceInDays(deadline, now);
    const hoursLeft = differenceInHours(deadline, now);
    
    let urgency: 'critical' | 'warning' | 'normal' | 'passed' = 'normal';
    let label = '';
    
    if (hoursLeft < 0) {
      urgency = 'passed';
      label = 'Délai dépassé';
    } else if (daysLeft <= 1) {
      urgency = 'critical';
      label = hoursLeft < 24 ? `${hoursLeft}h restantes` : 'Demain';
    } else if (daysLeft <= 7) {
      urgency = 'warning';
      label = `J-${daysLeft}`;
    } else {
      label = `J-${daysLeft}`;
    }
    
    return { deadline, daysLeft, hoursLeft, urgency, label };
  }, [tender.submission_deadline]);

  // Get required team from tender
  const requiredTeam = useMemo(() => {
    if (!tender.required_team) return [];
    if (Array.isArray(tender.required_team)) return tender.required_team;
    return [];
  }, [tender.required_team]);

  const mandatoryTeam = requiredTeam.filter((t: any) => t.is_mandatory);

  // Format budget
  const formatBudget = (amount: number | null) => {
    if (!amount) return null;
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1).replace('.0', '')} M€`;
    }
    return `${(amount / 1000).toFixed(0)} k€`;
  };

  const siteVisitContact = tender as any;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Points critiques</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Deadline */}
          <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg",
            deadlineInfo?.urgency === 'critical' && "bg-red-100 dark:bg-red-950/50",
            deadlineInfo?.urgency === 'warning' && "bg-amber-100 dark:bg-amber-950/50",
            deadlineInfo?.urgency === 'passed' && "bg-red-200 dark:bg-red-900/50",
            deadlineInfo?.urgency === 'normal' && "bg-muted/50"
          )}>
            <div className={cn(
              "p-2 rounded-full shrink-0",
              deadlineInfo?.urgency === 'critical' && "bg-red-200 text-red-700",
              deadlineInfo?.urgency === 'warning' && "bg-amber-200 text-amber-700",
              deadlineInfo?.urgency === 'passed' && "bg-red-300 text-red-800",
              deadlineInfo?.urgency === 'normal' && "bg-primary/10 text-primary"
            )}>
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Date limite</p>
              {tender.submission_deadline ? (
                <>
                  <p className={cn(
                    "font-semibold text-sm",
                    deadlineInfo?.urgency === 'critical' && "text-red-700 dark:text-red-400",
                    deadlineInfo?.urgency === 'warning' && "text-amber-700 dark:text-amber-400",
                    deadlineInfo?.urgency === 'passed' && "text-red-800 dark:text-red-300"
                  )}>
                    {format(new Date(tender.submission_deadline), "d MMM yyyy", { locale: fr })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(tender.submission_deadline), "HH:mm", { locale: fr })}
                    {deadlineInfo?.label && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "ml-2 text-xs",
                          deadlineInfo.urgency === 'critical' && "bg-red-200 text-red-800",
                          deadlineInfo.urgency === 'warning' && "bg-amber-200 text-amber-800",
                          deadlineInfo.urgency === 'passed' && "bg-red-300 text-red-900"
                        )}
                      >
                        {deadlineInfo.label}
                      </Badge>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-sm text-amber-600 font-medium">Non renseigné</p>
              )}
            </div>
          </div>

          {/* Budget */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 shrink-0">
              <Euro className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Budget travaux</p>
              {tender.estimated_budget ? (
                <>
                  <p className="font-semibold text-sm">{formatBudget(tender.estimated_budget)} HT</p>
                  <p className="text-xs text-muted-foreground">
                    {(tender as any).budget_disclosed !== false ? (
                      <span className="text-green-600">Budget affiché</span>
                    ) : (
                      <span className="text-amber-600">Budget indicatif</span>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-sm text-amber-600 font-medium">Non renseigné</p>
              )}
            </div>
          </div>

          {/* Site Visit */}
          <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg",
            tender.site_visit_required ? "bg-blue-50 dark:bg-blue-950/30" : "bg-muted/50"
          )}>
            <div className={cn(
              "p-2 rounded-full shrink-0",
              tender.site_visit_required 
                ? "bg-blue-200 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                : "bg-muted text-muted-foreground"
            )}>
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Visite de site</p>
              {tender.site_visit_required ? (
                <>
                  <div className="flex items-center gap-1">
                    <Badge variant="default" className="text-xs bg-blue-600">Obligatoire</Badge>
                  </div>
                  {tender.site_visit_date ? (
                    <p className="text-xs mt-1">
                      {format(new Date(tender.site_visit_date), "d MMM à HH:mm", { locale: fr })}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1">Date non fixée</p>
                  )}
                  {siteVisitContact.site_visit_contact_name && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      <User className="h-3 w-3 inline mr-1" />
                      {siteVisitContact.site_visit_contact_name}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Non obligatoire</p>
              )}
            </div>
          </div>

          {/* Required Team */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Équipe requise</p>
              {mandatoryTeam.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {mandatoryTeam.slice(0, 3).map((t: any, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {getSpecialtyLabel(t.specialty)}
                    </Badge>
                  ))}
                  {mandatoryTeam.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{mandatoryTeam.length - 3}
                    </Badge>
                  )}
                </div>
              ) : requiredTeam.length > 0 ? (
                <p className="text-sm text-muted-foreground">{requiredTeam.length} compétences</p>
              ) : (
                <p className="text-sm text-amber-600 font-medium">Non définie</p>
              )}
            </div>
          </div>
        </div>

        {/* Site visit contact details if required */}
        {tender.site_visit_required && (siteVisitContact.site_visit_contact_phone || siteVisitContact.site_visit_contact_email) && (
          <div className="mt-3 pt-3 border-t border-primary/10 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Contact visite :</span>
            {siteVisitContact.site_visit_contact_phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {siteVisitContact.site_visit_contact_phone}
              </span>
            )}
            {siteVisitContact.site_visit_contact_email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {siteVisitContact.site_visit_contact_email}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getSpecialtyLabel(specialty: string): string {
  const labels: Record<string, string> = {
    architecte: "Archi",
    architecte_associe: "Archi assoc.",
    bet_structure: "Structure",
    bet_fluides: "Fluides",
    bet_electricite: "Élec",
    thermicien: "Therm",
    economiste: "Éco",
    acousticien: "Acoust",
    paysagiste: "Pays",
    vrd: "VRD",
    opc: "OPC",
    ssi: "SSI",
    bim: "BIM",
    hqe: "HQE",
    urbaniste: "Urba",
    scenographe: "Scéno",
    eclairagiste: "Éclair",
    signaletique: "Signal",
  };
  return labels[specialty] || specialty;
}
