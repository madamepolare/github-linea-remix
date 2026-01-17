import { useState, useMemo } from "react";
import { useWorkspaceSettings, WorkspaceSetting } from "@/hooks/useWorkspaceSettings";
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
  Briefcase, 
  Building, 
  RefreshCw, 
  Wrench, 
  Pencil, 
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Trophy,
  Folder,
  Star,
  Layers,
  FileText,
  Calendar,
  Wallet,
  Receipt,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

// Icon options for categories
const ICON_OPTIONS = [
  { name: "Briefcase", icon: Briefcase },
  { name: "Building", icon: Building },
  { name: "RefreshCw", icon: RefreshCw },
  { name: "Wrench", icon: Wrench },
  { name: "Trophy", icon: Trophy },
  { name: "Folder", icon: Folder },
  { name: "Star", icon: Star },
  { name: "Layers", icon: Layers },
  { name: "FileText", icon: FileText },
];

const CATEGORY_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", 
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
  "#6B7280"
];

// Feature definitions
const FEATURE_OPTIONS = [
  { key: "isBillable", label: "Facturable", description: "Les projets peuvent être facturés au client", icon: Receipt },
  { key: "hasBudget", label: "Budget global", description: "Définir un budget total pour le projet", icon: Wallet },
  { key: "hasEndDate", label: "Date de fin", description: "Planifier une date de fin de projet", icon: Calendar },
  { key: "hasPhases", label: "Phases", description: "Découper le projet en phases", icon: Layers },
  { key: "hasDeliverables", label: "Livrables", description: "Gérer des livrables pour le projet", icon: FileText },
  { key: "hasMonthlyBudget", label: "Budget mensuel", description: "Budget récurrent mensuel", icon: RefreshCw },
  { key: "hasAutoRenew", label: "Renouvellement auto", description: "Reconduction automatique", icon: RefreshCw },
];

interface CategoryFormData {
  key: string;
  label: string;
  labelShort: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  features: {
    isBillable: boolean;
    hasBudget: boolean;
    hasEndDate: boolean;
    hasPhases: boolean;
    hasDeliverables: boolean;
    hasMonthlyBudget: boolean;
    hasAutoRenew: boolean;
  };
}

const defaultFormData: CategoryFormData = {
  key: "",
  label: "",
  labelShort: "",
  description: "",
  icon: "Briefcase",
  color: "#3B82F6",
  isActive: true,
  features: {
    isBillable: true,
    hasBudget: true,
    hasEndDate: true,
    hasPhases: true,
    hasDeliverables: true,
    hasMonthlyBudget: false,
    hasAutoRenew: false,
  },
};

// Default categories to initialize
const DEFAULT_CATEGORIES: Omit<CategoryFormData, "isActive">[] = [
  {
    key: "standard",
    label: "Projet client",
    labelShort: "Client",
    description: "Projet facturable avec budget et planning définis",
    icon: "Briefcase",
    color: "#3B82F6",
    features: { isBillable: true, hasBudget: true, hasEndDate: true, hasPhases: true, hasDeliverables: true, hasMonthlyBudget: false, hasAutoRenew: false },
  },
  {
    key: "internal",
    label: "Projet interne",
    labelShort: "Interne",
    description: "Projet non facturable (R&D, admin, interne)",
    icon: "Building",
    color: "#6B7280",
    features: { isBillable: false, hasBudget: false, hasEndDate: false, hasPhases: false, hasDeliverables: false, hasMonthlyBudget: false, hasAutoRenew: false },
  },
];

export function ProjectCategoriesSettings() {
  const { settings, isLoading, createSetting, updateSetting, deleteSetting, reorderSettings } = useWorkspaceSettings("project_categories");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WorkspaceSetting | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);

  // Get icon component from name
  const getIconComponent = (iconName: string) => {
    const found = ICON_OPTIONS.find(i => i.name === iconName);
    return found?.icon || Briefcase;
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      ...defaultFormData,
      color: CATEGORY_COLORS[settings.length % CATEGORY_COLORS.length],
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: WorkspaceSetting) => {
    setEditingCategory(item);
    const value = item.setting_value;
    setFormData({
      key: item.setting_key,
      label: value.label || "",
      labelShort: (value.labelShort as string) || "",
      description: value.description || "",
      icon: (value.icon as string) || "Briefcase",
      color: value.color || "#3B82F6",
      isActive: item.is_active,
      features: {
        isBillable: (value.features as any)?.isBillable ?? true,
        hasBudget: (value.features as any)?.hasBudget ?? true,
        hasEndDate: (value.features as any)?.hasEndDate ?? true,
        hasPhases: (value.features as any)?.hasPhases ?? true,
        hasDeliverables: (value.features as any)?.hasDeliverables ?? true,
        hasMonthlyBudget: (value.features as any)?.hasMonthlyBudget ?? false,
        hasAutoRenew: (value.features as any)?.hasAutoRenew ?? false,
      },
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const settingValue = {
      label: formData.label,
      labelShort: formData.labelShort,
      description: formData.description,
      icon: formData.icon,
      color: formData.color,
      features: formData.features,
    };

    if (editingCategory) {
      await updateSetting.mutateAsync({
        id: editingCategory.id,
        setting_key: formData.key,
        setting_value: settingValue,
        is_active: formData.isActive,
      });
    } else {
      await createSetting.mutateAsync({
        setting_type: "project_categories",
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
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const cat = DEFAULT_CATEGORIES[i];
      const exists = settings.some(s => s.setting_key === cat.key);
      if (!exists) {
        await createSetting.mutateAsync({
          setting_type: "project_categories",
          setting_key: cat.key,
          setting_value: {
            label: cat.label,
            labelShort: cat.labelShort,
            description: cat.description,
            icon: cat.icon,
            color: cat.color,
            features: cat.features,
          },
          sort_order: i,
          is_active: true,
        });
      }
    }
  };

  const toggleFeature = (featureKey: keyof typeof formData.features) => {
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [featureKey]: !formData.features[featureKey],
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
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
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Catégories de projet</CardTitle>
                <CardDescription className="text-xs">
                  Définissez les modèles économiques de vos projets (facturable, interne, concours...)
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {settings.length === 0 && (
                <Button variant="outline" size="sm" onClick={initializeDefaults}>
                  Charger par défaut
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
              Aucune catégorie configurée
            </div>
          ) : (
            <div className="space-y-2">
              {settings.map((item, index) => {
                const IconComponent = getIconComponent(item.setting_value.icon as string);
                const features = (item.setting_value.features || {}) as any;
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
                      !item.is_active && "opacity-50"
                    )}
                  >
                    {/* Move controls */}
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

                    {/* Icon */}
                    <div 
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.setting_value.color}20` }}
                    >
                      <IconComponent 
                        className="h-5 w-5" 
                        style={{ color: item.setting_value.color }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{item.setting_value.label}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {item.setting_key}
                        </Badge>
                        {!item.is_active && (
                          <Badge variant="secondary" className="text-xs">Inactif</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.setting_value.description}
                      </p>
                      
                      {/* Features badges */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {features.isBillable && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Facturable</Badge>
                        )}
                        {features.hasBudget && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Budget</Badge>
                        )}
                        {features.hasPhases && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Phases</Badge>
                        )}
                        {features.hasMonthlyBudget && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Mensuel</Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirmId(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Modifier" : "Ajouter"} une catégorie
            </DialogTitle>
            <DialogDescription>
              Définissez le comportement de cette catégorie de projet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Libellé complet *</Label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Ex: Concours"
                />
              </div>
              <div className="space-y-2">
                <Label>Libellé court *</Label>
                <Input
                  value={formData.labelShort}
                  onChange={(e) => setFormData({ ...formData, labelShort: e.target.value })}
                  placeholder="Ex: Concours"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Clé (identifiant)</Label>
              <Input
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                placeholder="Généré automatiquement"
                disabled={!!editingCategory}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la catégorie"
              />
            </div>

            {/* Icon selection */}
            <div className="space-y-2">
              <Label>Icône</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((opt) => {
                  const IconComp = opt.icon;
                  const isSelected = formData.icon === opt.name;
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      className={cn(
                        "h-10 w-10 rounded-lg border flex items-center justify-center transition-all",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setFormData({ ...formData, icon: opt.name })}
                    >
                      <IconComp className="h-5 w-5" style={{ color: isSelected ? formData.color : undefined }} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color selection */}
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full transition-all flex items-center justify-center",
                      formData.color === color && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  >
                    {formData.color === color && <Check className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label>Caractéristiques</Label>
              <div className="grid grid-cols-1 gap-2 p-3 rounded-lg border bg-muted/30">
                {FEATURE_OPTIONS.map((feature) => {
                  const FeatureIcon = feature.icon;
                  const isChecked = formData.features[feature.key as keyof typeof formData.features];
                  return (
                    <label
                      key={feature.key}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                        isChecked ? "bg-primary/10" : "hover:bg-muted"
                      )}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleFeature(feature.key as keyof typeof formData.features)}
                      />
                      <FeatureIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{feature.label}</span>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Active toggle */}
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
            <Button onClick={handleSave} disabled={!formData.label || !formData.labelShort}>
              {editingCategory ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les projets existants dans cette catégorie ne seront pas supprimés.
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
