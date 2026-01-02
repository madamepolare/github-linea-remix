import { useState, useEffect } from "react";
import { usePhaseTemplates, PhaseTemplate, CreatePhaseTemplateInput } from "@/hooks/usePhaseTemplates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PROJECT_TYPE_LABELS } from "@/lib/commercialTypes";

const PROJECT_TYPES = ["interior", "architecture", "scenography"] as const;

interface PhaseFormData {
  code: string;
  name: string;
  description: string;
  default_percentage: number;
  deliverables: string[];
  color: string;
  is_active: boolean;
}

const defaultFormData: PhaseFormData = {
  code: "",
  name: "",
  description: "",
  default_percentage: 0,
  deliverables: [],
  color: "",
  is_active: true,
};

export function PhaseTemplatesSettings() {
  const [activeProjectType, setActiveProjectType] = useState<string>("interior");
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, reorderTemplates, resetToDefaults, initializeDefaultsIfEmpty } = usePhaseTemplates(activeProjectType);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<PhaseTemplate | null>(null);
  const [formData, setFormData] = useState<PhaseFormData>(defaultFormData);
  const [deliverablesText, setDeliverablesText] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetConfirmType, setResetConfirmType] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  // Initialize defaults when switching project type
  useEffect(() => {
    initializeDefaultsIfEmpty.mutate(activeProjectType);
  }, [activeProjectType]);

  const handleOpenCreate = () => {
    setEditingPhase(null);
    setFormData({
      ...defaultFormData,
      code: `PHASE_${templates.length + 1}`,
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

  const movePhase = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= templates.length) return;

    const reorderedTemplates = [...templates];
    const [movedItem] = reorderedTemplates.splice(index, 1);
    reorderedTemplates.splice(newIndex, 0, movedItem);

    await reorderTemplates.mutateAsync(
      reorderedTemplates.map((t, i) => ({ id: t.id, sort_order: i }))
    );
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Phases de projet</h3>
          <p className="text-sm text-muted-foreground">
            Définissez les phases par défaut pour chaque type de projet
          </p>
        </div>
      </div>

      <Tabs value={activeProjectType} onValueChange={setActiveProjectType}>
        <TabsList>
          {PROJECT_TYPES.map((type) => (
            <TabsTrigger key={type} value={type}>
              {PROJECT_TYPE_LABELS[type]}
            </TabsTrigger>
          ))}
        </TabsList>

        {PROJECT_TYPES.map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="flex items-center justify-between">
              <Button onClick={handleOpenCreate} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une phase
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResetConfirmType(type)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>

            <div className="space-y-2">
              {templates.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Aucune phase définie pour ce type de projet
                  </CardContent>
                </Card>
              ) : (
                templates.map((phase, index) => (
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
                            onClick={() => movePhase(index, "up")}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            disabled={index === templates.length - 1}
                            onClick={() => movePhase(index, "down")}
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
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

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
                    setFormData({ ...formData, code: e.target.value })
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
              disabled={!formData.code || !formData.name}
            >
              {editingPhase ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette phase ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La phase sera supprimée du modèle.
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
      <AlertDialog
        open={!!resetConfirmType}
        onOpenChange={() => setResetConfirmType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser les phases ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera toutes les phases personnalisées et les
              remplacera par les phases par défaut. Cette action est irréversible.
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
    </div>
  );
}
