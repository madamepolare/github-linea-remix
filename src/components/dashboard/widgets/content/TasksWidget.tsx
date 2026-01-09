import { format, isPast, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, Circle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  title: string;
  project: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  completed: boolean;
}

// Mock data
const mockTasks: Task[] = [
  {
    id: "1",
    title: "Révision plans étage",
    project: "Villa Moderne",
    dueDate: new Date(),
    priority: "high",
    completed: false,
  },
  {
    id: "2",
    title: "Validation matériaux",
    project: "Résidence Étoile",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    priority: "medium",
    completed: false,
  },
  {
    id: "3",
    title: "Réunion client",
    project: "Bureau Central",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48),
    priority: "high",
    completed: false,
  },
  {
    id: "4",
    title: "Envoi devis",
    project: "Loft Bastille",
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
    priority: "medium",
    completed: false,
  },
];

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
};

function formatDueDate(date: Date): { label: string; isOverdue: boolean } {
  if (isPast(date) && !isToday(date)) {
    return { label: "En retard", isOverdue: true };
  }
  if (isToday(date)) {
    return { label: "Aujourd'hui", isOverdue: false };
  }
  if (isTomorrow(date)) {
    return { label: "Demain", isOverdue: false };
  }
  return { label: format(date, "d MMM", { locale: fr }), isOverdue: false };
}

export function TasksWidget() {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-2">
        {mockTasks.map((task) => {
          const { label, isOverdue } = formatDueDate(task.dueDate);
          return (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0 mt-0.5"
              >
                {task.completed ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {task.project}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    priorityColors[task.priority]
                  )}
                >
                  {task.priority === "high" ? "Urgent" : task.priority === "medium" ? "Normal" : "Faible"}
                </span>
                <span
                  className={cn(
                    "text-xs flex items-center gap-1",
                    isOverdue ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {isOverdue ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
