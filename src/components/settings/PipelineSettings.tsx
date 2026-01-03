import { useState } from "react";
import { useCRMPipelines, Pipeline, PipelineStage } from "@/hooks/useCRMPipelines";
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

const STAGE_COLORS = [
  "#6B7280", "#3B82F6", "#8B5CF6", "#EC4899", "#F97316", "#22C55E", "#EF4444"
];

export function PipelineSettings() {
  const {
    pipelines,
    isLoading,
    createPipeline,
    updatePipeline,
    deletePipeline,
    createDefaultPipeline,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
  } = useCRMPipelines();

  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);
  const [isPipelineDialogOpen, setIsPipelineDialogOpen] = useState(false);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"pipeline" | "stage">("pipeline");

  const [pipelineForm, setPipelineForm] = useState({ name: "", color: "#3B82F6" });
  const [stageForm, setStageForm] = useState({ name: "", color: STAGE_COLORS[0], probability: 0 });

  const handleCreateDefaultPipeline = async () => {
    await createDefaultPipeline.mutateAsync();
  };

  const handleOpenCreatePipeline = () => {
    setEditingPipeline(null);
    setPipelineForm({ name: "", color: "#3B82F6" });
    setIsPipelineDialogOpen(true);
  };

  const handleOpenEditPipeline = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline);
    setPipelineForm({
      name: pipeline.name,
      color: pipeline.color || "#3B82F6",
    });
    setIsPipelineDialogOpen(true);
  };

  const handleSavePipeline = async () => {
    if (editingPipeline) {
      await updatePipeline.mutateAsync({
        id: editingPipeline.id,
        name: pipelineForm.name,
        color: pipelineForm.color,
      });
    } else {
      await createPipeline.mutateAsync({
        name: pipelineForm.name,
        color: pipelineForm.color,
      });
    }
    setIsPipelineDialogOpen(false);
  };

  const handleOpenCreateStage = (pipelineId: string) => {
    setCurrentPipelineId(pipelineId);
    setEditingStage(null);
    setStageForm({ name: "", color: STAGE_COLORS[0], probability: 0 });
    setIsStageDialogOpen(true);
  };

  const handleOpenEditStage = (stage: PipelineStage) => {
    setEditingStage(stage);
    setStageForm({
      name: stage.name,
      color: stage.color || STAGE_COLORS[0],
      probability: stage.probability || 0,
    });
    setIsStageDialogOpen(true);
  };

  const handleSaveStage = async () => {
    if (editingStage) {
      await updateStage.mutateAsync({
        id: editingStage.id,
        name: stageForm.name,
        color: stageForm.color,
        probability: stageForm.probability,
      });
    } else if (currentPipelineId) {
      await createStage.mutateAsync({
        pipeline_id: currentPipelineId,
        name: stageForm.name,
        color: stageForm.color,
        probability: stageForm.probability,
      });
    }
    setIsStageDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    if (deleteType === "pipeline") {
      await deletePipeline.mutateAsync(deleteConfirmId);
    } else {
      await deleteStage.mutateAsync(deleteConfirmId);
    }
    setDeleteConfirmId(null);
  };

  const handleMoveStage = async (pipelineId: string, stageId: string, direction: "up" | "down") => {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline?.stages) return;

    const stages = [...pipeline.stages];
    const index = stages.findIndex((s) => s.id === stageId);
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;

    const [moved] = stages.splice(index, 1);
    stages.splice(newIndex, 0, moved);

    await reorderStages.mutateAsync(
      stages.map((s, i) => ({ id: s.id, sort_order: i }))
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
                const pipelineStages = pipeline.stages || [];

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
                                style={{ backgroundColor: pipeline.color || "#3B82F6" }}
                              />
                              <span className="font-medium">{pipeline.name}</span>
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
                                      style={{ backgroundColor: stage.color || "#6B7280" }}
                                    />
                                    <span className="flex-1 text-sm">{stage.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {stage.probability || 0}%
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
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      pipelineForm.color === color
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
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
              {editingPipeline ? "Enregistrer" : "Créer"}
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
                value={stageForm.name}
                onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                placeholder="Ex: Qualification"
              />
            </div>
            <div className="space-y-2">
              <Label>Probabilité de conversion (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={stageForm.probability}
                onChange={(e) =>
                  setStageForm({ ...stageForm, probability: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-2">
                {STAGE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      stageForm.color === color
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
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
            <Button onClick={handleSaveStage} disabled={!stageForm.name}>
              {editingStage ? "Enregistrer" : "Créer"}
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
                ? "Voulez-vous vraiment supprimer ce pipeline et toutes ses étapes ? Cette action est irréversible."
                : "Voulez-vous vraiment supprimer cette étape ? Cette action est irréversible."}
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
    </>
  );
}
