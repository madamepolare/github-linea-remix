import { useState, useMemo } from "react";
import { useWorkspaceSettings, WorkspaceSetting } from "@/hooks/useWorkspaceSettings";
import { usePhaseTemplates, PhaseTemplate } from "@/hooks/usePhaseTemplates";
import { useProjectTypeSettings } from "@/hooks/useProjectTypeSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Layers, FolderKanban, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROJECT_CATEGORIES } from "@/lib/projectCategories";

interface ProjectTypesSettingsProps {
  defaultItems?: Array<{ key: string; label: string; color?: string; description?: string; categories?: string[] }>;
  disciplineName?: string;
}

const DEFAULT_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", 
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
];

const categoryOptions = PROJECT_CATEGORIES.map(c => ({ key: c.key, label: c.labelShort }));

export function ProjectTypesSettings({ defaultItems = [], disciplineName }: ProjectTypesSettingsProps) {
  const { settings, isLoading, createSetting, updateSetting, deleteSetting, reorderSettings } = useWorkspaceSettings("project_types");
  
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkspaceSetting | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    key: "",
    label: "",
    color: DEFAULT_COLORS[0],
    description: "",
    categories: [] as string[],
    isActive: true,
  });

  // Phase templates for selected type
  const { templates: allPhaseTemplates } = usePhaseTemplates();
  
  const phasesForSelectedType = useMemo(() => {
    if (!selectedType) return [];
    return allPhaseTemplates
      .filter(t => t.project_type === selectedType)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [allPhaseTemplates, selectedType]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      key: "",
      label: "",
      color: DEFAULT_COLORS[0],
      description: "",
      categories: [],
      isActive: true,
    });
    setActiveTab("general");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: WorkspaceSetting) => {
    setEditingItem(item);
    setSelectedType(item.setting_key);
    setFormData({
      key: item.setting_key,
      label: item.setting_value.label || "",
      color: item.setting_value.color || DEFAULT_COLORS[0],
      description: item.setting_value.description || "",
      categories: (item.setting_value.categories as string[]) || [],
      isActive: item.is_active,
    });
    setActiveTab("general");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const settingValue: WorkspaceSetting["setting_value"] = {
      label: formData.label,
      color: formData.color,
      description: formData.description,
    };
    
    if (formData.categories.length > 0) {
      (settingValue as any).categories = formData.categories;
    }

    if (editingItem) {
      await updateSetting.mutateAsync({
        id: editingItem.id,
        setting_key: formData.key || formData.label.toLowerCase().replace(/\s+/g, "_"),
        setting_value: settingValue,
        is_active: formData.isActive,
      });
    } else {
      await createSetting.mutateAsync({
        setting_type: "project_types",
        setting_key: formData.key || formData.label.toLowerCase().replace(/\s+/g, "_"),
        setting_value: settingValue,
        sort_order: settings.length,
        is_active: formData.isActive,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteSetting.mutateAsync(id);
    setDeleteConfirmId(null);
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= settings.length) return;

    const reordered = [...settings];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    await reorderSettings.mutateAsync(
      reordered.map((s, i) => ({ id: s.id, sort_order: i }))
    );
  };

  const initializeDefaults = async () => {
    for (let i = 0; i < defaultItems.length; i++) {
      const item = defaultItems[i];
      const exists = settings.some(s => s.setting_key === item.key);
      if (!exists) {
        await createSetting.mutateAsync({
          setting_type: "project_types",
          setting_key: item.key,
          setting_value: {
            label: item.label,
            color: item.color,
            description: item.description,
          },
          sort_order: i,
        });
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
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
              <FolderKanban className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Types de projet</CardTitle>
                <CardDescription className="text-xs">
                  Catégories de projets pour {disciplineName || 'votre discipline'}. Associez chaque type aux catégories et phases.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {settings.length === 0 && defaultItems.length > 0 && (
                <Button variant="outline" size="sm" onClick={initializeDefaults}>
                  Charger les valeurs par défaut
                </Button>
              )}
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Aucun type de projet configuré
            </div>
          ) : (
            <div className="space-y-1">
              {settings.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors",
                    !item.is_active && "opacity-50"
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      disabled={index === settings.length - 1}
                      onClick={() => handleMove(index, "down")}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {item.setting_value.color && (
                    <div
                      className="h-4 w-4 rounded-full shrink-0"
                      style={{ backgroundColor: item.setting_value.color }}
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {item.setting_value.label}
                      </span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {item.setting_key}
                      </Badge>
                      {!item.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Inactif
                        </Badge>
                      )}
                      {/* Phase count badge */}
                      {(() => {
                        const phaseCount = allPhaseTemplates.filter(
                          p => p.project_type === item.setting_key
                        ).length;
                        return phaseCount > 0 ? (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <ListTodo className="h-3 w-3" />
                            {phaseCount} phases
                          </Badge>
                        ) : null;
                      })()}
                      {/* Category badges */}
                      {(item.setting_value as any).categories && (
                        <div className="flex gap-1">
                          {((item.setting_value as any).categories as string[]).map(catKey => {
                            const cat = categoryOptions.find(c => c.key === catKey);
                            return cat ? (
                              <Badge key={catKey} variant="secondary" className="text-2xs">
                                {cat.label}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    {item.setting_value.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.setting_value.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleOpenEdit(item)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirmId(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog with Tabs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Modifier" : "Ajouter"} un type de projet
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="general" className="flex-1 gap-1.5">
                <FolderKanban className="h-4 w-4" />
                Général
              </TabsTrigger>
              <TabsTrigger value="phases" className="flex-1 gap-1.5" disabled={!editingItem}>
                <ListTodo className="h-4 w-4" />
                Phases ({phasesForSelectedType.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Libellé</Label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Nom du type de projet"
                />
              </div>

              <div className="space-y-2">
                <Label>Clé (identifiant unique)</Label>
                <Input
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  placeholder="Généré automatiquement"
                  disabled={!!editingItem}
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
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "h-8 w-8 rounded-full transition-all",
                        formData.color === color && "ring-2 ring-offset-2 ring-primary"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Catégories de projet</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Sélectionnez les catégories pour lesquelles ce type est disponible
                </p>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((cat) => {
                    const isSelected = formData.categories.includes(cat.key);
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            categories: isSelected
                              ? formData.categories.filter(c => c !== cat.key)
                              : [...formData.categories, cat.key]
                          });
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        {isSelected && <span className="text-xs">✓</span>}
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
                {formData.categories.length === 0 && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Sans catégorie, ce type sera disponible pour toutes les catégories
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label>Actif</Label>
              </div>
            </TabsContent>

            <TabsContent value="phases" className="mt-4">
              {editingItem ? (
                <ProjectTypePhasesEditor 
                  projectType={editingItem.setting_key}
                  phases={phasesForSelectedType}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Enregistrez d'abord le type de projet pour gérer ses phases.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!formData.label}>
              {editingItem ? "Mettre à jour" : "Créer"}
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
              Cette action est irréversible. Les phases associées à ce type ne seront pas supprimées.
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
    </>
  );
}

// Sub-component to edit phases for a project type
interface ProjectTypePhasesEditorProps {
  projectType: string;
  phases: PhaseTemplate[];
}

function ProjectTypePhasesEditor({ projectType, phases }: ProjectTypePhasesEditorProps) {
  const { createTemplate, updateTemplate, deleteTemplate, reorderTemplates, resetToDefaults, initializeDefaultsIfEmpty } = usePhaseTemplates();
  
  const [isPhaseDialogOpen, setIsPhaseDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<PhaseTemplate | null>(null);
  const [deletePhaseId, setDeletePhaseId] = useState<string | null>(null);
  
  const [phaseForm, setPhaseForm] = useState({
    code: "",
    name: "",
    description: "",
    defaultPercentage: 0,
    category: "base" as "base" | "complementary",
    isActive: true,
  });

  const basePhases = phases.filter(p => p.category === "base");
  const complementaryPhases = phases.filter(p => p.category === "complementary");

  const handleOpenCreatePhase = (category: "base" | "complementary") => {
    setEditingPhase(null);
    setPhaseForm({
      code: "",
      name: "",
      description: "",
      defaultPercentage: 0,
      category,
      isActive: true,
    });
    setIsPhaseDialogOpen(true);
  };

  const handleOpenEditPhase = (phase: PhaseTemplate) => {
    setEditingPhase(phase);
    setPhaseForm({
      code: phase.code,
      name: phase.name,
      description: phase.description || "",
      defaultPercentage: phase.default_percentage || 0,
      category: phase.category,
      isActive: phase.is_active,
    });
    setIsPhaseDialogOpen(true);
  };

  const handleSavePhase = async () => {
    if (editingPhase) {
      await updateTemplate.mutateAsync({
        id: editingPhase.id,
        code: phaseForm.code,
        name: phaseForm.name,
        description: phaseForm.description || null,
        default_percentage: phaseForm.defaultPercentage,
        category: phaseForm.category,
        is_active: phaseForm.isActive,
      });
    } else {
      await createTemplate.mutateAsync({
        project_type: projectType,
        code: phaseForm.code,
        name: phaseForm.name,
        description: phaseForm.description,
        default_percentage: phaseForm.defaultPercentage,
        category: phaseForm.category,
        is_active: phaseForm.isActive,
        sort_order: phases.length,
      });
    }
    setIsPhaseDialogOpen(false);
  };

  const handleDeletePhase = async () => {
    if (deletePhaseId) {
      await deleteTemplate.mutateAsync(deletePhaseId);
      setDeletePhaseId(null);
    }
  };

  const handleInitDefaults = async () => {
    await initializeDefaultsIfEmpty.mutateAsync(projectType);
  };

  const renderPhaseList = (phaseList: PhaseTemplate[], category: "base" | "complementary") => (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">
          {category === "base" ? "Phases de base" : "Phases complémentaires"}
        </h4>
        <Button variant="outline" size="sm" onClick={() => handleOpenCreatePhase(category)}>
          <Plus className="h-3 w-3 mr-1" />
          Ajouter
        </Button>
      </div>
      {phaseList.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Aucune phase</p>
      ) : (
        phaseList.map((phase) => (
          <div
            key={phase.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-md border bg-muted/30 hover:bg-muted/50",
              !phase.is_active && "opacity-50"
            )}
          >
            <Badge variant="outline" className="text-xs font-mono shrink-0">
              {phase.code}
            </Badge>
            <span className="text-sm flex-1 truncate">{phase.name}</span>
            {phase.default_percentage > 0 && (
              <Badge variant="secondary" className="text-xs">
                {phase.default_percentage}%
              </Badge>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleOpenEditPhase(phase)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => setDeletePhaseId(phase.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Phases par défaut pour ce type de projet
        </p>
        {phases.length === 0 && (
          <Button variant="outline" size="sm" onClick={handleInitDefaults}>
            Charger les phases par défaut
          </Button>
        )}
      </div>

      {renderPhaseList(basePhases, "base")}
      <div className="border-t pt-4">
        {renderPhaseList(complementaryPhases, "complementary")}
      </div>

      {/* Phase Edit Dialog */}
      <Dialog open={isPhaseDialogOpen} onOpenChange={setIsPhaseDialogOpen}>
        <DialogContent>
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
                  value={phaseForm.code}
                  onChange={(e) => setPhaseForm({ ...phaseForm, code: e.target.value.toUpperCase() })}
                  placeholder="ESQ, APS, APD..."
                />
              </div>
              <div className="space-y-2">
                <Label>Pourcentage par défaut</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={phaseForm.defaultPercentage}
                  onChange={(e) => setPhaseForm({ ...phaseForm, defaultPercentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={phaseForm.name}
                onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })}
                placeholder="Esquisse, Avant-projet sommaire..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={phaseForm.description}
                onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })}
                placeholder="Description optionnelle"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={phaseForm.isActive}
                onCheckedChange={(checked) => setPhaseForm({ ...phaseForm, isActive: checked })}
              />
              <Label>Actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPhaseDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSavePhase} disabled={!phaseForm.code || !phaseForm.name}>
              {editingPhase ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Phase Confirmation */}
      <AlertDialog open={!!deletePhaseId} onOpenChange={() => setDeletePhaseId(null)}>
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
              onClick={handleDeletePhase}
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
