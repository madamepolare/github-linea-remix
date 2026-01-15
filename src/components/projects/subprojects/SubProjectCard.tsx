import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, parseISO, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, ListTodo, Calendar, AlertTriangle, User } from "lucide-react";
import { SubProjectWithStats } from "@/hooks/useSubProjects";

interface SubProjectCardProps {
  subProject: SubProjectWithStats;
  color?: string;
  showClientBadge?: boolean;
}

export function SubProjectCard({ subProject, color, showClientBadge }: SubProjectCardProps) {
  const navigate = useNavigate();
  
  const isOverdue = subProject.end_date && isPast(parseISO(subProject.end_date)) && subProject.status !== "completed" && subProject.status !== "done";
  const isDueToday = subProject.end_date && isToday(parseISO(subProject.end_date));
  
  const completionPercent = subProject.tasks_count > 0 
    ? Math.round((subProject.tasks_completed / subProject.tasks_count) * 100) 
    : 0;

  const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: "En cours", className: "bg-blue-500/10 text-blue-600" },
    in_progress: { label: "En cours", className: "bg-blue-500/10 text-blue-600" },
    completed: { label: "Terminé", className: "bg-green-500/10 text-green-600" },
    done: { label: "Terminé", className: "bg-green-500/10 text-green-600" },
    on_hold: { label: "En pause", className: "bg-amber-500/10 text-amber-600" },
    archived: { label: "Archivé", className: "bg-muted text-muted-foreground" },
  };

  const status = statusConfig[subProject.status] || statusConfig.active;

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 group",
        isOverdue && "border-l-destructive"
      )}
      style={{ borderLeftColor: isOverdue ? undefined : (color || "#3B82F6") }}
      onClick={() => navigate(`/projects/${subProject.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {subProject.name}
              </h4>
              {showClientBadge && subProject.client_request_id && (
                <Badge variant="outline" className="text-2xs shrink-0 bg-purple-50 text-purple-600 border-purple-200">
                  <User className="h-2.5 w-2.5 mr-1" />
                  Client
                </Badge>
              )}
              <Badge variant="secondary" className={cn("text-2xs shrink-0", status.className)}>
                {status.label}
              </Badge>
            </div>
            
            {subProject.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                {subProject.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-2xs text-muted-foreground">
              {/* Time tracked */}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{subProject.total_time_hours}h</span>
              </div>
              
              {/* Tasks progress */}
              <div className="flex items-center gap-1">
                <ListTodo className="h-3 w-3" />
                <span>{subProject.tasks_completed}/{subProject.tasks_count}</span>
              </div>
              
              {/* Deadline */}
              {subProject.end_date && (
                <div className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-destructive font-medium",
                  isDueToday && "text-amber-600 font-medium"
                )}>
                  {isOverdue ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <Calendar className="h-3 w-3" />
                  )}
                  <span>
                    {format(parseISO(subProject.end_date), "d MMM", { locale: fr })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {subProject.tasks_count > 0 && (
              <>
                <span className="text-xs font-medium">{completionPercent}%</span>
                <Progress value={completionPercent} className="w-16 h-1.5" />
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
