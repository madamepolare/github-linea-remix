import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useProject, useProjects } from "@/hooks/useProjects";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { usePhaseDependencies } from "@/hooks/usePhaseDependencies";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  HardHat,
  ListTodo,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Ruler,
  Sparkles,
  Wallet,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PROJECT_TYPES, PHASE_STATUS_CONFIG } from "@/lib/projectTypes";
import { ProjectChantierTab } from "@/components/projects/ProjectChantierTab";
import { ProjectEventsTab } from "@/components/projects/ProjectEventsTab";
import { ProjectMOESection } from "@/components/projects/ProjectMOESection";
import { PhaseGanttTimeline } from "@/components/projects/PhaseGanttTimeline";
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
        <div className="flex-shrink-0 border-b border-border bg-background">
          <div className="px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/projects")}
                  className="mt-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-8 rounded-full"
                      style={{ backgroundColor: project.color || "#3B82F6" }}
                    />
                    <h1 className="text-xl font-semibold">{project.name}</h1>
                    {currentPhase && (
                      <Badge 
                        variant="secondary" 
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {currentPhase.name}
                      </Badge>
                    )}
                    {projectType && (
                      <Badge variant="outline" className="text-muted-foreground">
                        {projectType.label}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
            <TabsList className="h-10 bg-transparent p-0 border-b-0">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Événements
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <ListTodo className="h-4 w-4 mr-2" />
                Tâches
              </TabsTrigger>
              <TabsTrigger
                value="chantier"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <HardHat className="h-4 w-4 mr-2" />
                Chantier
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
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
          {activeTab === "events" && <ProjectEventsTab projectId={project.id} />}
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
  const { dependencies } = usePhaseDependencies(project.id);
  const { updatePhase, createPhase, deletePhase, reorderPhases } = useProjectPhases(project.id);
  const [phaseEditOpen, setPhaseEditOpen] = useState(false);
  const [projectEditOpen, setProjectEditOpen] = useState(false);
  const { updateProject } = useProjects();

  const projectType = PROJECT_TYPES.find((t) => t.value === project.project_type);

  // Determine current phase based on today's date
  const currentPhaseByDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Sort phases by start_date
    const sortedPhases = [...phases].sort((a, b) => {
      if (!a.start_date && !b.start_date) return a.sort_order - b.sort_order;
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    });

    // Find the phase where today falls between start and end
    for (const phase of sortedPhases) {
      if (phase.start_date && phase.end_date) {
        const start = new Date(phase.start_date);
        const end = new Date(phase.end_date);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        if (today >= start && today <= end) {
          return phase;
        }
      }
    }

    // If no exact match, find the closest upcoming phase
    for (const phase of sortedPhases) {
      if (phase.start_date) {
        const start = new Date(phase.start_date);
        start.setHours(0, 0, 0, 0);
        if (today < start) {
          return phase;
        }
      }
    }

    // Return the last phase if we're past all dates
    return sortedPhases[sortedPhases.length - 1] || null;
  }, [phases]);

  // Update phase statuses based on today's date
  useEffect(() => {
    if (!phases.length) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    phases.forEach(phase => {
      if (phase.start_date && phase.end_date) {
        const start = new Date(phase.start_date);
        const end = new Date(phase.end_date);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        let expectedStatus: "pending" | "in_progress" | "completed" = "pending";
        
        if (today > end) {
          expectedStatus = "completed";
        } else if (today >= start && today <= end) {
          expectedStatus = "in_progress";
        }

        // Only update if status doesn't match and it's not manually overridden
        if (phase.status !== expectedStatus) {
          updatePhase.mutate({ id: phase.id, status: expectedStatus });
        }
      }
    });

    // Also update project's current_phase_id if it differs
    if (currentPhaseByDate && project.current_phase_id !== currentPhaseByDate.id) {
      updateProject.mutate({ id: project.id, current_phase_id: currentPhaseByDate.id });
    }
  }, [phases, currentPhaseByDate?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const cyclePhaseStatus = (phase: any) => {
    const statusOrder: Array<"pending" | "in_progress" | "completed"> = ["pending", "in_progress", "completed"];
    const currentIndex = statusOrder.indexOf(phase.status || "pending");
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    updatePhase.mutate({ id: phase.id, status: nextStatus });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Main Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Project Info */}
        <Card>
          <CardContent className="py-5">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-medium">Informations</h3>
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
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {projectType && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Type</p>
                  <p className="font-medium">{projectType.label}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Client</p>
                <p className="font-medium">{project.crm_company?.name || <span className="text-muted-foreground italic">Non défini</span>}</p>
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

        {/* Gantt Timeline */}
        {phases.length > 0 && (
          <Card>
            <CardContent className="py-5">
              <h3 className="text-sm font-medium mb-4">Planning</h3>
              <PhaseGanttTimeline
                key={phases.map(p => `${p.id}-${p.start_date}-${p.end_date}`).join("|")}
                phases={phases}
                dependencies={dependencies}
                onPhaseUpdate={(phaseId, updates) => {
                  updatePhase.mutate({ id: phaseId, ...updates });
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column - Progress & Phases */}
      <div className="space-y-6">
        {/* Progress */}
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Avancement</h3>
              <span className="text-xl font-bold text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">{completedPhases}/{phases.length} phases terminées</p>
          </CardContent>
        </Card>

        {/* Phases List */}
        {phases.length > 0 && (
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Phases</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs"
                  onClick={() => setPhaseEditOpen(true)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Gérer
                </Button>
              </div>
              <div className="space-y-1.5">
                {phases.map((phase, index) => (
                  <button
                    key={phase.id}
                    onClick={() => cyclePhaseStatus(phase)}
                    className={cn(
                      "w-full flex items-center gap-2.5 p-2 rounded-lg transition-all text-left",
                      "hover:bg-muted/50 cursor-pointer",
                      phase.status === "in_progress" && "bg-primary/5 ring-1 ring-primary/20",
                      phase.status === "completed" && "bg-muted/30"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 transition-colors",
                        phase.status === "completed" && "bg-primary text-primary-foreground",
                        phase.status === "in_progress" && "bg-primary/20 text-primary ring-2 ring-primary",
                        phase.status === "pending" && "bg-muted text-muted-foreground"
                      )}
                    >
                      {phase.status === "completed" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={cn(
                      "flex-1 text-sm truncate",
                      phase.status === "completed" && "line-through text-muted-foreground"
                    )}>
                      {phase.name}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-[9px] px-1.5 py-0",
                        phase.status === "in_progress" && "bg-primary/10 text-primary",
                        phase.status === "completed" && "bg-emerald-500/10 text-emerald-600",
                        phase.status === "pending" && "bg-muted text-muted-foreground"
                      )}
                    >
                      {phase.status === "completed" ? "✓" : phase.status === "in_progress" ? "En cours" : "À faire"}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Summary */}
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
            {project.ai_summary ? (
              <p className="text-xs text-muted-foreground leading-relaxed">{project.ai_summary}</p>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                className="w-full h-8 text-xs"
                onClick={onRefreshSummary}
                disabled={isGeneratingSummary}
              >
                {isGeneratingSummary ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Générer
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
