import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useProject } from "@/hooks/useProjects";
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
  RefreshCw,
  Sparkles,
  Wallet,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PROJECT_TYPES, PHASE_STATUS_CONFIG } from "@/lib/projectTypes";
import { ProjectChantierTab } from "@/components/projects/ProjectChantierTab";
import { ProjectDeliverablesTab } from "@/components/projects/ProjectDeliverablesTab";
import { ProjectMOESection } from "@/components/projects/ProjectMOESection";
import { PhaseGanttTimeline } from "@/components/projects/PhaseGanttTimeline";
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
                value="deliverables"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <FileText className="h-4 w-4 mr-2" />
                Livrables
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
            />
          )}
          {activeTab === "deliverables" && <ProjectDeliverablesTab projectId={project.id} />}
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
}

function OverviewTab({ project, phases, progressPercent, onRefreshSummary, isGeneratingSummary }: OverviewTabProps) {
  const completedPhases = phases.filter((p) => p.status === "completed").length;
  const inProgressPhase = phases.find((p) => p.status === "in_progress");
  const { dependencies } = usePhaseDependencies(project.id);
  const { updatePhase } = useProjectPhases(project.id);

  return (
    <div className="space-y-6">
      {/* Top row - Info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Project Info & Team */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.crm_company && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Client</p>
                    <p className="text-sm font-medium truncate">{project.crm_company.name}</p>
                  </div>
                </div>
              )}

              {project.city && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Localisation</p>
                    <p className="text-sm font-medium">
                      {project.address && `${project.address}, `}{project.city}
                    </p>
                  </div>
                </div>
              )}

              {(project.start_date || project.end_date) && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Dates</p>
                    <p className="text-sm font-medium">
                      {project.start_date && format(parseISO(project.start_date), "dd/MM/yy", { locale: fr })}
                      {project.start_date && project.end_date && " → "}
                      {project.end_date && format(parseISO(project.end_date), "dd/MM/yy", { locale: fr })}
                    </p>
                  </div>
                </div>
              )}

              {project.surface_area && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Surface</p>
                    <p className="text-sm font-medium">{project.surface_area} m²</p>
                  </div>
                </div>
              )}

              {project.budget && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Budget</p>
                    <p className="text-sm font-medium">{project.budget.toLocaleString("fr-FR")} €</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* MOE Team */}
          <Card>
            <CardContent className="pt-4">
              <ProjectMOESection projectId={project.id} />
            </CardContent>
          </Card>
        </div>

        {/* Center - Progress & Phase List */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Avancement</CardTitle>
                <span className="text-xl font-bold text-primary">{progressPercent}%</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={progressPercent} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completedPhases}/{phases.length} phases</span>
                {inProgressPhase && (
                  <Badge variant="secondary" className="text-[10px]">
                    <Clock className="h-3 w-3 mr-1" />
                    {inProgressPhase.name}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Phases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md border transition-colors",
                      phase.status === "in_progress" && "border-primary bg-primary/5",
                      phase.status === "completed" && "border-transparent bg-muted/50",
                      phase.status === "pending" && "border-transparent"
                    )}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0"
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
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs font-medium",
                        phase.status === "completed" && "line-through text-muted-foreground"
                      )}>
                        {phase.name}
                      </p>
                    </div>
                    {phase.end_date && (
                      <span className="text-[10px] text-muted-foreground">
                        {format(parseISO(phase.end_date), "dd/MM", { locale: fr })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right - AI Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Résumé AI
                </CardTitle>
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
            </CardHeader>
            <CardContent>
              {project.ai_summary ? (
                <p className="text-xs text-muted-foreground leading-relaxed">{project.ai_summary}</p>
              ) : (
                <div className="text-center py-3">
                  <Sparkles className="h-6 w-6 mx-auto text-muted-foreground/40 mb-1.5" />
                  <p className="text-[11px] text-muted-foreground mb-2">Aucun résumé</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-7 text-xs"
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {project.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">{project.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Gantt Timeline */}
      {phases.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Planning des phases</CardTitle>
          </CardHeader>
          <CardContent>
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
    </div>
  );
}
