import { useState } from "react";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { useProjectDeliverables } from "@/hooks/useProjectDeliverables";
import { useProject } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Sparkles, Package, Calendar, Check, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SuggestedDeliverable {
  phase_id: string;
  name: string;
  description: string;
  due_date: string | null;
  selected: boolean;
}

interface AIDeliverablesGeneratorProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIDeliverablesGenerator({ projectId, open, onOpenChange }: AIDeliverablesGeneratorProps) {
  const { phases } = useProjectPhases(projectId);
  const { data: project } = useProject(projectId);
  const { createDeliverable } = useProjectDeliverables(projectId);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedDeliverable[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!project || phases.length === 0) {
      setError("Définissez d'abord des phases pour votre projet");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuggestions([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-project-deliverables', {
        body: {
          projectName: project.name,
          projectType: project.project_type,
          phases: phases.map(p => ({
            id: p.id,
            name: p.name,
            start_date: p.start_date,
            end_date: p.end_date,
            status: p.status,
          })),
        }
      });

      if (fnError) throw fnError;

      if (data?.error) {
        setError(data.error);
        return;
      }

      const deliverables = (data?.deliverables || []).map((d: any) => ({
        ...d,
        selected: true,
      }));

      setSuggestions(deliverables);
      
      if (deliverables.length === 0) {
        setError("Aucun livrable suggéré. Vérifiez que vos phases ont des dates.");
      }
    } catch (err: any) {
      console.error("Error generating deliverables:", err);
      setError("Erreur lors de la génération. Réessayez.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleDeliverable = (index: number) => {
    setSuggestions(prev => 
      prev.map((s, i) => i === index ? { ...s, selected: !s.selected } : s)
    );
  };

  const toggleAll = (selected: boolean) => {
    setSuggestions(prev => prev.map(s => ({ ...s, selected })));
  };

  const handleCreate = async () => {
    const selectedDeliverables = suggestions.filter(s => s.selected);
    if (selectedDeliverables.length === 0) {
      toast.error("Sélectionnez au moins un livrable");
      return;
    }

    setIsCreating(true);

    try {
      for (const deliverable of selectedDeliverables) {
        await createDeliverable.mutateAsync({
          name: deliverable.name,
          description: deliverable.description,
          phase_id: deliverable.phase_id,
          due_date: deliverable.due_date,
          status: "pending",
        });
      }

      toast.success(`${selectedDeliverables.length} livrables créés`);
      onOpenChange(false);
      setSuggestions([]);
    } catch (err) {
      console.error("Error creating deliverables:", err);
      toast.error("Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
  };

  const getPhaseById = (id: string) => phases.find(p => p.id === id);
  const selectedCount = suggestions.filter(s => s.selected).length;

  // Group suggestions by phase
  const groupedByPhase = suggestions.reduce((acc, s) => {
    const phase = getPhaseById(s.phase_id);
    const phaseName = phase?.name || "Sans phase";
    if (!acc[phaseName]) {
      acc[phaseName] = { phase, items: [] };
    }
    acc[phaseName].items.push(s);
    return acc;
  }, {} as Record<string, { phase: any; items: SuggestedDeliverable[] }>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Générer des livrables avec l'IA
          </DialogTitle>
          <DialogDescription>
            L'IA analyse vos phases et le type de projet pour suggérer des livrables pertinents.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {suggestions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
              {error ? (
                <>
                  <AlertCircle className="h-12 w-12 text-destructive/50 mb-4" />
                  <p className="text-destructive">{error}</p>
                  {phases.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Ajoutez des phases dans l'onglet "Planning projet" d'abord.
                    </p>
                  )}
                </>
              ) : isGenerating ? (
                <>
                  <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">Analyse du projet en cours...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Génération de livrables pour {phases.length} phases
                  </p>
                </>
              ) : (
                <>
                  <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-1">
                    Générez des livrables adaptés à votre projet
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {phases.length} phase{phases.length > 1 ? "s" : ""} • {project?.project_type || "Type non défini"}
                  </p>
                  <Button onClick={handleGenerate} disabled={phases.length === 0}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer les livrables
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleAll(selectedCount < suggestions.length)}
                  >
                    {selectedCount === suggestions.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </Button>
                  <Badge variant="secondary">
                    {selectedCount}/{suggestions.length} sélectionnés
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Regénérer
                </Button>
              </div>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 py-4">
                  {Object.entries(groupedByPhase).map(([phaseName, { phase, items }]) => (
                    <div key={phaseName}>
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: phase?.color || "#6b7280" }}
                        />
                        <h4 className="font-medium text-sm">{phaseName}</h4>
                        <span className="text-xs text-muted-foreground">
                          ({items.length} livrable{items.length > 1 ? "s" : ""})
                        </span>
                      </div>
                      <div className="space-y-2 ml-5">
                        {items.map((item, globalIndex) => {
                          const index = suggestions.findIndex(s => s === item);
                          return (
                            <div 
                              key={index}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                                item.selected ? "bg-primary/5 border-primary/30" : "bg-muted/30 hover:bg-muted/50"
                              )}
                              onClick={() => toggleDeliverable(index)}
                            >
                              <Checkbox 
                                checked={item.selected}
                                onCheckedChange={() => toggleDeliverable(index)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "font-medium text-sm",
                                    !item.selected && "text-muted-foreground"
                                  )}>
                                    {item.name}
                                  </span>
                                </div>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              {item.due_date && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                  <Calendar className="h-3 w-3" />
                                  {format(parseISO(item.due_date), "d MMM yyyy", { locale: fr })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          {suggestions.length > 0 && (
            <Button 
              onClick={handleCreate} 
              disabled={selectedCount === 0 || isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Créer {selectedCount} livrable{selectedCount > 1 ? "s" : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
