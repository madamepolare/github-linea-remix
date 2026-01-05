import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useChantier } from "@/hooks/useChantier";
import { useMeetingReports } from "@/hooks/useMeetingReports";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardList,
  Eye,
  FileText,
  HardHat,
} from "lucide-react";
import { format, parseISO, isBefore, isAfter } from "date-fns";
import { fr } from "date-fns/locale";

interface ChantierDashboardProps {
  projectId: string;
}

export function ChantierDashboard({ projectId }: ChantierDashboardProps) {
  const navigate = useNavigate();
  const { lots, lotsLoading, meetings, meetingsLoading, observations, observationsLoading } = useChantier(projectId);
  const { reports, reportsLoading } = useMeetingReports(projectId);

  const isLoading = lotsLoading || meetingsLoading || observationsLoading || reportsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  // Calculate stats
  const lotsInProgress = lots.filter(l => l.status === "in_progress").length;
  const lotsCompleted = lots.filter(l => l.status === "completed").length;
  const lotsProgress = lots.length > 0 ? Math.round((lotsCompleted / lots.length) * 100) : 0;

  const openObservations = observations.filter(o => o.status !== "resolved").length;
  const criticalObservations = observations.filter(o => o.priority === "critical" && o.status !== "resolved").length;

  const now = new Date();
  const upcomingMeetings = meetings.filter(m => isAfter(parseISO(m.meeting_date), now));
  const nextMeeting = upcomingMeetings.sort((a, b) => 
    parseISO(a.meeting_date).getTime() - parseISO(b.meeting_date).getTime()
  )[0];

  const meetingsWithoutReport = meetings.filter(m => {
    const hasReport = reports.some(r => r.meeting_id === m.id);
    return !hasReport && isBefore(parseISO(m.meeting_date), now);
  });

  const goToChantier = (section?: string) => {
    navigate(`/chantier/${projectId}${section ? `/${section}` : ""}`);
  };

  return (
    <div className="space-y-6">
      {/* Main CTA */}
      <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <HardHat className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Module Chantier</h3>
                <p className="text-sm text-muted-foreground">
                  Gérez les réunions, planning et observations
                </p>
              </div>
            </div>
            <Button onClick={() => goToChantier()} className="gap-2 bg-orange-500 hover:bg-orange-600">
              Ouvrir le chantier
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lots Progress */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/30"
          onClick={() => goToChantier("planning")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lots</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{lotsInProgress}</span>
                <span className="text-sm text-muted-foreground">en cours</span>
              </div>
              <Progress value={lotsProgress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {lotsCompleted}/{lots.length} terminés ({lotsProgress}%)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Meetings */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/30"
          onClick={() => goToChantier("meetings")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Réunions</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{meetings.length}</span>
                <span className="text-sm text-muted-foreground">réunions</span>
              </div>
              {nextMeeting ? (
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3 text-primary" />
                  <span>Prochaine: {format(parseISO(nextMeeting.meeting_date), "d MMM", { locale: fr })}</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Aucune réunion planifiée</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Observations */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/30"
          onClick={() => goToChantier("observations")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Observations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{openObservations}</span>
                <span className="text-sm text-muted-foreground">ouvertes</span>
              </div>
              {criticalObservations > 0 ? (
                <Badge variant="destructive" className="text-xs">
                  {criticalObservations} critique{criticalObservations > 1 ? "s" : ""}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Aucune critique
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {meetingsWithoutReport.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">
                    {meetingsWithoutReport.length} réunion{meetingsWithoutReport.length > 1 ? "s" : ""} sans compte-rendu
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Des réunions passées n'ont pas encore de CR
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => goToChantier("reports")}>
                <Eye className="h-4 w-4 mr-1" />
                Voir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
