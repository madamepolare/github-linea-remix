import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Building2, Frame, Megaphone, Info, Sparkles, GripVertical, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useWorkspaceDisciplines } from "@/hooks/useWorkspaceDisciplines";
import { type DisciplineSlug, getAvailableDisciplines } from "@/lib/tenderDisciplineConfig";
import { useDiscipline } from "@/hooks/useDiscipline";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Theater: Frame,
  Megaphone,
};

export function DisciplinesSection() {
  const { 
    disciplines, 
    isDisciplineActive, 
    toggleDiscipline, 
    reorderDisciplines,
    hasConfigs, 
    initializeDisciplines,
    defaultDiscipline,
  } = useWorkspaceDisciplines();
  const { disciplineSlug: workspacePrimaryDiscipline } = useDiscipline();
  const allDisciplines = getAvailableDisciplines();

  // Sort disciplines by sort_order if we have configs
  const sortedDisciplines = hasConfigs && disciplines
    ? [...allDisciplines].sort((a, b) => {
        const aOrder = disciplines.find(d => d.discipline_slug === a.slug)?.sort_order ?? 99;
        const bOrder = disciplines.find(d => d.discipline_slug === b.slug)?.sort_order ?? 99;
        return aOrder - bOrder;
      })
    : allDisciplines;

  const handleToggle = async (slug: DisciplineSlug, currentState: boolean) => {
    // Prevent disabling the primary workspace discipline
    if (slug === workspacePrimaryDiscipline && currentState) {
      return;
    }
    
    // Ensure at least one discipline remains active
    const currentlyActive = allDisciplines.filter(d => isDisciplineActive(d.slug));
    if (currentState && currentlyActive.length <= 1) {
      return;
    }
    
    await toggleDiscipline.mutateAsync({ slug, isActive: !currentState });
  };

  const handleInitialize = async () => {
    await initializeDisciplines.mutateAsync();
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    if (sourceIndex === destIndex) return;

    const reordered = [...sortedDisciplines];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, removed);

    const newOrder = reordered.map(d => d.slug);
    reorderDisciplines.mutate(newOrder);
  }, [sortedDisciplines, reorderDisciplines]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Disciplines actives</h3>
        <p className="text-sm text-muted-foreground">
          Réorganisez les disciplines par glisser-déposer. 
          <strong className="text-foreground"> La première discipline active sera celle par défaut</strong> lors de la création d'un appel d'offres.
        </p>
      </div>

      {!hasConfigs && (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-dashed">
          <div>
            <p className="font-medium">Configuration par défaut</p>
            <p className="text-sm text-muted-foreground">
              Toutes les disciplines sont actuellement actives. Initialisez pour personnaliser l'ordre.
            </p>
          </div>
          <Button onClick={handleInitialize} disabled={initializeDisciplines.isPending}>
            <Sparkles className="h-4 w-4 mr-2" />
            Personnaliser
          </Button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="disciplines">
          {(provided) => (
            <div 
              ref={provided.innerRef} 
              {...provided.droppableProps}
              className="space-y-2"
            >
              {sortedDisciplines.map((discipline, idx) => {
                const Icon = ICONS[discipline.icon] || Building2;
                const isActive = isDisciplineActive(discipline.slug);
                const isPrimary = discipline.slug === workspacePrimaryDiscipline;
                const isDefault = discipline.slug === defaultDiscipline;

                return (
                  <Draggable 
                    key={discipline.slug} 
                    draggableId={discipline.slug} 
                    index={idx}
                    isDragDisabled={!hasConfigs}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border transition-all",
                          isActive ? "bg-card" : "bg-muted/30 opacity-60",
                          snapshot.isDragging && "shadow-lg ring-2 ring-primary/20",
                          isDefault && isActive && "ring-2 ring-primary/30 border-primary/50"
                        )}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className={cn(
                            "cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted",
                            !hasConfigs && "opacity-30 cursor-not-allowed"
                          )}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div
                          className={cn(
                            "p-3 rounded-lg transition-colors relative",
                            isActive ? "bg-primary/10" : "bg-muted"
                          )}
                        >
                          <Icon className={cn(
                            "h-6 w-6",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )} />
                          {isDefault && isActive && (
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500 absolute -top-1 -right-1" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("font-medium", !isActive && "text-muted-foreground")}>
                              {discipline.name}
                            </span>
                            {isDefault && isActive && (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
                                Par défaut
                              </Badge>
                            )}
                            {isPrimary && (
                              <Badge variant="secondary" className="text-xs">
                                Workspace
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {discipline.description}
                          </p>
                        </div>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2">
                                {isPrimary && (
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                )}
                                <Switch
                                  checked={isActive}
                                  onCheckedChange={() => handleToggle(discipline.slug, isActive)}
                                  disabled={isPrimary || toggleDiscipline.isPending}
                                />
                              </div>
                            </TooltipTrigger>
                            {isPrimary && (
                              <TooltipContent>
                                <p>La discipline principale du workspace ne peut pas être désactivée</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <Star className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-200">
              Discipline par défaut : {allDisciplines.find(d => d.slug === defaultDiscipline)?.name || 'Architecture'}
            </p>
            <p className="text-amber-700 dark:text-amber-300 mt-1">
              Glissez une discipline en première position pour la définir comme discipline par défaut lors de la création d'AO.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Note :</strong> La désactivation d'une discipline masque uniquement son affichage 
              dans le sélecteur de création. Les appels d'offres existants de cette discipline restent accessibles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
