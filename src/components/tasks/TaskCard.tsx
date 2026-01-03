import { Task } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckSquare, Circle, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LinkedEntityBadge } from "./EntitySelector";
import { RelatedEntityType } from "@/lib/taskTypes";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";

const statusConfig = {
  todo: {
    color: "bg-muted-foreground/60",
    icon: Circle,
    label: "À faire",
  },
  in_progress: {
    color: "bg-amber-500",
    icon: Clock,
    label: "En cours",
  },
  done: {
    color: "bg-emerald-500",
    icon: CheckCircle2,
    label: "Terminé",
  },
} as const;

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { data: profiles } = useWorkspaceProfiles();
  const subtaskCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.status === "done").length || 0;
  const status = (task.status || "todo") as keyof typeof statusConfig;
  const config = statusConfig[status] || statusConfig.todo;
  const StatusIcon = config.icon;

  // Get profile by user ID
  const getProfile = (userId: string) => profiles?.find((p) => p.user_id === userId);

  return (
    <div
      onClick={onClick}
      className="task-card bg-card rounded-xl p-4 cursor-pointer border border-border transition-all duration-200 hover:shadow-lg hover:border-muted-foreground/20 relative overflow-hidden"
    >
      {/* Status indicator bar */}
      <div className={cn("absolute top-0 left-0 w-1 h-full", config.color)} />
      
      {/* Status badge */}
      <div className="flex items-center gap-1.5 mb-2">
        <StatusIcon className={cn("h-3.5 w-3.5", 
          status === "todo" && "text-muted-foreground",
          status === "in_progress" && "text-amber-500",
          status === "done" && "text-emerald-500"
        )} />
        <span className={cn("text-xs font-medium",
          status === "todo" && "text-muted-foreground",
          status === "in_progress" && "text-amber-500",
          status === "done" && "text-emerald-500"
        )}>
          {config.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-medium text-sm text-foreground leading-snug mb-2 pl-0">
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

        {/* Assignees with profile pictures */}
        {task.assigned_to && task.assigned_to.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assigned_to.slice(0, 3).map((userId) => {
              const profile = getProfile(userId);
              const initials = profile?.full_name
                ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                : userId.slice(0, 2).toUpperCase();
              return (
                <Avatar key={userId} className="h-6 w-6 border-2 border-card">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name || ""} className="object-cover" />}
                  <AvatarFallback className="text-2xs bg-muted text-muted-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
