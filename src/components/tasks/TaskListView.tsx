import { useState } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const statusLabels: Record<Task["status"], string> = {
  todo: "À faire",
  in_progress: "En cours",
  review: "En revue",
  done: "Terminé",
  archived: "Archivé",
};

const statusColors: Record<Task["status"], string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  review: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  done: "bg-green-500/20 text-green-700 dark:text-green-300",
  archived: "bg-slate-500/20 text-slate-700 dark:text-slate-300",
};

const priorityLabels: Record<Task["priority"], string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};

const priorityColors: Record<Task["priority"], string> = {
  low: "bg-slate-500/20 text-slate-700 dark:text-slate-300",
  medium: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  high: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  urgent: "bg-red-500/20 text-red-700 dark:text-red-300",
};

export function TaskListView() {
  const { tasks, isLoading, updateTaskStatus } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleToggleComplete = (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    updateTaskStatus.mutate({ id: task.id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Tâche</TableHead>
              <TableHead className="w-32">Statut</TableHead>
              <TableHead className="w-28">Priorité</TableHead>
              <TableHead className="w-32">Échéance</TableHead>
              <TableHead className="w-24">Temps</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks?.map((task) => (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedTask(task)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={task.status === "done"}
                    onCheckedChange={() => handleToggleComplete(task)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className={cn("font-medium", task.status === "done" && "line-through text-muted-foreground")}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge>
                </TableCell>
                <TableCell>
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(task.due_date), "d MMM", { locale: fr })}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {task.estimated_hours && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{task.estimated_hours}h</span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {(!tasks || tasks.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucune tâche
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </>
  );
}
