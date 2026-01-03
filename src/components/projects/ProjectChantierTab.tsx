import { useState } from "react";
import { useChantier, ProjectMeeting, ProjectLot } from "@/hooks/useChantier";
import { useMeetingReports, MeetingReport } from "@/hooks/useMeetingReports";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProject } from "@/hooks/useProjects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChantierOverview } from "./chantier/ChantierOverview";
import { ChantierPlanningTab } from "./chantier/ChantierPlanningTab";
import { MeetingsSection } from "./chantier/MeetingsSection";
import { ReportsSection } from "./chantier/ReportsSection";
import { ObservationsSection } from "./chantier/ObservationsSection";
import { SendConvocationDialog } from "./chantier/SendConvocationDialog";
import { MeetingReportBuilder } from "./MeetingReportBuilder";
import {
  AlertTriangle,
  Calendar,
  FileText,
  LayoutDashboard,
  Users,
} from "lucide-react";

interface ProjectChantierTabProps {
  projectId: string;
}

export function ProjectChantierTab({ projectId }: ProjectChantierTabProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedReportForEdit, setSelectedReportForEdit] = useState<MeetingReport | null>(null);
  const [convocationMeeting, setConvocationMeeting] = useState<ProjectMeeting | null>(null);
  const [editingLot, setEditingLot] = useState<ProjectLot | null>(null);
  const { data: project } = useProject(projectId);
  const { lots, lotsLoading, updateLot, createLot, deleteLot, meetings } = useChantier(projectId);
  const { companies } = useCRMCompanies();

  // If a report is selected for editing, show the builder
  // We need to convert report to meeting format for compatibility
  if (selectedReportForEdit) {
    const linkedMeeting = meetings.find(m => m.id === selectedReportForEdit.meeting_id);
    // Create a compatibility meeting object from the report
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
      <MeetingReportBuilder
        projectId={projectId}
        meeting={meetingForBuilder}
        onBack={() => setSelectedReportForEdit(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="planning">
            <Calendar className="h-4 w-4 mr-2" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <Users className="h-4 w-4 mr-2" />
            Réunions
          </TabsTrigger>
          <TabsTrigger value="cr">
            <FileText className="h-4 w-4 mr-2" />
            CR
          </TabsTrigger>
          <TabsTrigger value="observations">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Observations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <ChantierOverview 
            projectId={projectId} 
            onNavigate={setActiveTab}
            onOpenReport={() => setActiveTab("cr")}
            onOpenPlanning={() => setActiveTab("planning")}
          />
        </TabsContent>

        <TabsContent value="planning" className="mt-4">
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
        </TabsContent>

        <TabsContent value="meetings" className="mt-4">
          <MeetingsSection 
            projectId={projectId} 
            onSendConvocation={setConvocationMeeting}
          />
        </TabsContent>

        <TabsContent value="cr" className="mt-4">
          <ReportsSection 
            projectId={projectId} 
            onOpenReport={setSelectedReportForEdit}
          />
        </TabsContent>

        <TabsContent value="observations" className="mt-4">
          <ObservationsSection projectId={projectId} />
        </TabsContent>
      </Tabs>

      {/* Send Convocation Dialog */}
      <SendConvocationDialog
        meeting={convocationMeeting}
        projectName={project?.name || "Projet"}
        projectId={projectId}
        onClose={() => setConvocationMeeting(null)}
      />
    </div>
  );
}
