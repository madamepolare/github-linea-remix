import { useState, useMemo } from "react";
import { useWorkspaceSettings, WorkspaceSetting } from "@/hooks/useWorkspaceSettings";
import { usePhaseTemplates } from "@/hooks/usePhaseTemplates";
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
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, FolderKanban, Layers, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectCategorySettings } from "@/hooks/useProjectCategorySettings";
import { PhaseTemplatesEditor } from "./PhaseTemplatesEditor";

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
  const { templates: allPhaseTemplates } = usePhaseTemplates();
  
  // View mode: "list" shows all types, "phases" shows phases for a selected type
  const [viewMode, setViewMode] = useState<"list" | "phases">("list");
  const [selectedType, setSelectedType] = useState<WorkspaceSetting | null>(null);
  
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

  // Get phase count for a type
  const getPhaseCount = (typeKey: string) => {
    return allPhaseTemplates.filter(p => p.project_type === typeKey).length;
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      key: "",
      label: "",
      color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
      description: "",
      categories: [],
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: WorkspaceSetting) => {
    setEditingItem(item);
    setFormData({
      key: item.setting_key,
      label: item.setting_value.label || "",
      color: item.setting_value.color || DEFAULT_COLORS[0],
      description: item.setting_value.description || "",
      categories: (item.setting_value.categories as string[]) || [],
      isActive: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleOpenPhases = (item: WorkspaceSetting) => {
    setSelectedType(item);
    setViewMode("phases");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedType(null);
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

  // Phases view for selected type
  if (viewMode === "phases" && selectedType) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: selectedType.setting_value.color }}
            />
            <span className="font-medium">{selectedType.setting_value.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Phases</span>
          </div>
        </div>
        
        <PhaseTemplatesEditor
          projectTypeKey={selectedType.setting_key}
          projectTypeLabel={selectedType.setting_value.label || selectedType.setting_key}
        />
      </div>
    );
  }

  // List view
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
                  Catégories de projets pour {disciplineName || 'votre discipline'}. Cliquez sur un type pour gérer ses phases.
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
              {settings.map((item, index) => {
                const phaseCount = getPhaseCount(item.setting_key);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors cursor-pointer",
                      !item.is_active && "opacity-50"
                    )}
                    onClick={() => handleOpenPhases(item)}
                  >
                    <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
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
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Layers className="h-3 w-3" />
                          {phaseCount} phase{phaseCount > 1 ? "s" : ""}
                        </Badge>
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

                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Modifier" : "Ajouter"} un type de projet
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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
          </div>

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
