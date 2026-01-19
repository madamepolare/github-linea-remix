import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTeamEvaluations, useCreateEvaluation, useUpdateEvaluation, evaluationTypeLabels, TeamEvaluation } from "@/hooks/useTeamEvaluations";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { InterviewScheduler, ScheduleData } from "./InterviewScheduler";
import { ObjectivesPanel } from "./ObjectivesPanel";
import { 
  ClipboardCheck, 
  Plus, 
  Calendar, 
  Star, 
  Check, 
  Users, 
  Video, 
  MapPin,
  Clock,
  Target,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const statusLabels: Record<string, string> = {
  pending: "À planifier",
  scheduled: "Planifié",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};

const statusColors: Record<string, string> = {
  pending: "bg-purple-100 text-purple-800",
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export function EvaluationsTab() {
  const [tab, setTab] = useState("pending");
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [schedulingEvaluation, setSchedulingEvaluation] = useState<TeamEvaluation | null>(null);

  const { data: evaluations, isLoading } = useTeamEvaluations();
  const { data: members } = useTeamMembers();
  const { user } = useAuth();
  const createEvaluation = useCreateEvaluation();
  const updateEvaluation = useUpdateEvaluation();

  const currentUserRole = members?.find((m) => m.user_id === user?.id)?.role;
  const canCreate = currentUserRole === "owner" || currentUserRole === "admin";

  // Pending = auto-generated, needs scheduling
  const pendingEvaluations = evaluations?.filter(
    (e) => e.status === "pending"
  ) || [];
  // Upcoming = scheduled or in progress
  const upcomingEvaluations = evaluations?.filter(
    (e) => e.status === "scheduled" || e.status === "in_progress"
  ) || [];
  const completedEvaluations = evaluations?.filter(
    (e) => e.status === "completed"
  ) || [];
  const myEvaluations = evaluations?.filter(
    (e) => e.user_id === user?.id || e.evaluator_id === user?.id || 
    (e.panel_members && e.panel_members.includes(user?.id || ""))
  ) || [];

  const memberMap = members?.reduce((acc, m) => {
    acc[m.user_id] = m;
    return acc;
  }, {} as Record<string, typeof members[0]>);

  const handleSchedule = async (data: ScheduleData) => {
    if (schedulingEvaluation) {
      // Update existing pending evaluation to scheduled
      await updateEvaluation.mutateAsync({
        id: schedulingEvaluation.id,
        status: "scheduled",
        scheduled_date: new Date(data.scheduled_date).toISOString(),
        notes: data.notes,
        panel_members: data.panel_members,
        location: data.location,
        meeting_link: data.meeting_link,
        duration_minutes: data.duration_minutes,
      });
      setSchedulingEvaluation(null);
    } else {
      // Create new evaluation
      await createEvaluation.mutateAsync({
        user_id: data.user_id,
        evaluation_type: data.evaluation_type,
        scheduled_date: new Date(data.scheduled_date).toISOString(),
        notes: data.notes,
        panel_members: data.panel_members,
        location: data.location,
        meeting_link: data.meeting_link,
        duration_minutes: data.duration_minutes,
      });
    }
    setCreateOpen(false);
  };

  const handleComplete = async (id: string, rating?: number) => {
    await updateEvaluation.mutateAsync({
      id,
      status: "completed",
      completed_date: new Date().toISOString(),
      rating,
    });
  };

  const handleStart = async (id: string) => {
    await updateEvaluation.mutateAsync({
      id,
      status: "in_progress",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const renderEvaluationCard = (evaluation: TeamEvaluation, showActions: boolean) => {
    const member = memberMap?.[evaluation.user_id];
    const evaluator = memberMap?.[evaluation.evaluator_id];
    const panelMembers = (evaluation.panel_members || [])
      .map(id => memberMap?.[id])
      .filter(Boolean);
    const initials = member?.profile?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?";
    const isExpanded = expandedId === evaluation.id;
    const canManage = canCreate || evaluation.evaluator_id === user?.id;
    const isPanel = evaluation.panel_members?.includes(user?.id || "");

    return (
      <Card key={evaluation.id}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member?.profile?.avatar_url || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">{member?.profile?.full_name || "—"}</h3>
                <Badge className={statusColors[evaluation.status]}>
                  {statusLabels[evaluation.status]}
                </Badge>
                <Badge variant="outline">
                  {evaluationTypeLabels[evaluation.evaluation_type]}
                </Badge>
                {isPanel && (
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    Jury
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(evaluation.scheduled_date), "EEEE d MMMM", { locale: fr })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(evaluation.scheduled_date), "HH:mm")}
                  {evaluation.duration_minutes && ` (${evaluation.duration_minutes}min)`}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>Évaluateur: {evaluator?.profile?.full_name || "—"}</span>
                {evaluation.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {evaluation.location}
                  </span>
                )}
                {evaluation.meeting_link && (
                  <a 
                    href={evaluation.meeting_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Rejoindre
                  </a>
                )}
              </div>

              {/* Panel members */}
              {panelMembers.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">Jury:</span>
                  <div className="flex -space-x-2">
                    {panelMembers.slice(0, 4).map((m) => (
                      <Avatar key={m.user_id} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={m.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {m.profile?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {panelMembers.length > 4 && (
                    <span className="text-xs text-muted-foreground">
                      +{panelMembers.length - 4}
                    </span>
                  )}
                </div>
              )}

              {evaluation.notes && (
                <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                  {evaluation.notes}
                </p>
              )}

              {/* Rating */}
              {evaluation.rating && (
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-4 w-4",
                        star <= evaluation.rating! ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Expandable objectives section */}
              {evaluation.status !== "cancelled" && (
                <Collapsible 
                  open={isExpanded} 
                  onOpenChange={() => setExpandedId(isExpanded ? null : evaluation.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="mt-2 h-8">
                      <Target className="h-3.5 w-3.5 mr-1" />
                      Objectifs
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 ml-1" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <ObjectivesPanel 
                      userId={evaluation.user_id} 
                      evaluationId={evaluation.id}
                      readOnly={evaluation.status === "completed" || !canManage}
                    />
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>

            {/* Actions */}
            {showActions && canManage && evaluation.status !== "completed" && (
              <div className="flex flex-col gap-2">
                {evaluation.status === "pending" && (
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setSchedulingEvaluation(evaluation);
                      setCreateOpen(true);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Planifier
                  </Button>
                )}
                {evaluation.status === "scheduled" && (
                  <Button size="sm" variant="outline" onClick={() => handleStart(evaluation.id)}>
                    Démarrer
                  </Button>
                )}
                {evaluation.status === "in_progress" && (
                  <RatingButton onComplete={(rating) => handleComplete(evaluation.id, rating)} />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="pending">
              À planifier
              {pendingEvaluations.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingEvaluations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Planifiés
              {upcomingEvaluations.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {upcomingEvaluations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Terminés</TabsTrigger>
            <TabsTrigger value="my">Mes entretiens</TabsTrigger>
          </TabsList>
          {canCreate && (
            <Button onClick={() => { setSchedulingEvaluation(null); setCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau
            </Button>
          )}
        </div>

        <TabsContent value="pending" className="mt-6">
          {pendingEvaluations.length > 0 ? (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 inline mr-2" />
                Ces entretiens ont été générés automatiquement. Cliquez sur "Planifier" pour définir la date et le jury.
              </div>
              {pendingEvaluations.map((evaluation) => 
                renderEvaluationCard(evaluation, true)
              )}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Aucun entretien à planifier"
              description="Les entretiens semestriels seront générés automatiquement."
            />
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingEvaluations.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvaluations.map((evaluation) => 
                renderEvaluationCard(evaluation, true)
              )}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Aucun entretien planifié"
              description="Planifiez des entretiens pour suivre vos collaborateurs."
              action={canCreate ? {
                label: "Planifier un entretien",
                onClick: () => { setSchedulingEvaluation(null); setCreateOpen(true); },
              } : undefined}
            />
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedEvaluations.length > 0 ? (
            <div className="space-y-4">
              {completedEvaluations.map((evaluation) => 
                renderEvaluationCard(evaluation, false)
              )}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title="Aucune évaluation terminée"
              description="L'historique des évaluations apparaîtra ici."
            />
          )}
        </TabsContent>

        <TabsContent value="my" className="mt-6">
          {myEvaluations.length > 0 ? (
            <div className="space-y-4">
              {myEvaluations.map((evaluation) => 
                renderEvaluationCard(evaluation, evaluation.evaluator_id === user?.id)
              )}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title="Aucun entretien"
              description="Vos entretiens (évalué, évaluateur ou jury) apparaîtront ici."
            />
          )}
        </TabsContent>
      </Tabs>

      <InterviewScheduler
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setSchedulingEvaluation(null);
        }}
        onSchedule={handleSchedule}
        isLoading={createEvaluation.isPending || updateEvaluation.isPending}
        initialData={schedulingEvaluation ? {
          user_id: schedulingEvaluation.user_id,
          evaluation_type: schedulingEvaluation.evaluation_type,
          scheduled_date: schedulingEvaluation.scheduled_date.slice(0, 16), // Format for datetime-local
          duration_minutes: schedulingEvaluation.duration_minutes || 60,
          location: schedulingEvaluation.location || "",
          meeting_link: schedulingEvaluation.meeting_link || "",
          panel_members: schedulingEvaluation.panel_members || [],
          notes: schedulingEvaluation.notes || "",
        } : undefined}
      />
    </div>
  );
}

function RatingButton({ onComplete }: { onComplete: (rating: number) => void }) {
  const [rating, setRating] = useState(0);
  const [showRating, setShowRating] = useState(false);

  if (!showRating) {
    return (
      <Button size="sm" onClick={() => setShowRating(true)}>
        <Check className="h-4 w-4 mr-1" />
        Terminer
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <Star
              className={cn(
                "h-5 w-5 transition-colors",
                star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300 hover:text-yellow-400"
              )}
            />
          </button>
        ))}
      </div>
      <Button size="sm" onClick={() => onComplete(rating)} disabled={rating === 0}>
        Valider
      </Button>
    </div>
  );
}