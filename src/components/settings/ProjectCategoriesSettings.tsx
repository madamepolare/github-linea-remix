import { useState } from "react";
import { useProjectCategorySettings, WorkspaceProjectCategory } from "@/hooks/useProjectCategorySettings";
import { ProjectCategory, PROJECT_CATEGORIES } from "@/lib/projectCategories";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Briefcase, 
  Building, 
  RefreshCw, 
  Wrench, 
  Pencil, 
  RotateCcw,
  Info,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase,
  Building,
  RefreshCw,
  Wrench,
};

const CATEGORY_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", 
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
  "#6B7280"
];

interface EditFormData {
  label: string;
  labelShort: string;
  description: string;
  color: string;
}

export function ProjectCategoriesSettings() {
  const { 
    categories, 
    isLoading, 
    updateCategory, 
    resetCategory,
    initializeDefaults 
  } = useProjectCategorySettings();

  const [editingCategory, setEditingCategory] = useState<WorkspaceProjectCategory | null>(null);
  const [formData, setFormData] = useState<EditFormData>({
    label: "",
    labelShort: "",
    description: "",
    color: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = (category: WorkspaceProjectCategory) => {
    setEditingCategory(category);
    setFormData({
      label: category.label,
      labelShort: category.labelShort,
      description: category.description,
      color: category.color,
    });
  };

  const handleSave = async () => {
    if (!editingCategory) return;
    
    setIsSaving(true);
    try {
      await updateCategory(editingCategory.key, {
        label: formData.label,
        labelShort: formData.labelShort,
        description: formData.description,
        color: formData.color,
      });
      setEditingCategory(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (key: ProjectCategory, isEnabled: boolean) => {
    await updateCategory(key, { isEnabled });
  };

  const handleReset = async (key: ProjectCategory) => {
    await resetCategory(key);
  };

  const getDefaultConfig = (key: ProjectCategory) => {
    return PROJECT_CATEGORIES.find(c => c.key === key);
  };

  const isModified = (category: WorkspaceProjectCategory) => {
    const defaultConfig = getDefaultConfig(category.key);
    if (!defaultConfig) return false;
    
    return (
      category.label !== defaultConfig.label ||
      category.labelShort !== defaultConfig.labelShort ||
      category.description !== defaultConfig.description ||
      category.color !== defaultConfig.color
    );
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
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Catégories de projet
              </CardTitle>
              <CardDescription className="text-xs">
                Activez/désactivez les catégories disponibles et personnalisez leurs labels
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Info banner */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <p className="text-muted-foreground">
              Les catégories définissent le modèle économique des projets. 
              Vous pouvez désactiver celles qui ne s'appliquent pas à votre activité et personnaliser les labels.
            </p>
          </div>

          {/* Categories list */}
          <div className="space-y-2">
            {categories.map((category) => {
              const IconComponent = ICON_MAP[category.icon] || Briefcase;
              const modified = isModified(category);
              
              return (
                <div
                  key={category.key}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all",
                    !category.isEnabled && "opacity-50 bg-muted/30"
                  )}
                >
                  {/* Icon and color indicator */}
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <IconComponent 
                      className="h-5 w-5" 
                      style={{ color: category.color }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{category.label}</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {category.key}
                      </Badge>
                      {modified && (
                        <Badge variant="secondary" className="text-xs">
                          Personnalisé
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {category.description}
                    </p>
                    
                    {/* Features badges */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {category.features.isBillable && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Facturable
                        </Badge>
                      )}
                      {category.features.hasBudget && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Budget
                        </Badge>
                      )}
                      {category.features.hasMonthlyBudget && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Budget mensuel
                        </Badge>
                      )}
                      {category.features.hasPhases && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Phases
                        </Badge>
                      )}
                      {category.features.hasAutoRenew && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Auto-renouv.
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {modified && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleReset(category.key)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Réinitialiser par défaut</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    
                    <Switch
                      checked={category.isEnabled}
                      onCheckedChange={(checked) => handleToggle(category.key, checked)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personnaliser la catégorie</DialogTitle>
            <DialogDescription>
              Modifiez les labels affichés. Les fonctionnalités (budget, phases, etc.) restent fixes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Libellé complet</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Ex: Projet client"
              />
            </div>

            <div className="space-y-2">
              <Label>Libellé court</Label>
              <Input
                value={formData.labelShort}
                onChange={(e) => setFormData({ ...formData, labelShort: e.target.value })}
                placeholder="Ex: Client"
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
                    {formData.color === color && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {editingCategory && (
              <div className="p-3 rounded-lg border bg-muted/30">
                <Label className="text-xs text-muted-foreground mb-2 block">Aperçu</Label>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${formData.color}20` }}
                  >
                    {(() => {
                      const IconComponent = ICON_MAP[editingCategory.icon] || Briefcase;
                      return <IconComponent className="h-4 w-4" style={{ color: formData.color }} />;
                    })()}
                  </div>
                  <div>
                    <span className="font-medium text-sm">{formData.label || "Label"}</span>
                    <span className="text-xs text-muted-foreground ml-2">({formData.labelShort || "Court"})</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!formData.label || isSaving}>
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
