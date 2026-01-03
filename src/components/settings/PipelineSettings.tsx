import { useState } from "react";
import { useWorkspaceSettings, WorkspaceSetting } from "@/hooks/useWorkspaceSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Target, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGE_COLORS = [
  "#6B7280", "#3B82F6", "#8B5CF6", "#EC4899", "#F97316", "#22C55E", "#EF4444"
];

const DEFAULT_PIPELINE = {
  name: "Pipeline Principal",
  stages: [
    { key: "new", label: "Nouveau", color: "#6B7280", probability: 10 },
    { key: "contacted", label: "Contacté", color: "#3B82F6", probability: 20 },
    { key: "meeting", label: "RDV planifié", color: "#8B5CF6", probability: 40 },
    { key: "proposal", label: "Proposition", color: "#EC4899", probability: 60 },
    { key: "negotiation", label: "Négociation", color: "#F97316", probability: 80 },
    { key: "won", label: "Gagné", color: "#22C55E", probability: 100 },
    { key: "lost", label: "Perdu", color: "#EF4444", probability: 0 },
  ],
};

export function PipelineSettings() {
  const { settings: pipelines, isLoading, createSetting, updateSetting, deleteSetting } = useWorkspaceSettings("pipelines");
  const { settings: stages, createSetting: createStage, updateSetting: updateStage, deleteSetting: deleteStage, reorderSettings: reorderStages } = useWorkspaceSettings("pipeline_stages");

  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);
  const [isPipelineDialogOpen, setIsPipelineDialogOpen] = useState(false);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<WorkspaceSetting | null>(null);
  const [editingStage, setEditingStage] = useState<WorkspaceSetting | null>(null);
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"pipeline" | "stage">("pipeline");

  const [pipelineForm, setPipelineForm] = useState({ name: "", color: "#3B82F6" });
  const [stageForm, setStageForm] = useState({ key: "", label: "", color: STAGE_COLORS[0], probability: 0 });

  const handleCreateDefaultPipeline = async () => {
    const result = await createSetting.mutateAsync({
      setting_type: "pipelines",
      setting_key: "default",
      setting_value: { label: DEFAULT_PIPELINE.name, color: "#3B82F6" },
      sort_order: 0,
    });

    // Create default stages
    for (let i = 0; i < DEFAULT_PIPELINE.stages.length; i++) {
      const stage = DEFAULT_PIPELINE.stages[i];
      await createStage.mutateAsync({
        setting_type: "pipeline_stages",
        setting_key: stage.key,
        setting_value: {
          label: stage.label,
          color: stage.color,
          probability: stage.probability,
          pipeline_id: result.id,
        },
        sort_order: i,
      });
    }
  };

  const handleOpenCreatePipeline = () => {
    setEditingPipeline(null);
    setPipelineForm({ name: "", color: "#3B82F6" });
    setIsPipelineDialogOpen(true);
  };

  const handleOpenEditPipeline = (pipeline: WorkspaceSetting) => {
    setEditingPipeline(pipeline);
    setPipelineForm({
      name: pipeline.setting_value.label,
      color: pipeline.setting_value.color || "#3B82F6",
    });
    setIsPipelineDialogOpen(true);
  };

  const handleSavePipeline = async () => {
    if (editingPipeline) {
      await updateSetting.mutateAsync({
        id: editingPipeline.id,
        setting_value: { label: pipelineForm.name, color: pipelineForm.color },
      });
    } else {
      await createSetting.mutateAsync({
        setting_type: "pipelines",
        setting_key: pipelineForm.name.toLowerCase().replace(/\s+/g, "_"),
        setting_value: { label: pipelineForm.name, color: pipelineForm.color },
        sort_order: pipelines.length,
      });
    }
    setIsPipelineDialogOpen(false);
  };

  const handleOpenCreateStage = (pipelineId: string) => {
    setCurrentPipelineId(pipelineId);
    setEditingStage(null);
    setStageForm({ key: "", label: "", color: STAGE_COLORS[0], probability: 0 });
    setIsStageDialogOpen(true);
  };

  const handleOpenEditStage = (stage: WorkspaceSetting) => {
    setEditingStage(stage);
    setStageForm({
      key: stage.setting_key,
      label: stage.setting_value.label,
      color: stage.setting_value.color || STAGE_COLORS[0],
      probability: stage.setting_value.probability || 0,
    });
    setIsStageDialogOpen(true);
  };

  const handleSaveStage = async () => {
    if (editingStage) {
      await updateStage.mutateAsync({
        id: editingStage.id,
        setting_key: stageForm.key,
        setting_value: {
          label: stageForm.label,
          color: stageForm.color,
          probability: stageForm.probability,
          pipeline_id: editingStage.setting_value.pipeline_id,
        },
      });
    } else if (currentPipelineId) {
      const pipelineStages = stages.filter(s => s.setting_value.pipeline_id === currentPipelineId);
      await createStage.mutateAsync({
        setting_type: "pipeline_stages",
        setting_key: stageForm.key || stageForm.label.toLowerCase().replace(/\s+/g, "_"),
        setting_value: {
          label: stageForm.label,
          color: stageForm.color,
          probability: stageForm.probability,
          pipeline_id: currentPipelineId,
        },
        sort_order: pipelineStages.length,
      });
    }
    setIsStageDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    
    if (deleteType === "pipeline") {
      // Delete all stages first
      const pipelineStages = stages.filter(s => s.setting_value.pipeline_id === deleteConfirmId);
      for (const stage of pipelineStages) {
        await deleteStage.mutateAsync(stage.id);
      }
      await deleteSetting.mutateAsync(deleteConfirmId);
    } else {
      await deleteStage.mutateAsync(deleteConfirmId);
    }
    setDeleteConfirmId(null);
  };

  const handleMoveStage = async (pipelineId: string, stageId: string, direction: "up" | "down") => {
    const pipelineStages = stages.filter(s => s.setting_value.pipeline_id === pipelineId);
    const index = pipelineStages.findIndex(s => s.id === stageId);
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= pipelineStages.length) return;

    const reordered = [...pipelineStages];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    await reorderStages.mutateAsync(
      reordered.map((s, i) => ({ id: s.id, sort_order: i }))
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Pipelines commerciaux</CardTitle>
                <CardDescription className="text-xs">
                  Gérez vos pipelines et leurs étapes
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pipelines.length === 0 && (
                <Button variant="outline" size="sm" onClick={handleCreateDefaultPipeline}>
                  Créer le pipeline par défaut
                </Button>
              )}
              <Button size="sm" onClick={handleOpenCreatePipeline}>
                <Plus className="h-4 w-4 mr-1" />
                Pipeline
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pipelines.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Aucun pipeline configuré
            </div>
          ) : (
            <div className="space-y-3">
              {pipelines.map((pipeline) => {
                const pipelineStages = stages.filter(
                  (s) => s.setting_value.pipeline_id === pipeline.id
                ).sort((a, b) => a.sort_order - b.sort_order);

                return (
                  <Collapsible
                    key={pipeline.id}
                    open={expandedPipeline === pipeline.id}
                    onOpenChange={(open) => setExpandedPipeline(open ? pipeline.id : null)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: pipeline.setting_value.color }}
                              />
                              <span className="font-medium">
                                {pipeline.setting_value.label}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {pipelineStages.length} étapes
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditPipeline(pipeline);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteType("pipeline");
                                  setDeleteConfirmId(pipeline.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                              {expandedPipeline === pipeline.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                Étapes du pipeline
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleOpenCreateStage(pipeline.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Étape
                              </Button>
                            </div>

                            {pipelineStages.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Aucune étape
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {pipelineStages.map((stage, index) => (
                                  <div
                                    key={stage.id}
                                    className="flex items-center gap-2 p-2 rounded bg-muted/50"
                                  >
                                    <div className="flex flex-col gap-0.5">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4"
                                        disabled={index === 0}
                                        onClick={() => handleMoveStage(pipeline.id, stage.id, "up")}
                                      >
                                        <ChevronUp className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4"
                                        disabled={index === pipelineStages.length - 1}
                                        onClick={() => handleMoveStage(pipeline.id, stage.id, "down")}
                                      >
                                        <ChevronDown className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <div
                                      className="h-3 w-3 rounded-full"
                                      style={{ backgroundColor: stage.setting_value.color }}
                                    />
                                    <span className="flex-1 text-sm">
                                      {stage.setting_value.label}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {stage.setting_value.probability}%
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleOpenEditStage(stage)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive"
                                      onClick={() => {
                                        setDeleteType("stage");
                                        setDeleteConfirmId(stage.id);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Dialog */}
      <Dialog open={isPipelineDialogOpen} onOpenChange={setIsPipelineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPipeline ? "Modifier le pipeline" : "Nouveau pipeline"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du pipeline</Label>
              <Input
                value={pipelineForm.name}
                onChange={(e) => setPipelineForm({ ...pipelineForm, name: e.target.value })}
                placeholder="Ex: Pipeline Principal"
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-2">
                {STAGE_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      pipelineForm.color === color && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setPipelineForm({ ...pipelineForm, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPipelineDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSavePipeline} disabled={!pipelineForm.name}>
              {editingPipeline ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Dialog */}
      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStage ? "Modifier l'étape" : "Nouvelle étape"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'étape</Label>
              <Input
                value={stageForm.label}
                onChange={(e) => setStageForm({ ...stageForm, label: e.target.value })}
                placeholder="Ex: Proposition envoyée"
              />
            </div>
            <div className="space-y-2">
              <Label>Clé (identifiant)</Label>
              <Input
                value={stageForm.key}
                onChange={(e) => setStageForm({ ...stageForm, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                placeholder="Généré automatiquement"
              />
            </div>
            <div className="space-y-2">
              <Label>Probabilité de conversion (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={stageForm.probability}
                onChange={(e) => setStageForm({ ...stageForm, probability: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-2">
                {STAGE_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      stageForm.color === color && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setStageForm({ ...stageForm, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStageDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveStage} disabled={!stageForm.label}>
              {editingStage ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === "pipeline"
                ? "Supprimer ce pipeline supprimera également toutes ses étapes. Cette action est irréversible."
                : "Voulez-vous vraiment supprimer cette étape ?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
