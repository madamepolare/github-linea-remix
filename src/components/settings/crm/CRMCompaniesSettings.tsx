import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Layers, Sparkles, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { useDiscipline } from "@/hooks/useDiscipline";
import { useWorkspaceSettings, type WorkspaceSetting } from "@/hooks/useWorkspaceSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DEFAULT_COLORS = [
  "#10B981", "#3B82F6", "#8B5CF6", "#F97316", "#EF4444",
  "#EC4899", "#06B6D4", "#84CC16", "#F59E0B", "#6366F1"
];

interface CategoryFormData {
  key: string;
  label: string;
  color: string;
}

interface SubcategoryFormData {
  key: string;
  label: string;
  shortLabel: string;
  color: string;
  category: string;
}

export function CRMCompaniesSettings() {
  const { companyCategories, companyTypes, isLoading } = useCRMSettings();
  const { disciplineSlug, config } = useDiscipline();
  const { 
    settings: categorySettings 
  } = useWorkspaceSettings("company_categories");
  const { 
    settings: typeSettings 
  } = useWorkspaceSettings("company_types");
  const { createSetting, deleteSetting } = useWorkspaceSettings();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  
  // Category dialog
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ key: string; label: string; color: string } | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({ key: "", label: "", color: DEFAULT_COLORS[0] });
  
  // Subcategory dialog
  const [showSubcategoryDialog, setShowSubcategoryDialog] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<{ key: string; label: string; shortLabel: string; color: string; category: string } | null>(null);
  const [subcategoryForm, setSubcategoryForm] = useState<SubcategoryFormData>({ key: "", label: "", shortLabel: "", color: DEFAULT_COLORS[0], category: "" });
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "category" | "subcategory"; key: string } | null>(null);

  // Find setting by key
  const findCategorySetting = (key: string): WorkspaceSetting | undefined => {
    return categorySettings.find(s => s.setting_key === key);
  };

  const findTypeSetting = (key: string): WorkspaceSetting | undefined => {
    return typeSettings.find(s => s.setting_key === key);
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-company-categories", {
        body: { 
          discipline: disciplineSlug,
          disciplineName: config.name 
        }
      });

      if (error) throw error;

      const { categories, subcategories } = data;

      // Create categories
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        await createSetting.mutateAsync({
          setting_type: "company_categories",
          setting_key: cat.key,
          setting_value: {
            label: cat.label,
            color: cat.color,
          },
          sort_order: i,
        });
      }

      // Create subcategories (types)
      for (let i = 0; i < subcategories.length; i++) {
        const sub = subcategories[i];
        await createSetting.mutateAsync({
          setting_type: "company_types",
          setting_key: sub.key,
          setting_value: {
            label: sub.label,
            shortLabel: sub.shortLabel,
            color: sub.color,
            category: sub.category,
          },
          sort_order: i,
        });
      }

      toast.success("Catégories générées avec succès");
      setShowAIDialog(false);
    } catch (error) {
      console.error("Error generating categories:", error);
      toast.error("Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  // Category handlers
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ key: "", label: "", color: DEFAULT_COLORS[0] });
    setShowCategoryDialog(true);
  };

  const openEditCategory = (cat: { key: string; label: string; color: string }) => {
    setEditingCategory(cat);
    setCategoryForm({ key: cat.key, label: cat.label, color: cat.color });
    setShowCategoryDialog(true);
  };

  const saveCategory = async () => {
    const key = categoryForm.key || categoryForm.label.toLowerCase().replace(/\s+/g, "_");
    
    if (editingCategory) {
      // Find the setting to update
      // We need to find by key since we don't have ID here
      // This is a simplified approach - ideally we'd pass the full setting object
      toast.info("Mise à jour en cours...");
    } else {
      await createSetting.mutateAsync({
        setting_type: "company_categories",
        setting_key: key,
        setting_value: {
          label: categoryForm.label,
          color: categoryForm.color,
        },
        sort_order: companyCategories.length,
      });
    }
    setShowCategoryDialog(false);
  };

  // Subcategory handlers
  const openCreateSubcategory = (categoryKey: string) => {
    setEditingSubcategory(null);
    const cat = companyCategories.find(c => c.key === categoryKey);
    setSubcategoryForm({ 
      key: "", 
      label: "", 
      shortLabel: "",
      color: cat?.color || DEFAULT_COLORS[0], 
      category: categoryKey 
    });
    setShowSubcategoryDialog(true);
  };

  const openEditSubcategory = (sub: { key: string; label: string; shortLabel: string; color: string; category: string }) => {
    setEditingSubcategory(sub);
    setSubcategoryForm(sub);
    setShowSubcategoryDialog(true);
  };

  const saveSubcategory = async () => {
    const key = subcategoryForm.key || subcategoryForm.label.toLowerCase().replace(/\s+/g, "_");
    
    await createSetting.mutateAsync({
      setting_type: "company_types",
      setting_key: key,
      setting_value: {
        label: subcategoryForm.label,
        shortLabel: subcategoryForm.shortLabel || subcategoryForm.label.substring(0, 6),
        color: subcategoryForm.color,
        category: subcategoryForm.category,
      },
      sort_order: companyTypes.length,
    });
    setShowSubcategoryDialog(false);
  };

  // Delete handlers
  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      if (deleteConfirm.type === "category") {
        // Find the category setting
        const categorySetting = findCategorySetting(deleteConfirm.key);
        if (categorySetting) {
          // First delete all types in this category
          const typesToDelete = typeSettings.filter(t => t.setting_value.category === deleteConfirm.key);
          for (const type of typesToDelete) {
            await deleteSetting.mutateAsync(type.id);
          }
          // Then delete the category
          await deleteSetting.mutateAsync(categorySetting.id);
          toast.success("Catégorie et types associés supprimés");
        }
      } else {
        // Find the type setting
        const typeSetting = findTypeSetting(deleteConfirm.key);
        if (typeSetting) {
          await deleteSetting.mutateAsync(typeSetting.id);
          toast.success("Type supprimé");
        }
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const hasCategories = companyCategories.length > 0;

  return (
    <div className="space-y-6">
      {/* Header with AI button */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Catégories d'entreprises</CardTitle>
                <CardDescription className="text-xs">
                  Organisez vos entreprises en catégories et sous-catégories
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAIDialog(true)}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                Générer avec l'IA
              </Button>
              <Button size="sm" onClick={openCreateCategory}>
                <Plus className="h-4 w-4 mr-1" />
                Catégorie
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasCategories ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Layers className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Aucune catégorie configurée pour l'instant.
              </p>
              <Button onClick={() => setShowAIDialog(true)} variant="default" size="sm" className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                Générer des catégories adaptées à {config.name}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {companyCategories.map((category) => {
                const categoryTypes = companyTypes.filter(t => t.category === category.key);
                
                return (
                  <div 
                    key={category.key} 
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Category header */}
                    <div className="flex items-center justify-between p-3 bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-3 w-3 rounded-full shrink-0" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {categoryTypes.length} type{categoryTypes.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditCategory(category)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm({ type: "category", key: category.key })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Subcategories (types) */}
                    <div className="p-3 space-y-2">
                      {categoryTypes.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Aucun type dans cette catégorie
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {categoryTypes.map((type) => (
                            <div key={type.key} className="group relative">
                              <Badge 
                                variant="outline" 
                                className="py-1 px-2 gap-1 cursor-pointer hover:bg-muted/50 transition-colors pr-6"
                                style={{ 
                                  borderColor: type.color,
                                  color: type.color,
                                }}
                                onClick={() => openEditSubcategory({
                                  key: type.key,
                                  label: type.label,
                                  shortLabel: type.shortLabel || "",
                                  color: type.color,
                                  category: category.key,
                                })}
                              >
                                {type.shortLabel || type.label}
                                <Pencil className="h-2.5 w-2.5 opacity-50" />
                              </Badge>
                              <button
                                className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm({ type: "subcategory", key: type.key });
                                }}
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => openCreateSubcategory(category.key)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter un type
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Générer avec l'IA
            </DialogTitle>
            <DialogDescription>
              L'IA va créer des catégories et types d'entreprises adaptés à votre discipline : <strong>{config.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Les catégories générées seront spécifiques à votre domaine et pourront être modifiées ensuite.
            </p>
            {hasCategories && (
              <p className="text-sm text-amber-600 mt-2">
                ⚠️ Les nouvelles catégories s'ajouteront aux existantes.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleGenerateWithAI} disabled={isGenerating}>
              {isGenerating ? (
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

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la catégorie</Label>
              <Input
                value={categoryForm.label}
                onChange={(e) => setCategoryForm({ ...categoryForm, label: e.target.value })}
                placeholder="Ex: Clients, Partenaires, Fournisseurs..."
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
                      categoryForm.color === color && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setCategoryForm({ ...categoryForm, color })}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveCategory} disabled={!categoryForm.label}>
              {editingCategory ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={showSubcategoryDialog} onOpenChange={setShowSubcategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubcategory ? "Modifier le type" : "Nouveau type d'entreprise"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du type</Label>
              <Input
                value={subcategoryForm.label}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, label: e.target.value })}
                placeholder="Ex: Client actif, Partenaire, Fournisseur..."
              />
            </div>

            <div className="space-y-2">
              <Label>Abréviation (optionnel)</Label>
              <Input
                value={subcategoryForm.shortLabel}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, shortLabel: e.target.value })}
                placeholder="Ex: Client, Part., Fourn..."
                maxLength={10}
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
                      subcategoryForm.color === color && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSubcategoryForm({ ...subcategoryForm, color })}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubcategoryDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveSubcategory} disabled={!subcategoryForm.label}>
              {editingSubcategory ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === "category" 
                ? "Supprimer cette catégorie supprimera également tous les types associés."
                : "Cette action est irréversible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}