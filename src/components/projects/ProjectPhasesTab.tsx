import { useState } from "react";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { usePhaseDependencies } from "@/hooks/usePhaseDependencies";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PHASE_STATUS_CONFIG, PhaseStatus } from "@/lib/projectTypes";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
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
import { ImportPhasesFromQuoteDialog } from "./ImportPhasesFromQuoteDialog";
import { PhaseFormDialog } from "./PhaseFormDialog";
import { toast } from "sonner";

interface ProjectPhasesTabProps {
  projectId: string;
}

export function ProjectPhasesTab({ projectId }: ProjectPhasesTabProps) {
  const { activeWorkspace } = useAuth();
  const { phases, isLoading, createPhase, createManyPhases, updatePhase, deletePhase, reorderPhases } = useProjectPhases(projectId);
  const { dependencies, addDependency, removeDependency } = usePhaseDependencies(projectId);
  
  const [editingPhase, setEditingPhase] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDependencyDialogOpen, setIsDependencyDialogOpen] = useState(false);
  const [selectedPhaseForDependency, setSelectedPhaseForDependency] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [formDependsOn, setFormDependsOn] = useState<string>("");
  const [draggedPhaseId, setDraggedPhaseId] = useState<string | null>(null);

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, phaseId: string) => {
    setDraggedPhaseId(phaseId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedPhaseId || draggedPhaseId === targetId) return;

    const newOrder = [...phases];
    const draggedIndex = newOrder.findIndex((p) => p.id === draggedPhaseId);
    const targetIndex = newOrder.findIndex((p) => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedPhase] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedPhase);

    reorderPhases.mutate(newOrder.map((p) => p.id));
    setDraggedPhaseId(null);
  };

  const handleDragEnd = () => {
    setDraggedPhaseId(null);
  };

  const openEditDialog = (phase: any) => {
    setEditingPhase(phase);
  };

  const handlePhaseSubmit = (data: {
    name: string;
    description?: string;
    status: PhaseStatus;
    color: string;
    end_date?: string;
  }) => {
    if (editingPhase) {
      // Update existing phase
      updatePhase.mutate({
        id: editingPhase.id,
        name: data.name,
        description: data.description || null,
        status: data.status,
        color: data.color,
        end_date: data.end_date || null,
      });
      setEditingPhase(null);
    } else {
      // Create new phase
      createPhase.mutate({
        name: data.name,
        description: data.description,
        status: data.status,
        color: data.color,
        end_date: data.end_date,
        sort_order: phases.length,
      });
      setIsCreateOpen(false);
    }
  };

  const handleMultiplePhasesSubmit = async (phasesData: {
    name: string;
    description?: string;
    status: PhaseStatus;
    color: string;
  }[]) => {
    if (!activeWorkspace) return;

    await createManyPhases.mutateAsync(
      phasesData.map((p, index) => ({
        project_id: projectId,
        workspace_id: activeWorkspace.id,
        name: p.name,
        description: p.description,
        status: p.status,
        color: p.color,
        sort_order: phases.length + index,
      }))
    );

    toast.success(`${phasesData.length} phases ajoutées`);
    setIsCreateOpen(false);
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

  const handleImportPhases = async (
    phasesToImport: {
      name: string;
      description?: string;
      sort_order: number;
      status: string;
      phase_code?: string;
    }[]
  ) => {
    if (!activeWorkspace) return;

    // If replacing, delete all existing phases first
    if (phases.length > 0) {
      // Check if user selected "replace" mode - we handle this by checking sort_order starts at 0
      const isReplacing = phasesToImport.length > 0 && phasesToImport[0].sort_order === 0;
      if (isReplacing) {
        // Delete existing phases
        for (const phase of phases) {
          await deletePhase.mutateAsync(phase.id);
        }
      }
    }

    // Create new phases with required fields
    await createManyPhases.mutateAsync(
      phasesToImport.map((p) => ({
        project_id: projectId,
        workspace_id: activeWorkspace.id,
        name: p.name,
        description: p.description,
        sort_order: p.sort_order,
        status: p.status as PhaseStatus,
      }))
    );

    toast.success(`${phasesToImport.length} phase${phasesToImport.length > 1 ? "s" : ""} importée${phasesToImport.length > 1 ? "s" : ""}`);
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

  if (phases.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-1" />
            Importer depuis un devis
          </Button>
        </div>
        <EmptyState
          icon={Calendar}
          title="Aucune phase"
          description="Ajoutez des phases pour organiser votre projet ou importez-les depuis un devis."
          action={{ label: "Ajouter une phase", onClick: () => setIsCreateOpen(true) }}
        />
        
        {/* Phase Form Dialog */}
        <PhaseFormDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSubmit={handlePhaseSubmit}
          onSubmitMultiple={handleMultiplePhasesSubmit}
          existingPhasesCount={0}
        />
        
        {/* Import Dialog */}
        <ImportPhasesFromQuoteDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          projectId={projectId}
          existingPhasesCount={0}
          onImport={handleImportPhases}
        />
      </div>
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
          <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-1" />
            Importer
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
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
            const isDragging = draggedPhaseId === phase.id;

            return (
              <Card 
                key={phase.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, phase.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, phase.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "transition-all cursor-grab active:cursor-grabbing",
                  phase.status === "in_progress" && "border-primary",
                  isDragging && "opacity-50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 pt-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
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
                            {phaseDependencies.map((dep) => {
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

      {/* Phase Form Dialog - Create/Edit */}
      <PhaseFormDialog
        open={isCreateOpen || !!editingPhase}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingPhase(null);
          }
        }}
        editingPhase={editingPhase}
        onSubmit={handlePhaseSubmit}
        onSubmitMultiple={handleMultiplePhasesSubmit}
        existingPhasesCount={phases.length}
      />

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

      {/* Import from Quote Dialog */}
      <ImportPhasesFromQuoteDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        projectId={projectId}
        existingPhasesCount={phases.length}
        onImport={handleImportPhases}
      />
    </div>
  );
}
