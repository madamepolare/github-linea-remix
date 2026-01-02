import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useProject } from "@/hooks/useProjects";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { useProjectMOE } from "@/hooks/useProjectMOE";
import { useProjectDeliverables } from "@/hooks/useProjectDeliverables";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  HardHat,
  ListTodo,
  Loader2,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PROJECT_TYPES, PHASE_STATUS_CONFIG, MOE_ROLES } from "@/lib/projectTypes";
import { ProjectPhasesTab } from "@/components/projects/ProjectPhasesTab";
import { ProjectMOETab } from "@/components/projects/ProjectMOETab";
import { ProjectDeliverablesTab } from "@/components/projects/ProjectDeliverablesTab";
import { ProjectChantierTab } from "@/components/projects/ProjectChantierTab";
import { ProjectPlanningTab } from "@/components/projects/ProjectPlanningTab";
import { EntityTasksList } from "@/components/tasks/EntityTasksList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: project, isLoading } = useProject(id || null);
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
                    {projectType && (
                      <Badge variant="secondary">{projectType.label}</Badge>
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
                    {currentPhase && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Phase: {currentPhase.name}
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
                value="planning"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Planning
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <ListTodo className="h-4 w-4 mr-2" />
                Tâches
              </TabsTrigger>
              <TabsTrigger
                value="moe"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <Users className="h-4 w-4 mr-2" />
                Équipe MOE
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
            />
          )}
          {activeTab === "planning" && <ProjectPlanningTab projectId={project.id} />}
          {activeTab === "tasks" && (
            <EntityTasksList entityType="project" entityId={project.id} entityName={project.name} />
          )}
          {activeTab === "moe" && <ProjectMOETab projectId={project.id} />}
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
}

function OverviewTab({ project, phases, progressPercent, onRefreshSummary, isGeneratingSummary }: OverviewTabProps) {
  const completedPhases = phases.filter((p) => p.status === "completed").length;
  const inProgressPhase = phases.find((p) => p.status === "in_progress");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        {/* AI Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Résumé AI
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRefreshSummary}
                disabled={isGeneratingSummary}
              >
                {isGeneratingSummary ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-1.5">{isGeneratingSummary ? "Génération..." : "Actualiser"}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {project.ai_summary ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.ai_summary}</p>
            ) : (
              <div className="text-center py-4">
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  Aucun résumé disponible
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefreshSummary}
                  disabled={isGeneratingSummary}
                >
                  {isGeneratingSummary ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1.5" />
                  )}
                  Générer le résumé
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Avancement</CardTitle>
              <span className="text-2xl font-bold">{progressPercent}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{completedPhases} / {phases.length} phases terminées</span>
              {inProgressPhase && <span>En cours: {inProgressPhase.name}</span>}
            </div>
          </CardContent>
        </Card>

        {/* Phases Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Phases du projet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {phases.map((phase, index) => {
                const statusConfig = PHASE_STATUS_CONFIG[phase.status as keyof typeof PHASE_STATUS_CONFIG] || PHASE_STATUS_CONFIG.pending;
                
                return (
                  <div
                    key={phase.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      phase.status === "in_progress" && "border-primary bg-primary/5",
                      phase.status === "completed" && "border-muted bg-muted/30",
                      phase.status === "pending" && "border-border"
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{
                        backgroundColor: phase.status === "completed" ? "hsl(var(--primary))" : phase.color || "#e5e7eb",
                        color: phase.status === "completed" ? "white" : "inherit",
                      }}
                    >
                      {phase.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm",
                        phase.status === "completed" && "line-through text-muted-foreground"
                      )}>
                        {phase.name}
                      </p>
                      {phase.end_date && (
                        <p className="text-xs text-muted-foreground">
                          Échéance : {format(parseISO(phase.end_date), "d MMM yyyy", { locale: fr })}
                        </p>
                      )}
                    </div>
                    <Badge variant={phase.status === "in_progress" ? "default" : "secondary"} className="text-xs">
                      {statusConfig.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Project Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.crm_company && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="text-sm font-medium">{project.crm_company.name}</p>
                </div>
              </div>
            )}

            {project.city && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Localisation</p>
                  <p className="text-sm font-medium">
                    {project.address && `${project.address}, `}{project.city}
                  </p>
                </div>
              </div>
            )}

            {project.surface_area && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Surface</p>
                  <p className="text-sm font-medium">{project.surface_area} m²</p>
                </div>
              </div>
            )}

            {project.budget && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="text-sm font-medium">
                    {project.budget.toLocaleString("fr-FR")} €
                  </p>
                </div>
              </div>
            )}

            {project.start_date && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dates</p>
                  <p className="text-sm font-medium">
                    {format(parseISO(project.start_date), "d MMMM yyyy", { locale: fr })}
                    {project.end_date && (
                      <> → {format(parseISO(project.end_date), "d MMMM yyyy", { locale: fr })}</>
                    )}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        {project.description && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
