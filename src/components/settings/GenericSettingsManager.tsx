import { useState } from "react";
import { useWorkspaceSettings, SettingType, WorkspaceSetting, CreateSettingInput } from "@/hooks/useWorkspaceSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Pencil, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectCategory } from "@/lib/projectCategories";
import { useProjectCategorySettings } from "@/hooks/useProjectCategorySettings";

interface CategoryOption {
  key: string;
  label: string;
}

interface GenericSettingsManagerProps {
  settingType: SettingType;
  title: string;
  description: string;
  icon: React.ReactNode;
  showColor?: boolean;
  showDescription?: boolean;
  showProbability?: boolean;
  showCategories?: boolean;
  colorOptions?: string[];
  categoryOptions?: CategoryOption[];
  defaultItems?: Array<{ key: string; label: string; color?: string; description?: string; categories?: string[] }>;
}

const DEFAULT_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", 
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
];

export function GenericSettingsManager({
  settingType,
  title,
  description,
  icon,
  showColor = true,
  showDescription = false,
  showProbability = false,
  showCategories = false,
  colorOptions = DEFAULT_COLORS,
  categoryOptions = PROJECT_CATEGORIES.map(c => ({ key: c.key, label: c.labelShort })),
  defaultItems = [],
}: GenericSettingsManagerProps) {
  const { settings, isLoading, createSetting, updateSetting, deleteSetting, reorderSettings } = useWorkspaceSettings(settingType);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkspaceSetting | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    key: "",
    label: "",
    color: colorOptions[0],
    description: "",
    probability: 0,
    categories: [] as string[],
    isActive: true,
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      key: "",
      label: "",
      color: colorOptions[0],
      description: "",
      probability: 0,
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
      color: item.setting_value.color || colorOptions[0],
      description: item.setting_value.description || "",
      probability: item.setting_value.probability || 0,
      categories: (item.setting_value.categories as string[]) || [],
      isActive: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const settingValue: WorkspaceSetting["setting_value"] = {
      label: formData.label,
    };
    
    if (showColor) settingValue.color = formData.color;
    if (showDescription) settingValue.description = formData.description;
    if (showProbability) settingValue.probability = formData.probability;
    if (showCategories && formData.categories.length > 0) {
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
        setting_type: settingType,
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
          setting_type: settingType,
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
              {icon}
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
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
              Aucun élément configuré
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

                  {showColor && item.setting_value.color && (
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
                      {/* Display category badges */}
                      {showCategories && (item.setting_value as any).categories && (
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
                    {showDescription && item.setting_value.description && (
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Modifier" : "Ajouter"} {title.toLowerCase()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Libellé</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Nom affiché"
              />
            </div>

            <div className="space-y-2">
              <Label>Clé (identifiant unique)</Label>
              <Input
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                placeholder="Généré automatiquement"
              />
            </div>

            {showDescription && (
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description optionnelle"
                />
              </div>
            )}

            {showColor && (
              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
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
            )}

            {showProbability && (
              <div className="space-y-2">
                <Label>Probabilité (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}

            {showCategories && (
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
            )}

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
              Cette action est irréversible. Voulez-vous vraiment supprimer cet élément ?
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
