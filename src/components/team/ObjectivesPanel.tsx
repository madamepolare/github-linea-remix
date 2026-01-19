import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  useEmployeeObjectives, 
  useCreateObjective, 
  useUpdateObjective, 
  useDeleteObjective,
  objectiveCategoryLabels,
  objectiveStatusLabels,
  EmployeeObjective 
} from "@/hooks/useEmployeeObjectives";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Target, Plus, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ObjectivesPanelProps {
  userId?: string;
  evaluationId?: string;
  readOnly?: boolean;
}

const statusColors: Record<EmployeeObjective["status"], string> = {
  active: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  on_hold: "bg-yellow-100 text-yellow-800",
};

export function ObjectivesPanel({ userId, evaluationId, readOnly = false }: ObjectivesPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<EmployeeObjective | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newObjective, setNewObjective] = useState<Partial<EmployeeObjective>>({
    title: "",
    description: "",
    category: "performance",
    target_value: "",
    progress: 0,
    weight: 1,
    due_date: "",
    status: "active",
  });

  const { data: objectives, isLoading } = useEmployeeObjectives({ userId, evaluationId });
  const { data: members } = useTeamMembers();
  const { user } = useAuth();
  const createObjective = useCreateObjective();
  const updateObjective = useUpdateObjective();
  const deleteObjective = useDeleteObjective();

  const currentUserRole = members?.find((m) => m.user_id === user?.id)?.role;
  const canManage = !readOnly && (currentUserRole === "owner" || currentUserRole === "admin");

  const memberMap = members?.reduce((acc, m) => {
    acc[m.user_id] = m;
    return acc;
  }, {} as Record<string, typeof members[0]>) || {};

  const handleCreate = async () => {
    if (!newObjective.title || !userId) return;
    await createObjective.mutateAsync({
      ...newObjective,
      user_id: userId,
      evaluation_id: evaluationId,
    });
    setCreateOpen(false);
    setNewObjective({
      title: "",
      description: "",
      category: "performance",
      target_value: "",
      progress: 0,
      weight: 1,
      due_date: "",
      status: "active",
    });
  };

  const handleUpdate = async () => {
    if (!editingObjective) return;
    await updateObjective.mutateAsync({
      id: editingObjective.id,
      title: editingObjective.title,
      description: editingObjective.description,
      category: editingObjective.category,
      target_value: editingObjective.target_value,
      current_value: editingObjective.current_value,
      progress: editingObjective.progress,
      weight: editingObjective.weight,
      due_date: editingObjective.due_date,
      status: editingObjective.status,
    });
    setEditingObjective(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteObjective.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleMarkComplete = async (objective: EmployeeObjective) => {
    await updateObjective.mutateAsync({
      id: objective.id,
      status: "completed",
      progress: 100,
    });
  };

  if (isLoading) {
    return <Skeleton className="h-48" />;
  }

  // Calculate overall progress
  const totalWeight = objectives?.reduce((sum, o) => sum + o.weight, 0) || 0;
  const weightedProgress = objectives?.reduce((sum, o) => sum + (o.progress * o.weight), 0) || 0;
  const overallProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

  return (
    <div className="space-y-4">
      {/* Header with overall progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Objectifs</h3>
          {objectives && objectives.length > 0 && (
            <div className="flex items-center gap-2">
              <Progress value={overallProgress} className="w-24 h-2" />
              <span className="text-sm text-muted-foreground">{overallProgress}%</span>
            </div>
          )}
        </div>
        {canManage && userId && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Objectives List */}
      {objectives && objectives.length > 0 ? (
        <div className="space-y-3">
          {objectives.map((objective) => (
            <Card key={objective.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-medium">{objective.title}</h4>
                      <Badge className={statusColors[objective.status]} variant="secondary">
                        {objectiveStatusLabels[objective.status]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {objectiveCategoryLabels[objective.category] || objective.category}
                      </Badge>
                    </div>
                    {objective.description && (
                      <p className="text-sm text-muted-foreground mb-2">{objective.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {objective.target_value && (
                        <span>Cible: {objective.target_value}</span>
                      )}
                      {objective.current_value && (
                        <span>Actuel: {objective.current_value}</span>
                      )}
                      {objective.due_date && (
                        <span>Échéance: {format(new Date(objective.due_date), "d MMM yyyy", { locale: fr })}</span>
                      )}
                      <span>Poids: {objective.weight}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={objective.progress} className="flex-1 h-2" />
                      <span className="text-sm font-medium w-10 text-right">{objective.progress}%</span>
                    </div>
                  </div>
                  {canManage && objective.status === "active" && (
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleMarkComplete(objective)}
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setEditingObjective(objective)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setDeleteId(objective.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="Aucun objectif"
          description={canManage ? "Ajoutez des objectifs SMART pour ce collaborateur." : "Aucun objectif défini."}
          action={canManage && userId ? {
            label: "Ajouter un objectif",
            onClick: () => setCreateOpen(true),
          } : undefined}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvel objectif</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titre de l'objectif *</Label>
              <Input
                value={newObjective.title}
                onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
                placeholder="Ex: Améliorer la satisfaction client"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newObjective.description || ""}
                onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
                placeholder="Détails de l'objectif..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={newObjective.category}
                  onValueChange={(v) => setNewObjective({ ...newObjective, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(objectiveCategoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Poids (importance)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={newObjective.weight}
                  onChange={(e) => setNewObjective({ ...newObjective, weight: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valeur cible (optionnel)</Label>
              <Input
                value={newObjective.target_value || ""}
                onChange={(e) => setNewObjective({ ...newObjective, target_value: e.target.value })}
                placeholder="Ex: NPS > 50"
              />
            </div>
            <div className="space-y-2">
              <Label>Date d'échéance</Label>
              <Input
                type="date"
                value={newObjective.due_date || ""}
                onChange={(e) => setNewObjective({ ...newObjective, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!newObjective.title || createObjective.isPending}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingObjective} onOpenChange={(open) => !open && setEditingObjective(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l'objectif</DialogTitle>
          </DialogHeader>
          {editingObjective && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={editingObjective.title}
                  onChange={(e) => setEditingObjective({ ...editingObjective, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingObjective.description || ""}
                  onChange={(e) => setEditingObjective({ ...editingObjective, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select
                    value={editingObjective.status}
                    onValueChange={(v) => setEditingObjective({ ...editingObjective, status: v as EmployeeObjective["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(objectiveStatusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Poids</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={editingObjective.weight}
                    onChange={(e) => setEditingObjective({ ...editingObjective, weight: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valeur cible</Label>
                  <Input
                    value={editingObjective.target_value || ""}
                    onChange={(e) => setEditingObjective({ ...editingObjective, target_value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valeur actuelle</Label>
                  <Input
                    value={editingObjective.current_value || ""}
                    onChange={(e) => setEditingObjective({ ...editingObjective, current_value: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Progression: {editingObjective.progress}%</Label>
                <Slider
                  value={[editingObjective.progress]}
                  onValueChange={([v]) => setEditingObjective({ ...editingObjective, progress: v })}
                  max={100}
                  step={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Date d'échéance</Label>
                <Input
                  type="date"
                  value={editingObjective.due_date || ""}
                  onChange={(e) => setEditingObjective({ ...editingObjective, due_date: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingObjective(null)}>
              Annuler
            </Button>
            <Button onClick={handleUpdate} disabled={updateObjective.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'objectif ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
