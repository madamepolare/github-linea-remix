import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useProjectsWithModule } from "@/hooks/useProjectModules";
import { useProject } from "@/hooks/useProjects";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChantierOverview } from "@/components/projects/chantier/ChantierOverview";
import { ChantierPlanningTab } from "@/components/projects/chantier/ChantierPlanningTab";
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
  ClipboardList,
  Eye,
  FileText,
  HardHat,
  MapPin,
  Plus,
  Search,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function Chantier() {
  const { projectId, section } = useParams<{ projectId?: string; section?: string }>();
  const navigate = useNavigate();
  
  // If we have a projectId, show the project chantier view
  if (projectId) {
    return <ChantierProject projectId={projectId} section={section} />;
  }
  
  // Otherwise show the list of all chantiers
  return <ChantierList />;
}

function ChantierList() {
  const { data: projectsWithChantier = [], isLoading } = useProjectsWithModule("chantier");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredProjects = projectsWithChantier.filter((item) => {
    const project = item.project;
    if (!project) return false;
    const searchLower = search.toLowerCase();
    return (
      project.name?.toLowerCase().includes(searchLower) ||
      project.crm_company?.name?.toLowerCase().includes(searchLower) ||
      project.city?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <MainLayout>
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
            <Button onClick={() => navigate("/projects")}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau projet
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un chantier..."
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
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HardHat className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun chantier</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search ? "Aucun chantier ne correspond à votre recherche" : "Activez le module Chantier sur vos projets pour les voir ici"}
              </p>
              <Button variant="outline" onClick={() => navigate("/projects")}>
                Voir les projets
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((item) => {
                const project = item.project;
                if (!project) return null;
                
                const activePhase = Array.isArray(project.phases) 
                  ? project.phases.find((p: any) => p.status === "in_progress")
                  : null;
                
                return (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-md transition-all border-border hover:border-primary/30"
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
          )}
        </div>
      </div>
    </MainLayout>
  );
}

interface ChantierProjectProps {
  projectId: string;
  section?: string;
}

function ChantierProject({ projectId, section = "overview" }: ChantierProjectProps) {
  const navigate = useNavigate();
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
      <MainLayout>
        <MeetingReportBuilder
          projectId={projectId}
          meeting={meetingForBuilder}
          onBack={() => setSelectedReportForEdit(null)}
        />
      </MainLayout>
    );
  }

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
            <HardHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium">Projet non trouvé</h2>
            <Button variant="link" onClick={() => navigate("/chantier")}>
              Retour aux chantiers
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

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
    </MainLayout>
  );
}
