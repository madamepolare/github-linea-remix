import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";
import { Plus } from "lucide-react";

const phases = [
  { id: "planning", label: "Planning", color: "bg-blue-500" },
  { id: "design", label: "Design", color: "bg-amber-500" },
  { id: "execution", label: "Execution", color: "bg-green-500" },
  { id: "review", label: "Review", color: "bg-purple-500" },
  { id: "completed", label: "Completed", color: "bg-muted" },
];

export function ProjectBoard() {
  const { projects, isLoading } = useProjects();

  const getProjectsByPhase = (phaseId: string) => 
    projects.filter(p => p.phase === phaseId);

  if (isLoading) {
    return (
      <div className="h-full overflow-x-auto p-6">
        <div className="flex gap-4">
          {phases.map((phase) => (
            <div key={phase.id} className="w-72 flex-shrink-0">
              <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-x-auto p-6">
      <div className="flex gap-4 min-w-max">
        {phases.map((phase) => {
          const phaseProjects = getProjectsByPhase(phase.id);
          
          return (
            <div key={phase.id} className="w-72 flex-shrink-0">
              <div className="kanban-column">
                <div className="kanban-column-header border-b border-border">
                  <div className={cn("w-2 h-2 rounded-full", phase.color)} />
                  <span className="text-sm font-medium">{phase.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {phaseProjects.length}
                  </span>
                </div>

                <div className="p-2 space-y-2 flex-1">
                  {phaseProjects.map((project) => (
                    <Card key={project.id} className="task-card">
                      <CardContent className="p-3 space-y-3">
                        <div>
                          <p className="text-sm font-medium leading-snug">{project.name}</p>
                          {project.client && (
                            <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-2xs capitalize">
                            {phase.label}
                          </Badge>
                          
                          {project.budget && (
                            <span className="text-xs text-muted-foreground">
                              ${project.budget.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {phaseProjects.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No projects
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
