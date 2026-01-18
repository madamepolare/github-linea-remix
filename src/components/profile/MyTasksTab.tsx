import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { CheckSquare, ExternalLink, Calendar, Circle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  todo: "À faire",
  in_progress: "En cours",
  review: "En revue",
  done: "Terminé",
  cancelled: "Annulé",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export function MyTasksTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("active");
  const { tasks, isLoading } = useTasks({ assignedTo: user?.id });

  const activeTasks = tasks?.filter(t => t.status !== "done" && t.status !== "cancelled") || [];
  const completedTasks = tasks?.filter(t => t.status === "done") || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  const renderTaskList = (taskList: typeof tasks) => {
    if (!taskList || taskList.length === 0) {
      return (
        <EmptyState
          icon={CheckSquare}
          title="Aucune tâche"
          description="Aucune tâche dans cette catégorie."
        />
      );
    }

    return (
      <div className="space-y-3">
        {taskList.map((task) => (
          <Card 
            key={task.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/tasks/${task.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  {task.status === "done" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={cn(
                      "font-medium",
                      task.status === "done" && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={priorityColors[task.priority] || "bg-gray-100"}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {task.project?.name && (
                      <span className="truncate max-w-[150px]">{task.project.name}</span>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {statusLabels[task.status] || task.status}
                    </Badge>
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.due_date), "d MMM", { locale: fr })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="active">
          En cours
          {activeTasks.length > 0 && (
            <Badge variant="secondary" className="ml-2">{activeTasks.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="completed">
          Terminées
          {completedTasks.length > 0 && (
            <Badge variant="secondary" className="ml-2">{completedTasks.length}</Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="mt-4">
        {renderTaskList(activeTasks)}
      </TabsContent>
      <TabsContent value="completed" className="mt-4">
        {renderTaskList(completedTasks)}
      </TabsContent>
    </Tabs>
  );
}
