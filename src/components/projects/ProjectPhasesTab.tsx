import { useState } from "react";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { usePhaseDependencies } from "@/hooks/usePhaseDependencies";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PHASE_STATUS_CONFIG, PHASE_COLORS, PhaseStatus } from "@/lib/projectTypes";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  GanttChart,
  GripVertical,
  Link2,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PhaseGanttTimeline } from "./PhaseGanttTimeline";
import { ViewSwitcher } from "@/components/ui/view-switcher";

interface ProjectPhasesTabProps {
  projectId: string;
}

export function ProjectPhasesTab({ projectId }: ProjectPhasesTabProps) {
  const { phases, isLoading, createPhase, updatePhase, deletePhase } = useProjectPhases(projectId);
  const { dependencies, addDependency, removeDependency } = usePhaseDependencies(projectId);
  
  const [editingPhase, setEditingPhase] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDependencyDialogOpen, setIsDependencyDialogOpen] = useState(false);
  const [selectedPhaseForDependency, setSelectedPhaseForDependency] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<PhaseStatus>("pending");
  const [formColor, setFormColor] = useState(PHASE_COLORS[0]);
  const [formDeadline, setFormDeadline] = useState<Date | null>(null);
  const [formDependsOn, setFormDependsOn] = useState<string>("");

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormStatus("pending");
    setFormColor(PHASE_COLORS[phases.length % PHASE_COLORS.length]);
    setFormDeadline(null);
    setFormDependsOn("");
  };

  const openEditDialog = (phase: any) => {
    setEditingPhase(phase);
    setFormName(phase.name);
    setFormDescription(phase.description || "");
    setFormStatus(phase.status as PhaseStatus);
    setFormColor(phase.color || PHASE_COLORS[0]);
    setFormDeadline(phase.end_date ? parseISO(phase.end_date) : null);
  };

  const handleCreate = () => {
    if (!formName.trim()) return;

    createPhase.mutate({
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      status: formStatus,
      color: formColor,
      end_date: formDeadline ? format(formDeadline, "yyyy-MM-dd") : undefined,
      sort_order: phases.length,
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingPhase || !formName.trim()) return;

    updatePhase.mutate({
      id: editingPhase.id,
      name: formName.trim(),
      description: formDescription.trim() || null,
      status: formStatus,
      color: formColor,
      end_date: formDeadline ? format(formDeadline, "yyyy-MM-dd") : null,
    });

    setEditingPhase(null);
    resetForm();
  };

  const handleDelete = (phaseId: string) => {
    if (confirm("Supprimer cette phase ?")) {
      deletePhase.mutate(phaseId);
    }
  };

  const handleStatusChange = (phaseId: string, newStatus: PhaseStatus) => {
    updatePhase.mutate({ id: phaseId, status: newStatus });
  };

  const handleAddDependency = () => {
    if (!selectedPhaseForDependency || !formDependsOn) return;
    
    addDependency.mutate({
      phaseId: selectedPhaseForDependency,
      dependsOnPhaseId: formDependsOn,
    });
    
    setIsDependencyDialogOpen(false);
    setSelectedPhaseForDependency(null);
    setFormDependsOn("");
  };

  const getPhaseDependencies = (phaseId: string) => {
    return dependencies.filter((d) => d.phase_id === phaseId);
  };

  const getPhaseById = (id: string) => phases.find((p) => p.id === id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (phases.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Aucune phase"
        description="Ajoutez des phases pour organiser votre projet."
        action={{ label: "Ajouter une phase", onClick: () => setIsCreateOpen(true) }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Phases du projet</h3>
        <div className="flex items-center gap-2">
          <ViewSwitcher
            value={viewMode}
            onChange={(v) => setViewMode(v as "list" | "timeline")}
            options={[
              { value: "list", label: "Liste", icon: <List className="h-3.5 w-3.5" /> },
              { value: "timeline", label: "Timeline", icon: <GanttChart className="h-3.5 w-3.5" /> },
            ]}
          />
          <Button size="sm" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>

      {viewMode === "timeline" ? (
        <PhaseGanttTimeline
          phases={phases}
          dependencies={dependencies}
          onPhaseClick={(phase) => openEditDialog(phase)}
          onPhaseUpdate={(phaseId, updates) => {
            updatePhase.mutate({ id: phaseId, ...updates });
          }}
        />
      ) : (
        <div className="space-y-3">
          {phases.map((phase, index) => {
            const statusConfig = PHASE_STATUS_CONFIG[phase.status as PhaseStatus] || PHASE_STATUS_CONFIG.pending;
            const phaseDependencies = getPhaseDependencies(phase.id);

            return (
              <Card key={phase.id} className={cn(
                "transition-all",
                phase.status === "in_progress" && "border-primary"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 pt-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: phase.color || "#3B82F6" }}
                      >
                        {phase.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={cn(
                          "font-medium",
                          phase.status === "completed" && "line-through text-muted-foreground"
                        )}>
                          {phase.name}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {statusConfig.label}
                        </Badge>
                      </div>
                      {phase.description && (
                        <p className="text-sm text-muted-foreground mt-1">{phase.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        {phase.end_date && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Échéance : {format(parseISO(phase.end_date), "d MMM yyyy", { locale: fr })}
                          </p>
                        )}
                        {phaseDependencies.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Link2 className="h-3 w-3 text-muted-foreground" />
                            {phaseDependencies.map((dep, i) => {
                              const depPhase = getPhaseById(dep.depends_on_phase_id);
                              return (
                                <Badge
                                  key={dep.id}
                                  variant="outline"
                                  className="text-xs gap-1 group cursor-pointer hover:bg-destructive/10"
                                  onClick={() => removeDependency.mutate(dep.id)}
                                >
                                  <ArrowRight className="h-2.5 w-2.5" />
                                  {depPhase?.name || "?"}
                                  <X className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-destructive" />
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {phase.status !== "in_progress" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(phase.id, "in_progress")}>
                            <Clock className="h-4 w-4 mr-2" />
                            Marquer en cours
                          </DropdownMenuItem>
                        )}
                        {phase.status !== "completed" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(phase.id, "completed")}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Marquer terminée
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setSelectedPhaseForDependency(phase.id);
                          setIsDependencyDialogOpen(true);
                        }}>
                          <Link2 className="h-4 w-4 mr-2" />
                          Ajouter dépendance
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEditDialog(phase)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(phase.id)}
                          className="text-destructive"
                        >
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
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingPhase} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingPhase(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPhase ? "Modifier la phase" : "Nouvelle phase"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Esquisse"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Description de la phase..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as PhaseStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PHASE_STATUS_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex gap-2 flex-wrap">
                  {PHASE_COLORS.slice(0, 8).map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormColor(color)}
                      className={cn(
                        "w-6 h-6 rounded-full transition-all",
                        formColor === color && "ring-2 ring-offset-2 ring-primary"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date d'échéance</Label>
              <InlineDatePicker
                value={formDeadline}
                onChange={setFormDeadline}
                placeholder="Sélectionner une échéance..."
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditingPhase(null); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={editingPhase ? handleUpdate : handleCreate} disabled={!formName.trim()}>
              {editingPhase ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dependency Dialog */}
      <Dialog open={isDependencyDialogOpen} onOpenChange={setIsDependencyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une dépendance</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              La phase "{phases.find((p) => p.id === selectedPhaseForDependency)?.name}" dépend de :
            </p>
            
            <Select value={formDependsOn} onValueChange={setFormDependsOn}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une phase..." />
              </SelectTrigger>
              <SelectContent>
                {phases
                  .filter((p) => p.id !== selectedPhaseForDependency)
                  .filter((p) => !dependencies.some(
                    (d) => d.phase_id === selectedPhaseForDependency && d.depends_on_phase_id === p.id
                  ))
                  .map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: phase.color || "#3B82F6" }}
                        />
                        {phase.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDependencyDialogOpen(false);
              setSelectedPhaseForDependency(null);
              setFormDependsOn("");
            }}>
              Annuler
            </Button>
            <Button onClick={handleAddDependency} disabled={!formDependsOn}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
