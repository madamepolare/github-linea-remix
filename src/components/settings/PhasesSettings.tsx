import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePhaseTemplates, PhaseTemplate, CreatePhaseTemplateInput } from "@/hooks/usePhaseTemplates";
import { useProjectTypeSettings } from "@/hooks/useProjectTypeSettings";
import { useDiscipline } from "@/hooks/useDiscipline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  DialogDescription,
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
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Layers,
  Puzzle,
  Folder,
  AlertCircle,
  Sparkles,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { PHASE_CATEGORY_LABELS, PhaseCategory } from "@/lib/commercialTypes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

export function PhasesSettings() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const { projectTypes, isLoading: projectTypesLoading } = useProjectTypeSettings();
  const { discipline, disciplineSlug } = useDiscipline();
  const [activeProjectType, setActiveProjectType] = useState<string>("");
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, reorderTemplates, resetToDefaults, initializeDefaultsIfEmpty } = usePhaseTemplates(activeProjectType);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<PhaseTemplate | null>(null);
  const [formData, setFormData] = useState<PhaseFormData>(defaultFormData);
  const [deliverablesText, setDeliverablesText] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetConfirmType, setResetConfirmType] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showAIPromptDialog, setShowAIPromptDialog] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [generatedPhases, setGeneratedPhases] = useState<{ basePhases: any[], complementaryPhases: any[] } | null>(null);

  // Open AI prompt dialog
  const handleOpenAIPromptDialog = () => {
    setAiCustomPrompt('');
    setShowAIPromptDialog(true);
  };

  // AI generation handler
  const handleGenerateWithAI = async () => {
    const projectTypeLabel = projectTypes.find(t => t.key === activeProjectType)?.label || activeProjectType;
    
    setIsGeneratingAI(true);
    setShowAIPromptDialog(false);
    try {
      const { data, error } = await supabase.functions.invoke('generate-phase-templates', {
        body: { 
          projectType: activeProjectType, 
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
      // Get current max sort_order for this project type
      const existingTemplates = templates.filter(t => t.project_type === activeProjectType);
      const maxSortOrder = existingTemplates.length > 0 
        ? Math.max(...existingTemplates.map(t => t.sort_order)) + 1 
        : 0;
      
      // Prepare all phases for batch insert
      const allPhases = [
        ...generatedPhases.basePhases.map((phase, index) => ({
          workspace_id: activeWorkspace.id,
          project_type: activeProjectType,
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
          project_type: activeProjectType,
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
      
      // Direct batch insert via supabase for efficiency
      const { error } = await supabase
        .from("phase_templates")
        .insert(allPhases);
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(error.message);
      }
      
      // Refresh the query cache
      queryClient.invalidateQueries({ queryKey: ["phase-templates"] });
      
      toast.success(`${allPhases.length} phases créées avec succès`);
      setShowAIDialog(false);
      setGeneratedPhases(null);
    } catch (error) {
      console.error('Error creating phases:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création des phases');
    }
  };

  // Set first project type as active when loaded
  useEffect(() => {
    if (projectTypes.length > 0 && !activeProjectType) {
      setActiveProjectType(projectTypes[0].key);
    }
  }, [projectTypes, activeProjectType]);

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const base = templates.filter(t => t.category === 'base');
    const complementary = templates.filter(t => t.category === 'complementary');
    return { base, complementary };
  }, [templates]);

  // Calculate totals
  const totals = useMemo(() => {
    const baseTotal = groupedTemplates.base.reduce((sum, t) => sum + t.default_percentage, 0);
    const complementaryTotal = groupedTemplates.complementary.reduce((sum, t) => sum + t.default_percentage, 0);
    return { base: baseTotal, complementary: complementaryTotal, total: baseTotal + complementaryTotal };
  }, [groupedTemplates]);

  // Initialize defaults when switching project type
  useEffect(() => {
    if (activeProjectType) {
      initializeDefaultsIfEmpty.mutate(activeProjectType);
    }
  }, [activeProjectType]);

  const handleOpenCreate = (category: PhaseCategory = 'base') => {
    setEditingPhase(null);
    setFormData({
      ...defaultFormData,
      code: `PHASE_${templates.length + 1}`,
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
      await createTemplate.mutateAsync({
        project_type: activeProjectType,
        ...formData,
        deliverables,
        sort_order: templates.length,
      } as CreatePhaseTemplateInput);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate.mutateAsync(id);
    setDeleteConfirmId(null);
  };

  const handleReset = async (projectType: string) => {
    await resetToDefaults.mutateAsync(projectType);
    setResetConfirmType(null);
  };

  const handleNormalizePercentages = async () => {
    if (groupedTemplates.base.length === 0 || totals.base === 100) return;
    
    const ratio = 100 / totals.base;
    const updates = groupedTemplates.base.map((phase, index, arr) => {
      if (index === arr.length - 1) {
        // Last phase gets the remainder to ensure exactly 100%
        const previousSum = arr.slice(0, -1).reduce((sum, p) => {
          return sum + Math.round(p.default_percentage * ratio);
        }, 0);
        return {
          id: phase.id,
          default_percentage: 100 - previousSum,
        };
      }
      return {
        id: phase.id,
        default_percentage: Math.round(phase.default_percentage * ratio),
      };
    });

    // Update each phase sequentially
    for (const update of updates) {
      await updateTemplate.mutateAsync(update);
    }
  };

  const movePhase = async (phaseId: string, direction: "up" | "down", categoryTemplates: PhaseTemplate[]) => {
    const index = categoryTemplates.findIndex(t => t.id === phaseId);
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categoryTemplates.length) return;

    const reorderedTemplates = [...categoryTemplates];
    const [movedItem] = reorderedTemplates.splice(index, 1);
    reorderedTemplates.splice(newIndex, 0, movedItem);

    await reorderTemplates.mutateAsync(
      reorderedTemplates.map((t, i) => ({ id: t.id, sort_order: i }))
    );
  };

  const renderPhaseCard = (phase: PhaseTemplate, index: number, categoryTemplates: PhaseTemplate[]) => (
    <Card
      key={phase.id}
      className={!phase.is_active ? "opacity-50" : ""}
    >
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              disabled={index === 0}
              onClick={() => movePhase(phase.id, "up", categoryTemplates)}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              disabled={index === categoryTemplates.length - 1}
              onClick={() => movePhase(phase.id, "down", categoryTemplates)}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {phase.code}
              </Badge>
              <CardTitle className="text-sm font-medium truncate">
                {phase.name}
              </CardTitle>
              {phase.default_percentage > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {phase.default_percentage}%
                </Badge>
              )}
              {!phase.is_active && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Inactive
                </Badge>
              )}
            </div>
            {phase.description && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {phase.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                setExpandedPhase(
                  expandedPhase === phase.id ? null : phase.id
                )
              }
            >
              {expandedPhase === phase.id ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleOpenEdit(phase)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setDeleteConfirmId(phase.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expandedPhase === phase.id && (
        <CardContent className="pt-0 pb-3 px-4">
          <div className="pl-10">
            {phase.deliverables.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Livrables par défaut :
                </p>
                <ul className="text-sm space-y-0.5">
                  {phase.deliverables.map((d, i) => (
                    <li key={i} className="text-muted-foreground">
                      • {d}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Aucun livrable défini
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Phases de mission</h3>
        <p className="text-sm text-muted-foreground">
          Gérez les phases par défaut utilisées dans les devis, projets, concours, et factures. Ces phases sont centralisées ici pour assurer la cohérence à travers l'application.
        </p>
      </div>

      {projectTypesLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : projectTypes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">Aucun type de projet configuré</p>
            <p className="text-sm text-muted-foreground">
              Configurez d'abord vos types de projets dans les paramètres Projets.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeProjectType} onValueChange={setActiveProjectType}>
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max">
              {projectTypes.map((type) => (
                <TabsTrigger key={type.key} value={type.key} className="gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: type.color || '#6366f1' }}
                  />
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {projectTypes.map((type) => (
            <TabsContent key={type.key} value={type.key} className="space-y-6 mt-6">
              {/* Summary Card */}
              <Card className={totals.base !== 100 && groupedTemplates.base.length > 0 ? "border-orange-500" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-semibold">{groupedTemplates.base.length}</p>
                        <p className="text-xs text-muted-foreground">Missions de base</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-semibold">{groupedTemplates.complementary.length}</p>
                        <p className="text-xs text-muted-foreground">Complémentaires</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-2xl font-semibold ${totals.base === 100 ? "text-green-600" : "text-orange-500"}`}>
                          {totals.base}%
                        </p>
                        <p className="text-xs text-muted-foreground">Total base</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenAIPromptDialog}
                        disabled={isGeneratingAI}
                      >
                        {isGeneratingAI ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        Ajouter avec IA
                      </Button>
                      {totals.base !== 100 && groupedTemplates.base.length > 0 && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleNormalizePercentages()}
                        >
                          Ajuster à 100%
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResetConfirmType(type.key)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Réinitialiser
                      </Button>
                    </div>
                  </div>
                  {totals.base !== 100 && groupedTemplates.base.length > 0 && (
                    <p className="text-sm text-orange-500 mt-2">
                      ⚠️ Le total des missions de base doit être égal à 100% (actuellement {totals.base}%)
                    </p>
                  )}
                </CardContent>
              </Card>

            {/* Missions de base */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Missions de base</h4>
                  <Badge variant="secondary" className="text-xs">
                    {groupedTemplates.base.length} phases • {totals.base}%
                  </Badge>
                </div>
                <Button onClick={() => handleOpenCreate('base')} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
              
              <div className="space-y-2">
                {groupedTemplates.base.length === 0 ? (
                  <Card>
                    <CardContent className="py-6 text-center text-muted-foreground">
                      Aucune phase de base définie
                    </CardContent>
                  </Card>
                ) : (
                  groupedTemplates.base.map((phase, index) => 
                    renderPhaseCard(phase, index, groupedTemplates.base)
                  )
                )}
              </div>
            </div>

            {/* Missions complémentaires */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Puzzle className="h-5 w-5 text-orange-500" />
                  <h4 className="font-medium">Missions complémentaires</h4>
                  <Badge variant="secondary" className="text-xs">
                    {groupedTemplates.complementary.length} phases • {totals.complementary}%
                  </Badge>
                </div>
                <Button onClick={() => handleOpenCreate('complementary')} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
              
              <div className="space-y-2">
                {groupedTemplates.complementary.length === 0 ? (
                  <Card>
                    <CardContent className="py-6 text-center text-muted-foreground">
                      Aucune mission complémentaire définie
                    </CardContent>
                  </Card>
                ) : (
                  groupedTemplates.complementary.map((phase, index) => 
                    renderPhaseCard(phase, index, groupedTemplates.complementary)
                  )
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPhase ? "Modifier la phase" : "Nouvelle phase"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="ESQ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentage">Pourcentage par défaut</Label>
                <Input
                  id="percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.default_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      default_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Esquisse"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value: PhaseCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      {PHASE_CATEGORY_LABELS.base}
                    </div>
                  </SelectItem>
                  <SelectItem value="complementary">
                    <div className="flex items-center gap-2">
                      <Puzzle className="h-4 w-4" />
                      {PHASE_CATEGORY_LABELS.complementary}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description de la phase..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverables">Livrables (un par ligne)</Label>
              <Textarea
                id="deliverables"
                value={deliverablesText}
                onChange={(e) => setDeliverablesText(e.target.value)}
                placeholder="Plans d'esquisse&#10;Maquette 3D&#10;Estimation budgétaire"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Phase active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.code || !formData.name || createTemplate.isPending || updateTemplate.isPending}
            >
              {editingPhase ? "Enregistrer" : "Créer"}
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
              Cette action est irréversible. La phase sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation */}
      <AlertDialog open={!!resetConfirmType} onOpenChange={() => setResetConfirmType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser les phases ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les phases personnalisées pour ce type de projet seront remplacées par les valeurs par défaut. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetConfirmType && handleReset(resetConfirmType)}
            >
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Generated Phases Preview Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Phases générées par l'IA
            </DialogTitle>
            <DialogDescription>
              Vérifiez les phases proposées avant de les appliquer. Vous pourrez les modifier ensuite.
            </DialogDescription>
          </DialogHeader>
          
          {generatedPhases && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Base phases */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">Phases de base ({generatedPhases.basePhases.length})</h4>
                    <Badge variant="secondary" className="ml-auto">
                      {generatedPhases.basePhases.reduce((sum, p) => sum + p.default_percentage, 0)}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {generatedPhases.basePhases.map((phase, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="font-mono text-xs shrink-0">
                            {phase.code}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{phase.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {phase.default_percentage}%
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{phase.description}</p>
                            {phase.deliverables?.length > 0 && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                <span className="font-medium">Livrables:</span> {phase.deliverables.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Complementary phases */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Puzzle className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Phases complémentaires ({generatedPhases.complementaryPhases.length})</h4>
                  </div>
                  <div className="space-y-2">
                    {generatedPhases.complementaryPhases.map((phase, index) => (
                      <Card key={index} className="p-3 border-dashed">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="font-mono text-xs shrink-0">
                            {phase.code}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{phase.name}</span>
                              {phase.default_percentage > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {phase.default_percentage}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{phase.description}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={applyGeneratedPhases}
              disabled={createTemplate.isPending}
            >
              {createTemplate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Appliquer ces phases
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Prompt Dialog */}
      <Dialog open={showAIPromptDialog} onOpenChange={setShowAIPromptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Générer des phases avec l'IA
            </DialogTitle>
            <DialogDescription>
              Décrivez le type de mission ou laissez vide pour des phases standards.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type de mission (optionnel)</Label>
              <Input
                value={aiCustomPrompt}
                onChange={(e) => setAiCustomPrompt(e.target.value)}
                placeholder="Ex: Charte graphique, Identité visuelle, Rénovation complète..."
                disabled={isGeneratingAI}
              />
              <p className="text-xs text-muted-foreground">
                L'IA générera des phases adaptées à ce type de mission pour votre discipline ({discipline?.name || disciplineSlug}).
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIPromptDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleGenerateWithAI}
              disabled={isGeneratingAI}
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
