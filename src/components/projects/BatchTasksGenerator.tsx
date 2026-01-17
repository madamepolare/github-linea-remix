import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2, CheckCircle2, XCircle, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Deliverable {
  id: string;
  name: string;
  description?: string | null;
  due_date?: string | null;
  phase?: {
    name: string;
    phase_code: string;
  } | null;
}

interface BatchTasksGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverables: Deliverable[];
  projectId: string;
  projectName: string;
}

interface GenerationStatus {
  id: string;
  status: "pending" | "generating" | "success" | "error";
  tasksCount?: number;
  error?: string;
}

export function BatchTasksGenerator({
  open,
  onOpenChange,
  deliverables,
  projectId,
  projectName,
}: BatchTasksGeneratorProps) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(deliverables.map(d => d.id)));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatuses, setGenerationStatuses] = useState<Map<string, GenerationStatus>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === deliverables.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deliverables.map(d => d.id)));
    }
  };

  const generateTasksForDeliverable = async (deliverable: Deliverable): Promise<{ success: boolean; tasksCount?: number; error?: string }> => {
    try {
      // Call the edge function to generate tasks
      const { data, error } = await supabase.functions.invoke(
        "generate-deliverable-tasks",
        {
          body: {
            deliverableName: deliverable.name,
            phaseName: deliverable.phase?.name,
            phaseCode: deliverable.phase?.phase_code,
            projectName,
            description: deliverable.description,
            dueDate: deliverable.due_date,
          },
        }
      );

      if (error) throw error;

      const tasks = data.tasks || [];
      if (tasks.length === 0) {
        return { success: true, tasksCount: 0 };
      }

      // Calculate total estimated hours
      const totalEstimatedHours = tasks.reduce((sum: number, t: any) => sum + (t.estimatedHours || 0), 0);

      // Create main task with subtasks
      const mainTaskTitle = `📦 ${deliverable.name}`;
      
      const { data: mainTask, error: mainTaskError } = await supabase
        .from("tasks")
        .insert({
          title: mainTaskTitle,
          description: deliverable.description || `Tâche principale pour le livrable "${deliverable.name}"`,
          priority: "high",
          estimated_hours: totalEstimatedHours || null,
          project_id: projectId,
          deliverable_id: deliverable.id,
          status: "todo",
          due_date: deliverable.due_date || null,
          workspace_id: activeWorkspace!.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (mainTaskError) throw mainTaskError;

      // Create subtasks
      const subtasksToInsert = tasks.map((task: any, index: number) => ({
        title: task.title,
        description: task.description || null,
        priority: task.priority || "medium",
        estimated_hours: task.estimatedHours || null,
        project_id: projectId,
        parent_id: mainTask.id,
        status: "todo",
        workspace_id: activeWorkspace!.id,
        created_by: user?.id,
        sort_order: index,
      }));

      const { error: subtasksError } = await supabase
        .from("tasks")
        .insert(subtasksToInsert);

      if (subtasksError) throw subtasksError;

      return { success: true, tasksCount: tasks.length + 1 };
    } catch (error: any) {
      console.error("Error generating tasks for deliverable:", deliverable.name, error);
      return { success: false, error: error.message };
    }
  };

  const handleGenerate = async () => {
    if (selectedIds.size === 0) {
      toast.error("Sélectionnez au moins un livrable");
      return;
    }

    setIsGenerating(true);
    const selectedDeliverables = deliverables.filter(d => selectedIds.has(d.id));
    
    // Initialize statuses
    const initialStatuses = new Map<string, GenerationStatus>();
    selectedDeliverables.forEach(d => {
      initialStatuses.set(d.id, { id: d.id, status: "pending" });
    });
    setGenerationStatuses(initialStatuses);

    let successCount = 0;
    let errorCount = 0;
    let totalTasksCreated = 0;

    for (let i = 0; i < selectedDeliverables.length; i++) {
      const deliverable = selectedDeliverables[i];
      setCurrentIndex(i);

      // Update status to generating
      setGenerationStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(deliverable.id, { id: deliverable.id, status: "generating" });
        return newMap;
      });

      const result = await generateTasksForDeliverable(deliverable);

      // Update status based on result
      setGenerationStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(deliverable.id, {
          id: deliverable.id,
          status: result.success ? "success" : "error",
          tasksCount: result.tasksCount,
          error: result.error,
        });
        return newMap;
      });

      if (result.success) {
        successCount++;
        totalTasksCreated += result.tasksCount || 0;
      } else {
        errorCount++;
      }
    }

    setIsGenerating(false);

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["deliverable-tasks"] });

    // Show summary toast
    if (errorCount === 0) {
      toast.success(`${totalTasksCreated} tâches créées pour ${successCount} livrables`);
    } else {
      toast.warning(`${successCount} livrables traités, ${errorCount} erreurs`);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setGenerationStatuses(new Map());
      setCurrentIndex(0);
      onOpenChange(false);
    }
  };

  const progress = generationStatuses.size > 0 
    ? Math.round((Array.from(generationStatuses.values()).filter(s => s.status === "success" || s.status === "error").length / selectedIds.size) * 100)
    : 0;

  const hasStarted = generationStatuses.size > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Générer les tâches pour les livrables
          </DialogTitle>
          <DialogDescription>
            L'IA va générer des tâches pour chaque livrable sélectionné
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!hasStarted && (
            <div className="flex items-center justify-between pb-2 border-b">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedIds.size === deliverables.length}
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm font-medium">Tout sélectionner</span>
              </label>
              <Badge variant="secondary">
                {selectedIds.size} / {deliverables.length}
              </Badge>
            </div>
          )}

          {hasStarted && (
            <div className="space-y-2 pb-4 border-b">
              <div className="flex items-center justify-between text-sm">
                <span>Progression</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="space-y-2">
            {deliverables.map((deliverable) => {
              const status = generationStatuses.get(deliverable.id);
              const isSelected = selectedIds.has(deliverable.id);

              return (
                <div
                  key={deliverable.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    !hasStarted && isSelected && "border-primary/50 bg-primary/5",
                    status?.status === "generating" && "border-violet-500/50 bg-violet-500/5",
                    status?.status === "success" && "border-green-500/50 bg-green-500/5",
                    status?.status === "error" && "border-red-500/50 bg-red-500/5"
                  )}
                >
                  {!hasStarted ? (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(deliverable.id)}
                    />
                  ) : (
                    <div className="w-5 h-5 flex items-center justify-center">
                      {status?.status === "pending" && (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                      )}
                      {status?.status === "generating" && (
                        <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                      )}
                      {status?.status === "success" && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {status?.status === "error" && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{deliverable.name}</span>
                    </div>
                    {deliverable.phase && (
                      <span className="text-xs text-muted-foreground">
                        {deliverable.phase.phase_code} - {deliverable.phase.name}
                      </span>
                    )}
                  </div>

                  {status?.status === "success" && status.tasksCount !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      {status.tasksCount} tâches
                    </Badge>
                  )}
                  {status?.status === "error" && (
                    <Badge variant="destructive" className="text-xs">
                      Erreur
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
            {hasStarted && !isGenerating ? "Fermer" : "Annuler"}
          </Button>
          {!hasStarted && (
            <Button
              onClick={handleGenerate}
              disabled={selectedIds.size === 0 || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer ({selectedIds.size})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
