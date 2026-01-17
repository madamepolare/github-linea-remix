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
import { Sparkles, Loader2, ListTodo, Clock, AlertTriangle, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface GeneratedSubtask {
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
  const [subtasks, setSubtasks] = useState<GeneratedSubtask[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [mainTaskTitle, setMainTaskTitle] = useState("");

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

      const generatedSubtasks = (data.tasks || []).map((t: any) => ({
        ...t,
        selected: true,
      }));

      setSubtasks(generatedSubtasks);
      setMainTaskTitle(`Livrable: ${deliverable.name}`);
      setHasGenerated(true);
      toast.success(`${generatedSubtasks.length} sous-tâches générées`);
    } catch (error) {
      console.error("Error generating tasks:", error);
      toast.error("Erreur lors de la génération des tâches");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleSubtask = (index: number) => {
    setSubtasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleUpdateSubtask = (index: number, field: string, value: any) => {
    setSubtasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const handleCreateTasks = async () => {
    if (!activeWorkspace?.id) {
      toast.error("Workspace non trouvé");
      return;
    }

    const selectedSubtasks = subtasks.filter((t) => t.selected);
    if (selectedSubtasks.length === 0) {
      toast.error("Sélectionnez au moins une sous-tâche");
      return;
    }

    setIsCreating(true);
    try {
      // Calculate total estimated hours from subtasks
      const totalEstimatedHours = selectedSubtasks.reduce(
        (acc, t) => acc + (t.estimatedHours || 0),
        0
      );

      // 1. Create the main task linked to the deliverable
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

      // 2. Create subtasks linked to the main task
      for (let i = 0; i < selectedSubtasks.length; i++) {
        const subtask = selectedSubtasks[i];
        const { error } = await supabase.from("tasks").insert({
          title: subtask.title,
          description: subtask.description || null,
          priority: subtask.priority,
          estimated_hours: subtask.estimatedHours || null,
          project_id: projectId,
          parent_id: mainTask.id,
          status: "todo",
          due_date: deliverable.due_date || null,
          workspace_id: activeWorkspace!.id,
          created_by: user?.id,
          sort_order: i + 1,
        });

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["subtasks", mainTask.id] });
      queryClient.invalidateQueries({ queryKey: ["deliverable-tasks", deliverable.id] });
      toast.success(`Tâche créée avec ${selectedSubtasks.length} sous-tâches`);
      onOpenChange(false);
      setSubtasks([]);
      setHasGenerated(false);
      setMainTaskTitle("");
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
            Générer une tâche avec sous-tâches
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Info livrable */}
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-medium">{deliverable.name}</p>
            </div>
            {deliverable.phase && (
              <p className="text-xs text-muted-foreground mt-1">
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
                <p className="font-medium">Génération IA des sous-tâches</p>
                <p className="text-sm text-muted-foreground mt-1">
                  L'IA va créer une tâche principale liée au livrable avec des sous-tâches adaptées
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
                    Générer les sous-tâches
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Main task title */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tâche principale</Label>
                <Input
                  value={mainTaskTitle}
                  onChange={(e) => setMainTaskTitle(e.target.value)}
                  placeholder="Titre de la tâche principale"
                  className="font-medium"
                />
                <p className="text-xs text-muted-foreground">
                  Cette tâche sera liée au livrable "{deliverable.name}"
                </p>
              </div>

              {/* Subtasks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Sous-tâches ({subtasks.filter((t) => t.selected).length}/{subtasks.length})
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

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {subtasks.map((subtask, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border transition-colors ${
                        subtask.selected
                          ? "bg-background border-border"
                          : "bg-muted/30 border-transparent opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={subtask.selected}
                          onCheckedChange={() => handleToggleSubtask(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <Input
                            value={subtask.title}
                            onChange={(e) =>
                              handleUpdateSubtask(index, "title", e.target.value)
                            }
                            className="h-8 text-sm font-medium"
                            disabled={!subtask.selected}
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={priorityColors[subtask.priority]}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {priorityLabels[subtask.priority]}
                            </Badge>
                            {subtask.estimatedHours && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {subtask.estimatedHours}h
                              </Badge>
                            )}
                          </div>
                          {subtask.description && (
                            <p className="text-xs text-muted-foreground">
                              {subtask.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                isCreating || subtasks.filter((t) => t.selected).length === 0 || !mainTaskTitle.trim()
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
                  Créer la tâche ({subtasks.filter((t) => t.selected).length} sous-tâches)
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
