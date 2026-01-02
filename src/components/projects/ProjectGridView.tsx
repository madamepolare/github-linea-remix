import { useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, Calendar, FolderKanban, MapPin, Wallet } from "lucide-react";
import { PROJECT_TYPES } from "@/lib/projectTypes";

interface ProjectGridViewProps {
  onCreateProject?: () => void;
}

export function ProjectGridView({ onCreateProject }: ProjectGridViewProps) {
  const navigate = useNavigate();
  const { projects, isLoading } = useProjects();

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <EmptyState
          icon={FolderKanban}
          title="Aucun projet"
          description="Créez votre premier projet pour commencer."
          action={onCreateProject ? { label: "Créer un projet", onClick: onCreateProject } : undefined}
        />
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {projects.map((project) => {
        const projectType = PROJECT_TYPES.find((t) => t.value === project.project_type);
        const phases = project.phases || [];
        const completedPhases = phases.filter((p) => p.status === "completed").length;
        const progressPercent = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
        const currentPhase = phases.find((p) => p.status === "in_progress");

        return (
          <Card
            key={project.id}
            interactive
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            {/* Color bar at top */}
            <div
              className="h-2 w-full"
              style={{ backgroundColor: project.color || "#3B82F6" }}
            />
            
            <CardContent className="p-4 space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
                    {project.name}
                  </h3>
                  {projectType && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {projectType.label}
                    </Badge>
                  )}
                </div>
                
                {/* Location & Client */}
                <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                  {project.crm_company && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {project.crm_company.name}
                    </span>
                  )}
                  {project.city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {project.city}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {currentPhase ? currentPhase.name : "Aucune phase"}
                  </span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Footer Info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                {project.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(project.start_date), "d MMM yyyy", { locale: fr })}
                  </span>
                )}
                {project.budget && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Wallet className="h-3 w-3" />
                    {(project.budget / 1000).toFixed(0)}k €
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
