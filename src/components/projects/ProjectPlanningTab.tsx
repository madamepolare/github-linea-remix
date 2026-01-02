import { useState } from "react";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { useProjectDeliverables } from "@/hooks/useProjectDeliverables";
import { usePhaseDependencies } from "@/hooks/usePhaseDependencies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { PHASE_STATUS_CONFIG, PhaseStatus, DELIVERABLE_STATUS } from "@/lib/projectTypes";
import { format, parseISO, isPast, isFuture, addDays, isWithinInterval, startOfToday, endOfWeek, addWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  GanttChart,
  List,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { PhaseGanttTimeline } from "./PhaseGanttTimeline";
import { ViewSwitcher } from "@/components/ui/view-switcher";
import { ProjectPhasesTab } from "./ProjectPhasesTab";
import { ProjectDeliverablesTab } from "./ProjectDeliverablesTab";

interface ProjectPlanningTabProps {
  projectId: string;
}

interface UpcomingEvent {
  id: string;
  type: "phase_end" | "phase_start" | "deliverable_due";
  title: string;
  subtitle?: string;
  date: Date;
  status?: string;
  color?: string;
}

export function ProjectPlanningTab({ projectId }: ProjectPlanningTabProps) {
  const { phases, isLoading: phasesLoading, updatePhase } = useProjectPhases(projectId);
  const { deliverables, isLoading: deliverablesLoading } = useProjectDeliverables(projectId);
  const { dependencies } = usePhaseDependencies(projectId);
  const [activeSubTab, setActiveSubTab] = useState("overview");

  const isLoading = phasesLoading || deliverablesLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  // Calculate stats
  const totalPhases = phases.length;
  const completedPhases = phases.filter(p => p.status === "completed").length;
  const inProgressPhases = phases.filter(p => p.status === "in_progress").length;
  const phaseProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  const totalDeliverables = deliverables.length;
  const deliveredCount = deliverables.filter(d => d.status === "delivered" || d.status === "validated").length;
  const deliverableProgress = totalDeliverables > 0 ? Math.round((deliveredCount / totalDeliverables) * 100) : 0;

  const overdueDeliverables = deliverables.filter(d => 
    d.due_date && isPast(parseISO(d.due_date)) && d.status !== "delivered" && d.status !== "validated"
  ).length;

  // Build upcoming events (next 4 weeks)
  const today = startOfToday();
  const fourWeeksLater = addWeeks(today, 4);
  
  const upcomingEvents: UpcomingEvent[] = [];

  // Add phase deadlines
  phases.forEach(phase => {
    if (phase.end_date) {
      const endDate = parseISO(phase.end_date);
      if (isWithinInterval(endDate, { start: today, end: fourWeeksLater }) || 
          (isPast(endDate) && phase.status !== "completed")) {
        upcomingEvents.push({
          id: `phase-end-${phase.id}`,
          type: "phase_end",
          title: `Fin de phase: ${phase.name}`,
          date: endDate,
          status: phase.status,
          color: phase.color,
        });
      }
    }
    if (phase.start_date && phase.status === "pending") {
      const startDate = parseISO(phase.start_date);
      if (isWithinInterval(startDate, { start: today, end: fourWeeksLater })) {
        upcomingEvents.push({
          id: `phase-start-${phase.id}`,
          type: "phase_start",
          title: `Début de phase: ${phase.name}`,
          date: startDate,
          color: phase.color,
        });
      }
    }
  });

  // Add deliverable deadlines
  deliverables.forEach(deliverable => {
    if (deliverable.due_date && deliverable.status !== "delivered" && deliverable.status !== "validated") {
      const dueDate = parseISO(deliverable.due_date);
      if (isWithinInterval(dueDate, { start: addDays(today, -7), end: fourWeeksLater })) {
        const phase = phases.find(p => p.id === deliverable.phase_id);
        upcomingEvents.push({
          id: `deliverable-${deliverable.id}`,
          type: "deliverable_due",
          title: deliverable.name,
          subtitle: phase?.name,
          date: dueDate,
          status: deliverable.status,
          color: phase?.color,
        });
      }
    }
  });

  // Sort by date
  upcomingEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group events by week
  const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const nextWeekEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });

  const overdueEvents = upcomingEvents.filter(e => isPast(e.date) && e.date < today);
  const thisWeekEvents = upcomingEvents.filter(e => 
    !isPast(e.date) && isWithinInterval(e.date, { start: today, end: thisWeekEnd })
  );
  const nextWeekEvents = upcomingEvents.filter(e => 
    isWithinInterval(e.date, { start: addDays(thisWeekEnd, 1), end: nextWeekEnd })
  );
  const laterEvents = upcomingEvents.filter(e => e.date > nextWeekEnd);

  const EventCard = ({ event }: { event: UpcomingEvent }) => {
    const isOverdue = isPast(event.date) && event.date < today;
    
    return (
      <div className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
        isOverdue && "border-destructive/50 bg-destructive/5",
        !isOverdue && "hover:bg-muted/50"
      )}>
        <div 
          className="w-1 h-12 rounded-full flex-shrink-0"
          style={{ backgroundColor: event.color || "#3B82F6" }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {event.type === "deliverable_due" ? (
              <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            ) : (
              <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            )}
            <span className={cn(
              "font-medium text-sm truncate",
              isOverdue && "text-destructive"
            )}>
              {event.title}
            </span>
          </div>
          {event.subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{event.subtitle}</p>
          )}
          <p className={cn(
            "text-xs mt-1",
            isOverdue ? "text-destructive" : "text-muted-foreground"
          )}>
            {isOverdue ? "En retard: " : ""}
            {format(event.date, "EEEE d MMMM", { locale: fr })}
          </p>
        </div>
        {isOverdue && (
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
        )}
      </div>
    );
  };

  const EventSection = ({ title, events, variant }: { 
    title: string; 
    events: UpcomingEvent[];
    variant?: "danger" | "default";
  }) => {
    if (events.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <h4 className={cn(
          "text-sm font-medium",
          variant === "danger" && "text-destructive"
        )}>
          {title}
        </h4>
        <div className="space-y-2">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub navigation */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <CalendarDays className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="phases" className="gap-1.5">
            <GanttChart className="h-4 w-4" />
            Phases
          </TabsTrigger>
          <TabsTrigger value="deliverables" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Livrables
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Phases</span>
                  <span className="text-sm text-muted-foreground">
                    {completedPhases}/{totalPhases}
                  </span>
                </div>
                <Progress value={phaseProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {inProgressPhases > 0 && `${inProgressPhases} en cours`}
                  {inProgressPhases === 0 && completedPhases === totalPhases && "Toutes terminées"}
                  {inProgressPhases === 0 && completedPhases < totalPhases && "Aucune en cours"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Livrables</span>
                  <span className="text-sm text-muted-foreground">
                    {deliveredCount}/{totalDeliverables}
                  </span>
                </div>
                <Progress value={deliverableProgress} className="h-2" />
                {overdueDeliverables > 0 ? (
                  <p className="text-xs text-destructive mt-2">
                    {overdueDeliverables} en retard
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    Aucun retard
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progression globale</span>
                  <span className="text-2xl font-bold">
                    {Math.round((phaseProgress + deliverableProgress) / 2)}%
                  </span>
                </div>
                <div className="flex gap-1 mt-2">
                  {phases.map(phase => (
                    <div
                      key={phase.id}
                      className={cn(
                        "h-2 flex-1 rounded-full",
                        phase.status === "completed" && "bg-emerald-500",
                        phase.status === "in_progress" && "bg-primary",
                        phase.status === "pending" && "bg-muted"
                      )}
                      title={phase.name}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Planning des phases</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveSubTab("phases")}
                    >
                      Voir tout
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {phases.length === 0 ? (
                    <EmptyState
                      icon={Calendar}
                      title="Aucune phase"
                      description="Créez des phases pour planifier votre projet."
                      action={{ 
                        label: "Gérer les phases", 
                        onClick: () => setActiveSubTab("phases") 
                      }}
                    />
                  ) : (
                    <PhaseGanttTimeline
                      phases={phases}
                      dependencies={dependencies}
                      onPhaseClick={() => setActiveSubTab("phases")}
                      onPhaseUpdate={(phaseId, updates) => {
                        updatePhase.mutate({ id: phaseId, ...updates });
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upcoming events */}
            <div>
              <Card className="h-fit">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Événements à venir</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-6">
                      <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Aucun événement prévu
                      </p>
                    </div>
                  ) : (
                    <>
                      <EventSection 
                        title="En retard" 
                        events={overdueEvents} 
                        variant="danger" 
                      />
                      <EventSection 
                        title="Cette semaine" 
                        events={thisWeekEvents} 
                      />
                      <EventSection 
                        title="Semaine prochaine" 
                        events={nextWeekEvents} 
                      />
                      <EventSection 
                        title="Plus tard" 
                        events={laterEvents.slice(0, 3)} 
                      />
                      {laterEvents.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{laterEvents.length - 3} autres événements
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Current phase detail */}
          {inProgressPhases > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Phases en cours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {phases.filter(p => p.status === "in_progress").map(phase => {
                    const phaseDeliverables = deliverables.filter(d => d.phase_id === phase.id);
                    const phaseDelivered = phaseDeliverables.filter(
                      d => d.status === "delivered" || d.status === "validated"
                    ).length;
                    const phaseProgress = phaseDeliverables.length > 0 
                      ? Math.round((phaseDelivered / phaseDeliverables.length) * 100) 
                      : 0;

                    return (
                      <div 
                        key={phase.id}
                        className="p-4 rounded-lg border bg-primary/5 border-primary/20"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: phase.color || "#3B82F6" }}
                          />
                          <span className="font-medium">{phase.name}</span>
                        </div>
                        {phase.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {phase.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {phaseDeliverables.length} livrable{phaseDeliverables.length > 1 ? "s" : ""}
                          </span>
                          <span>{phaseProgress}%</span>
                        </div>
                        <Progress value={phaseProgress} className="h-1.5 mt-1" />
                        {phase.end_date && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Échéance: {format(parseISO(phase.end_date), "d MMMM yyyy", { locale: fr })}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="phases" className="mt-6">
          <ProjectPhasesTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="deliverables" className="mt-6">
          <ProjectDeliverablesTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
