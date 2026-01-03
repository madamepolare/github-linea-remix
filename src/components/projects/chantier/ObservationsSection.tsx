import { useState } from "react";
import { useChantier, ObservationStatus, ProjectLot } from "@/hooks/useChantier";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { OBSERVATION_STATUS, OBSERVATION_PRIORITY } from "@/lib/projectTypes";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

interface ObservationsSectionProps {
  projectId: string;
}

export function ObservationsSection({ projectId }: ObservationsSectionProps) {
  const { observations, lots, observationsLoading, createObservation, updateObservation, deleteObservation } = useChantier(projectId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingObservation, setEditingObservation] = useState<any | null>(null);

  const [formDescription, setFormDescription] = useState("");
  const [formLotId, setFormLotId] = useState<string | null>(null);
  const [formPriority, setFormPriority] = useState("normal");
  const [formDueDate, setFormDueDate] = useState<Date | null>(null);

  const resetForm = () => {
    setFormDescription("");
    setFormLotId(null);
    setFormPriority("normal");
    setFormDueDate(null);
  };

  const openEditDialog = (obs: any) => {
    setEditingObservation(obs);
    setFormDescription(obs.description);
    setFormLotId(obs.lot_id);
    setFormPriority(obs.priority || "normal");
    setFormDueDate(obs.due_date ? parseISO(obs.due_date) : null);
  };

  const handleCreate = () => {
    if (!formDescription.trim()) return;

    createObservation.mutate({
      description: formDescription.trim(),
      lot_id: formLotId || undefined,
      priority: formPriority as any,
      due_date: formDueDate ? format(formDueDate, "yyyy-MM-dd") : undefined,
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingObservation || !formDescription.trim()) return;

    updateObservation.mutate({
      id: editingObservation.id,
      description: formDescription.trim(),
      lot_id: formLotId,
      priority: formPriority as any,
      due_date: formDueDate ? format(formDueDate, "yyyy-MM-dd") : null,
    });

    setEditingObservation(null);
    resetForm();
  };

  const handleStatusChange = (id: string, newStatus: ObservationStatus) => {
    updateObservation.mutate({
      id,
      status: newStatus,
      resolved_at: newStatus === "resolved" ? new Date().toISOString() : null,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette observation ?")) {
      deleteObservation.mutate(id);
    }
  };

  if (observationsLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  // Stats
  const openCount = observations.filter(o => o.status === "open").length;
  const inProgressCount = observations.filter(o => o.status === "in_progress").length;
  const resolvedCount = observations.filter(o => o.status === "resolved").length;

  if (observations.length === 0) {
    return (
      <>
        <EmptyState
          icon={AlertTriangle}
          title="Aucune observation"
          description="Ajoutez des observations de chantier (réserves, points d'attention...)."
          action={{ label: "Ajouter une observation", onClick: () => setIsCreateOpen(true) }}
        />
        <ObservationDialog
          isOpen={isCreateOpen}
          onClose={() => { setIsCreateOpen(false); resetForm(); }}
          formDescription={formDescription}
          setFormDescription={setFormDescription}
          formLotId={formLotId}
          setFormLotId={setFormLotId}
          formPriority={formPriority}
          setFormPriority={setFormPriority}
          formDueDate={formDueDate}
          setFormDueDate={setFormDueDate}
          lots={lots}
          onSubmit={handleCreate}
          isEditing={false}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Observations</h3>
          <Badge variant="secondary">{observations.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400">
              {openCount} ouvertes
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400">
              {inProgressCount} en cours
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">
              {resolvedCount} résolues
            </Badge>
          </div>
          <Button size="sm" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Observations List */}
      <div className="grid gap-3">
        {observations.map((obs) => {
          const statusConfig = OBSERVATION_STATUS.find(s => s.value === obs.status) || OBSERVATION_STATUS[0];
          const priorityConfig = OBSERVATION_PRIORITY.find(p => p.value === obs.priority) || OBSERVATION_PRIORITY[1];
          const lot = lots.find(l => l.id === obs.lot_id);

          return (
            <Card key={obs.id} className={cn(
              "transition-colors",
              obs.priority === "critical" && "border-destructive/50 bg-destructive/5",
              obs.priority === "high" && "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    obs.status === "resolved" ? "bg-green-100 dark:bg-green-950" : 
                    obs.status === "in_progress" ? "bg-blue-100 dark:bg-blue-950" : "bg-muted"
                  )}>
                    {obs.status === "resolved" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : obs.status === "in_progress" ? (
                      <Clock className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm",
                      obs.status === "resolved" && "line-through text-muted-foreground"
                    )}>
                      {obs.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{
                          backgroundColor: statusConfig.value === "open" ? "hsl(var(--warning) / 0.15)" :
                                           statusConfig.value === "in_progress" ? "hsl(var(--primary) / 0.15)" : "hsl(var(--success) / 0.15)",
                          color: statusConfig.value === "open" ? "hsl(var(--warning))" :
                                 statusConfig.value === "in_progress" ? "hsl(var(--primary))" : "hsl(var(--success))"
                        }}
                      >
                        {statusConfig.label}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          obs.priority === "critical" && "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400",
                          obs.priority === "high" && "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400",
                          obs.priority === "normal" && "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
                          obs.priority === "low" && "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                        )}
                      >
                        {priorityConfig.label}
                      </Badge>
                      {lot && (
                        <Badge variant="outline" className="text-xs">
                          {lot.name}
                        </Badge>
                      )}
                      {obs.due_date && (
                        <span className={cn(
                          "text-xs flex items-center gap-1",
                          new Date(obs.due_date) < new Date() && obs.status !== "resolved" 
                            ? "text-destructive font-medium" 
                            : "text-muted-foreground"
                        )}>
                          <Clock className="h-3 w-3" />
                          {format(parseISO(obs.due_date), "d MMM yyyy", { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(obs)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      {obs.status === "open" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(obs.id, "in_progress")}>
                          <Clock className="h-4 w-4 mr-2" />
                          En cours
                        </DropdownMenuItem>
                      )}
                      {obs.status !== "resolved" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(obs.id, "resolved")}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Résolu
                        </DropdownMenuItem>
                      )}
                      {obs.status === "resolved" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(obs.id, "open")}>
                          <Eye className="h-4 w-4 mr-2" />
                          Réouvrir
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDelete(obs.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ObservationDialog
        isOpen={isCreateOpen || !!editingObservation}
        onClose={() => { setIsCreateOpen(false); setEditingObservation(null); resetForm(); }}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        formLotId={formLotId}
        setFormLotId={setFormLotId}
        formPriority={formPriority}
        setFormPriority={setFormPriority}
        formDueDate={formDueDate}
        setFormDueDate={setFormDueDate}
        lots={lots}
        onSubmit={editingObservation ? handleUpdate : handleCreate}
        isEditing={!!editingObservation}
      />
    </div>
  );
}

// Observation Dialog Component (Create/Edit)
function ObservationDialog({
  isOpen,
  onClose,
  formDescription,
  setFormDescription,
  formLotId,
  setFormLotId,
  formPriority,
  setFormPriority,
  formDueDate,
  setFormDueDate,
  lots,
  onSubmit,
  isEditing,
}: {
  isOpen: boolean;
  onClose: () => void;
  formDescription: string;
  setFormDescription: (v: string) => void;
  formLotId: string | null;
  setFormLotId: (v: string | null) => void;
  formPriority: string;
  setFormPriority: (v: string) => void;
  formDueDate: Date | null;
  setFormDueDate: (v: Date | null) => void;
  lots: ProjectLot[];
  onSubmit: () => void;
  isEditing: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier l'observation" : "Nouvelle observation"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Décrivez l'observation..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lot concerné</Label>
              <Select value={formLotId || "none"} onValueChange={(v) => setFormLotId(v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun lot</SelectItem>
                  {lots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={formPriority} onValueChange={setFormPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OBSERVATION_PRIORITY.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date limite</Label>
            <InlineDatePicker
              value={formDueDate}
              onChange={setFormDueDate}
              placeholder="Sélectionner..."
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={!formDescription.trim()}>
            {isEditing ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
