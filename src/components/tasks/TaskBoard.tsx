import { useState } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { TaskCard } from "./TaskCard";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { QuickTaskRow } from "./QuickTaskRow";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreHorizontal, CheckSquare } from "lucide-react";

const COLUMNS: { id: Task["status"]; label: string; icon?: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "In Review" },
  { id: "done", label: "Done" },
];

interface TaskBoardProps {
  statusFilter?: string | null;
  priorityFilter?: string | null;
  onCreateTask?: () => void;
}

export function TaskBoard({ statusFilter, priorityFilter, onCreateTask }: TaskBoardProps) {
  const { tasks, isLoading, updateTaskStatus } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    if (draggedTaskId) {
      updateTaskStatus.mutate({ id: draggedTaskId, status });
      setDraggedTaskId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const getTasksByStatus = (status: Task["status"]) => {
    let filtered = tasks?.filter((task) => task.status === status) || [];
    if (priorityFilter) {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }
    return filtered;
  };

  const columnsToShow = statusFilter 
    ? COLUMNS.filter(col => col.id === statusFilter)
    : COLUMNS;

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <div key={column.id} className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // Check if all tasks are empty
  const totalTasks = tasks?.length || 0;
  if (totalTasks === 0 && !statusFilter && !priorityFilter) {
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
      <div className={cn(
        "grid gap-4 h-full",
        statusFilter ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      )}>
        {columnsToShow.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <div
              key={column.id}
              className="kanban-column flex flex-col rounded-xl min-h-[500px] bg-surface"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="kanban-column-header flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{column.label}</span>
                  <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded hover:bg-background text-muted-foreground">
                    <Plus className="h-4 w-4" />
                  </button>
                  <button className="p-1 rounded hover:bg-background text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto scrollbar-thin">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "cursor-grab active:cursor-grabbing transition-all duration-150",
                      draggedTaskId === task.id && "opacity-50 scale-[0.98]"
                    )}
                  >
                    <TaskCard task={task} onClick={() => setSelectedTask(task)} />
                  </div>
                ))}

                {/* Quick Add */}
                <QuickTaskRow defaultStatus={column.id} />
              </div>
            </div>
          );
        })}
      </div>

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </>
  );
}
