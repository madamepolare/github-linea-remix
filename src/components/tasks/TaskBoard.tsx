import { useState } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { TaskCard } from "./TaskCard";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { QuickTaskRow } from "./QuickTaskRow";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const COLUMNS: { id: Task["status"]; label: string; color: string }[] = [
  { id: "todo", label: "À faire", color: "bg-muted" },
  { id: "in_progress", label: "En cours", color: "bg-blue-500/20" },
  { id: "review", label: "En revue", color: "bg-amber-500/20" },
  { id: "done", label: "Terminé", color: "bg-green-500/20" },
];

interface TaskBoardProps {
  statusFilter?: string | null;
  priorityFilter?: string | null;
}

export function TaskBoard({ statusFilter, priorityFilter }: TaskBoardProps) {
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
    
    // Apply filters
    if (statusFilter && statusFilter !== status) {
      return [];
    }
    if (priorityFilter) {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }
    
    return filtered;
  };

  // If status filter is active, only show that column
  const columnsToShow = statusFilter 
    ? COLUMNS.filter(col => col.id === statusFilter)
    : COLUMNS;

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <div key={column.id} className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
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
              className={cn(
                "flex flex-col rounded-lg border bg-card/50 min-h-[500px]",
                draggedTaskId && "ring-2 ring-primary/20"
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className={cn("px-3 py-2 rounded-t-lg flex items-center justify-between", column.color)}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{column.label}</span>
                  <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks List */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "cursor-grab active:cursor-grabbing",
                      draggedTaskId === task.id && "opacity-50"
                    )}
                  >
                    <TaskCard task={task} onClick={() => setSelectedTask(task)} />
                  </div>
                ))}

                {/* Quick Add Row */}
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
