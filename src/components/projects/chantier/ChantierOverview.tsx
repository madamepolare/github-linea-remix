import { useChantier, ProjectMeeting, ProjectObservation } from "@/hooks/useChantier";
import { useProject } from "@/hooks/useProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Clock,
  Eye,
  FileText,
  Hammer, 
  TrendingUp,
  Users,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO, isFuture, isPast, isToday, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LOT_STATUS } from "@/lib/projectTypes";

interface ChantierOverviewProps {
  projectId: string;
  onNavigate: (tab: string) => void;
  onOpenReport: (meeting: ProjectMeeting) => void;
  onOpenPlanning?: () => void;
}

export function ChantierOverview({ projectId, onNavigate, onOpenReport, onOpenPlanning }: ChantierOverviewProps) {
  const { lots, meetings, observations, lotsLoading, meetingsLoading, observationsLoading } = useChantier(projectId);
  const { data: project } = useProject(projectId);

  const isLoading = lotsLoading || meetingsLoading || observationsLoading;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  // Calculate stats
  const lotsInProgress = lots.filter(l => l.status === "in_progress").length;
  const lotsCompleted = lots.filter(l => l.status === "completed").length;
  const lotsProgress = lots.length > 0 ? Math.round((lotsCompleted / lots.length) * 100) : 0;

  const openObservations = observations.filter(o => o.status === "open").length;
  const criticalObservations = observations.filter(o => o.priority === "critical" && o.status !== "resolved");
  const highPriorityObservations = observations.filter(o => o.priority === "high" && o.status !== "resolved");

  // Find next meeting
  const upcomingMeetings = meetings.filter(m => isFuture(parseISO(m.meeting_date)) || isToday(parseISO(m.meeting_date)));
  const nextMeeting = upcomingMeetings.length > 0 
    ? upcomingMeetings.sort((a, b) => parseISO(a.meeting_date).getTime() - parseISO(b.meeting_date).getTime())[0]
    : null;
  
  // Past meetings without report content
  const hasReportContent = (meeting: ProjectMeeting) => {
    if (!meeting.report_data) return false;
    const data = meeting.report_data as Record<string, unknown>;
    return Boolean(
      data.context || 
      (data.lot_progress && (data.lot_progress as unknown[]).length > 0) ||
      (data.technical_decisions && (data.technical_decisions as unknown[]).length > 0)
    );
  };
  
  const meetingsWithoutReport = meetings.filter(m => {
    const isPastMeeting = isPast(parseISO(m.meeting_date)) && !isToday(parseISO(m.meeting_date));
    return isPastMeeting && !hasReportContent(m);
  });

  // Lots with delayed end date
  const delayedLots = lots.filter(l => {
    if (!l.end_date || l.status === "completed") return false;
    return isPast(parseISO(l.end_date));
  });

  return (
    <div className="space-y-6">
      {/* Central Planning Button */}
      {onOpenPlanning && (
        <Card 
          className="cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all group"
          onClick={onOpenPlanning}
        >
          <CardContent className="py-8 flex flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Calendar className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Ouvrir le Planning Chantier</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Visualisez et planifiez tous les lots en mode Gantt interactif
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigate("lots")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Hammer className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Lots</p>
                <p className="text-2xl font-bold">{lots.length}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{lotsCompleted} terminés</span>
                <span>{lotsProgress}%</span>
              </div>
              <Progress value={lotsProgress} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigate("meetings")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Réunions</p>
                <p className="text-2xl font-bold">{meetings.length}</p>
              </div>
            </div>
            {nextMeeting && (
              <div className="mt-4 flex items-center gap-2 text-xs">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Prochaine:</span>
                <span className="font-medium">
                  {format(parseISO(nextMeeting.meeting_date), "d MMM", { locale: fr })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigate("observations")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl",
                criticalObservations.length > 0 ? "bg-destructive/10" : "bg-amber-500/10"
              )}>
                <Eye className={cn(
                  "h-6 w-6",
                  criticalObservations.length > 0 ? "text-destructive" : "text-amber-500"
                )} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Observations</p>
                <p className="text-2xl font-bold">{observations.length}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="text-amber-600">{openObservations} ouvertes</span>
              {criticalObservations.length > 0 && (
                <Badge variant="destructive" className="text-[10px] h-5">
                  {criticalObservations.length} critiques
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Actions Required Section */}
      {(meetingsWithoutReport.length > 0 || criticalObservations.length > 0 || highPriorityObservations.length > 0 || delayedLots.length > 0) && (
        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Clock className="h-4 w-4" />
              Actions requises
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Meetings without reports */}
            {meetingsWithoutReport.slice(0, 2).map(meeting => (
              <div 
                key={meeting.id} 
                className="flex items-center gap-3 p-2 rounded-lg bg-blue-100/50 dark:bg-blue-950/30 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                onClick={() => onOpenReport(meeting)}
              >
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-sm flex-1 truncate">
                  Rédiger le CR de la réunion n°{meeting.meeting_number} ({format(parseISO(meeting.meeting_date), "d MMM", { locale: fr })})
                </span>
                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400">
                  CR à rédiger
                </Badge>
              </div>
            ))}
            
            {/* Critical observations */}
            {criticalObservations.slice(0, 2).map(obs => (
              <div 
                key={obs.id} 
                className="flex items-center gap-3 p-2 rounded-lg bg-destructive/10 cursor-pointer hover:bg-destructive/20 transition-colors"
                onClick={() => onNavigate("observations")}
              >
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-sm flex-1 truncate">{obs.description}</span>
                <Badge variant="destructive" className="text-[10px]">Critique</Badge>
              </div>
            ))}
            
            {/* High priority observations */}
            {highPriorityObservations.slice(0, 2).map(obs => (
              <div 
                key={obs.id} 
                className="flex items-center gap-3 p-2 rounded-lg bg-orange-100/50 dark:bg-orange-950/30 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors"
                onClick={() => onNavigate("observations")}
              >
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
                <span className="text-sm flex-1 truncate">{obs.description}</span>
                <Badge className="text-[10px] bg-orange-500 hover:bg-orange-600">Haute priorité</Badge>
              </div>
            ))}
            
            {/* Delayed lots */}
            {delayedLots.slice(0, 2).map(lot => (
              <div 
                key={lot.id} 
                className="flex items-center gap-3 p-2 rounded-lg bg-amber-100/50 dark:bg-amber-950/30 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
                onClick={() => onNavigate("planning")}
              >
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-sm flex-1 truncate">
                  Lot "{lot.name}" en retard ({differenceInDays(new Date(), parseISO(lot.end_date!))} jours)
                </span>
                <Badge className="text-[10px] bg-amber-500 hover:bg-amber-600">Retard</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Next Meeting */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Prochaine réunion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextMeeting ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {nextMeeting.meeting_number || "#"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{nextMeeting.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(nextMeeting.meeting_date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
                {nextMeeting.location && (
                  <p className="text-sm text-muted-foreground pl-15">
                    📍 {nextMeeting.location}
                  </p>
                )}
                {nextMeeting.attendees && nextMeeting.attendees.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{nextMeeting.attendees.length} participants invités</span>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => onNavigate("meetings")}
                >
                  Voir les détails
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune réunion planifiée</p>
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => onNavigate("meetings")}
                >
                  Planifier une réunion
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lots Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avancement des lots
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lots.length > 0 ? (
              <div className="space-y-3">
                {lots.slice(0, 5).map(lot => {
                  const statusConfig = LOT_STATUS.find(s => s.value === lot.status) || LOT_STATUS[0];
                  return (
                    <div key={lot.id} className="flex items-center gap-3">
                      <div 
                        className="w-2 h-8 rounded-full"
                        style={{ backgroundColor: lot.color || statusConfig.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lot.name}</p>
                        {lot.company && (
                          <p className="text-xs text-muted-foreground truncate">{lot.company.name}</p>
                        )}
                      </div>
                      <Badge 
                        variant="secondary"
                        className="text-xs shrink-0"
                        style={{ 
                          backgroundColor: statusConfig.color + "20",
                          color: statusConfig.color 
                        }}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>
                  );
                })}
                {lots.length > 5 && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onNavigate("planning")}
                  >
                    Voir tous les lots (+{lots.length - 5})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Hammer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun lot créé</p>
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => onNavigate("planning")}
                >
                  Créer des lots
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Observations */}
      {observations.filter(o => o.status !== "resolved").length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Observations en cours
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("observations")}>
                Voir tout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {observations
                .filter(o => o.status !== "resolved")
                .slice(0, 5)
                .map(obs => (
                  <div 
                    key={obs.id} 
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                      obs.priority === "critical" && "border-destructive/50 bg-destructive/5",
                      obs.priority === "high" && "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20"
                    )}
                    onClick={() => onNavigate("observations")}
                  >
                    {obs.status === "in_progress" ? (
                      <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                    ) : (
                      <Eye className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                    <span className="text-sm flex-1 truncate">{obs.description}</span>
                    {obs.lot && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {obs.lot.name}
                      </Badge>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
