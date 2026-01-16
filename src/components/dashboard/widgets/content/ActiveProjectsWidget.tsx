import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronRight, Clock, FolderKanban } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";

const phaseColors: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  design: "bg-info/10 text-info",
  development: "bg-accent/10 text-accent",
  execution: "bg-warning/10 text-warning",
  review: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
};

const phaseLabels: Record<string, string> = {
  planning: "Planif",
  design: "Concept",
  development: "Dev",
  execution: "Exec",
  review: "Revue",
  completed: "Terminé",
};

export function ActiveProjectsWidget() {
  const navigate = useNavigate();
  const { projects, isLoading } = useProjects();

  // Get recent active projects
  const activeProjects = projects
    .filter(p => p.status === 'active')
    .slice(0, 5);

  // Calculate progress based on phases
  const getProgress = (project: typeof projects[0]): number => {
    if (!project.phases || project.phases.length === 0) return 0;
    const completedPhases = project.phases.filter(p => p.status === 'completed').length;
    return Math.round((completedPhases / project.phases.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 rounded-lg border border-border">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2 mb-3" />
            <Skeleton className="h-1.5 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (activeProjects.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
        <FolderKanban className="h-8 w-8 opacity-50" />
        <span className="text-sm">Aucun projet actif</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full -mx-1 px-1">
      <div className="space-y-2">
        {activeProjects.map((project) => {
          const progress = getProgress(project);
          const phase = project.phase || 'planning';
          
          return (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium truncate">{project.name}</h4>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0",
                        phaseColors[phase] || "bg-muted text-muted-foreground"
                      )}
                    >
                      {phaseLabels[phase] || phase}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {project.crm_company?.name || project.client || "—"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-medium tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>

              {project.end_date && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    Échéance : {format(new Date(project.end_date), "d MMM yyyy", { locale: fr })}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
