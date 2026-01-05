import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { usePlanningVersions, PlanningVersion } from "@/hooks/usePlanningVersions";
import { Intervention } from "@/hooks/useInterventions";
import { ProjectLot } from "@/hooks/useChantier";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { History, Plus, Trash2, RotateCcw, Save, Clock } from "lucide-react";
import { toast } from "sonner";

interface PlanningVersionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  lots: ProjectLot[];
  interventions: Intervention[];
  onRestoreVersion: (version: PlanningVersion) => void;
}

export function PlanningVersionsSheet({
  open,
  onOpenChange,
  projectId,
  lots,
  interventions,
  onRestoreVersion,
}: PlanningVersionsSheetProps) {
  const { versions, isLoading, createVersion, deleteVersion } = usePlanningVersions(projectId);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [newVersionDescription, setNewVersionDescription] = useState("");
  const [versionToDelete, setVersionToDelete] = useState<PlanningVersion | null>(null);

  const handleCreateVersion = () => {
    if (!newVersionName.trim()) {
      toast.error("Veuillez entrer un nom pour la version");
      return;
    }

    createVersion.mutate({
      name: newVersionName,
      description: newVersionDescription || undefined,
      lots,
      interventions,
    });

    setNewVersionName("");
    setNewVersionDescription("");
    setShowCreateForm(false);
  };

  const handleRestore = (version: PlanningVersion) => {
    onRestoreVersion(version);
    toast.success(`Version "${version.name}" restaurée`);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[500px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historique des versions
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Create new version */}
            {!showCreateForm ? (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowCreateForm(true)}
              >
                <Save className="w-4 h-4" />
                Sauvegarder la version actuelle
              </Button>
            ) : (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="space-y-2">
                  <Label>Nom de la version</Label>
                  <Input
                    value={newVersionName}
                    onChange={(e) => setNewVersionName(e.target.value)}
                    placeholder="Ex: Version avant modification planning"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optionnel)</Label>
                  <Textarea
                    value={newVersionDescription}
                    onChange={(e) => setNewVersionDescription(e.target.value)}
                    placeholder="Notes sur cette version..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateVersion} disabled={createVersion.isPending}>
                    <Plus className="w-4 h-4 mr-1" />
                    Créer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowCreateForm(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {/* Current state summary */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">État actuel</span>
                <Badge variant="secondary">{interventions.length} interventions</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {lots.length} lots • {format(new Date(), "d MMM yyyy à HH:mm", { locale: fr })}
              </p>
            </div>

            {/* Versions list */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center text-muted-foreground py-8">
                    Chargement...
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune version sauvegardée</p>
                    <p className="text-xs mt-1">Créez des points de sauvegarde pour pouvoir revenir en arrière</p>
                  </div>
                ) : (
                  versions.map((version) => (
                    <div
                      key={version.id}
                      className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{version.name}</span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              v{version.version_number}
                            </Badge>
                          </div>
                          {version.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {version.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(parseISO(version.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                            <span>•</span>
                            <span>{version.snapshot.interventions?.length || 0} interventions</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleRestore(version)}
                            title="Restaurer cette version"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setVersionToDelete(version)}
                            className="text-destructive hover:text-destructive"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!versionToDelete} onOpenChange={() => setVersionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette version ?</AlertDialogTitle>
            <AlertDialogDescription>
              La version "{versionToDelete?.name}" sera définitivement supprimée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (versionToDelete) {
                  deleteVersion.mutate(versionToDelete.id);
                  setVersionToDelete(null);
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
