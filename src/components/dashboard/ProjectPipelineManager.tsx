import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useWorkspaceNavigation } from "@/hooks/useWorkspaceNavigation";
import { cn } from "@/lib/utils";
import { useProjects, Project, ProjectPhase } from "@/hooks/useProjects";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronRight,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MoreVertical,
  ExternalLink,
  SkipForward,
  Calendar,
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface ProjectWithCurrentPhase extends Project {
  currentPhase: ProjectPhase | null;
  nextPhase: ProjectPhase | null;
  phaseProgress: number;
  phasesCompleted: number;
  totalPhases: number;
  isPhaseOverdue: boolean;
  daysRemaining: number | null;
}

export function ProjectPipelineManager() {
  const { navigate } = useWorkspaceNavigation();
  const { projects, isLoading, updateProject } = useProjects();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const projectsWithPhaseInfo = useMemo<ProjectWithCurrentPhase[]>(() => {
    return projects
      .filter(p => p.status === "active")
      .map((project) => {
        const phases = project.phases || [];
        const sortedPhases = [...phases].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        
        // Find current phase (in_progress or first pending if none in progress)
        let currentPhase = sortedPhases.find(p => p.status === "in_progress") || null;
        if (!currentPhase) {
          currentPhase = sortedPhases.find(p => p.status === "pending") || null;
        }
        
        // Find next phase
        const currentIndex = currentPhase 
          ? sortedPhases.findIndex(p => p.id === currentPhase!.id)
          : -1;
        const nextPhase = currentIndex >= 0 && currentIndex < sortedPhases.length - 1
          ? sortedPhases[currentIndex + 1]
          : null;
        
        // Calculate progress
        const completedPhases = sortedPhases.filter(p => p.status === "completed").length;
        const inProgressPhases = sortedPhases.filter(p => p.status === "in_progress").length;
        const phaseProgress = sortedPhases.length > 0 
          ? ((completedPhases + (inProgressPhases * 0.5)) / sortedPhases.length) * 100
          : 0;
        
        // Check if current phase is overdue
        const isPhaseOverdue = currentPhase?.end_date 
          ? isPast(new Date(currentPhase.end_date)) && currentPhase.status !== "completed"
          : false;
        
        // Calculate days remaining
        const daysRemaining = currentPhase?.end_date 
          ? differenceInDays(new Date(currentPhase.end_date), new Date())
          : null;
        
        return {
          ...project,
          currentPhase,
          nextPhase,
          phaseProgress,
          phasesCompleted: completedPhases,
          totalPhases: sortedPhases.length,
          isPhaseOverdue,
          daysRemaining,
        };
      })
      .sort((a, b) => {
        // Sort: overdue first, then by days remaining
        if (a.isPhaseOverdue && !b.isPhaseOverdue) return -1;
        if (!a.isPhaseOverdue && b.isPhaseOverdue) return 1;
        if (a.daysRemaining !== null && b.daysRemaining !== null) {
          return a.daysRemaining - b.daysRemaining;
        }
        return 0;
      });
  }, [projects]);

  const toggleExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card"
      >
        <div className="border-b border-border px-6 py-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </motion.div>
    );
  }

  const overdueCount = projectsWithPhaseInfo.filter(p => p.isPhaseOverdue).length;
  const upcomingCount = projectsWithPhaseInfo.filter(p => 
    p.daysRemaining !== null && p.daysRemaining >= 0 && p.daysRemaining <= 7
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            Gestion des Phases
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-muted-foreground">
              {projectsWithPhaseInfo.length} projets actifs
            </span>
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueCount} en retard
              </Badge>
            )}
            {upcomingCount > 0 && (
              <Badge variant="outline" className="text-xs border-warning text-warning">
                {upcomingCount} à terminer cette semaine
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/projects")}
        >
          Voir tous
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="divide-y divide-border">
        {projectsWithPhaseInfo.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Aucun projet actif avec des phases
          </div>
        ) : (
          projectsWithPhaseInfo.slice(0, 8).map((project, index) => (
            <ProjectPhaseRow
              key={project.id}
              project={project}
              index={index}
              isExpanded={expandedProjects.has(project.id)}
              onToggleExpanded={() => toggleExpanded(project.id)}
              onNavigate={() => navigate(`/projects/${project.id}`)}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

interface ProjectPhaseRowProps {
  project: ProjectWithCurrentPhase;
  index: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onNavigate: () => void;
}

function ProjectPhaseRow({ 
  project, 
  index, 
  isExpanded, 
  onToggleExpanded,
  onNavigate 
}: ProjectPhaseRowProps) {
  const { updatePhase } = useProjectPhases(project.id);

  const handleActivatePhase = async (phaseId: string) => {
    try {
      // Complete current phase if exists
      if (project.currentPhase && project.currentPhase.id !== phaseId) {
        await updatePhase.mutateAsync({
          id: project.currentPhase.id,
          status: "completed",
        });
      }
      // Activate new phase
      await updatePhase.mutateAsync({
        id: phaseId,
        status: "in_progress",
      });
      toast.success("Phase activée");
    } catch (error) {
      toast.error("Erreur lors de l'activation de la phase");
    }
  };

  const handleCompleteCurrentPhase = async () => {
    if (!project.currentPhase) return;
    try {
      await updatePhase.mutateAsync({
        id: project.currentPhase.id,
        status: "completed",
      });
      // Auto-activate next phase
      if (project.nextPhase) {
        await updatePhase.mutateAsync({
          id: project.nextPhase.id,
          status: "in_progress",
        });
        toast.success(`Phase "${project.currentPhase.name}" terminée, "${project.nextPhase.name}" activée`);
      } else {
        toast.success(`Phase "${project.currentPhase.name}" terminée`);
      }
    } catch (error) {
      toast.error("Erreur lors de la complétion de la phase");
    }
  };

  const handleSkipToNextPhase = async () => {
    if (!project.nextPhase) return;
    try {
      if (project.currentPhase) {
        await updatePhase.mutateAsync({
          id: project.currentPhase.id,
          status: "completed",
        });
      }
      await updatePhase.mutateAsync({
        id: project.nextPhase.id,
        status: "in_progress",
      });
      toast.success(`Passé à la phase "${project.nextPhase.name}"`);
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const phases = project.phases || [];
  const sortedPhases = [...phases].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "px-6 py-4 hover:bg-muted/50 transition-colors",
        project.isPhaseOverdue && "bg-destructive/5"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Expand button */}
        <button
          onClick={onToggleExpanded}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        {/* Project color indicator */}
        <div
          className="h-10 w-1.5 rounded-full shrink-0"
          style={{ backgroundColor: project.color || "hsl(var(--primary))" }}
        />

        {/* Project info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigate}
              className="font-medium text-foreground hover:text-primary truncate transition-colors"
            >
              {project.name}
            </button>
            {project.isPhaseOverdue && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex shrink-0">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Phase en retard</TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {project.currentPhase ? (
              <>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    project.currentPhase.status === "in_progress" && "border-primary text-primary",
                    project.currentPhase.status === "pending" && "border-muted-foreground text-muted-foreground"
                  )}
                >
                  {project.currentPhase.status === "in_progress" ? (
                    <Play className="h-3 w-3 mr-1" />
                  ) : (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  {project.currentPhase.name}
                </Badge>
                {project.daysRemaining !== null && (
                  <span className={cn(
                    "text-xs",
                    project.daysRemaining < 0 && "text-destructive",
                    project.daysRemaining >= 0 && project.daysRemaining <= 7 && "text-warning",
                    project.daysRemaining > 7 && "text-muted-foreground"
                  )}>
                    {project.daysRemaining < 0 
                      ? `${Math.abs(project.daysRemaining)}j de retard`
                      : project.daysRemaining === 0 
                        ? "Échéance aujourd'hui"
                        : `${project.daysRemaining}j restants`}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Aucune phase active</span>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="w-32 shrink-0 hidden sm:block">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{project.phasesCompleted}/{project.totalPhases}</span>
            <span>{Math.round(project.phaseProgress)}%</span>
          </div>
          <Progress value={project.phaseProgress} className="h-1.5" />
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1 shrink-0">
          {project.currentPhase && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCompleteCurrentPhase}
                  className="text-success hover:text-success hover:bg-success/10"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Terminer la phase actuelle</TooltipContent>
            </Tooltip>
          )}
          
          {project.nextPhase && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleSkipToNextPhase}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Passer à "{project.nextPhase.name}"</TooltipContent>
            </Tooltip>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onNavigate}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir le projet
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {sortedPhases
                .filter(p => p.status !== "completed")
                .map(phase => (
                  <DropdownMenuItem 
                    key={phase.id}
                    onClick={() => handleActivatePhase(phase.id)}
                    disabled={phase.status === "in_progress"}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Activer "{phase.name}"
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded phases list */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 ml-8 pl-4 border-l-2 border-border"
        >
          <div className="space-y-2">
            {sortedPhases.map((phase, phaseIndex) => (
              <PhaseItem
                key={phase.id}
                phase={phase}
                isCurrentPhase={project.currentPhase?.id === phase.id}
                onActivate={() => handleActivatePhase(phase.id)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

interface PhaseItemProps {
  phase: ProjectPhase;
  isCurrentPhase: boolean;
  onActivate: () => void;
}

function PhaseItem({ phase, isCurrentPhase, onActivate }: PhaseItemProps) {
  const isOverdue = phase.end_date && isPast(new Date(phase.end_date)) && phase.status !== "completed";
  
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg transition-colors",
        isCurrentPhase && "bg-primary/10",
        phase.status === "completed" && "opacity-60"
      )}
    >
      <div
        className={cn(
          "h-2.5 w-2.5 rounded-full shrink-0",
          phase.status === "completed" && "bg-success",
          phase.status === "in_progress" && "bg-primary animate-pulse",
          phase.status === "pending" && "bg-muted-foreground"
        )}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm",
            isCurrentPhase && "font-medium text-primary",
            phase.status === "completed" && "line-through"
          )}>
            {phase.name}
          </span>
          {phase.status === "completed" && (
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          )}
          {isOverdue && (
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          )}
        </div>
        {phase.end_date && (
          <span className={cn(
            "text-xs",
            isOverdue ? "text-destructive" : "text-muted-foreground"
          )}>
            <Calendar className="inline h-3 w-3 mr-1" />
            {format(new Date(phase.end_date), "d MMM yyyy", { locale: fr })}
          </span>
        )}
      </div>

      {phase.status === "pending" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onActivate}
              className="text-muted-foreground hover:text-primary"
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Démarrer cette phase</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
