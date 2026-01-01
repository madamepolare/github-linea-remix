import { useState } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { QuickTaskRow } from "./QuickTaskRow";
import { EmptyState } from "@/components/ui/empty-state";
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/KanbanBoard";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckSquare, Calendar } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const COLUMNS: { id: Task["status"]; label: string; color: string }[] = [
  { id: "todo", label: "À faire", color: "#6b7280" },
  { id: "in_progress", label: "En cours", color: "#3b82f6" },
  { id: "review", label: "En revue", color: "#8b5cf6" },
  { id: "done", label: "Terminé", color: "#22c55e" },
];

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-600 border-red-200",
  high: "bg-orange-500/10 text-orange-600 border-orange-200",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  low: "bg-green-500/10 text-green-600 border-green-200",
};

interface TaskBoardProps {
  statusFilter?: string | null;
  priorityFilter?: string | null;
  onCreateTask?: () => void;
}

export function TaskBoard({ statusFilter, priorityFilter, onCreateTask }: TaskBoardProps) {
  const { tasks, isLoading, updateTaskStatus } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleDrop = (taskId: string, _fromColumn: string, toColumn: string) => {
    updateTaskStatus.mutate({ id: taskId, status: toColumn as Task["status"] });
  };

  const getFilteredTasks = () => {
    let filtered = tasks || [];
    if (priorityFilter) {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }
    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  const columnsToShow = statusFilter
    ? COLUMNS.filter((col) => col.id === statusFilter)
    : COLUMNS;

  const kanbanColumns: KanbanColumn<Task>[] = columnsToShow.map((col) => ({
    id: col.id,
    label: col.label,
    color: col.color,
    items: filteredTasks.filter((task) => task.status === col.id),
  }));

  // Check if all tasks are empty
  const totalTasks = tasks?.length || 0;
  if (!isLoading && totalTasks === 0 && !statusFilter && !priorityFilter) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="Aucune tâche"
        description="Créez votre première tâche pour commencer à organiser votre travail."
        action={onCreateTask ? { label: "Créer une tâche", onClick: onCreateTask } : undefined}
      />
    );
  }

  return (
    <>
      <KanbanBoard<Task>
        columns={kanbanColumns}
        isLoading={isLoading}
        onDrop={handleDrop}
        getItemId={(task) => task.id}
        renderCard={(task, isDragging) => (
          <TaskKanbanCard
            task={task}
            onClick={() => setSelectedTask(task)}
            isDragging={isDragging}
          />
        )}
        renderQuickAdd={(columnId) => (
          <QuickTaskRow defaultStatus={columnId as Task["status"]} />
        )}
        className="pt-4"
      />

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </>
  );
}

interface TaskKanbanCardProps {
  task: Task;
  onClick: () => void;
  isDragging: boolean;
}

function TaskKanbanCard({ task, onClick, isDragging }: TaskKanbanCardProps) {
  const completedSubtasks = task.subtasks?.filter((s) => s.status === "done").length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Aujourd'hui";
    return format(date, "d MMM", { locale: fr });
  };

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "done";

  return (
    <KanbanCard onClick={onClick}>
      <div className="space-y-2.5">
        {/* Title */}
        <p className="text-sm font-medium leading-snug line-clamp-2">{task.title}</p>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-2xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <span className="text-2xs text-muted-foreground">+{task.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Subtasks progress */}
        {totalSubtasks > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckSquare className="h-3 w-3" />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/60 rounded-full transition-all"
                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer: Priority, Due Date, Assignees */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            {task.priority && (
              <Badge
                variant="outline"
                className={cn("text-2xs capitalize px-1.5 py-0", priorityColors[task.priority])}
              >
                {task.priority}
              </Badge>
            )}
            {task.due_date && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-destructive" : "text-muted-foreground"
              )}>
                <Calendar className="h-3 w-3" />
                <span>{formatDueDate(task.due_date)}</span>
              </div>
            )}
          </div>

          {/* Assignees */}
          {task.assigned_to && task.assigned_to.length > 0 && (
            <div className="flex -space-x-1.5">
              {task.assigned_to.slice(0, 2).map((userId, i) => (
                <Avatar key={userId} className="h-5 w-5 border-2 border-card">
                  <AvatarFallback className="text-2xs bg-primary/10">
                    {userId.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {task.assigned_to.length > 2 && (
                <div className="h-5 w-5 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                  <span className="text-2xs text-muted-foreground">+{task.assigned_to.length - 2}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </KanbanCard>
  );
}
