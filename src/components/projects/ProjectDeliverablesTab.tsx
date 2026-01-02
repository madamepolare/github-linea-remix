import { useState } from "react";
import { useProjectDeliverables } from "@/hooks/useProjectDeliverables";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DELIVERABLE_STATUS } from "@/lib/projectTypes";
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  File,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface ProjectDeliverablesTabProps {
  projectId: string;
}

export function ProjectDeliverablesTab({ projectId }: ProjectDeliverablesTabProps) {
  const { deliverables, isLoading, createDeliverable, updateDeliverable, deleteDeliverable } = useProjectDeliverables(projectId);
  const { phases } = useProjectPhases(projectId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<any | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPhaseId, setFormPhaseId] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState("pending");
  const [formDueDate, setFormDueDate] = useState<Date | null>(null);
  const [formFileUrl, setFormFileUrl] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormPhaseId(null);
    setFormStatus("pending");
    setFormDueDate(null);
    setFormFileUrl("");
  };

  const openEditDialog = (deliverable: any) => {
    setEditingDeliverable(deliverable);
    setFormName(deliverable.name);
    setFormDescription(deliverable.description || "");
    setFormPhaseId(deliverable.phase_id);
    setFormStatus(deliverable.status);
    setFormDueDate(deliverable.due_date ? parseISO(deliverable.due_date) : null);
    setFormFileUrl(deliverable.file_url || "");
  };

  const handleCreate = () => {
    if (!formName.trim()) return;

    createDeliverable.mutate({
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      phase_id: formPhaseId || undefined,
      status: formStatus,
      due_date: formDueDate ? format(formDueDate, "yyyy-MM-dd") : undefined,
      file_url: formFileUrl.trim() || undefined,
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingDeliverable || !formName.trim()) return;

    updateDeliverable.mutate({
      id: editingDeliverable.id,
      name: formName.trim(),
      description: formDescription.trim() || null,
      phase_id: formPhaseId,
      status: formStatus,
      due_date: formDueDate ? format(formDueDate, "yyyy-MM-dd") : null,
      file_url: formFileUrl.trim() || null,
    });

    setEditingDeliverable(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer ce livrable ?")) {
      deleteDeliverable.mutate(id);
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateDeliverable.mutate({ 
      id, 
      status: newStatus,
      delivered_at: newStatus === "delivered" || newStatus === "validated" ? new Date().toISOString() : null
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (deliverables.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Aucun livrable"
        description="Ajoutez des livrables pour chaque phase du projet."
        action={{ label: "Ajouter un livrable", onClick: () => setIsCreateOpen(true) }}
      />
    );
  }

  // Group by phase
  const groupedByPhase = deliverables.reduce((acc, deliverable) => {
    const phaseId = deliverable.phase_id || "no-phase";
    if (!acc[phaseId]) acc[phaseId] = [];
    acc[phaseId].push(deliverable);
    return acc;
  }, {} as Record<string, typeof deliverables>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Livrables du projet</h3>
        <Button size="sm" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedByPhase).map(([phaseId, items]) => {
          const phase = phases.find(p => p.id === phaseId);
          
          return (
            <div key={phaseId}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                {phase && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: phase.color || "#3B82F6" }}
                  />
                )}
                {phase?.name || "Sans phase"}
              </h4>
              <div className="grid gap-3">
                {items.map((deliverable) => {
                  const statusConfig = DELIVERABLE_STATUS.find(s => s.value === deliverable.status) || DELIVERABLE_STATUS[0];

                  return (
                    <Card key={deliverable.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            deliverable.status === "validated" ? "bg-green-100 text-green-600" :
                            deliverable.status === "delivered" ? "bg-blue-100 text-blue-600" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {deliverable.status === "validated" ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <File className="h-5 w-5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{deliverable.name}</span>
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: statusConfig.color + "20",
                                  color: statusConfig.color 
                                }}
                              >
                                {statusConfig.label}
                              </Badge>
                            </div>
                            {deliverable.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {deliverable.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {deliverable.due_date && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Échéance: {format(parseISO(deliverable.due_date), "d MMMM yyyy", { locale: fr })}
                                </span>
                              )}
                              {deliverable.delivered_at && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Livré: {format(parseISO(deliverable.delivered_at), "d MMM yyyy", { locale: fr })}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {deliverable.file_url && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => window.open(deliverable.file_url, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {deliverable.status === "pending" && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(deliverable.id, "in_progress")}>
                                    <Clock className="h-4 w-4 mr-2" />
                                    En cours
                                  </DropdownMenuItem>
                                )}
                                {deliverable.status !== "delivered" && deliverable.status !== "validated" && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(deliverable.id, "delivered")}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Marquer livré
                                  </DropdownMenuItem>
                                )}
                                {deliverable.status === "delivered" && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(deliverable.id, "validated")}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Valider
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => openEditDialog(deliverable)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(deliverable.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingDeliverable} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingDeliverable(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDeliverable ? "Modifier le livrable" : "Nouveau livrable"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Plans d'exécution"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Description du livrable..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phase</Label>
                <Select value={formPhaseId || "none"} onValueChange={(v) => setFormPhaseId(v === "none" ? null : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sans phase</SelectItem>
                    {phases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERABLE_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date d'échéance</Label>
              <InlineDatePicker
                value={formDueDate}
                onChange={setFormDueDate}
                placeholder="Sélectionner..."
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>URL du fichier</Label>
              <Input
                value={formFileUrl}
                onChange={(e) => setFormFileUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditingDeliverable(null); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={editingDeliverable ? handleUpdate : handleCreate} disabled={!formName.trim()}>
              {editingDeliverable ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
