import { Task } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LinkedEntityBadge } from "./EntitySelector";
import { RelatedEntityType } from "@/lib/taskTypes";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const subtaskCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.status === "done").length || 0;

  return (
    <div
      onClick={onClick}
      className="task-card bg-card rounded-xl p-4 cursor-pointer border border-border"
    >
      {/* Title */}
      <h4 className="font-medium text-sm text-foreground leading-snug mb-2">
        {task.title}
      </h4>

      {/* Linked Entity */}
      {task.related_type && task.related_id && (
        <LinkedEntityBadge 
          entityType={task.related_type as RelatedEntityType} 
          entityId={task.related_id} 
          className="mb-2"
        />
      )}

      {/* Phase badge */}
      {task.tags && task.tags.length > 0 && (
        <Badge variant="phase" className="mb-3">
          {task.tags[0]}
        </Badge>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-3 text-muted-foreground">
          {/* Subtasks */}
          {subtaskCount > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <CheckSquare className="h-3.5 w-3.5" />
              <span>{completedSubtasks} of {subtaskCount}</span>
            </div>
          )}

          {/* Due date */}
          {task.due_date && (
            <div className="flex items-center gap-1 text-xs">
              <span>{format(new Date(task.due_date), "d MMM", { locale: fr })}</span>
            </div>
          )}
        </div>

        {/* Assignees */}
        {task.assigned_to && task.assigned_to.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assigned_to.slice(0, 3).map((userId, i) => (
              <Avatar key={userId} className="h-6 w-6 border-2 border-card">
                <AvatarFallback className="text-2xs bg-muted text-muted-foreground">
                  {String.fromCharCode(65 + i)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
