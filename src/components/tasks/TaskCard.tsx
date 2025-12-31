import { Task } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckSquare, Clock, GripVertical, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const priorityColors: Record<Task["priority"], string> = {
  low: "bg-slate-500/20 text-slate-700 dark:text-slate-300",
  medium: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  high: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  urgent: "bg-red-500/20 text-red-700 dark:text-red-300",
};

const priorityLabels: Record<Task["priority"], string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const subtaskCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.status === "done").length || 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border bg-card cursor-pointer transition-all group",
        "hover:shadow-md hover:border-primary/20"
      )}
    >
      {/* Header with grip and priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {task.tags.length > 3 && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              +{task.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t">
        <div className="flex items-center gap-2">
          {/* Priority */}
          <Badge variant="secondary" className={cn("text-xs", priorityColors[task.priority])}>
            {priorityLabels[task.priority]}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          {/* Subtasks count */}
          {subtaskCount > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <CheckSquare className="h-3 w-3" />
              <span>
                {completedSubtasks}/{subtaskCount}
              </span>
            </div>
          )}

          {/* Due date */}
          {task.due_date && (
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.due_date), "d MMM", { locale: fr })}</span>
            </div>
          )}

          {/* Estimated hours */}
          {task.estimated_hours && (
            <div className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              <span>{task.estimated_hours}h</span>
            </div>
          )}

          {/* Assignees */}
          {task.assigned_to && task.assigned_to.length > 0 && (
            <div className="flex items-center">
              <User className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
