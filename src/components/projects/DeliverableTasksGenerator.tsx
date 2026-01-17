import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2, ListTodo, Clock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface GeneratedTask {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  estimatedHours?: number;
  selected: boolean;
}

interface DeliverableTasksGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverable: {
    id: string;
    name: string;
    description?: string | null;
    due_date?: string | null;
    phase?: {
      phase_name: string;
      phase_code: string;
    } | null;
  };
  projectId: string;
  projectName: string;
}

export function DeliverableTasksGenerator({
  open,
  onOpenChange,
  deliverable,
  projectId,
  projectName,
}: DeliverableTasksGeneratorProps) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [tasks, setTasks] = useState<GeneratedTask[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-deliverable-tasks",
        {
          body: {
            deliverableName: deliverable.name,
            phaseName: deliverable.phase?.phase_name,
            phaseCode: deliverable.phase?.phase_code,
            projectName,
            description: deliverable.description,
            dueDate: deliverable.due_date,
          },
        }
      );

      if (error) throw error;

      const generatedTasks = (data.tasks || []).map((t: any) => ({
        ...t,
        selected: true,
      }));

      setTasks(generatedTasks);
      setHasGenerated(true);
      toast.success(`${generatedTasks.length} tâches générées`);
    } catch (error) {
      console.error("Error generating tasks:", error);
      toast.error("Erreur lors de la génération des tâches");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = (index: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleUpdateTask = (index: number, field: string, value: any) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const handleCreateTasks = async () => {
    if (!activeWorkspace?.id) {
      toast.error("Workspace non trouvé");
      return;
    }

    const selectedTasks = tasks.filter((t) => t.selected);
    if (selectedTasks.length === 0) {
      toast.error("Sélectionnez au moins une tâche");
      return;
    }

    setIsCreating(true);
    try {
      for (const task of selectedTasks) {
        const { error } = await supabase.from("tasks").insert({
          title: task.title,
          description: task.description || null,
          priority: task.priority,
          estimated_hours: task.estimatedHours || null,
          project_id: projectId,
          deliverable_id: deliverable.id,
          status: "todo",
          due_date: deliverable.due_date || null,
          workspace_id: activeWorkspace!.id,
          created_by: user?.id,
        });
        
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`${selectedTasks.length} tâches créées avec succès`);
      onOpenChange(false);
      setTasks([]);
      setHasGenerated(false);
    } catch (error) {
      console.error("Error creating tasks:", error);
      toast.error("Erreur lors de la création des tâches");
    } finally {
      setIsCreating(false);
    }
  };

  const priorityColors = {
    low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  const priorityLabels = {
    low: "Basse",
    medium: "Moyenne",
    high: "Haute",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Générer des tâches
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Info livrable */}
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-sm font-medium">{deliverable.name}</p>
            {deliverable.phase && (
              <p className="text-xs text-muted-foreground">
                Phase: {deliverable.phase.phase_code} - {deliverable.phase.phase_name}
              </p>
            )}
            {deliverable.due_date && (
              <p className="text-xs text-muted-foreground">
                Échéance: {new Date(deliverable.due_date).toLocaleDateString("fr-FR")}
              </p>
            )}
          </div>

          {!hasGenerated ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">Génération IA des tâches</p>
                <p className="text-sm text-muted-foreground mt-1">
                  L'IA va analyser ce livrable et proposer des tâches adaptées
                </p>
              </div>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer les tâches
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Tâches proposées ({tasks.filter((t) => t.selected).length}/{tasks.length})
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span className="ml-1">Régénérer</span>
                </Button>
              </div>

              <div className="space-y-2">
                {tasks.map((task, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-colors ${
                      task.selected
                        ? "bg-background border-border"
                        : "bg-muted/30 border-transparent opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={task.selected}
                        onCheckedChange={() => handleToggleTask(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <Input
                          value={task.title}
                          onChange={(e) =>
                            handleUpdateTask(index, "title", e.target.value)
                          }
                          className="h-8 text-sm font-medium"
                          disabled={!task.selected}
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={priorityColors[task.priority]}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {priorityLabels[task.priority]}
                          </Badge>
                          {task.estimatedHours && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.estimatedHours}h
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {hasGenerated && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateTasks}
              disabled={
                isCreating || tasks.filter((t) => t.selected).length === 0
              }
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <ListTodo className="h-4 w-4 mr-2" />
                  Créer {tasks.filter((t) => t.selected).length} tâches
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
