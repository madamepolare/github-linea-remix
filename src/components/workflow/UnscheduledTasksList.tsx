import { useState } from "react";
import { useUnscheduledTasks } from "@/hooks/useTaskSchedules";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Clock, Flag, GripVertical, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "bg-red-500" },
  high: { label: "Haute", color: "bg-orange-500" },
  medium: { label: "Moyenne", color: "bg-yellow-500" },
  low: { label: "Basse", color: "bg-green-500" },
};

interface UnscheduledTasksListProps {
  onTaskSelect?: (task: any) => void;
}

export function UnscheduledTasksList({ onTaskSelect }: UnscheduledTasksListProps) {
  const { data: tasks, isLoading } = useUnscheduledTasks();
  const [search, setSearch] = useState("");

  const filteredTasks = (tasks || []).filter(task =>
    task.title.toLowerCase().includes(search.toLowerCase()) ||
    task.project?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, task: any) => {
    const payload = JSON.stringify(task);
    // Certains navigateurs sont capricieux avec application/json, on met aussi text/plain
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  // Séparer les tâches avec créneaux et sans créneaux
  const tasksWithSchedule = filteredTasks.filter(t => t.scheduled_hours > 0);
  const tasksWithoutSchedule = filteredTasks.filter(t => !t.scheduled_hours || t.scheduled_hours === 0);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {search ? "Aucune tâche trouvée" : "Aucune tâche en cours"}
            </div>
          ) : (
            <>
              {/* Tâches sans créneaux - priorité */}
              {tasksWithoutSchedule.length > 0 && (
                <>
                  <div className="text-xs font-medium text-muted-foreground px-1 pt-2">
                    À planifier ({tasksWithoutSchedule.length})
                  </div>
                  {tasksWithoutSchedule.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onDragStart={handleDragStart}
                      onTaskSelect={onTaskSelect}
                    />
                  ))}
                </>
              )}

              {/* Tâches avec créneaux existants */}
              {tasksWithSchedule.length > 0 && (
                <>
                  <div className="text-xs font-medium text-muted-foreground px-1 pt-4">
                    Déjà planifiées ({tasksWithSchedule.length})
                  </div>
                  {tasksWithSchedule.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onDragStart={handleDragStart}
                      onTaskSelect={onTaskSelect}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Glissez une tâche pour ajouter un créneau
        </p>
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: any;
  onDragStart: (e: React.DragEvent, task: any) => void;
  onTaskSelect?: (task: any) => void;
}

function TaskCard({ task, onDragStart, onTaskSelect }: TaskCardProps) {
  const scheduledHours = task.scheduled_hours || 0;
  const estimatedHours = task.estimated_hours || 0;
  const hasSchedule = scheduledHours > 0;
  
  // Calculer le pourcentage de planification (peut dépasser 100%)
  const planningProgress = estimatedHours > 0 
    ? Math.round((scheduledHours / estimatedHours) * 100)
    : null;
  
  const isOverPlanned = planningProgress !== null && planningProgress > 100;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onTaskSelect?.(task)}
      className={cn(
        "p-3 rounded-lg border bg-card cursor-grab active:cursor-grabbing",
        "hover:border-primary/50 hover:shadow-sm transition-all",
        "group",
        hasSchedule && "border-l-2 border-l-primary/50"
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm leading-tight">{task.title}</div>
          
          {task.project && (
            <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
              {task.project.name}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {task.priority && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.color,
                  "text-white"
                )}
              >
                <Flag className="h-2.5 w-2.5 mr-0.5" />
                {PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.label}
              </Badge>
            )}
            
            {/* Icône calendrier vert si planifié, sinon afficher estimation */}
            {hasSchedule ? (
              <CalendarCheck className="h-3.5 w-3.5 text-green-500" />
            ) : estimatedHours > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                <Clock className="h-2.5 w-2.5 mr-0.5" />
                {estimatedHours}h
              </Badge>
            )}

            {task.due_date && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {new Date(task.due_date).toLocaleDateString("fr-FR", { 
                  day: "numeric", 
                  month: "short" 
                })}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
