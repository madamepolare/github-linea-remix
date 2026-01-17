import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useProject, useProjects, useProjectMembers } from "@/hooks/useProjects";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { useTopBar } from "@/contexts/TopBarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspaceDiscipline } from "@/hooks/useDiscipline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  FileCheck,
  FileText,
  FolderKanban,
  HardHat,
  Layers,
  ListTodo,
  Loader2,
  MapPin,
  Pencil,
  Receipt,
  RefreshCw,
  Shield,
  ShoppingCart,
  Sparkles,
  Users,
  BookOpen,
  Package,
} from "lucide-react";
import { format, parseISO, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PROJECT_TYPES } from "@/lib/projectTypes";
import { ChantierDashboard } from "@/components/projects/ChantierDashboard";
import { ProjectPlanningTab } from "@/components/projects/ProjectPlanningTab";
import { ProjectMOESection } from "@/components/projects/ProjectMOESection";
import { PhaseQuickEditDialog } from "@/components/projects/PhaseQuickEditDialog";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { TeamManagementDialog } from "@/components/projects/TeamManagementDialog";
import { ClientTeamDialog } from "@/components/projects/ClientTeamDialog";
import { ModulesSelector } from "@/components/projects/ModulesSelector";
import { ProjectTasksTab } from "@/components/projects/ProjectTasksTab";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ProjectDocumentsTab } from "@/components/projects/ProjectDocumentsTab";
import { ProjectInvoicingTab } from "@/components/projects/ProjectInvoicingTab";
import { ProjectCommercialTab } from "@/components/projects/ProjectCommercialTab";
import { PermitsTab } from "@/components/projects/permits/PermitsTab";
import { InsurancesSection } from "@/components/projects/insurances/InsurancesSection";
import { ProjectOrdersTab } from "@/components/projects/ProjectOrdersTab";
import { LinkedEntitiesPanel } from "@/components/shared/LinkedEntitiesPanel";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { TimeTrackerButton } from "@/components/time-tracking/TimeTrackerButton";
import { EntityCommunications } from "@/components/shared/EntityCommunications";
import { EntityEmailsTab } from "@/components/shared/EntityEmailsTab";
import { ProjectElementsTab } from "@/components/projects/elements/ProjectElementsTab";
import { ProjectPhasesTab } from "@/components/projects/ProjectPhasesTab";
import { ProjectPlanningContainer } from "@/components/projects/ProjectPlanningContainer";
import { ProjectBudgetTab } from "@/components/projects/ProjectBudgetTab";
import { ProjectDeliverablesTab } from "@/components/projects/ProjectDeliverablesTab";
import { MessageCircle, Mail } from "lucide-react";
import { FrameworkDashboard } from "@/components/projects/subprojects/FrameworkDashboard";
import { SubProjectsList } from "@/components/projects/subprojects/SubProjectsList";
import { ProjectContactsSummary } from "@/components/projects/ProjectContactsSummary";

// Tab configuration for project detail
const PROJECT_TABS = [
  { key: "overview", label: "Vue d'ensemble", icon: Sparkles },
  { key: "project_planning", label: "Planning projet", icon: Calendar },
  { key: "deliverables", label: "Livrables", icon: Package },
  { key: "tasks", label: "Tâches", icon: ListTodo },
  { key: "budget", label: "Budget", icon: Receipt },
  { key: "emails", label: "Emails", icon: Mail },
  { key: "communications", label: "Communications", icon: MessageCircle },
  { key: "elements", label: "Knowledge", icon: BookOpen },
  { key: "orders", label: "Commandes", icon: ShoppingCart },
  { key: "permits", label: "Autorisations", icon: FileCheck },
  { key: "insurances", label: "Assurances", icon: Shield },
  { key: "chantier", label: "Chantier", icon: HardHat },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "invoicing", label: "Facturation", icon: Receipt },
  { key: "commercial", label: "Commercial", icon: Briefcase },
];

// Tabs to hide for communication/creative agencies (construction-specific)
const CONSTRUCTION_ONLY_TABS = ["permits", "insurances", "chantier"];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setEntityConfig } = useTopBar();
  const { data: project, isLoading } = useProject(id || null);
  const { members: projectMembers } = useProjectMembers(id || null);
  const { updateProject } = useProjects();
  const { data: discipline } = useWorkspaceDiscipline();
  const [activeTab, setActiveTab] = useState("overview");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [projectEditOpen, setProjectEditOpen] = useState(false);
  const [teamEditOpen, setTeamEditOpen] = useState(false);
  const [clientTeamOpen, setClientTeamOpen] = useState(false);

  // Filter tabs based on discipline (hide construction tabs for communication agencies)
  const filteredTabs = useMemo(() => {
    const isConstructionDiscipline = !discipline?.slug || ["architecture", "interior", "scenography"].includes(discipline.slug);
    if (isConstructionDiscipline) {
      return PROJECT_TABS;
    }
    return PROJECT_TABS.filter(tab => !CONSTRUCTION_ONLY_TABS.includes(tab.key));
  }, [discipline?.slug]);

  // Build entity config for TopBar
  const projectType = project ? PROJECT_TYPES.find((t) => t.value === project.project_type) : null;
  const phases = project?.phases || [];
  const currentPhase = phases.find((p) => p.status === "in_progress");

  // Build team members display for actions slot
  const teamMembersDisplay = (
    <TooltipProvider>
      <div className="flex items-center -space-x-2 mr-2">
        {projectMembers.length > 0 ? (
          <>
            {projectMembers.slice(0, 4).map((member) => (
              <Tooltip key={member.id}>
                <TooltipTrigger asChild>
                  <Avatar className="h-7 w-7 border-2 border-background ring-0 cursor-pointer hover:z-10 hover:scale-110 transition-transform" onClick={() => setTeamEditOpen(true)}>
                    <AvatarImage src={member.profile?.avatar_url || ""} />
                    <AvatarFallback className="text-2xs bg-primary/10 text-primary">
                      {member.profile?.full_name?.slice(0, 2).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{member.profile?.full_name || "Membre"}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {projectMembers.length > 4 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-2xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/80"
                    onClick={() => setTeamEditOpen(true)}
                  >
                    +{projectMembers.length - 4}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{projectMembers.length - 4} autres membres</p>
                </TooltipContent>
              </Tooltip>
            )}
          </>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setTeamEditOpen(true)}
              >
                <Users className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Gérer l'équipe</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );

  // Set TopBar entity config when project data is available
  useEffect(() => {
    if (project) {
      const metadata = [];
      
      if (project.crm_company) {
        metadata.push({ icon: Building2, label: project.crm_company.name });
      }
      if (project.city) {
        metadata.push({ icon: MapPin, label: project.city });
      }

      const badges = [];
      if (projectType) {
        badges.push({ label: projectType.label, variant: "outline" as const });
      }
      if (currentPhase) {
        badges.push({ 
          label: currentPhase.name, 
          variant: "secondary" as const,
          icon: Clock 
        });
      }

      setEntityConfig({
        backTo: "/projects",
        color: project.color || "#3B82F6",
        title: project.name,
        badges,
        metadata,
        tabs: filteredTabs,
        activeTab,
        onTabChange: setActiveTab,
        actions: teamMembersDisplay,
        onSettings: () => setProjectEditOpen(true),
      });
    }

    return () => {
      setEntityConfig(null);
    };
  }, [project, projectType, currentPhase, activeTab, setEntityConfig, projectMembers, filteredTabs]);

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
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium">Projet non trouvé</h2>
          <Button variant="link" onClick={() => navigate("/projects")}>
            Retour aux projets
          </Button>
        </div>
      </div>
    );
  }

  const completedPhases = phases.filter((p) => p.status === "completed").length;
  const progressPercent = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Content - no more header here, it's in TopBar */}
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
              onOpenProjectEdit={() => setProjectEditOpen(true)}
              onOpenTeamEdit={() => setTeamEditOpen(true)}
              onOpenClientTeam={() => setClientTeamOpen(true)}
              projectMembers={projectMembers}
            />
          )}
          {activeTab === "project_planning" && <ProjectPlanningContainer projectId={project.id} />}
          {activeTab === "deliverables" && (
            <ProjectDeliverablesTab projectId={project.id} />
          )}
          {activeTab === "tasks" && (
            <ProjectTasksTab projectId={project.id} />
          )}
          {activeTab === "budget" && (
            <ProjectBudgetTab projectId={project.id} />
          )}
          {activeTab === "emails" && (
            <EntityEmailsTab entityType="project" entityId={project.id} />
          )}
          {activeTab === "communications" && (
            <EntityCommunications entityType="project" entityId={project.id} />
          )}
          {activeTab === "elements" && <ProjectElementsTab projectId={project.id} />}
          {activeTab === "orders" && <ProjectOrdersTab projectId={project.id} />}
          {activeTab === "chantier" && <ChantierDashboard projectId={project.id} />}
          {activeTab === "permits" && <PermitsTab projectId={project.id} />}
          {activeTab === "insurances" && <InsurancesSection projectId={project.id} />}
          {activeTab === "documents" && (
            <ProjectDocumentsTab projectId={project.id} />
          )}
          {activeTab === "invoicing" && (
            <ProjectInvoicingTab projectId={project.id} projectName={project.name} />
          )}
          {activeTab === "commercial" && (
            <ProjectCommercialTab projectId={project.id} projectName={project.name} />
          )}
        </div>
      </div>

      <EditProjectDialog
        open={projectEditOpen}
        onOpenChange={setProjectEditOpen}
        project={project}
        onSave={(updates) => updateProject.mutate({ id: project.id, ...updates })}
        isSaving={updateProject.isPending}
      />

      <TeamManagementDialog
        open={teamEditOpen}
        onOpenChange={setTeamEditOpen}
        projectId={project.id}
        projectName={project.name}
      />

      <ClientTeamDialog
        open={clientTeamOpen}
        onOpenChange={setClientTeamOpen}
        projectId={project.id}
        projectName={project.name}
        companyId={project.crm_company_id}
        companyName={project.crm_company?.name}
      />
    </>
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
  onOpenProjectEdit: () => void;
  onOpenTeamEdit: () => void;
  onOpenClientTeam: () => void;
  projectMembers: any[];
}

function OverviewTab({ project, phases, progressPercent, onRefreshSummary, isGeneratingSummary, onUpdateProject, isUpdatingProject, onOpenProjectEdit, onOpenTeamEdit, onOpenClientTeam, projectMembers }: OverviewTabProps) {
  const completedPhases = phases.filter((p) => p.status === "completed").length;
  const { updatePhase, createPhase, createManyPhases, deletePhase, reorderPhases } = useProjectPhases(project.id);
  const { activeWorkspace } = useAuth();
  const [phaseEditOpen, setPhaseEditOpen] = useState(false);
  const [confirmPhaseId, setConfirmPhaseId] = useState<string | null>(null);

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
                  <TimeTrackerButton 
                    projectId={project.id} 
                    projectName={project.name}
                    showLabel
                  />
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
                            "text-sm font-medium",
                            isActive && "text-primary-foreground",
                            isCompleted && "text-muted-foreground line-through",
                            isPending && "text-foreground"
                          )}>
                            {phase.name}
                          </span>
                        </div>
                        {hasDate && (
                          <span className={cn(
                            "text-[10px] pl-7",
                            isActive && "text-primary-foreground/70",
                            isCompleted && "text-muted-foreground",
                            isPending && "text-muted-foreground",
                            isOverdue && !isCompleted && "text-destructive font-medium"
                          )}>
                            {phase.end_date && format(parseISO(phase.end_date), "d MMM", { locale: fr })}
                          </span>
                        )}
                      </button>
                      {index < phases.length - 1 && (
                        <div className={cn(
                          "w-4 h-0.5 mx-1",
                          isCompleted ? "bg-muted-foreground/30" : "bg-border"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Framework Dashboard & Sub-projects for framework contracts */}
      {project.contract_type === "framework" && (
        <div className="space-y-6">
          <FrameworkDashboard projectId={project.id} projectName={project.name} />
          <SubProjectsList 
            parentId={project.id} 
            parentName={project.name}
            parentColor={project.color}
          />
        </div>
      )}

      {/* Project Description */}
      {project.description && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Description</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {project.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Project Summary with AI */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Résumé IA</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshSummary}
              disabled={isGeneratingSummary}
              className="gap-1.5"
            >
              {isGeneratingSummary ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {isGeneratingSummary ? "Génération..." : "Actualiser"}
            </Button>
          </div>
          
          {project.ai_summary ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {project.ai_summary}
            </p>
          ) : (
            <div className="text-center py-6">
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
                {isGeneratingSummary ? "Génération..." : "Générer un résumé IA"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Informations</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenProjectEdit}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Modifier
              </Button>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Type</dt>
                <dd>{projectType?.label || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ville</dt>
                <dd>{project.city || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Surface</dt>
                <dd>{project.surface ? `${project.surface} m²` : "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Budget</dt>
                <dd>{project.budget ? `${project.budget.toLocaleString()} €` : "-"}</dd>
              </div>
              {project.crm_company && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Client</dt>
                  <dd>{project.crm_company.name}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Phases</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPhaseEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Gérer
              </Button>
            </div>
            {phases.length > 0 ? (
              <div className="space-y-2">
                {phases.slice(0, 5).map((phase) => (
                  <div key={phase.id} className="flex items-center justify-between text-sm">
                    <span className={cn(
                      phase.status === "completed" && "text-muted-foreground line-through"
                    )}>
                      {phase.name}
                    </span>
                    <Badge
                      variant={
                        phase.status === "completed" ? "secondary" :
                        phase.status === "in_progress" ? "default" : "outline"
                      }
                      className="text-xs"
                    >
                      {phase.status === "completed" ? "Terminée" :
                       phase.status === "in_progress" ? "En cours" : "À venir"}
                    </Badge>
                  </div>
                ))}
                {phases.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    +{phases.length - 5} autres phases
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune phase définie</p>
            )}
          </CardContent>
        </Card>

        {/* Linked Entities Panel */}
        <LinkedEntitiesPanel
          entityType="project"
          entityId={project.id}
          workspaceId={activeWorkspace?.id}
        />
      </div>

      {/* Team & Contacts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Équipe projet
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenTeamEdit}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Gérer
              </Button>
            </div>
            {projectMembers.length > 0 ? (
              <div className="space-y-2">
                {projectMembers.map((member) => {
                  const roleLabels: Record<string, string> = {
                    owner: "Responsable",
                    lead: "Chef de projet",
                    member: "Membre",
                    viewer: "Observateur",
                  };
                  return (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profile?.avatar_url || ""} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {member.profile?.full_name?.slice(0, 2).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {member.profile?.full_name || "Membre"}
                          </span>
                          {member.role === "lead" && (
                            <Crown className="h-3 w-3 text-amber-500" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {roleLabels[member.role] || member.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Aucun membre assigné</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={onOpenTeamEdit}
                  className="mt-2"
                >
                  Ajouter des membres
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contacts Card */}
        {!project.is_internal && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Client et Équipe client
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenClientTeam}
                >
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Gérer
                </Button>
              </div>
              <ProjectContactsSummary
                projectId={project.id}
                companyName={project.crm_company?.name}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activity Timeline & MOE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MOE Section */}
        <ProjectMOESection projectId={project.id} />

        {/* Activity Timeline */}
        <ActivityTimeline
          entityType="project"
          entityId={project.id}
          workspaceId={activeWorkspace?.id}
          maxItems={10}
        />
      </div>


      {/* Phase Edit Dialog */}
      <PhaseQuickEditDialog
        open={phaseEditOpen}
        onOpenChange={setPhaseEditOpen}
        phases={phases}
        onCreatePhase={createPhase.mutate}
        onCreateManyPhases={activeWorkspace ? (phasesData) => {
          createManyPhases.mutate(phasesData.map((p, index) => ({
            project_id: project.id,
            workspace_id: activeWorkspace.id,
            name: p.name,
            description: p.description,
            status: p.status || "pending",
            color: p.color,
            sort_order: phases.length + index,
          })));
        } : undefined}
        onUpdatePhase={(id, updates) => updatePhase.mutate({ id, ...updates })}
        onDeletePhase={deletePhase.mutate}
        onReorderPhases={reorderPhases.mutate}
      />


      {/* Confirm Phase Change Dialog */}
      <AlertDialog open={!!confirmPhaseId} onOpenChange={() => setConfirmPhaseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revenir à cette phase ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de revenir à la phase "{phaseToConfirm?.name}". 
              Toutes les phases suivantes seront marquées comme "en attente".
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
