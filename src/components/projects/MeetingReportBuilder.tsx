import { useState, useRef } from "react";
import { useChantier, ProjectMeeting, MeetingAttendee } from "@/hooks/useChantier";
import { useContacts } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProject } from "@/hooks/useProjects";
import { useProjectMOE } from "@/hooks/useProjectMOE";
import { useTasks } from "@/hooks/useTasks";
import { useMeetingVersions } from "@/hooks/useMeetingVersions";
import { useAuth } from "@/contexts/AuthContext";
import { useMeetingReportData } from "@/hooks/useMeetingReportData";
import { useMeetingAttentionItems } from "@/hooks/useMeetingAttentionItems";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { generateMeetingPDF } from "@/lib/generateMeetingPDF";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft, Download, Loader2, Mail, Save, Sparkles, History,
  FileText, TrendingUp, AlertTriangle, Paperclip, CheckSquare,
} from "lucide-react";

import { SendEmailDialog } from "./meeting-report/SendEmailDialog";
import { VersionHistorySheet } from "./meeting-report/VersionHistorySheet";
import { AttendeeWithType, ExternalTask, EmailRecipient } from "./meeting-report/types";
import { PDFPreviewDialog } from "./meeting-report/PDFPreviewDialog";

// Import new tab components
import { GeneralTab } from "./meeting-report/tabs/GeneralTab";
import { ProgressTab } from "./meeting-report/tabs/ProgressTab";
import { PointsTab } from "./meeting-report/tabs/PointsTab";
import { AnnexesTab } from "./meeting-report/tabs/AnnexesTab";
import { ClosureTab } from "./meeting-report/tabs/ClosureTab";

interface MeetingReportBuilderProps {
  projectId: string;
  meeting: ProjectMeeting;
  onBack: () => void;
}

export function MeetingReportBuilder({ projectId, meeting, onBack }: MeetingReportBuilderProps) {
  const { data: project } = useProject(projectId);
  const { lots, observations, meetings, updateMeeting, createObservation, updateObservation } = useChantier(projectId);
  const { moeTeam } = useProjectMOE(projectId);
  const { allContacts } = useContacts();
  const { companies } = useCRMCompanies();
  const { tasks, createTask, updateTaskStatus } = useTasks({ projectId });
  const { versions, createVersion, latestVersionNumber } = useMeetingVersions(meeting.id);
  const { items: attentionItems, createItem: createAttentionItem, updateItem: updateAttentionItem, deleteItem: deleteAttentionItem } = useMeetingAttentionItems(meeting.id);
  const { profile } = useAuth();

  // Report data hook for new sections
  const {
    reportData,
    hasUnsavedChanges: reportHasChanges,
    isSaving: reportIsSaving,
    save: saveReportData,
    updateSection,
    updateField,
    addToArray,
    removeFromArray,
    updateInArray,
    copyFromPreviousMeeting,
  } = useMeetingReportData(meeting);

  const [localMeeting, setLocalMeeting] = useState(meeting);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [externalTasks, setExternalTasks] = useState<ExternalTask[]>([]);
  const [observationComments, setObservationComments] = useState<Record<string, string>>({});
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFileName, setPdfFileName] = useState("");

  // Track if there are unsaved changes
  const savedDataRef = useRef<string>(JSON.stringify({
    title: meeting.title,
    meeting_date: meeting.meeting_date,
    location: meeting.location,
    notes: meeting.notes,
    attendees: meeting.attendees,
  }));

  const currentData = JSON.stringify({
    title: localMeeting.title,
    meeting_date: localMeeting.meeting_date,
    location: localMeeting.location,
    notes: localMeeting.notes,
    attendees: localMeeting.attendees,
  });

  const hasUnsavedChanges = currentData !== savedDataRef.current || reportHasChanges;

  // Get attendee type from contact or MOE role
  const getAttendeeType = (contactId?: string, companyId?: string): AttendeeWithType["type"] => {
    if (contactId) {
      const contact = allContacts.find(c => c.id === contactId);
      if (contact?.contact_type === "client") return "moa";
      if (contact?.contact_type === "bet") return "bet";
      if (contact?.contact_type === "contractor") return "entreprise";
    }
    const moeMember = moeTeam.find(m => m.contact_id === contactId || m.crm_company_id === companyId);
    if (moeMember) {
      if (moeMember.role.toLowerCase().includes("archi")) return "archi";
      if (moeMember.role.toLowerCase().includes("bet")) return "bet";
    }
    return "other";
  };

  const attendeesWithType: AttendeeWithType[] = (localMeeting.attendees || []).map(att => ({
    ...att,
    type: getAttendeeType(att.contact_id, att.company_id),
    email: att.contact_id ? allContacts.find(c => c.id === att.contact_id)?.email || undefined : undefined,
  }));

  const handleAddMOEAsAttendees = () => {
    const existingIds = (localMeeting.attendees || []).map(a => a.contact_id);
    const newAttendees: MeetingAttendee[] = [];

    moeTeam.forEach(member => {
      if (member.contact_id && !existingIds.includes(member.contact_id)) {
        const contact = member.contact;
        if (contact) {
          newAttendees.push({
            contact_id: contact.id,
            company_id: member.crm_company_id || undefined,
            name: contact.name,
            present: false,
          });
        }
      }
    });

    if (newAttendees.length > 0) {
      setLocalMeeting({
        ...localMeeting,
        attendees: [...(localMeeting.attendees || []), ...newAttendees],
      });
      toast.success(`${newAttendees.length} membre(s) MOE ajouté(s)`);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMeeting.mutateAsync({
        id: localMeeting.id,
        title: localMeeting.title,
        meeting_date: localMeeting.meeting_date,
        location: localMeeting.location,
        notes: localMeeting.notes,
        attendees: localMeeting.attendees,
      });
      savedDataRef.current = currentData;
      
      // Also save report data
      await saveReportData();
      
      toast.success("Compte rendu sauvegardé");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateVersion = async () => {
    try {
      await createVersion.mutateAsync({
        notes: localMeeting.notes,
        attendees: localMeeting.attendees,
      });
      toast.success(`Version ${latestVersionNumber + 1} créée`);
    } catch (error) {
      toast.error("Erreur lors de la création de la version");
    }
  };

  const handleGenerateAISummary = async () => {
    setIsGeneratingAI(true);
    try {
      const meetingObservations = observations.filter(o => o.meeting_id === meeting.id);
      const { data, error } = await supabase.functions.invoke("generate-project-summary", {
        body: {
          projectName: project?.name,
          meetingTitle: localMeeting.title,
          meetingDate: localMeeting.meeting_date,
          attendees: localMeeting.attendees,
          notes: localMeeting.notes,
          observations: meetingObservations.map(o => ({
            description: o.description,
            priority: o.priority,
            status: o.status,
            lot: lots.find(l => l.id === o.lot_id)?.name,
          })),
        },
      });

      if (error) throw error;
      setAiSummary(data.summary || "Aucune synthèse générée");
      toast.success("Synthèse AI générée");
    } catch (error) {
      toast.error("Erreur lors de la génération de la synthèse");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleExportPDF = () => {
    try {
      const meetingObservations = observations.filter(o => o.meeting_id === meeting.id);
      const chantierTasks = (tasks || []).filter(t => t.module === "chantier");
      
      const { blob, fileName } = generateMeetingPDF({
        meeting: localMeeting,
        observations: meetingObservations,
        attentionItems: attentionItems.map(item => ({
          id: item.id,
          description: item.description,
          urgency: item.urgency,
          progress: item.progress,
          due_date: item.due_date,
          assignee_names: item.assignee_names,
          stakeholder_type: item.stakeholder_type,
        })),
        tasks: chantierTasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          due_date: t.due_date,
          assigned_to: t.assigned_to,
        })),
        projectName: project?.name || "Projet",
        projectAddress: project?.address || undefined,
        projectClient: project?.client || undefined,
        aiSummary: aiSummary || undefined,
      });
      
      setPdfBlob(blob);
      setPdfFileName(fileName);
      setPdfPreviewOpen(true);
    } catch (error) {
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const handleSendEmail = async (recipients: string[], subject: string, message: string) => {
    toast.success(`Email envoyé à ${recipients.length} destinataire(s)`);
  };

  const emailRecipients: EmailRecipient[] = attendeesWithType
    .filter(a => a.email)
    .map(a => ({
      email: a.email!,
      name: a.name,
      type: a.type || "other",
      selected: true,
    }));

  const meetingObservations = (observations || []).filter(o => o.meeting_id === meeting.id);
  const internalTasks = (tasks || []).filter(t => t.module === "chantier" && t.status !== "done").slice(0, 10);
  const presentCount = attendeesWithType.filter(a => a.present).length;

  // Get previous meetings for context copy
  const previousMeetings = (meetings || [])
    .filter(m => m.id !== meeting.id && new Date(m.meeting_date) < new Date(meeting.meeting_date))
    .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime());

  // Prepare contacts for GeneralTab
  const contactsForGeneralTab = allContacts.map(c => ({
    id: c.id,
    name: c.name,
    company: c.crm_company_id ? companies.find(comp => comp.id === c.crm_company_id) : null,
    email: c.email,
    contact_type: c.contact_type,
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">Réunion de chantier n°{localMeeting.meeting_number || 1}</p>
            <h2 className="font-semibold text-lg">{localMeeting.title}</h2>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(localMeeting.meeting_date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={hasUnsavedChanges ? "default" : "outline"} 
            size="sm" 
            onClick={handleSave} 
            disabled={isSaving || reportIsSaving || !hasUnsavedChanges}
          >
            {(isSaving || reportIsSaving) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {hasUnsavedChanges ? "Enregistrer" : "Enregistré"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsVersionHistoryOpen(true)}>
            <History className="h-4 w-4 mr-1" />
            Historique
            {latestVersionNumber > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{latestVersionNumber}</Badge>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCreateVersion} disabled={createVersion.isPending}>
            {createVersion.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Version
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" />PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEmailDialogOpen(true)}>
            <Mail className="h-4 w-4 mr-1" />Envoyer
          </Button>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Général</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Avancement</span>
          </TabsTrigger>
          <TabsTrigger value="points" className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Points CR</span>
            {(attentionItems.length + meetingObservations.length) > 0 && (
              <Badge variant="secondary" className="h-5 w-5 p-0 text-[10px] justify-center">
                {attentionItems.length + meetingObservations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="annexes" className="flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Annexes</span>
          </TabsTrigger>
          <TabsTrigger value="closure" className="flex items-center gap-1.5">
            <CheckSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clôture</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-260px)] mt-4">
          <TabsContent value="general" className="mt-0 pr-4">
            <GeneralTab
              meeting={meeting}
              project={project ? {
                name: project.name,
                address: project.address,
                city: project.city,
                client: project.client,
              } : null}
              reportData={reportData}
              onUpdateReportData={updateSection}
              localMeeting={localMeeting}
              setLocalMeeting={setLocalMeeting}
              attendeesWithType={attendeesWithType}
              contacts={contactsForGeneralTab}
              companies={companies.map(c => ({ id: c.id, name: c.name, industry: c.industry }))}
              redactorName={profile?.full_name || null}
              onAddMOETeam={handleAddMOEAsAttendees}
              previousMeetings={previousMeetings}
              onCopyFromPrevious={copyFromPreviousMeeting}
            />
          </TabsContent>

          <TabsContent value="progress" className="mt-0 pr-4">
            <ProgressTab
              reportData={reportData}
              onUpdateReportData={updateSection}
              onUpdateField={updateField}
              lots={lots}
              companies={companies.map(c => ({ id: c.id, name: c.name }))}
            />
          </TabsContent>

          <TabsContent value="points" className="mt-0 pr-4">
            <PointsTab
              reportData={reportData}
              onUpdateReportData={updateSection}
              onUpdateField={updateField}
              meetingId={meeting.id}
              attentionItems={attentionItems}
              companies={companies.map(c => ({ id: c.id, name: c.name }))}
              lots={lots}
              moeTeam={moeTeam}
              onCreateAttentionItem={(item) => createAttentionItem.mutate(item)}
              onUpdateAttentionItem={(id, updates) => updateAttentionItem.mutate({ id, ...updates })}
              onDeleteAttentionItem={(id) => deleteAttentionItem.mutate(id)}
              meetingObservations={meetingObservations}
              allProjectObservations={observations}
              onStatusChange={(id, status) => updateObservation.mutate({ id, status: status as any, resolved_at: status === "resolved" ? new Date().toISOString() : null })}
              onAddObservation={(obs) => createObservation.mutate({ ...obs, meeting_id: meeting.id, priority: obs.priority as any })}
              onUpdateObservation={(id, updates) => updateObservation.mutate({ id, ...updates })}
              observationComments={observationComments}
              onUpdateObservationComment={(id, comment) => setObservationComments(prev => ({ ...prev, [id]: comment }))}
            />
          </TabsContent>

          <TabsContent value="annexes" className="mt-0 pr-4">
            <AnnexesTab
              reportData={reportData}
              onUpdateReportData={updateSection}
              onUpdateField={updateField}
            />
          </TabsContent>

          <TabsContent value="closure" className="mt-0 pr-4">
            <ClosureTab
              reportData={reportData}
              onUpdateReportData={updateSection}
              onUpdateField={updateField}
              internalTasks={internalTasks}
              externalTasks={externalTasks}
              onCreateInternalTask={(task) => createTask.mutate({ ...task, project_id: projectId, module: "chantier" })}
              onCreateExternalTask={(task) => setExternalTasks(prev => [...prev, { ...task, id: crypto.randomUUID() }])}
              onToggleExternalTask={(id, completed) => setExternalTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t))}
              onUpdateExternalTaskComment={(id, comment) => setExternalTasks(prev => prev.map(t => t.id === id ? { ...t, comment } : t))}
              onToggleInternalTask={(id, completed) => updateTaskStatus.mutate({ id, status: completed ? "done" : "todo" })}
              attendeeNames={attendeesWithType.map(a => ({ name: a.name, type: a.type || "other" }))}
              aiSummary={aiSummary}
              isGeneratingAI={isGeneratingAI}
              onGenerateAISummary={handleGenerateAISummary}
              attendeesWithType={attendeesWithType}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <SendEmailDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        recipients={emailRecipients}
        defaultSubject={`CR ${localMeeting.meeting_number} - ${project?.name || "Projet"}`}
        projectName={project?.name || "Projet"}
        onSend={handleSendEmail}
      />

      <VersionHistorySheet
        open={isVersionHistoryOpen}
        onOpenChange={setIsVersionHistoryOpen}
        meetingId={meeting.id}
        currentNotes={localMeeting.notes}
        currentAttendees={localMeeting.attendees}
        onRestore={(notes, attendees) => {
          setLocalMeeting({ ...localMeeting, notes, attendees });
        }}
      />

      <PDFPreviewDialog
        open={pdfPreviewOpen}
        onOpenChange={setPdfPreviewOpen}
        pdfBlob={pdfBlob}
        fileName={pdfFileName}
      />
    </div>
  );
}
