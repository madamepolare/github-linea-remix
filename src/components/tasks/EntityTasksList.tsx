import { useState } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { RelatedEntityType } from "@/lib/taskTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { Plus, CheckSquare, Clock, AlertCircle } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TASK_PRIORITIES } from "@/lib/taskTypes";

interface EntityTasksListProps {
  entityType: RelatedEntityType;
  entityId: string;
  entityName: string;
  compact?: boolean;
}

export function EntityTasksList({ entityType, entityId, entityName, compact = false }: EntityTasksListProps) {
  const { tasks, isLoading, updateTaskStatus } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Filter tasks linked to this entity
  const entityTasks = tasks?.filter((task) => {
    // Check specific entity fields based on type
    switch (entityType) {
      case "project":
        return task.project_id === entityId || (task.related_type === "project" && task.related_id === entityId);
      case "lead":
        return task.lead_id === entityId || (task.related_type === "lead" && task.related_id === entityId);
      case "company":
        return task.crm_company_id === entityId || (task.related_type === "company" && task.related_id === entityId);
      case "contact":
        return task.contact_id === entityId || (task.related_type === "contact" && task.related_id === entityId);
      case "tender":
        return task.tender_id === entityId || (task.related_type === "tender" && task.related_id === entityId);
      default:
        return false;
    }
  }) || [];

  const pendingTasks = entityTasks.filter((t) => t.status !== "done" && t.status !== "archived");
  const completedTasks = entityTasks.filter((t) => t.status === "done");

  const handleToggleComplete = (task: Task) => {
    updateTaskStatus.mutate({
      id: task.id,
      status: task.status === "done" ? "todo" : "done",
    });
  };

  const getPriorityConfig = (priority: string) => {
    return TASK_PRIORITIES.find((p) => p.id === priority) || TASK_PRIORITIES[1];
  };

  const getDeadlineStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return "overdue";
    if (isToday(date)) return "today";
    return "upcoming";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entityTasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={CheckSquare}
            title="Aucune tâche"
            description={`Aucune tâche liée à ${entityName}`}
            action={{
              label: "Créer une tâche",
              onClick: () => setShowCreateDialog(true),
            }}
          />
          <TaskDetailSheet
            task={null}
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            isCreateMode={true}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">
              Tâches ({entityTasks.length})
            </CardTitle>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div className="space-y-2">
              {pendingTasks.map((task) => {
                const priorityConfig = getPriorityConfig(task.priority);
                const deadlineStatus = getDeadlineStatus(task.due_date);

                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    <Checkbox
                      checked={task.status === "done"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(task);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={cn("text-2xs", priorityConfig.color)}>
                          {priorityConfig.label}
                        </Badge>
                        {task.due_date && (
                          <span
                            className={cn(
                              "text-2xs flex items-center gap-1",
                              deadlineStatus === "overdue" && "text-destructive",
                              deadlineStatus === "today" && "text-amber-600"
                            )}
                          >
                            {deadlineStatus === "overdue" && <AlertCircle className="h-3 w-3" />}
                            <Clock className="h-3 w-3" />
                            {format(new Date(task.due_date), "d MMM", { locale: fr })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                Terminées ({completedTasks.length})
              </p>
              {completedTasks.slice(0, compact ? 3 : undefined).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer opacity-60"
                  onClick={() => setSelectedTask(task)}
                >
                  <Checkbox checked={true} onClick={(e) => {
                    e.stopPropagation();
                    handleToggleComplete(task);
                  }} />
                  <p className="text-sm line-through truncate">{task.title}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />

      <TaskDetailSheet
        task={null}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        isCreateMode={true}
      />
    </>
  );
}