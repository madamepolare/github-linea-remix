import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, User, Phone, Mail, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisiteBlockProps {
  tender: any;
  onNavigateToTab?: (tab: string) => void;
}

export function VisiteBlock({ tender, onNavigateToTab }: VisiteBlockProps) {
  const siteVisitRequired = tender.site_visit_required;
  const siteVisitDate = tender.site_visit_date;
  
  // Ne pas afficher si visite non requise et pas de date
  if (!siteVisitRequired && !siteVisitDate) return null;

  const daysLeft = siteVisitDate 
    ? differenceInDays(new Date(siteVisitDate), new Date()) 
    : null;

  const isPast = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
  const isSoon = daysLeft !== null && daysLeft > 3 && daysLeft <= 7;

  const getUrgencyStyle = () => {
    if (isPast) return "border-red-300 bg-red-50/50 dark:bg-red-950/20";
    if (isUrgent) return "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20";
    if (siteVisitRequired) return "border-blue-300 bg-blue-50/50 dark:bg-blue-950/20";
    return "";
  };

  return (
    <Card className={cn("transition-all", getUrgencyStyle())}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className={cn(
            "h-4 w-4",
            isPast ? "text-red-600" : isUrgent ? "text-amber-600" : "text-blue-600"
          )} />
          Visite de site
          <div className="ml-auto flex items-center gap-2">
            {siteVisitRequired && (
              <Badge className="text-xs bg-amber-100 text-amber-700">
                Obligatoire
              </Badge>
            )}
            {daysLeft !== null && !isPast && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  isUrgent && "border-amber-500 text-amber-700",
                  isSoon && "border-blue-500 text-blue-700"
                )}
              >
                <Clock className="h-3 w-3 mr-1" />
                J-{daysLeft}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Date et heure */}
          {siteVisitDate ? (
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-lg",
                isPast ? "bg-red-100 dark:bg-red-900/50" : "bg-blue-100 dark:bg-blue-900/50"
              )}>
                <Calendar className={cn(
                  "h-5 w-5",
                  isPast ? "text-red-600" : "text-blue-600"
                )} />
              </div>
              <div>
                <p className="font-semibold">
                  {format(new Date(siteVisitDate), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(siteVisitDate), "'à' HH:mm", { locale: fr })}
                </p>
              </div>
              {isPast && (
                <Badge variant="destructive" className="ml-auto">
                  Passée
                </Badge>
              )}
            </div>
          ) : siteVisitRequired ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Date à planifier</span>
            </div>
          ) : null}

          {/* Contacts visite */}
          {(tender.site_visit_contact_name || tender.site_visit_contact_phone || tender.site_visit_contact_email) && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground font-medium">Contact visite</p>
              <div className="flex flex-wrap gap-3 text-sm">
                {tender.site_visit_contact_name && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {tender.site_visit_contact_name}
                  </span>
                )}
                {tender.site_visit_contact_phone && (
                  <a 
                    href={`tel:${tender.site_visit_contact_phone}`}
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {tender.site_visit_contact_phone}
                  </a>
                )}
                {tender.site_visit_contact_email && (
                  <a 
                    href={`mailto:${tender.site_visit_contact_email}`}
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {tender.site_visit_contact_email}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Assigned user */}
          {tender.site_visit_assigned_user_id && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 p-2 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
              <span>Responsable assigné</span>
            </div>
          )}

          {/* Bouton calendrier */}
          {onNavigateToTab && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onNavigateToTab('calendrier')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Voir dans le calendrier
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
