import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, FolderOpen, Filter } from "lucide-react";
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
import { ContentFiltersBar } from "@/components/shared/ContentFiltersBar";
import { ViewModeToggle } from "@/components/shared/filters";
import { MultiSelectFilter } from "@/components/shared/filters/MultiSelectFilter";
import { GridCardSkeleton } from "@/components/shared/CardListSkeleton";
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
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ProjectElement | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canEdit = isAtLeast("member");
  const canDelete = isAtLeast("admin");

  // Filter options
  const typeOptions = useMemo(() => 
    (Object.keys(ELEMENT_TYPE_CONFIG) as ElementType[]).map((type) => ({
      id: type,
      label: ELEMENT_TYPE_CONFIG[type].label,
    })), 
  []);

  const categoryOptions = useMemo(() => 
    ELEMENT_CATEGORIES.map((cat) => ({
      id: cat.value,
      label: cat.label,
    })), 
  []);

  const filteredElements = useMemo(() => {
    return elements.filter((element) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = element.title.toLowerCase().includes(query);
        const matchesDescription = element.description?.toLowerCase().includes(query);
        const matchesTags = element.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDescription && !matchesTags) return false;
      }

      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(element.element_type)) {
        return false;
      }

      // Category filter
      if (selectedCategories.length > 0 && element.category && !selectedCategories.includes(element.category)) {
        return false;
      }

      return true;
    });
  }, [elements, searchQuery, selectedTypes, selectedCategories]);

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

  const handleClearAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedTypes([]);
    setSelectedCategories([]);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedTypes.length > 0) count++;
    if (selectedCategories.length > 0) count++;
    return count;
  }, [selectedTypes, selectedCategories]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <GridCardSkeleton count={6} columns={3} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Unified Filter Bar */}
      <ContentFiltersBar
      viewToggle={
          <ViewModeToggle
            value={viewMode === "grid" ? "cards" : "table"}
            onChange={(v) => setViewMode(v === "cards" ? "grid" : "list")}
          />
        }
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Rechercher un élément...",
        }}
        filters={
          <div className="flex items-center gap-2">
            <MultiSelectFilter
              icon={Filter}
              label="Type"
              options={typeOptions}
              selected={selectedTypes}
              onChange={setSelectedTypes}
            />
            <MultiSelectFilter
              icon={FolderOpen}
              label="Catégorie"
              options={categoryOptions}
              selected={selectedCategories}
              onChange={setSelectedCategories}
            />
          </div>
        }
        actions={
          canEdit && (
            <Button onClick={() => setCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          )
        }
        onClearAll={handleClearAllFilters}
        activeFiltersCount={activeFiltersCount}
      />

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
            searchQuery || selectedTypes.length > 0 || selectedCategories.length > 0
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
