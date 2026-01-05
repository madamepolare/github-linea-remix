import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTeamEvaluations, useCreateEvaluation, useUpdateEvaluation, evaluationTypeLabels, TeamEvaluation } from "@/hooks/useTeamEvaluations";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck, Plus, Calendar, Star, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function EvaluationsTab() {
  const [tab, setTab] = useState("upcoming");
  const [createOpen, setCreateOpen] = useState(false);
  const [newEvaluation, setNewEvaluation] = useState<Partial<TeamEvaluation>>({
    user_id: "",
    evaluation_type: "annual",
    scheduled_date: "",
    notes: "",
  });

  const { data: evaluations, isLoading } = useTeamEvaluations();
  const { data: members } = useTeamMembers();
  const { user } = useAuth();
  const createEvaluation = useCreateEvaluation();
  const updateEvaluation = useUpdateEvaluation();

  const currentUserRole = members?.find((m) => m.user_id === user?.id)?.role;
  const canCreate = currentUserRole === "owner" || currentUserRole === "admin";

  const upcomingEvaluations = evaluations?.filter((e) => e.status === "scheduled" || e.status === "in_progress") || [];
  const completedEvaluations = evaluations?.filter((e) => e.status === "completed") || [];
  const myEvaluations = evaluations?.filter((e) => e.user_id === user?.id || e.evaluator_id === user?.id) || [];

  const memberMap = members?.reduce((acc, m) => {
    acc[m.user_id] = m;
    return acc;
  }, {} as Record<string, typeof members[0]>);

  const handleCreate = async () => {
    if (!newEvaluation.user_id || !newEvaluation.scheduled_date) return;
    await createEvaluation.mutateAsync({
      ...newEvaluation,
      scheduled_date: new Date(newEvaluation.scheduled_date).toISOString(),
    });
    setCreateOpen(false);
    setNewEvaluation({
      user_id: "",
      evaluation_type: "annual",
      scheduled_date: "",
      notes: "",
    });
  };

  const handleComplete = async (id: string, rating?: number) => {
    await updateEvaluation.mutateAsync({
      id,
      status: "completed",
      completed_date: new Date().toISOString(),
      rating,
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

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="upcoming">
              À venir
              {upcomingEvaluations.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {upcomingEvaluations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Terminées</TabsTrigger>
            <TabsTrigger value="my">Mes évaluations</TabsTrigger>
          </TabsList>
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Planifier un entretien
            </Button>
          )}
        </div>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingEvaluations.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvaluations.map((evaluation) => (
                <EvaluationCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  memberMap={memberMap}
                  canManage={canCreate}
                  onComplete={(rating) => handleComplete(evaluation.id, rating)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Aucun entretien planifié"
              description="Les entretiens à venir apparaîtront ici."
              action={canCreate ? {
                label: "Planifier un entretien",
                onClick: () => setCreateOpen(true),
              } : undefined}
            />
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedEvaluations.length > 0 ? (
            <div className="space-y-4">
              {completedEvaluations.map((evaluation) => (
                <EvaluationCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  memberMap={memberMap}
                  canManage={false}
                />
              ))}
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
              {myEvaluations.map((evaluation) => (
                <EvaluationCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  memberMap={memberMap}
                  canManage={evaluation.evaluator_id === user?.id && evaluation.status !== "completed"}
                  onComplete={(rating) => handleComplete(evaluation.id, rating)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title="Aucune évaluation"
              description="Vos évaluations apparaîtront ici."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Create Evaluation Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planifier un entretien</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Collaborateur</Label>
              <Select
                value={newEvaluation.user_id}
                onValueChange={(v) => setNewEvaluation({ ...newEvaluation, user_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {members?.filter((m) => m.user_id !== user?.id).map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profile?.full_name || m.profile?.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type d'entretien</Label>
              <Select
                value={newEvaluation.evaluation_type}
                onValueChange={(v) => setNewEvaluation({ ...newEvaluation, evaluation_type: v as TeamEvaluation["evaluation_type"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(evaluationTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date et heure</Label>
              <Input
                type="datetime-local"
                value={newEvaluation.scheduled_date}
                onChange={(e) => setNewEvaluation({ ...newEvaluation, scheduled_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes préliminaires (optionnel)</Label>
              <Textarea
                value={newEvaluation.notes || ""}
                onChange={(e) => setNewEvaluation({ ...newEvaluation, notes: e.target.value })}
                placeholder="Points à aborder, objectifs..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newEvaluation.user_id || !newEvaluation.scheduled_date || createEvaluation.isPending}
            >
              Planifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EvaluationCard({
  evaluation,
  memberMap,
  canManage,
  onComplete,
}: {
  evaluation: TeamEvaluation;
  memberMap?: Record<string, any>;
  canManage: boolean;
  onComplete?: (rating?: number) => void;
}) {
  const [rating, setRating] = useState(evaluation.rating || 0);
  const member = memberMap?.[evaluation.user_id];
  const evaluator = memberMap?.[evaluation.evaluator_id];
  const initials = member?.profile?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member?.profile?.avatar_url || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">{member?.profile?.full_name || "—"}</h3>
                <Badge className={statusColors[evaluation.status]}>
                  {statusLabels[evaluation.status]}
                </Badge>
                <Badge variant="outline">
                  {evaluationTypeLabels[evaluation.evaluation_type]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                <Calendar className="h-3.5 w-3.5 inline mr-1" />
                {format(new Date(evaluation.scheduled_date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
              <p className="text-sm text-muted-foreground">
                Évaluateur: {evaluator?.profile?.full_name || "—"}
              </p>
              {evaluation.notes && (
                <p className="text-sm mt-2">{evaluation.notes}</p>
              )}
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
            </div>
          </div>
          {canManage && onComplete && (
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
              <Button size="sm" onClick={() => onComplete(rating)}>
                <Check className="h-4 w-4 mr-1" />
                Terminer
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
