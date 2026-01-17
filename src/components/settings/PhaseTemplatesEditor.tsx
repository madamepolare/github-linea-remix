import { useState, useMemo } from "react";
import { usePhaseTemplates, PhaseTemplate, CreatePhaseTemplateInput } from "@/hooks/usePhaseTemplates";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  Puzzle,
  FileText,
  Sparkles,
  Loader2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PhaseCategory, PHASE_CATEGORY_LABELS } from "@/lib/commercialTypes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDiscipline } from "@/hooks/useDiscipline";
import { toast } from "sonner";

interface PhaseFormData {
  code: string;
  name: string;
  description: string;
  default_percentage: number;
  deliverables: string[];
  color: string;
  is_active: boolean;
  category: PhaseCategory;
}

const defaultFormData: PhaseFormData = {
  code: "",
  name: "",
  description: "",
  default_percentage: 0,
  deliverables: [],
  color: "",
  is_active: true,
  category: "base",
};

interface PhaseTemplatesEditorProps {
  projectTypeKey: string;
  projectTypeLabel: string;
}

export function PhaseTemplatesEditor({ projectTypeKey, projectTypeLabel }: PhaseTemplatesEditorProps) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const { discipline, disciplineSlug } = useDiscipline();
  
  const {
    templates: allTemplates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    reorderTemplates,
    initializeDefaultsIfEmpty,
  } = usePhaseTemplates();

  // Filter phases for this project type
  const phases = useMemo(() => {
    return allTemplates
      .filter(t => t.project_type === projectTypeKey)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [allTemplates, projectTypeKey]);

  // Group by category
  const basePhases = useMemo(() => phases.filter(p => p.category === "base"), [phases]);
  const complementaryPhases = useMemo(() => phases.filter(p => p.category === "complementary"), [phases]);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<PhaseTemplate | null>(null);
  const [formData, setFormData] = useState<PhaseFormData>(defaultFormData);
  const [deliverablesText, setDeliverablesText] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  
  // AI generation
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [generatedPhases, setGeneratedPhases] = useState<{ basePhases: any[], complementaryPhases: any[] } | null>(null);

  const handleOpenCreate = (category: PhaseCategory = "base") => {
    setEditingPhase(null);
    setFormData({
      ...defaultFormData,
      code: `PHASE_${phases.length + 1}`,
      category,
    });
    setDeliverablesText("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (phase: PhaseTemplate) => {
    setEditingPhase(phase);
    setFormData({
      code: phase.code,
      name: phase.name,
      description: phase.description || "",
      default_percentage: phase.default_percentage,
      deliverables: phase.deliverables,
      color: phase.color || "",
      is_active: phase.is_active,
      category: phase.category,
    });
    setDeliverablesText(phase.deliverables.join("\n"));
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const deliverables = deliverablesText
      .split("\n")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    if (editingPhase) {
      await updateTemplate.mutateAsync({
        id: editingPhase.id,
        ...formData,
        deliverables,
      });
    } else {
      const nextIndex = phases.filter(t => t.category === formData.category).length;
      const offset = formData.category === "base" ? 0 : 1000;

      await createTemplate.mutateAsync({
        project_type: projectTypeKey,
        ...formData,
        deliverables,
        sort_order: offset + nextIndex,
      } as CreatePhaseTemplateInput);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteTemplate.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const movePhase = async (phase: PhaseTemplate, direction: "up" | "down") => {
    const categoryPhases = phase.category === "base" ? basePhases : complementaryPhases;
    const index = categoryPhases.findIndex(p => p.id === phase.id);
    const newIndex = direction === "up" ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= categoryPhases.length) return;

    const reordered = [...categoryPhases];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    const offset = phase.category === "base" ? 0 : 1000;
    await reorderTemplates.mutateAsync(
      reordered.map((t, i) => ({ id: t.id, sort_order: offset + i }))
    );
  };

  // AI Generation
  const handleGenerateWithAI = async () => {
    setIsGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-phase-templates', {
        body: {
          projectType: projectTypeKey,
          projectTypeLabel,
          discipline: disciplineSlug,
          disciplineName: discipline?.name || disciplineSlug,
          customPrompt: aiCustomPrompt || undefined
        }
      });

      if (error) throw error;
      setGeneratedPhases(data);
      setShowAIDialog(true);
    } catch (error) {
      console.error('Error generating phases:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const applyGeneratedPhases = async () => {
    if (!generatedPhases || !activeWorkspace?.id) return;

    try {
      const maxSortOrder = phases.length > 0
        ? Math.max(...phases.map(t => t.sort_order)) + 1
        : 0;

      const allPhases = [
        ...generatedPhases.basePhases.map((phase, index) => ({
          workspace_id: activeWorkspace.id,
          project_type: projectTypeKey,
          code: phase.code,
          name: phase.name,
          description: phase.description || null,
          default_percentage: Number(phase.default_percentage) || 0,
          deliverables: Array.isArray(phase.deliverables) ? phase.deliverables : [],
          category: 'base' as const,
          sort_order: maxSortOrder + index,
          is_active: true
        })),
        ...generatedPhases.complementaryPhases.map((phase, index) => ({
          workspace_id: activeWorkspace.id,
          project_type: projectTypeKey,
          code: phase.code,
          name: phase.name,
          description: phase.description || null,
          default_percentage: Number(phase.default_percentage) || 0,
          deliverables: Array.isArray(phase.deliverables) ? phase.deliverables : [],
          category: 'complementary' as const,
          sort_order: maxSortOrder + generatedPhases.basePhases.length + index,
          is_active: true
        }))
      ];

      const { error } = await supabase.from("phase_templates").insert(allPhases);
      if (error) throw new Error(error.message);

      queryClient.invalidateQueries({ queryKey: ["phase-templates"] });
      toast.success(`${allPhases.length} phases créées avec succès`);
      setShowAIDialog(false);
      setGeneratedPhases(null);
    } catch (error) {
      console.error('Error creating phases:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
    }
  };

  const renderPhaseCard = (phase: PhaseTemplate, index: number, categoryPhases: PhaseTemplate[]) => (
    <div
      key={phase.id}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
        !phase.is_active && "opacity-50"
      )}
    >
      {/* Move controls */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          disabled={index === 0}
          onClick={() => movePhase(phase, "up")}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          disabled={index === categoryPhases.length - 1}
          onClick={() => movePhase(phase, "down")}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Phase info */}
      <Badge variant="outline" className="text-xs font-mono shrink-0">
        {phase.code}
      </Badge>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{phase.name}</div>
        {phase.description && (
          <p className="text-xs text-muted-foreground truncate">{phase.description}</p>
        )}
      </div>

      {/* Deliverables count */}
      {phase.deliverables.length > 0 && (
        <Badge variant="secondary" className="text-xs gap-1 shrink-0">
          <FileText className="h-3 w-3" />
          {phase.deliverables.length}
        </Badge>
      )}

      {/* Status */}
      {!phase.is_active && (
        <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">
          Inactive
        </Badge>
      )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
        >
          {expandedPhase === phase.id ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => handleOpenEdit(phase)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => setDeleteConfirmId(phase.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Expanded deliverables */}
      {expandedPhase === phase.id && (
        <div className="col-span-full pl-12 pb-2">
          <div className="border-l-2 border-muted pl-3">
            {phase.deliverables.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Livrables :</p>
                <ul className="text-xs space-y-0.5">
                  {phase.deliverables.map((d, i) => (
                    <li key={i} className="text-muted-foreground">• {d}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Aucun livrable défini</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderPhaseSection = (title: string, phaseList: PhaseTemplate[], category: PhaseCategory, icon: React.ReactNode) => (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <CardTitle className="text-sm">{title}</CardTitle>
              <CardDescription className="text-xs">
                {category === "base" ? "Phases principales de mission" : "Missions complémentaires optionnelles"}
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleOpenCreate(category)}>
            <Plus className="h-3 w-3 mr-1" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        {phaseList.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Aucune phase {category === "base" ? "de base" : "complémentaire"}
          </p>
        ) : (
          <div className="space-y-1.5">
            {phaseList.map((phase, index) => renderPhaseCard(phase, index, phaseList))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with AI generation */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Phases pour "{projectTypeLabel}"</h4>
          <p className="text-xs text-muted-foreground">
            {phases.length} phase{phases.length > 1 ? "s" : ""} configurée{phases.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {phases.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => initializeDefaultsIfEmpty.mutate(projectTypeKey)}
            >
              Charger les valeurs par défaut
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateWithAI}
            disabled={isGeneratingAI}
          >
            {isGeneratingAI ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            Générer avec IA
          </Button>
        </div>
      </div>

      {/* Phase sections */}
      {renderPhaseSection(
        PHASE_CATEGORY_LABELS.base,
        basePhases,
        "base",
        <Layers className="h-4 w-4 text-primary" />
      )}
      
      {renderPhaseSection(
        PHASE_CATEGORY_LABELS.complementary,
        complementaryPhases,
        "complementary",
        <Puzzle className="h-4 w-4 text-amber-500" />
      )}

      {/* Phase Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPhase ? "Modifier" : "Ajouter"} une phase
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="ESQ, APS, APD..."
                />
              </div>
              <div className="space-y-2">
                <Label>Pourcentage par défaut</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.default_percentage}
                  onChange={(e) => setFormData({ ...formData, default_percentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Esquisse, Avant-projet sommaire..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle"
              />
            </div>
            <div className="space-y-2">
              <Label>Livrables par défaut (un par ligne)</Label>
              <Textarea
                value={deliverablesText}
                onChange={(e) => setDeliverablesText(e.target.value)}
                placeholder="Plans d'esquisse&#10;Note d'intention&#10;Estimation budgétaire"
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!formData.code || !formData.name}>
              {editingPhase ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generated Phases Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Phases générées par IA</DialogTitle>
          </DialogHeader>
          {generatedPhases && (
            <div className="space-y-4">
              {generatedPhases.basePhases.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Phases de base</h4>
                  <div className="space-y-1">
                    {generatedPhases.basePhases.map((phase, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded border text-sm">
                        <Badge variant="outline" className="font-mono">{phase.code}</Badge>
                        <span className="flex-1">{phase.name}</span>
                        {phase.default_percentage > 0 && (
                          <Badge variant="secondary">{phase.default_percentage}%</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {generatedPhases.complementaryPhases.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Phases complémentaires</h4>
                  <div className="space-y-1">
                    {generatedPhases.complementaryPhases.map((phase, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded border text-sm">
                        <Badge variant="outline" className="font-mono">{phase.code}</Badge>
                        <span className="flex-1">{phase.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              Annuler
            </Button>
            <Button onClick={applyGeneratedPhases}>
              Appliquer ces phases
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette phase ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
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
    </div>
  );
}
