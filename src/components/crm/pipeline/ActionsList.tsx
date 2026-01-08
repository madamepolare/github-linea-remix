import { format, isPast, isToday, isTomorrow, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Mail, 
  Phone, 
  Calendar, 
  CheckSquare, 
  CornerUpRight,
  Clock,
  AlertTriangle,
  Check,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PipelineAction, ActionType, ActionPriority } from "@/hooks/usePipelineActions";

interface ActionsListProps {
  actions: PipelineAction[];
  onComplete: (actionId: string) => void;
  onDelete: (actionId: string) => void;
}

const actionTypeIcons: Record<ActionType, React.ReactNode> = {
  email: <Mail className="h-3.5 w-3.5" />,
  call: <Phone className="h-3.5 w-3.5" />,
  meeting: <Calendar className="h-3.5 w-3.5" />,
  task: <CheckSquare className="h-3.5 w-3.5" />,
  followup: <CornerUpRight className="h-3.5 w-3.5" />,
};

const priorityColors: Record<ActionPriority, string> = {
  low: 'text-muted-foreground',
  medium: 'text-foreground',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

function getDueDateLabel(date: string | null): { label: string; isUrgent: boolean; isOverdue: boolean } {
  if (!date) return { label: 'Sans échéance', isUrgent: false, isOverdue: false };
  
  const dueDate = new Date(date);
  const now = new Date();
  
  if (isPast(dueDate) && !isToday(dueDate)) {
    return { label: 'En retard', isUrgent: true, isOverdue: true };
  }
  
  if (isToday(dueDate)) {
    const hoursLeft = differenceInHours(dueDate, now);
    if (hoursLeft <= 2) {
      return { label: 'Très urgent', isUrgent: true, isOverdue: false };
    }
    return { label: "Aujourd'hui", isUrgent: true, isOverdue: false };
  }
  
  if (isTomorrow(dueDate)) {
    return { label: 'Demain', isUrgent: false, isOverdue: false };
  }
  
  return { 
    label: format(dueDate, "d MMM", { locale: fr }), 
    isUrgent: false,
    isOverdue: false 
  };
}

export function ActionsList({ actions, onComplete, onDelete }: ActionsListProps) {
  const pendingActions = actions.filter(a => a.status === 'pending');
  const completedActions = actions.filter(a => a.status === 'completed');

  if (actions.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <Clock className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucune action planifiée
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Pending actions */}
      {pendingActions.map(action => {
        const { label, isUrgent, isOverdue } = getDueDateLabel(action.due_date);
        
        return (
          <Card 
            key={action.id} 
            className={cn(
              "transition-colors",
              isOverdue && "border-red-500/50 bg-red-500/5",
              isUrgent && !isOverdue && "border-orange-500/50 bg-orange-500/5"
            )}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={false}
                  onCheckedChange={() => onComplete(action.id)}
                  className="mt-0.5"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "p-1 rounded",
                      isOverdue ? "bg-red-500/10 text-red-500" : "bg-muted"
                    )}>
                      {actionTypeIcons[action.action_type]}
                    </span>
                    <span className={cn(
                      "text-sm font-medium truncate",
                      action.status === 'completed' && "line-through text-muted-foreground"
                    )}>
                      {action.title}
                    </span>
                    {action.priority !== 'medium' && (
                      <Badge 
                        variant="outline" 
                        className={cn("text-[10px] h-4", priorityColors[action.priority])}
                      >
                        {action.priority === 'urgent' && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
                        {action.priority}
                      </Badge>
                    )}
                  </div>
                  
                  {action.description && (
                    <p className="text-xs text-muted-foreground truncate mb-1">
                      {action.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs">
                    {action.due_date && (
                      <span className={cn(
                        "flex items-center gap-1",
                        isOverdue && "text-red-500 font-medium",
                        isUrgent && !isOverdue && "text-orange-500 font-medium"
                      )}>
                        {isOverdue ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {label}
                        {action.due_date && !isOverdue && !isUrgent && (
                          <> · {format(new Date(action.due_date), "HH:mm")}</>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onComplete(action.id)}>
                      <Check className="h-4 w-4 mr-2" />
                      Marquer terminé
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(action.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Completed actions */}
      {completedActions.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Terminées ({completedActions.length})
          </p>
          {completedActions.slice(0, 3).map(action => (
            <Card key={action.id} className="mb-2 opacity-60">
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs line-through text-muted-foreground truncate">
                    {action.title}
                  </span>
                  {action.completed_at && (
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {format(new Date(action.completed_at), "d MMM", { locale: fr })}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
