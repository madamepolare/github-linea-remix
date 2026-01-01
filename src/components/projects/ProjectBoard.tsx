import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/KanbanBoard";
import { useProjects, Project } from "@/hooks/useProjects";
import { FolderKanban, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const phases = [
  { id: "planning", label: "Planification", color: "#3b82f6" },
  { id: "design", label: "Conception", color: "#f59e0b" },
  { id: "execution", label: "Exécution", color: "#22c55e" },
  { id: "review", label: "Revue", color: "#8b5cf6" },
  { id: "completed", label: "Terminé", color: "#6b7280" },
];

interface ProjectBoardProps {
  onCreateProject?: () => void;
}

export function ProjectBoard({ onCreateProject }: ProjectBoardProps) {
  const { projects, isLoading, updateProject } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleDrop = (projectId: string, _fromColumn: string, toColumn: string) => {
    updateProject.mutate({ id: projectId, phase: toColumn });
  };

  const kanbanColumns: KanbanColumn<Project>[] = phases.map((phase) => ({
    id: phase.id,
    label: phase.label,
    color: phase.color,
    items: projects.filter((p) => p.phase === phase.id),
  }));

  // Check if no projects at all
  if (!isLoading && projects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <EmptyState
          icon={FolderKanban}
          title="Aucun projet"
          description="Créez votre premier projet pour organiser vos tâches et suivre votre progression."
          action={onCreateProject ? { label: "Créer un projet", onClick: onCreateProject } : undefined}
        />
      </div>
    );
  }

  return (
    <KanbanBoard<Project>
      columns={kanbanColumns}
      isLoading={isLoading}
      onDrop={handleDrop}
      getItemId={(project) => project.id}
      renderCard={(project, isDragging) => (
        <ProjectKanbanCard
          project={project}
          onClick={() => setSelectedProject(project)}
          isDragging={isDragging}
        />
      )}
      className="pt-4"
    />
  );
}

interface ProjectKanbanCardProps {
  project: Project;
  onClick: () => void;
  isDragging: boolean;
}

function ProjectKanbanCard({ project, onClick, isDragging }: ProjectKanbanCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <KanbanCard onClick={onClick} accentColor={project.color || undefined}>
      <div className="space-y-2.5">
        {/* Project name and client */}
        <div>
          <p className="text-sm font-medium leading-snug line-clamp-2">{project.name}</p>
          {project.client && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.client}</p>
          )}
        </div>

        {/* Status badge */}
        {project.status && (
          <Badge variant="secondary" className="text-2xs capitalize">
            {project.status}
          </Badge>
        )}

        {/* Footer: Budget and dates */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {project.budget ? (
            <span className="text-xs font-medium text-primary">
              {formatCurrency(project.budget)}
            </span>
          ) : (
            <span />
          )}

          {project.end_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(project.end_date), "d MMM", { locale: fr })}</span>
            </div>
          )}
        </div>
      </div>
    </KanbanCard>
  );
}
