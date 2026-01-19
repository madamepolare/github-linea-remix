import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTeamEvaluations, evaluationTypeLabels, TeamEvaluation } from "@/hooks/useTeamEvaluations";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClipboardCheck, Calendar, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const statusLabels: Record<string, string> = {
  scheduled: "Planifié",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export function MyInterviewsTab() {
  const { user } = useAuth();
  const [tab, setTab] = useState("upcoming");
  const { data: evaluations, isLoading } = useTeamEvaluations();
  const { data: members } = useTeamMembers();

  const memberMap = members?.reduce((acc, m) => {
    acc[m.user_id] = m;
    return acc;
  }, {} as Record<string, typeof members[0]>);

  // Evaluations where I'm being evaluated, I'm the evaluator, or I'm in the panel
  const myEvaluations = evaluations?.filter(
    e => e.user_id === user?.id || 
         e.evaluator_id === user?.id || 
         (e.panel_members && e.panel_members.includes(user?.id || ""))
  ) || [];

  const upcomingEvaluations = myEvaluations.filter(
    e => e.status === "scheduled" || e.status === "in_progress"
  );
  const completedEvaluations = myEvaluations.filter(e => e.status === "completed");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const renderEvaluationList = (list: TeamEvaluation[]) => {
    if (list.length === 0) {
      return (
        <EmptyState
          icon={ClipboardCheck}
          title="Aucun entretien"
          description="Vos entretiens apparaîtront ici."
        />
      );
    }

    return (
      <div className="space-y-3">
        {list.map((evaluation) => {
          const evaluatedMember = memberMap?.[evaluation.user_id];
          const evaluator = memberMap?.[evaluation.evaluator_id];
          const isMyEvaluation = evaluation.user_id === user?.id;

          return (
            <Card key={evaluation.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium">
                        {evaluationTypeLabels[evaluation.evaluation_type]}
                      </h3>
                      <Badge className={statusColors[evaluation.status]}>
                        {statusLabels[evaluation.status]}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(evaluation.scheduled_date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        {isMyEvaluation ? "Mon entretien" : evaluatedMember?.profile?.full_name || "—"}
                      </div>
                      {evaluator && (
                        <span className="text-muted-foreground">
                          avec {evaluator.profile?.full_name}
                        </span>
                      )}
                    </div>

                    {evaluation.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {evaluation.notes}
                      </p>
                    )}

                    {evaluation.rating && evaluation.status === "completed" && (
                      <div className="flex items-center gap-1 mt-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-4 w-4",
                              star <= evaluation.rating!
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="upcoming">
          À venir
          {upcomingEvaluations.length > 0 && (
            <Badge variant="secondary" className="ml-2">{upcomingEvaluations.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="completed">Terminés</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-4">
        {renderEvaluationList(upcomingEvaluations)}
      </TabsContent>
      <TabsContent value="completed" className="mt-4">
        {renderEvaluationList(completedEvaluations)}
      </TabsContent>
    </Tabs>
  );
}
