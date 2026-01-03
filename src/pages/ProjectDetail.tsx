import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useProject, useProjects } from "@/hooks/useProjects";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FolderKanban,
  HardHat,
  ListTodo,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { format, parseISO, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PROJECT_TYPES } from "@/lib/projectTypes";
import { ProjectChantierTab } from "@/components/projects/ProjectChantierTab";
import { ProjectPlanningTab } from "@/components/projects/ProjectPlanningTab";
import { ProjectMOESection } from "@/components/projects/ProjectMOESection";
import { PhaseQuickEditDialog } from "@/components/projects/PhaseQuickEditDialog";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { EntityTasksList } from "@/components/tasks/EntityTasksList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: project, isLoading } = useProject(id || null);
  const { updateProject } = useProjects();
  const [activeTab, setActiveTab] = useState("overview");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const handleGenerateSummary = async () => {
    if (!id) return;
    
    setIsGeneratingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-project-summary", {
        body: { projectId: id },
      });

      if (error) throw error;
      
      // Invalidate project query to refresh data
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Résumé généré avec succès");
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Erreur lors de la génération du résumé");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium">Projet non trouvé</h2>
            <Button variant="link" onClick={() => navigate("/projects")}>
              Retour aux projets
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const projectType = PROJECT_TYPES.find((t) => t.value === project.project_type);
  const phases = project.phases || [];
  const completedPhases = phases.filter((p) => p.status === "completed").length;
  const progressPercent = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
  const currentPhase = phases.find((p) => p.status === "in_progress");

  return (
    <MainLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-card">
          <div className="px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/projects")}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-muted shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div
                  className="w-1 sm:w-1.5 h-8 sm:h-10 rounded-full shrink-0"
                  style={{ backgroundColor: project.color || "#3B82F6" }}
                />
                <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">{project.name}</h1>
                    {projectType && (
                      <Badge variant="outline" className="text-[10px] sm:text-xs font-normal text-muted-foreground border-border hidden sm:inline-flex">
                        {projectType.label}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                    {project.crm_company && (
                      <span className="flex items-center gap-1 sm:gap-1.5">
                        <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="truncate max-w-[100px] sm:max-w-none">{project.crm_company.name}</span>
                      </span>
                    )}
                    {project.city && (
                      <span className="flex items-center gap-1 sm:gap-1.5 hidden sm:flex">
                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {project.city}
                      </span>
                    )}
                    {currentPhase && (
                      <>
                        <span className="text-border hidden sm:inline">•</span>
                        <Badge 
                          variant="secondary" 
                          className="bg-primary/10 text-primary border-0 font-normal text-[10px] sm:text-xs"
                        >
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                          <span className="truncate max-w-[80px] sm:max-w-none">{currentPhase.name}</span>
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-full shrink-0 self-end sm:self-auto">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 sm:px-6 pb-2 pt-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger value="planning">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Calendrier
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  <ListTodo className="h-3.5 w-3.5 mr-1.5" />
                  Tâches
                </TabsTrigger>
                <TabsTrigger value="chantier">
                  <HardHat className="h-3.5 w-3.5 mr-1.5" />
                  Réunions & CR
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {activeTab === "overview" && (
            <OverviewTab 
              project={project} 
              phases={phases} 
              progressPercent={progressPercent}
              onRefreshSummary={handleGenerateSummary}
              isGeneratingSummary={isGeneratingSummary}
              onUpdateProject={(updates) => updateProject.mutate({ id: project.id, ...updates })}
              isUpdatingProject={updateProject.isPending}
            />
          )}
          {activeTab === "planning" && <ProjectPlanningTab projectId={project.id} />}
          {activeTab === "tasks" && (
            <EntityTasksList entityType="project" entityId={project.id} entityName={project.name} />
          )}
          {activeTab === "chantier" && <ProjectChantierTab projectId={project.id} />}
        </div>
      </div>
    </MainLayout>
  );
}

interface OverviewTabProps {
  project: any;
  phases: any[];
  progressPercent: number;
  onRefreshSummary: () => void;
  isGeneratingSummary: boolean;
  onUpdateProject: (updates: any) => void;
  isUpdatingProject: boolean;
}

function OverviewTab({ project, phases, progressPercent, onRefreshSummary, isGeneratingSummary, onUpdateProject, isUpdatingProject }: OverviewTabProps) {
  const completedPhases = phases.filter((p) => p.status === "completed").length;
  const { updatePhase, createPhase, deletePhase, reorderPhases } = useProjectPhases(project.id);
  const [phaseEditOpen, setPhaseEditOpen] = useState(false);
  const [projectEditOpen, setProjectEditOpen] = useState(false);
  const [confirmPhaseId, setConfirmPhaseId] = useState<string | null>(null);
  const { updateProject } = useProjects();

  const projectType = PROJECT_TYPES.find((t) => t.value === project.project_type);

  // Find current phase (in_progress or first pending)
  const currentPhase = phases.find((p) => p.status === "in_progress") || 
                       phases.find((p) => p.status === "pending");
  const currentPhaseIndex = currentPhase ? phases.findIndex(p => p.id === currentPhase.id) : -1;
  const nextPhase = currentPhaseIndex >= 0 && currentPhaseIndex < phases.length - 1 
    ? phases[currentPhaseIndex + 1] 
    : null;

  const activatePhase = (phaseId: string) => {
    const targetPhase = phases.find(p => p.id === phaseId);
    if (!targetPhase) return;
    
    // Mark all phases before this one as completed, this one as in_progress, and after as pending
    const targetIndex = phases.findIndex(p => p.id === phaseId);
    phases.forEach((phase, index) => {
      if (index < targetIndex && phase.status !== "completed") {
        updatePhase.mutate({ id: phase.id, status: "completed" });
      } else if (index === targetIndex && phase.status !== "in_progress") {
        updatePhase.mutate({ id: phase.id, status: "in_progress" });
      } else if (index > targetIndex && phase.status !== "pending") {
        updatePhase.mutate({ id: phase.id, status: "pending" });
      }
    });
    toast.success(`Phase "${targetPhase.name}" activée`);
    setConfirmPhaseId(null);
  };

  const handlePhaseClick = (phase: any, index: number) => {
    const isActive = phase.status === "in_progress";
    const isCompleted = phase.status === "completed";
    
    if (isActive && nextPhase) {
      completeCurrentAndActivateNext();
    } else if (isCompleted) {
      // Show confirmation for going back
      setConfirmPhaseId(phase.id);
    } else {
      // Pending phase - just activate
      activatePhase(phase.id);
    }
  };

  const phaseToConfirm = phases.find(p => p.id === confirmPhaseId);

  const completeCurrentAndActivateNext = () => {
    if (!currentPhase) return;
    updatePhase.mutate({ id: currentPhase.id, status: "completed" });
    if (nextPhase) {
      updatePhase.mutate({ id: nextPhase.id, status: "in_progress" });
      toast.success(`Phase "${nextPhase.name}" activée`);
    } else {
      toast.success("Toutes les phases sont terminées!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Phase Progress - Main focus */}
      {phases.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Current Phase Header */}
            <div className="bg-primary/5 border-b border-primary/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Phase actuelle</p>
                  <h2 className="text-xl font-semibold text-foreground">
                    {currentPhase?.name || "Aucune phase active"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {currentPhase && (
                    <Button 
                      onClick={completeCurrentAndActivateNext}
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {nextPhase ? `Passer à ${nextPhase.name}` : "Terminer"}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{completedPhases}/{phases.length} phases</span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>

            {/* Phases Timeline */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {phases.map((phase, index) => {
                  const isActive = phase.status === "in_progress";
                  const isCompleted = phase.status === "completed";
                  const isPending = phase.status === "pending";
                  const hasDate = phase.start_date || phase.end_date;
                  const isOverdue = !isCompleted && phase.end_date && isPast(parseISO(phase.end_date)) && !isToday(parseISO(phase.end_date));
                  
                  return (
                    <div key={phase.id} className="flex items-center">
                      <button
                        onClick={() => handlePhaseClick(phase, index)}
                        title={isCompleted ? "Cliquer pour revenir à cette phase" : isActive ? "Phase actuelle" : "Cliquer pour activer"}
                        className={cn(
                          "relative flex flex-col items-start gap-0.5 px-3 py-2 rounded-lg transition-all min-w-max cursor-pointer",
                          isActive && !isOverdue && "bg-primary text-primary-foreground shadow-lg scale-105",
                          isActive && isOverdue && "bg-destructive text-destructive-foreground shadow-lg scale-105",
                          isCompleted && "bg-muted text-muted-foreground hover:bg-muted/80",
                          isPending && !isOverdue && "bg-background border border-border hover:border-primary/50 hover:bg-primary/5",
                          isPending && isOverdue && "bg-destructive/10 border border-destructive/30 hover:border-destructive/50"
                        )}
                      >
                        {isOverdue && (
                          <div className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5">
                            <AlertTriangle className="h-3 w-3" />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                            isActive && !isOverdue && "bg-primary-foreground/20",
                            isActive && isOverdue && "bg-destructive-foreground/20",
                            isCompleted && "bg-success text-success-foreground",
                            isPending && "bg-muted-foreground/20"
                          )}>
                            {isCompleted ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <span className={cn(
                            "text-sm font-medium whitespace-nowrap",
                            isCompleted && "line-through"
                          )}>
                            {phase.name}
                          </span>
                        </div>
                        {hasDate && (
                          <span className={cn(
                            "text-[10px] pl-7 whitespace-nowrap",
                            isActive && !isOverdue && "text-primary-foreground/70",
                            isActive && isOverdue && "text-destructive-foreground/70",
                            !isActive && isOverdue && "text-destructive",
                            !isActive && !isOverdue && "text-muted-foreground"
                          )}>
                            {phase.start_date && format(parseISO(phase.start_date), "dd MMM", { locale: fr })}
                            {phase.start_date && phase.end_date && " → "}
                            {phase.end_date && format(parseISO(phase.end_date), "dd MMM", { locale: fr })}
                            {isOverdue && " (en retard)"}
                          </span>
                        )}
                      </button>
                      
                      {index < phases.length - 1 && (
                        <div className={cn(
                          "w-6 h-0.5 mx-1 shrink-0",
                          phases[index + 1].status === "completed" || isCompleted 
                            ? "bg-success" 
                            : "bg-border"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-end mt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => setPhaseEditOpen(true)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Gérer les phases
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Info - Compact */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-medium">Informations du projet</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs"
              onClick={() => setProjectEditOpen(true)}
            >
              <Pencil className="h-3 w-3 mr-1" />
              Modifier
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {projectType && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Type</p>
                <p className="font-medium">{projectType.label}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Client</p>
              <p className="font-medium">{project.crm_company?.name || <span className="text-muted-foreground italic">—</span>}</p>
            </div>
            {project.city && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Ville</p>
                <p className="font-medium">{project.city}</p>
              </div>
            )}
            {(project.start_date || project.end_date) && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Période</p>
                <p className="font-medium">
                  {project.start_date && format(parseISO(project.start_date), "MMM yy", { locale: fr })}
                  {project.start_date && project.end_date && " → "}
                  {project.end_date && format(parseISO(project.end_date), "MMM yy", { locale: fr })}
                </p>
              </div>
            )}
            {project.surface_area && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Surface</p>
                <p className="font-medium">{project.surface_area} m²</p>
              </div>
            )}
            {project.budget && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Budget</p>
                <p className="font-medium">{project.budget.toLocaleString("fr-FR")} €</p>
              </div>
            )}
          </div>

          {project.description && (
            <p className="mt-4 pt-4 border-t text-sm text-muted-foreground leading-relaxed">
              {project.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* MOE Team */}
      <Card>
        <CardContent className="py-5">
          <ProjectMOESection projectId={project.id} />
        </CardContent>
      </Card>

      {/* AI Summary - Optional */}
      {project.ai_summary && (
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-sm font-medium">Résumé AI</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={onRefreshSummary}
                disabled={isGeneratingSummary}
              >
                {isGeneratingSummary ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{project.ai_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <PhaseQuickEditDialog
        open={phaseEditOpen}
        onOpenChange={setPhaseEditOpen}
        phases={phases}
        onCreatePhase={(phase) => createPhase.mutate(phase)}
        onUpdatePhase={(id, updates) => updatePhase.mutate({ id, ...updates })}
        onDeletePhase={(id) => deletePhase.mutate(id)}
        onReorderPhases={(orderedIds) => reorderPhases.mutate(orderedIds)}
      />

      <EditProjectDialog
        open={projectEditOpen}
        onOpenChange={setProjectEditOpen}
        project={project}
        onSave={(updates) => {
          onUpdateProject(updates);
          setProjectEditOpen(false);
        }}
        isSaving={isUpdatingProject}
      />

      {/* Confirmation dialog for going back to a previous phase */}
      <AlertDialog open={!!confirmPhaseId} onOpenChange={(open) => !open && setConfirmPhaseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revenir à une phase précédente ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez réactiver la phase "{phaseToConfirm?.name}". 
              Les phases suivantes seront remises en attente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmPhaseId && activatePhase(confirmPhaseId)}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
