import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useWorkspaceNavigation } from "@/hooks/useWorkspaceNavigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit2,
  MoreHorizontal,
  Trash2,
  Copy,
  Share2,
  Eye,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Save,
  X,
  ChevronRight,
  Tag,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useDocumentationPage, useDocumentationPages, DOCUMENTATION_TAGS } from "@/hooks/useDocumentation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { THIN_STROKE } from "@/components/ui/icon";

export default function DocumentationPage() {
  const { id } = useParams<{ id: string }>();
  const { navigate } = useWorkspaceNavigation();
  const { page, isLoading, updatePage } = useDocumentationPage(id);
  const { deletePage } = useDocumentationPages();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedPage, setEditedPage] = useState<typeof page>(null);

  useEffect(() => {
    if (page) {
      setEditedPage(page);
    }
  }, [page]);

  const handleSave = async () => {
    if (!editedPage) return;

    try {
      await updatePage.mutateAsync({
        title: editedPage.title,
        objective: editedPage.objective,
        context: editedPage.context,
        content: editedPage.content,
        steps: editedPage.steps,
        checklist: editedPage.checklist,
        tips: editedPage.tips,
        tags: editedPage.tags,
      });
      toast.success("Page mise à jour");
      setIsEditing(false);
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deletePage.mutateAsync(id);
      navigate("/documentation");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const toggleChecklistItem = async (itemId: string) => {
    if (!page || !editedPage) return;

    const newChecklist = editedPage.checklist.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );

    setEditedPage({ ...editedPage, checklist: newChecklist });

    try {
      await updatePage.mutateAsync({ checklist: newChecklist });
    } catch (error) {
      // Revert on error
      setEditedPage(page);
    }
  };

  const addChecklistItem = () => {
    if (!editedPage) return;
    const newItem = {
      id: crypto.randomUUID(),
      label: "",
      checked: false,
    };
    setEditedPage({
      ...editedPage,
      checklist: [...(editedPage.checklist || []), newItem],
    });
  };

  const updateChecklistItem = (itemId: string, label: string) => {
    if (!editedPage) return;
    setEditedPage({
      ...editedPage,
      checklist: editedPage.checklist.map((item) =>
        item.id === itemId ? { ...item, label } : item
      ),
    });
  };

  const removeChecklistItem = (itemId: string) => {
    if (!editedPage) return;
    setEditedPage({
      ...editedPage,
      checklist: editedPage.checklist.filter((item) => item.id !== itemId),
    });
  };

  const addStep = () => {
    if (!editedPage) return;
    const newStep = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
    };
    setEditedPage({
      ...editedPage,
      steps: [...(editedPage.steps || []), newStep],
    });
  };

  if (isLoading) {
    return (
      <PageLayout title="Chargement..." description="">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageLayout>
    );
  }

  if (!page || !editedPage) {
    return (
      <PageLayout title="Page non trouvée" description="">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Cette page n'existe pas ou a été supprimée.</p>
          <Button onClick={() => navigate("/documentation")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la documentation
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title=""
      description=""
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/documentation")}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{page.emoji || "📄"}</span>
                {isEditing ? (
                  <Input
                    value={editedPage.title}
                    onChange={(e) => setEditedPage({ ...editedPage, title: e.target.value })}
                    className="text-2xl font-semibold h-auto py-1"
                  />
                ) : (
                  <h1 className="text-2xl font-semibold">{page.title}</h1>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => {
                    setEditedPage(page);
                    setIsEditing(false);
                  }}>
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={updatePage.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="h-4 w-4 mr-2" />
                        Partager
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pl-12">
            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              <span>{page.view_count || 0} vues</span>
            </div>
            {page.updated_at && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Modifié le {format(new Date(page.updated_at), "d MMM yyyy", { locale: fr })}
                </span>
              </div>
            )}
            {page.tags && page.tags.length > 0 && (
              <div className="flex items-center gap-2">
                {page.tags.map((tag) => {
                  const tagConfig = DOCUMENTATION_TAGS.find((t) => t.value === tag);
                  return (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className={cn("text-xs", tagConfig?.color)}
                    >
                      {tagConfig?.label || tag}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Content sections */}
        <div className="space-y-8 pl-12">
          {/* Objective */}
          {(page.objective || isEditing) && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🎯 Objectif
              </h2>
              {isEditing ? (
                <Textarea
                  value={editedPage.objective || ""}
                  onChange={(e) => setEditedPage({ ...editedPage, objective: e.target.value })}
                  placeholder="Décrivez l'objectif de cette page..."
                  rows={3}
                />
              ) : (
                <p className="text-muted-foreground">{page.objective}</p>
              )}
            </section>
          )}

          {/* Context */}
          {(page.context || isEditing) && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                📋 Contexte
              </h2>
              {isEditing ? (
                <Textarea
                  value={editedPage.context || ""}
                  onChange={(e) => setEditedPage({ ...editedPage, context: e.target.value })}
                  placeholder="Décrivez le contexte..."
                  rows={3}
                />
              ) : (
                <p className="text-muted-foreground">{page.context}</p>
              )}
            </section>
          )}

          {/* Main Content */}
          {(page.content || isEditing) && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                📝 Contenu
              </h2>
              {isEditing ? (
                <Textarea
                  value={editedPage.content || ""}
                  onChange={(e) => setEditedPage({ ...editedPage, content: e.target.value })}
                  placeholder="Contenu principal..."
                  rows={10}
                />
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">{page.content}</p>
                </div>
              )}
            </section>
          )}

          {/* Steps */}
          {((page.steps && page.steps.length > 0) || isEditing) && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                📍 Étapes
              </h2>
              <div className="space-y-4">
                {editedPage.steps?.map((step, index) => (
                  <Card key={step.id}>
                    <CardContent className="p-4">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                              {index + 1}
                            </span>
                            <Input
                              value={step.title}
                              onChange={(e) => {
                                const newSteps = [...editedPage.steps];
                                newSteps[index] = { ...step, title: e.target.value };
                                setEditedPage({ ...editedPage, steps: newSteps });
                              }}
                              placeholder="Titre de l'étape"
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                              onClick={() => {
                                const newSteps = editedPage.steps.filter((_, i) => i !== index);
                                setEditedPage({ ...editedPage, steps: newSteps });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={step.description}
                            onChange={(e) => {
                              const newSteps = [...editedPage.steps];
                              newSteps[index] = { ...step, description: e.target.value };
                              setEditedPage({ ...editedPage, steps: newSteps });
                            }}
                            placeholder="Description de l'étape"
                            rows={2}
                            className="ml-8"
                          />
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <h3 className="font-medium">{step.title}</h3>
                            {step.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {step.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {isEditing && (
                  <Button variant="outline" onClick={addStep} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une étape
                  </Button>
                )}
              </div>
            </section>
          )}

          {/* Checklist */}
          {((page.checklist && page.checklist.length > 0) || isEditing) && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                ✅ Checklist
              </h2>
              <Card>
                <CardContent className="p-4 space-y-3">
                  {editedPage.checklist?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => toggleChecklistItem(item.id)}
                        disabled={isEditing}
                      />
                      {isEditing ? (
                        <>
                          <Input
                            value={item.label}
                            onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                            placeholder="Élément de la checklist"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeChecklistItem(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span
                          className={cn(
                            "flex-1",
                            item.checked && "text-muted-foreground line-through"
                          )}
                        >
                          {item.label}
                        </span>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <Button variant="ghost" onClick={addChecklistItem} className="w-full mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un élément
                    </Button>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Tips */}
          {(page.tips || isEditing) && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                💡 Notes & conseils
              </h2>
              {isEditing ? (
                <Textarea
                  value={editedPage.tips || ""}
                  onChange={(e) => setEditedPage({ ...editedPage, tips: e.target.value })}
                  placeholder="Conseils et astuces..."
                  rows={4}
                />
              ) : (
                <Card className="bg-warning/5 border-warning/20">
                  <CardContent className="p-4">
                    <p className="text-sm whitespace-pre-wrap">{page.tips}</p>
                  </CardContent>
                </Card>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette page ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La page "{page.title}" sera définitivement supprimée.
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
    </PageLayout>
  );
}
