import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ListTodo, Plus, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProjectTasksTabProps {
  projectId: string;
}

export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  const { tasks, isLoading, updateTask } = useTasks();

  // Filter tasks for this project
  const projectTasks = tasks.filter(task => task.project_id === projectId);

  const handleToggleComplete = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    updateTask.mutate({ id: taskId, status: newStatus });
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

  if (projectTasks.length === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title="Aucune tâche"
        description="Les tâches liées à ce projet apparaîtront ici."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Tâches du projet ({projectTasks.length})</h3>
      </div>

      <div className="space-y-2">
        {projectTasks.map((task) => (
          <Card key={task.id} className={cn(task.status === "done" && "opacity-60")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.status === "done"}
                  onCheckedChange={() => handleToggleComplete(task.id, task.status)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-sm",
                    task.status === "done" && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(task.due_date), "d MMM", { locale: fr })}
                      </span>
                    )}
                    {task.priority && (
                      <Badge variant="outline" className="text-xs">
                        {task.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
