import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { ListTodo, Plus, Calendar, AlertCircle } from "lucide-react";
import { format, parseISO, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProjectTasksTabProps {
  projectId: string;
}

const PRIORITY_CONFIG = {
  low: { label: "Faible", color: "bg-slate-500" },
  medium: { label: "Moyen", color: "bg-blue-500" },
  high: { label: "Important", color: "bg-amber-500" },
  urgent: { label: "Urgent", color: "bg-red-500" },
};

export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  const { tasks, isLoading, createTask, updateTask } = useTasks({ projectId });
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState<Date | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Filter tasks for this project (already filtered by hook but double-check)
  const projectTasks = tasks.filter(task => task.project_id === projectId && !task.parent_id);
  const pendingTasks = projectTasks.filter(t => t.status !== "done");
  const doneTasks = projectTasks.filter(t => t.status === "done");
  const overdueTasks = pendingTasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)));

  const handleToggleComplete = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    updateTask.mutate({ id: taskId, status: newStatus });
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    await createTask.mutateAsync({
      title: newTaskTitle.trim(),
      project_id: projectId,
      due_date: newTaskDeadline ? format(newTaskDeadline, "yyyy-MM-dd") : undefined,
      status: "todo",
      priority: "medium",
    });
    
    setNewTaskTitle("");
    setNewTaskDeadline(null);
    setIsAdding(false);
  };

  const getDeadlineStyle = (dueDate: string | null) => {
    if (!dueDate) return "";
    const date = parseISO(dueDate);
    if (isPast(date) && !isToday(date)) return "text-destructive font-medium";
    if (isToday(date)) return "text-amber-600 font-medium";
    return "";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">
          {pendingTasks.length} en cours
        </span>
        <span className="text-muted-foreground">
          {doneTasks.length} terminées
        </span>
        {overdueTasks.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {overdueTasks.length} en retard
          </Badge>
        )}
      </div>

      {/* Quick Add */}
      {isAdding ? (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Nouvelle tâche..."
                className="flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTask();
                  if (e.key === "Escape") { setIsAdding(false); setNewTaskTitle(""); }
                }}
              />
              <InlineDatePicker
                value={newTaskDeadline}
                onChange={setNewTaskDeadline}
                placeholder="Deadline"
              />
              <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                Ajouter
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setIsAdding(false); setNewTaskTitle(""); }}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start text-muted-foreground"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une tâche
        </Button>
      )}

      {projectTasks.length === 0 && !isAdding && (
        <EmptyState
          icon={ListTodo}
          title="Aucune tâche"
          description="Ajoutez des tâches pour ce projet."
          action={{ label: "Ajouter une tâche", onClick: () => setIsAdding(true) }}
        />
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="space-y-2">
          {pendingTasks.map((task) => {
            const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
            return (
              <Card key={task.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => handleToggleComplete(task.id, task.status)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.due_date && (
                          <span className={cn("flex items-center gap-1 text-xs", getDeadlineStyle(task.due_date))}>
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(task.due_date), "d MMM", { locale: fr })}
                          </span>
                        )}
                        {priorityConfig && task.priority !== "medium" && (
                          <Badge variant="secondary" className="text-xs">
                            <div className={cn("w-1.5 h-1.5 rounded-full mr-1", priorityConfig.color)} />
                            {priorityConfig.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Done Tasks */}
      {doneTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Terminées</h4>
          {doneTasks.slice(0, 5).map((task) => (
            <Card key={task.id} className="opacity-60">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={true}
                    onCheckedChange={() => handleToggleComplete(task.id, task.status)}
                  />
                  <p className="font-medium text-sm line-through text-muted-foreground truncate">
                    {task.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {doneTasks.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              +{doneTasks.length - 5} autres tâches terminées
            </p>
          )}
        </div>
      )}
    </div>
  );
}
