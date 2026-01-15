import { useState } from "react";
import { useCRMPipelines, Pipeline, PipelineStage } from "@/hooks/useCRMPipelines";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Target, Layers, Mail, Sparkles, Loader2 } from "lucide-react";
import { DEFAULT_CONTACT_TYPES } from "@/lib/crmDefaults";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STAGE_COLORS = [
  "#6B7280", "#3B82F6", "#8B5CF6", "#EC4899", "#F97316", "#22C55E", "#EF4444"
];

const CONTACT_TYPE_OPTIONS = DEFAULT_CONTACT_TYPES.filter(t => 
  ["bet", "societe", "partenaire_moe", "fournisseur", "client", "prospect"].includes(t.key)
);

interface GeneratedStage {
  name: string;
  color: string;
  probability: number;
  requires_email_on_enter: boolean;
  is_final_stage: boolean;
  email_ai_prompt?: string;
}

export function CRMPipelinesSettings() {
  const {
    pipelines,
    isLoading,
    createPipeline,
    updatePipeline,
    deletePipeline,
    createDefaultContactPipelines,
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

  const [pipelineForm, setPipelineForm] = useState({ 
    name: "", 
    color: "#3B82F6",
    target_contact_type: "",
    objective: "",
    email_ai_prompt: ""
  });
  const [stageForm, setStageForm] = useState({ 
    name: "", 
    color: STAGE_COLORS[0], 
    probability: 0,
    requires_email_on_enter: false,
    is_final_stage: false,
    email_ai_prompt: "",
  });
  const [generatedStages, setGeneratedStages] = useState<GeneratedStage[]>([]);
  const [isGeneratingStages, setIsGeneratingStages] = useState(false);
  const [isGeneratingForPipeline, setIsGeneratingForPipeline] = useState<string | null>(null);

  const handleGenerateStages = async () => {
    if (!pipelineForm.name) {
      toast.error("Veuillez d'abord saisir un nom de pipeline");
      return;
    }

    setIsGeneratingStages(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pipeline-stages", {
        body: {
          pipelineName: pipelineForm.name,
          pipelineType: "contact",
          targetContactType: pipelineForm.target_contact_type,
          objective: pipelineForm.objective,
        },
      });

      if (error) throw error;

      if (data?.stages && Array.isArray(data.stages)) {
        setGeneratedStages(data.stages);
        // Also set the generated email AI prompt if available
        if (data.email_ai_prompt) {
          setPipelineForm(prev => ({ ...prev, email_ai_prompt: data.email_ai_prompt }));
        }
        toast.success(`${data.stages.length} étapes générées avec succès`);
      } else {
        throw new Error("Format de réponse invalide");
      }
    } catch (error) {
      console.error("Error generating stages:", error);
      toast.error("Erreur lors de la génération des étapes");
    } finally {
      setIsGeneratingStages(false);
    }
  };

  const handleCreateDefaultPipelines = async () => {
    await createDefaultContactPipelines.mutateAsync();
  };

  const handleOpenCreatePipeline = () => {
    setEditingPipeline(null);
    setPipelineForm({ name: "", color: "#3B82F6", target_contact_type: "", objective: "", email_ai_prompt: "" });
    setGeneratedStages([]);
    setIsPipelineDialogOpen(true);
  };

  const handleOpenEditPipeline = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline);
    setPipelineForm({
      name: pipeline.name,
      color: pipeline.color || "#3B82F6",
      target_contact_type: pipeline.target_contact_type || "",
      objective: "",
      email_ai_prompt: pipeline.email_ai_prompt || "",
    });
    setGeneratedStages([]);
    setIsPipelineDialogOpen(true);
  };

  const handleSavePipeline = async () => {
    if (editingPipeline) {
      await updatePipeline.mutateAsync({
        id: editingPipeline.id,
        name: pipelineForm.name,
        color: pipelineForm.color,
        target_contact_type: pipelineForm.target_contact_type || undefined,
        email_ai_prompt: pipelineForm.email_ai_prompt || undefined,
      });
    } else {
      const newPipeline = await createPipeline.mutateAsync({
        name: pipelineForm.name,
        color: pipelineForm.color,
        pipeline_type: "contact", // All pipelines are now unified as "contact" type
        target_contact_type: pipelineForm.target_contact_type || undefined,
        email_ai_prompt: pipelineForm.email_ai_prompt || undefined,
      });

      // Create generated stages if any
      if (generatedStages.length > 0 && newPipeline?.id) {
        for (let i = 0; i < generatedStages.length; i++) {
          const stage = generatedStages[i];
          await createStage.mutateAsync({
            pipeline_id: newPipeline.id,
            name: stage.name,
            color: stage.color,
            probability: stage.probability,
            requires_email_on_enter: stage.requires_email_on_enter,
            is_final_stage: stage.is_final_stage,
          });
        }
        toast.success(`Pipeline créé avec ${generatedStages.length} étapes`);
      }
    }
    setIsPipelineDialogOpen(false);
    setGeneratedStages([]);
  };

  const handleOpenCreateStage = (pipelineId: string) => {
    setCurrentPipelineId(pipelineId);
    setEditingStage(null);
    setStageForm({ 
      name: "", 
      color: STAGE_COLORS[0], 
      probability: 0,
      requires_email_on_enter: false,
      is_final_stage: false,
      email_ai_prompt: "",
    });
    setIsStageDialogOpen(true);
  };

  const handleOpenEditStage = (stage: PipelineStage) => {
    setEditingStage(stage);
    setStageForm({
      name: stage.name,
      color: stage.color || STAGE_COLORS[0],
      probability: stage.probability || 0,
      requires_email_on_enter: stage.requires_email_on_enter || false,
      is_final_stage: stage.is_final_stage || false,
      email_ai_prompt: stage.email_ai_prompt || "",
    });
    setIsStageDialogOpen(true);
  };

  // Generate stages for an existing pipeline
  const handleGenerateStagesForPipeline = async (pipeline: Pipeline) => {
    setIsGeneratingForPipeline(pipeline.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pipeline-stages", {
        body: {
          pipelineName: pipeline.name,
          pipelineType: "contact",
          targetContactType: pipeline.target_contact_type,
          objective: "",
        },
      });

      if (error) throw error;

      if (data?.stages && Array.isArray(data.stages)) {
        // Create the stages for this pipeline
        for (let i = 0; i < data.stages.length; i++) {
          const stage = data.stages[i];
          await createStage.mutateAsync({
            pipeline_id: pipeline.id,
            name: stage.name,
            color: stage.color,
            probability: stage.probability,
            requires_email_on_enter: stage.requires_email_on_enter,
            is_final_stage: stage.is_final_stage,
            email_ai_prompt: stage.email_ai_prompt,
          });
        }
        
        // Update pipeline with email_ai_prompt if provided
        if (data.email_ai_prompt) {
          await updatePipeline.mutateAsync({
            id: pipeline.id,
            email_ai_prompt: data.email_ai_prompt,
          });
        }
        
        toast.success(`${data.stages.length} étapes générées avec succès`);
      } else {
        throw new Error("Format de réponse invalide");
      }
    } catch (error) {
      console.error("Error generating stages:", error);
      toast.error("Erreur lors de la génération des étapes");
    } finally {
      setIsGeneratingForPipeline(null);
    }
  };

  const handleSaveStage = async () => {
    if (editingStage) {
      await updateStage.mutateAsync({
        id: editingStage.id,
        name: stageForm.name,
        color: stageForm.color,
        probability: stageForm.probability,
        requires_email_on_enter: stageForm.requires_email_on_enter,
        is_final_stage: stageForm.is_final_stage,
        email_ai_prompt: stageForm.requires_email_on_enter ? stageForm.email_ai_prompt : null,
      });
    } else if (currentPipelineId) {
      await createStage.mutateAsync({
        pipeline_id: currentPipelineId,
        name: stageForm.name,
        color: stageForm.color,
        probability: stageForm.probability,
        requires_email_on_enter: stageForm.requires_email_on_enter,
        is_final_stage: stageForm.is_final_stage,
        email_ai_prompt: stageForm.requires_email_on_enter ? stageForm.email_ai_prompt : undefined,
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

  const getContactTypeLabel = (type: string | null) => {
    if (!type) return null;
    const found = CONTACT_TYPE_OPTIONS.find(t => t.key === type);
    return found?.label || type;
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
                <CardTitle className="text-base">Pipelines de prospection</CardTitle>
                <CardDescription className="text-xs">
                  Gérez vos pipelines pour qualifier contacts et entreprises
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pipelines.length === 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCreateDefaultPipelines}
                  disabled={createDefaultContactPipelines.isPending}
                >
                  Créer les pipelines par défaut
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
                              {pipeline.target_contact_type && (
                                <Badge variant="outline" className="text-xs">
                                  {getContactTypeLabel(pipeline.target_contact_type)}
                                </Badge>
                              )}
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
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleGenerateStagesForPipeline(pipeline)}
                                  disabled={isGeneratingForPipeline === pipeline.id}
                                >
                                  {isGeneratingForPipeline === pipeline.id ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Génération...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      Générer avec IA
                                    </>
                                  )}
                                </Button>
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
                            </div>

                            {pipelineStages.length === 0 ? (
                              <div className="text-center py-6 border border-dashed rounded-lg">
                                <p className="text-sm text-muted-foreground mb-3">
                                  Aucune étape configurée
                                </p>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleGenerateStagesForPipeline(pipeline)}
                                  disabled={isGeneratingForPipeline === pipeline.id}
                                >
                                  {isGeneratingForPipeline === pipeline.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Génération en cours...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-4 w-4 mr-2" />
                                      Générer les étapes avec IA
                                    </>
                                  )}
                                </Button>
                              </div>
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
                                    {stage.requires_email_on_enter && (
                                      <Mail className="h-3 w-3 text-primary" />
                                    )}
                                    {stage.is_final_stage && (
                                      <Badge variant="outline" className="text-[10px] h-4">Final</Badge>
                                    )}
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
        <DialogContent className="max-w-lg">
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
                placeholder="Ex: Prospection BET"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Type de contact cible (optionnel)</Label>
              <Select
                value={pipelineForm.target_contact_type || "_all"}
                onValueChange={(value) => setPipelineForm({ ...pipelineForm, target_contact_type: value === "_all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Tous les types</SelectItem>
                  {CONTACT_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type.key} value={type.key}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* AI Stage Generation Section - Only for new pipelines */}
            {!editingPipeline && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="font-medium">Générer des étapes avec l'IA</Label>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Objectif du pipeline (optionnel)</Label>
                  <Textarea
                    value={pipelineForm.objective}
                    onChange={(e) => setPipelineForm({ ...pipelineForm, objective: e.target.value })}
                    placeholder="Ex: Qualifier et convertir des promoteurs immobiliers en clients..."
                    className="h-16 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateStages}
                  disabled={isGeneratingStages || !pipelineForm.name}
                  className="w-full"
                >
                  {isGeneratingStages ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Générer les étapes
                    </>
                  )}
                </Button>

                {/* Display generated stages preview */}
                {generatedStages.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <Label className="text-xs text-muted-foreground">
                      Étapes générées ({generatedStages.length})
                    </Label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {generatedStages.map((stage, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm"
                        >
                          <div
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="flex-1 truncate">{stage.name}</span>
                          <Badge variant="outline" className="text-[10px] h-4">
                            {stage.probability}%
                          </Badge>
                          {stage.requires_email_on_enter && (
                            <Mail className="h-3 w-3 text-primary" />
                          )}
                          {stage.is_final_stage && (
                            <Badge variant="secondary" className="text-[10px] h-4">Final</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setGeneratedStages([])}
                      className="text-xs text-muted-foreground"
                    >
                      Effacer les étapes générées
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Email AI Prompt Configuration */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Prompt IA pour les emails</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Ce prompt sera utilisé comme base pour générer automatiquement les emails de ce pipeline.
              </p>
              <Textarea
                value={pipelineForm.email_ai_prompt}
                onChange={(e) => setPipelineForm({ ...pipelineForm, email_ai_prompt: e.target.value })}
                placeholder="Ex: Adopter un ton professionnel et chaleureux pour prospecter des architectes, mentionner notre expertise en ingénierie structure..."
                className="h-20 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPipelineDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSavePipeline} disabled={!pipelineForm.name}>
              {editingPipeline ? "Enregistrer" : generatedStages.length > 0 ? `Créer avec ${generatedStages.length} étapes` : "Créer"}
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
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email requis à l'entrée</Label>
                <p className="text-xs text-muted-foreground">
                  Ouvre une modale email lors du déplacement vers cette étape
                </p>
              </div>
              <Switch
                checked={stageForm.requires_email_on_enter}
                onCheckedChange={(checked) => 
                  setStageForm({ ...stageForm, requires_email_on_enter: checked })
                }
              />
            </div>

            {/* Email AI Prompt - only show when email is required */}
            {stageForm.requires_email_on_enter && (
              <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <Label className="font-medium">Prompt IA pour l'email</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ce prompt sera utilisé pour générer l'email lors du passage à cette étape.
                </p>
                <Textarea
                  value={stageForm.email_ai_prompt}
                  onChange={(e) => setStageForm({ ...stageForm, email_ai_prompt: e.target.value })}
                  placeholder="Ex: Email de prise de contact initial, mentionner notre expertise et proposer un RDV découverte..."
                  className="h-20 text-sm"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Étape finale</Label>
                <p className="text-xs text-muted-foreground">
                  Marque la fin du parcours de prospection
                </p>
              </div>
              <Switch
                checked={stageForm.is_final_stage}
                onCheckedChange={(checked) => 
                  setStageForm({ ...stageForm, is_final_stage: checked })
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
            <AlertDialogTitle>
              Supprimer {deleteType === "pipeline" ? "le pipeline" : "l'étape"} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
              {deleteType === "pipeline" && " Toutes les étapes et entrées associées seront également supprimées."}
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
