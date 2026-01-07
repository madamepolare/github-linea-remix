import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
  Search,
  LayoutGrid,
  List,
  FolderOpen,
  Filter,
} from "lucide-react";
import { useProjectElements, ProjectElement } from "@/hooks/useProjectElements";
import { usePermissions } from "@/hooks/usePermissions";
import { ElementCard } from "./ElementCard";
import { CreateElementDialog } from "./CreateElementDialog";
import { ElementDetailSheet } from "./ElementDetailSheet";
import {
  ElementType,
  ELEMENT_TYPE_CONFIG,
  ELEMENT_CATEGORIES,
} from "@/lib/elementTypes";
import { cn } from "@/lib/utils";

interface ProjectElementsTabProps {
  projectId: string;
}

export function ProjectElementsTab({ projectId }: ProjectElementsTabProps) {
  const {
    elements,
    isLoading,
    addElement,
    updateElement,
    deleteElement,
    togglePin,
    uploadFile,
  } = useProjectElements(projectId);
  const { isAtLeast } = usePermissions();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ProjectElement | null>(
    null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canEdit = isAtLeast("member");
  const canDelete = isAtLeast("admin");

  const filteredElements = useMemo(() => {
    return elements.filter((element) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = element.title.toLowerCase().includes(query);
        const matchesDescription = element.description
          ?.toLowerCase()
          .includes(query);
        const matchesTags = element.tags?.some((tag) =>
          tag.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesDescription && !matchesTags) return false;
      }

      // Type filter
      if (typeFilter !== "all" && element.element_type !== typeFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "all" && element.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [elements, searchQuery, typeFilter, categoryFilter]);

  const pinnedElements = filteredElements.filter((e) => e.is_pinned);
  const unpinnedElements = filteredElements.filter((e) => !e.is_pinned);

  const handleCreate = async (data: any) => {
    await addElement.mutateAsync(data);
  };

  const handleUpdate = async (data: any) => {
    await updateElement.mutateAsync(data);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteElement.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    await togglePin.mutateAsync({ id, is_pinned: isPinned });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {(Object.keys(ELEMENT_TYPE_CONFIG) as ElementType[]).map(
                (type) => (
                  <SelectItem key={type} value={type}>
                    {ELEMENT_TYPE_CONFIG[type].label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {ELEMENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="rounded-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="rounded-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {canEdit && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="secondary">
          {filteredElements.length} élément{filteredElements.length > 1 ? "s" : ""}
        </Badge>
        {pinnedElements.length > 0 && (
          <Badge variant="outline">{pinnedElements.length} épinglé(s)</Badge>
        )}
      </div>

      {/* Content */}
      {filteredElements.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Aucun élément"
          description={
            searchQuery || typeFilter !== "all" || categoryFilter !== "all"
              ? "Aucun élément ne correspond à vos critères de recherche."
              : "Ajoutez des éléments pour constituer votre base de connaissances projet."
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Pinned elements */}
          {pinnedElements.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Éléments épinglés
              </h3>
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "flex flex-col gap-2"
                )}
              >
                {pinnedElements.map((element) => (
                  <ElementCard
                    key={element.id}
                    element={element}
                    onEdit={setSelectedElement}
                    onDelete={setDeleteConfirmId}
                    onTogglePin={handleTogglePin}
                    onView={setSelectedElement}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other elements */}
          {unpinnedElements.length > 0 && (
            <div className="space-y-3">
              {pinnedElements.length > 0 && (
                <h3 className="text-sm font-medium text-muted-foreground">
                  Autres éléments
                </h3>
              )}
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "flex flex-col gap-2"
                )}
              >
                {unpinnedElements.map((element) => (
                  <ElementCard
                    key={element.id}
                    element={element}
                    onEdit={setSelectedElement}
                    onDelete={setDeleteConfirmId}
                    onTogglePin={handleTogglePin}
                    onView={setSelectedElement}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateElementDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
        onUploadFile={uploadFile}
        projectId={projectId}
        isLoading={addElement.isPending}
      />

      <ElementDetailSheet
        element={selectedElement}
        open={!!selectedElement}
        onOpenChange={(open) => !open && setSelectedElement(null)}
        onUpdate={handleUpdate}
        canEdit={canEdit}
      />

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet élément ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'élément et son fichier associé
              seront définitivement supprimés.
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
    </div>
  );
}
