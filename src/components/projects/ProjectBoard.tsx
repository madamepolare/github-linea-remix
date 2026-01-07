import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/KanbanBoard";
import { useProjects, Project } from "@/hooks/useProjects";
import { FolderKanban, Calendar, Building2, MapPin, MoreHorizontal, Eye, Trash2, Copy, Wallet } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { PROJECT_TYPES } from "@/lib/projectTypes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
  const navigate = useNavigate();
  const { projects, isLoading, updateProject, deleteProject } = useProjects();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleDrop = (projectId: string, _fromColumn: string, toColumn: string) => {
    updateProject.mutate({ id: projectId, phase: toColumn });
  };

  const handleDelete = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject.mutate(projectToDelete.id, {
        onSuccess: () => {
          toast.success("Projet supprimé");
          setDeleteDialogOpen(false);
          setProjectToDelete(null);
        },
      });
    }
  };

  // Calculate stats per phase
  const getPhaseStats = (phaseId: string) => {
    const phaseProjects = projects.filter((p) => p.phase === phaseId);
    const totalBudget = phaseProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
    return { count: phaseProjects.length, totalBudget };
  };

  const kanbanColumns: KanbanColumn<Project>[] = phases.map((phase) => {
    const stats = getPhaseStats(phase.id);
    return {
      id: phase.id,
      label: phase.label,
      color: phase.color,
      items: projects.filter((p) => p.phase === phase.id),
      metadata: stats.totalBudget > 0 ? `${(stats.totalBudget / 1000).toFixed(0)}k €` : undefined,
    };
  });

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
    <>
      <KanbanBoard<Project>
        columns={kanbanColumns}
        isLoading={isLoading}
        onDrop={handleDrop}
        getItemId={(project) => project.id}
        renderCard={(project, isDragging) => (
          <ProjectKanbanCard
            project={project}
            onClick={() => navigate(`/projects/${project.id}`)}
            onDelete={() => handleDelete(project)}
            isDragging={isDragging}
          />
        )}
        className="pt-4"
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le projet "{projectToDelete?.name}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface ProjectKanbanCardProps {
  project: Project;
  onClick: () => void;
  onDelete: () => void;
  isDragging: boolean;
}

function ProjectKanbanCard({ project, onClick, onDelete, isDragging }: ProjectKanbanCardProps) {
  const projectType = PROJECT_TYPES.find((t) => t.value === project.project_type);
  const phases = project.phases || [];
  const completedPhases = phases.filter((p) => p.status === "completed").length;
  const progressPercent = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
  const currentPhase = phases.find((p) => p.status === "in_progress");
  const displayColor = projectType?.color || project.color || "#3B82F6";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <KanbanCard onClick={onClick} accentColor={displayColor}>
      <div className="space-y-3">
        {/* Header with title and menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug line-clamp-2">{project.name}</p>
            {projectType && (
              <Badge 
                variant="secondary" 
                className="mt-1 text-2xs"
                style={{ 
                  backgroundColor: `${displayColor}20`,
                  color: displayColor,
                }}
              >
                {projectType.label}
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-1 -mt-1">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onClick}>
                <Eye className="h-4 w-4 mr-2" />
                Voir le projet
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Client and location */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {project.crm_company && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{project.crm_company.name}</span>
            </div>
          )}
          {project.city && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{project.city}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        {phases.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate">
                {currentPhase ? currentPhase.name : "Aucune phase active"}
              </span>
              <span className="font-medium shrink-0">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        )}

        {/* Footer: Budget and dates */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
          {project.budget ? (
            <span className="text-xs font-medium text-primary flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              {formatCurrency(project.budget)}
            </span>
          ) : (
            <span />
          )}

          {project.end_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(parseISO(project.end_date), "d MMM", { locale: fr })}</span>
            </div>
          )}
        </div>
      </div>
    </KanbanCard>
  );
}
