import { useState } from "react";
import { useParams } from "react-router-dom";
import { useWorkspaceNavigation } from "@/hooks/useWorkspaceNavigation";

import { useProjectsWithModule, useProjectModules } from "@/hooks/useProjectModules";
import { useProjects, useProject } from "@/hooks/useProjects";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChantierOverview } from "@/components/projects/chantier/ChantierOverview";
import { ChantierPlanningTab } from "@/components/projects/chantier/ChantierPlanningTab";
import { LotsSection } from "@/components/projects/chantier/LotsSection";
import { MeetingsSection } from "@/components/projects/chantier/MeetingsSection";
import { ReportsSection } from "@/components/projects/chantier/ReportsSection";
import { ObservationsSection } from "@/components/projects/chantier/ObservationsSection";
import { SendConvocationDialog } from "@/components/projects/chantier/SendConvocationDialog";
import { MeetingReportBuilder } from "@/components/projects/MeetingReportBuilder";
import { useChantier, ProjectMeeting, ProjectLot } from "@/hooks/useChantier";
import { useMeetingReports, MeetingReport } from "@/hooks/useMeetingReports";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  HardHat,
  MapPin,
  Plus,
  Search,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function Chantier() {
  const { projectId, section } = useParams<{ projectId?: string; section?: string }>();
  const { navigate } = useWorkspaceNavigation();
  
  // If we have a projectId, show the project chantier view
  if (projectId) {
    return <ChantierProject projectId={projectId} section={section} />;
  }
  
  // Otherwise show the list of all chantiers
  return <ChantierList />;
}

function ChantierList() {
  const { data: projectsWithChantier = [], isLoading: chantiersLoading } = useProjectsWithModule("chantier");
  const { projects, isLoading: projectsLoading } = useProjects();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"chantiers" | "projets">("chantiers");
  const { navigate } = useWorkspaceNavigation();

  // Get project IDs that already have chantier enabled
  const projectsWithChantierIds = new Set(projectsWithChantier.map(p => p.project_id));

  // Projects without chantier module
  const projectsWithoutChantier = projects.filter(p => !projectsWithChantierIds.has(p.id));

  const filteredChantiers = projectsWithChantier.filter((item) => {
    const project = item.project;
    if (!project) return false;
    const searchLower = search.toLowerCase();
    return (
      project.name?.toLowerCase().includes(searchLower) ||
      project.crm_company?.name?.toLowerCase().includes(searchLower) ||
      project.city?.toLowerCase().includes(searchLower)
    );
  });

  const filteredProjects = projectsWithoutChantier.filter((project) => {
    const searchLower = search.toLowerCase();
    return (
      project.name?.toLowerCase().includes(searchLower) ||
      project.crm_company?.name?.toLowerCase().includes(searchLower) ||
      project.city?.toLowerCase().includes(searchLower)
    );
  });

  const isLoading = chantiersLoading || projectsLoading;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-card px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <HardHat className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Chantiers</h1>
                <p className="text-sm text-muted-foreground">Gestion des chantiers, réunions et comptes-rendus</p>
              </div>
            </div>
          </div>
          
          {/* View toggle */}
          <div className="mt-4">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "chantiers" | "projets")}>
              <TabsList>
                <TabsTrigger value="chantiers">
                  <HardHat className="h-3.5 w-3.5 mr-1.5" />
                  Chantiers actifs ({projectsWithChantier.length})
                </TabsTrigger>
                <TabsTrigger value="projets">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Activer sur un projet ({projectsWithoutChantier.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={viewMode === "chantiers" ? "Rechercher un chantier..." : "Rechercher un projet..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-md"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : viewMode === "chantiers" ? (
            // Active Chantiers View
            filteredChantiers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <HardHat className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun chantier actif</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {search ? "Aucun chantier ne correspond à votre recherche" : "Activez le module Chantier sur vos projets pour les voir ici"}
                </p>
                <Button variant="outline" onClick={() => setViewMode("projets")}>
                  Activer sur un projet
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredChantiers.map((item) => {
                  const project = item.project;
                  if (!project) return null;
                  
                  const activePhase = Array.isArray(project.phases) 
                    ? project.phases.find((p: any) => p.status === "in_progress")
                    : null;
                  
                  return (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow-md transition-all border-border hover:border-orange-500/30"
                      onClick={() => navigate(`/chantier/${project.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-2 h-12 rounded-full shrink-0"
                            style={{ backgroundColor: project.color || "#3B82F6" }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate mb-1">
                              {project.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                              {project.crm_company && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {project.crm_company.name}
                                </span>
                              )}
                              {project.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {project.city}
                                </span>
                              )}
                            </div>
                            {activePhase && (
                              <Badge variant="secondary" className="text-xs font-normal">
                                {activePhase.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(item.enabled_at), "dd MMM yy", { locale: fr })}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            Voir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          ) : (
            // Projects to activate view
            filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-success mb-4" />
                <h3 className="text-lg font-medium mb-2">Tous les projets ont un chantier</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {search ? "Aucun projet ne correspond à votre recherche" : "Le module Chantier est activé sur tous vos projets"}
                </p>
                <Button variant="outline" onClick={() => setViewMode("chantiers")}>
                  Voir les chantiers
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                  <ProjectCardWithActivation key={project.id} project={project} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}

// Component for activating chantier on a project
function ProjectCardWithActivation({ project }: { project: any }) {
  const { navigate } = useWorkspaceNavigation();
  const { enableModule } = useProjectModules(project.id);
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActivating(true);
    try {
      await enableModule.mutateAsync("chantier");
      toast.success("Module Chantier activé");
      navigate(`/chantier/${project.id}`);
    } catch (error) {
      toast.error("Erreur lors de l'activation");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-all border-border hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-2 h-12 rounded-full shrink-0"
            style={{ backgroundColor: project.color || "#3B82F6" }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate mb-1">
              {project.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
              {project.crm_company && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {project.crm_company.name}
                </span>
              )}
              {project.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {project.city}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end mt-4 pt-3 border-t border-border">
          <Button 
            size="sm" 
            onClick={handleActivate}
            disabled={isActivating}
            className="gap-2 bg-orange-500 hover:bg-orange-600"
          >
            <HardHat className="h-3.5 w-3.5" />
            {isActivating ? "Activation..." : "Activer Chantier"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ChantierProjectProps {
  projectId: string;
  section?: string;
}

function ChantierProject({ projectId, section = "overview" }: ChantierProjectProps) {
  const { navigate } = useWorkspaceNavigation();
  const { data: project, isLoading } = useProject(projectId);
  const [activeTab, setActiveTab] = useState(section);
  const [selectedReportForEdit, setSelectedReportForEdit] = useState<MeetingReport | null>(null);
  const [convocationMeeting, setConvocationMeeting] = useState<ProjectMeeting | null>(null);
  const [editingLot, setEditingLot] = useState<ProjectLot | null>(null);
  
  const { lots, lotsLoading, updateLot, createLot, deleteLot, meetings } = useChantier(projectId);
  const { companies } = useCRMCompanies();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/chantier/${projectId}/${tab}`, { replace: true });
  };

  // If a report is selected for editing, show the builder
  if (selectedReportForEdit) {
    const linkedMeeting = meetings.find(m => m.id === selectedReportForEdit.meeting_id);
    const meetingForBuilder: ProjectMeeting = {
      id: selectedReportForEdit.meeting_id || selectedReportForEdit.id,
      project_id: selectedReportForEdit.project_id,
      workspace_id: selectedReportForEdit.workspace_id,
      title: selectedReportForEdit.title,
      meeting_date: selectedReportForEdit.report_date,
      meeting_number: selectedReportForEdit.report_number,
      location: linkedMeeting?.location || null,
      attendees: linkedMeeting?.attendees || null,
      notes: linkedMeeting?.notes || null,
      pdf_url: selectedReportForEdit.pdf_url,
      report_data: selectedReportForEdit.report_data as unknown as Record<string, unknown> | null,
      created_by: selectedReportForEdit.created_by,
      created_at: selectedReportForEdit.created_at,
      updated_at: selectedReportForEdit.updated_at,
    };
    
    return (
      <>
        <MeetingReportBuilder
          projectId={projectId}
          meeting={meetingForBuilder}
          onBack={() => setSelectedReportForEdit(null)}
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <HardHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium">Projet non trouvé</h2>
            <Button variant="link" onClick={() => navigate("/chantier")}>
              Retour aux chantiers
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-card">
          <div className="px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/chantier")}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-muted shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div
                  className="w-1 sm:w-1.5 h-8 sm:h-10 rounded-full shrink-0"
                  style={{ backgroundColor: project.color || "#3B82F6" }}
                />
                <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <HardHat className="h-5 w-5 text-orange-500" />
                    <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
                      {project.name}
                    </h1>
                    <Badge variant="outline" className="text-xs font-normal bg-orange-500/10 text-orange-600 border-orange-500/30">
                      Chantier
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                    {project.crm_company && (
                      <span className="flex items-center gap-1 sm:gap-1.5">
                        <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="truncate max-w-[100px] sm:max-w-none">{project.crm_company.name}</span>
                      </span>
                    )}
                    {project.city && (
                      <span className="flex items-center gap-1 sm:gap-1.5">
                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {project.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/projects/${projectId}`)}
                >
                  Voir le projet
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 sm:px-6 pb-2 pt-2">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="overview">
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger value="lots">
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  Lots
                </TabsTrigger>
                <TabsTrigger value="planning">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Planning
                </TabsTrigger>
                <TabsTrigger value="meetings">
                  <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                  Réunions
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  CR
                </TabsTrigger>
                <TabsTrigger value="observations">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                  Observations
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {activeTab === "overview" && (
            <ChantierOverview 
              projectId={projectId} 
              onNavigate={handleTabChange}
              onOpenReport={() => handleTabChange("reports")}
              onOpenPlanning={() => handleTabChange("planning")}
            />
          )}
          {activeTab === "lots" && (
            <LotsSection
              projectId={projectId}
              lots={lots}
              lotsLoading={lotsLoading}
              onCreateLot={(name, startDate, endDate, companyId) => 
                createLot.mutate({ name, start_date: startDate, end_date: endDate, crm_company_id: companyId, status: "pending", sort_order: lots.length })
              }
              onUpdateLot={(id, updates) => updateLot.mutate({ id, ...updates })}
              onDeleteLot={(id) => deleteLot.mutate(id)}
              companies={companies}
            />
          )}
          {activeTab === "planning" && (
            <ChantierPlanningTab
              projectId={projectId}
              lots={lots}
              lotsLoading={lotsLoading}
              onUpdateLot={(id, updates) => updateLot.mutate({ id, ...updates })}
              onCreateLot={(name, start_date, end_date) => createLot.mutate({ name, start_date, end_date, status: "pending", sort_order: lots.length })}
              onDeleteLot={(id) => deleteLot.mutate(id)}
              onEditLot={(lot) => setEditingLot(lot)}
              companies={companies}
              projectName={project?.name}
            />
          )}
          {activeTab === "meetings" && (
            <MeetingsSection 
              projectId={projectId} 
              onSendConvocation={setConvocationMeeting}
            />
          )}
          {activeTab === "reports" && (
            <ReportsSection 
              projectId={projectId} 
              onOpenReport={setSelectedReportForEdit}
            />
          )}
          {activeTab === "observations" && (
            <ObservationsSection projectId={projectId} />
          )}
        </div>
      </div>

      {/* Send Convocation Dialog */}
      <SendConvocationDialog
        meeting={convocationMeeting}
        projectName={project?.name || "Projet"}
        projectId={projectId}
        onClose={() => setConvocationMeeting(null)}
      />
    </>
  );
}
