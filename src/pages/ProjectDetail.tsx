import { useState } from "react";
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
  const inProgressPhase = phases.find((p) => p.status === "in_progress");
  const { dependencies } = usePhaseDependencies(project.id);
  const { updatePhase, createPhase, deletePhase, reorderPhases } = useProjectPhases(project.id);
  const [phaseEditOpen, setPhaseEditOpen] = useState(false);
  const [projectEditOpen, setProjectEditOpen] = useState(false);

  const projectType = PROJECT_TYPES.find((t) => t.value === project.project_type);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Project Info - Compact inline layout */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Informations du projet</h3>
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
          
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {projectType && (
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <span>{projectType.label}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{project.crm_company?.name || <span className="text-muted-foreground italic">Client non défini</span>}</span>
            </div>
            {project.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{project.city}</span>
              </div>
            )}
            {(project.start_date || project.end_date) && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {project.start_date && format(parseISO(project.start_date), "MMM yyyy", { locale: fr })}
                  {project.start_date && project.end_date && " → "}
                  {project.end_date && format(parseISO(project.end_date), "MMM yyyy", { locale: fr })}
                </span>
              </div>
            )}
            {project.surface_area && (
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span>{project.surface_area} m²</span>
              </div>
            )}
            {project.budget && (
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span>{project.budget.toLocaleString("fr-FR")} €</span>
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

      {/* Progress Bar - Simple inline */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Avancement</span>
              <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {completedPhases}/{phases.length} phases
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* AI Summary - Optional, compact */}
      {(project.ai_summary || phases.length > 0) && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Résumé AI</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2"
                onClick={onRefreshSummary}
                disabled={isGeneratingSummary}
              >
                {isGeneratingSummary ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            {project.ai_summary ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{project.ai_summary}</p>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 text-xs"
                onClick={onRefreshSummary}
                disabled={isGeneratingSummary}
              >
                {isGeneratingSummary ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Générer un résumé
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* MOE Team */}
      <Card>
        <CardContent className="py-4">
          <ProjectMOESection projectId={project.id} />
        </CardContent>
      </Card>

      {/* Phases List - Compact */}
      {phases.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Phases du projet</span>
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
            <div className="space-y-2">
              {phases.map((phase, index) => (
                <div
                  key={phase.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors",
                    phase.status === "in_progress" && "bg-primary/5 border border-primary/20",
                    phase.status === "completed" && "bg-muted/50",
                    phase.status === "pending" && "hover:bg-muted/30"
                  )}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                    style={{
                      backgroundColor: phase.status === "completed" ? "hsl(var(--primary))" : phase.color || "#e5e7eb",
                      color: phase.status === "completed" ? "white" : "inherit",
                    }}
                  >
                    {phase.status === "completed" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={cn(
                    "flex-1 text-sm",
                    phase.status === "completed" && "line-through text-muted-foreground"
                  )}>
                    {phase.name}
                  </span>
                  {phase.start_date && phase.end_date && (
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(phase.start_date), "dd/MM", { locale: fr })} - {format(parseISO(phase.end_date), "dd/MM", { locale: fr })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gantt Timeline - Full width */}
      {phases.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="mb-4">
              <span className="text-sm font-medium">Planning</span>
            </div>
            <PhaseGanttTimeline
              phases={phases}
              dependencies={dependencies}
              onPhaseUpdate={(phaseId, updates) => {
                updatePhase.mutate({ id: phaseId, ...updates });
              }}
            />
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
    </div>
  );
}
