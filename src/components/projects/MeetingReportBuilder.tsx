import { useState, useEffect, useRef, useCallback } from "react";
import { useChantier, ProjectMeeting, MeetingAttendee, ObservationStatus } from "@/hooks/useChantier";
import { useContacts } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProject } from "@/hooks/useProjects";
import { useProjectMOE } from "@/hooks/useProjectMOE";
import { useTasks } from "@/hooks/useTasks";
import { useMeetingVersions } from "@/hooks/useMeetingVersions";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { generateMeetingPDF } from "@/lib/generateMeetingPDF";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft, ChevronDown, ChevronUp, Download, GripVertical,
  Loader2, Mail, Save, Sparkles, History,
} from "lucide-react";

import { AttendeesSection } from "./meeting-report/AttendeesSection";
import { ObservationsSection } from "./meeting-report/ObservationsSection";
import { TasksSection } from "./meeting-report/TasksSection";
import { AttentionItemsSection } from "./meeting-report/AttentionItemsSection";
import { AIRewriteButton } from "./meeting-report/AIRewriteButton";
import { SendEmailDialog } from "./meeting-report/SendEmailDialog";
import { VersionHistorySheet } from "./meeting-report/VersionHistorySheet";
import { ReportSection, AttendeeWithType, ExternalTask, EmailRecipient } from "./meeting-report/types";
import { useMeetingAttentionItems } from "@/hooks/useMeetingAttentionItems";

interface MeetingReportBuilderProps {
  projectId: string;
  meeting: ProjectMeeting;
  onBack: () => void;
}

export function MeetingReportBuilder({ projectId, meeting, onBack }: MeetingReportBuilderProps) {
  const { data: project } = useProject(projectId);
  const { lots, observations, updateMeeting, createObservation, updateObservation } = useChantier(projectId);
  const { moeTeam } = useProjectMOE(projectId);
  const { allContacts } = useContacts();
  const { companies } = useCRMCompanies();
  const { tasks, createTask, updateTaskStatus } = useTasks({ projectId });
  const { versions, createVersion, latestVersionNumber } = useMeetingVersions(meeting.id);
  const { items: attentionItems, createItem: createAttentionItem, updateItem: updateAttentionItem, deleteItem: deleteAttentionItem } = useMeetingAttentionItems(meeting.id);
  const { profile } = useAuth();

  const [reportSections, setReportSections] = useState<ReportSection[]>([
    { id: "header", type: "header", title: "Informations de la réunion", expanded: true },
    { id: "attendees", type: "attendees", title: "Liste des présents", expanded: true },
    { id: "notes", type: "notes", title: "Notes & Ordre du jour", expanded: true },
    { id: "attention", type: "attention", title: "Points d'attention", expanded: true },
    { id: "observations", type: "observations", title: "Observations & Réserves", expanded: true },
    { id: "tasks", type: "tasks", title: "Actions & Tâches", expanded: true },
    { id: "summary", type: "summary", title: "Synthèse AI", expanded: false },
  ]);

  const [localMeeting, setLocalMeeting] = useState(meeting);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [selectedContactToAdd, setSelectedContactToAdd] = useState<string | null>(null);
  const [externalTasks, setExternalTasks] = useState<ExternalTask[]>([]);
  const [observationComments, setObservationComments] = useState<Record<string, string>>({});
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSavedData = useRef<string>("");

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    const currentData = JSON.stringify({
      title: localMeeting.title,
      meeting_date: localMeeting.meeting_date,
      location: localMeeting.location,
      notes: localMeeting.notes,
      attendees: localMeeting.attendees,
    });

    if (currentData === lastSavedData.current) return;

    try {
      await updateMeeting.mutateAsync({
        id: localMeeting.id,
        title: localMeeting.title,
        meeting_date: localMeeting.meeting_date,
        location: localMeeting.location,
        notes: localMeeting.notes,
        attendees: localMeeting.attendees,
      });
      lastSavedData.current = currentData;
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, [localMeeting, updateMeeting]);

  useEffect(() => {
    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    autoSaveTimeout.current = setTimeout(autoSave, 2000);
    return () => {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    };
  }, [localMeeting, autoSave]);

  const toggleSection = (sectionId: string) => {
    setReportSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, expanded: !s.expanded } : s
    ));
  };

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

  const handleAddAttendee = () => {
    if (!selectedContactToAdd) return;
    const contact = allContacts.find(c => c.id === selectedContactToAdd);
    if (!contact) return;

    const attendees = [...(localMeeting.attendees || [])];
    if (attendees.some(a => a.contact_id === selectedContactToAdd)) {
      toast.error("Ce contact est déjà dans la liste");
      return;
    }

    attendees.push({
      contact_id: contact.id,
      company_id: contact.crm_company_id || undefined,
      name: contact.name,
      present: true,
    });
    setLocalMeeting({ ...localMeeting, attendees });
    setSelectedContactToAdd(null);
  };

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
      lastSavedData.current = JSON.stringify(localMeeting);
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
      setReportSections(prev => prev.map(s => s.id === "summary" ? { ...s, expanded: true } : s));
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
      generateMeetingPDF({
        meeting: localMeeting,
        observations: meetingObservations,
        projectName: project?.name || "Projet",
        projectAddress: project?.address || undefined,
        projectClient: project?.client || undefined,
      });
      toast.success("PDF généré avec succès");
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-semibold text-lg">{localMeeting.title}</h2>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(localMeeting.meeting_date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <Button variant="outline" size="sm" onClick={handleGenerateAISummary} disabled={isGeneratingAI}>
            {isGeneratingAI ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Synthèse AI
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" />PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEmailDialogOpen(true)}>
            <Mail className="h-4 w-4 mr-1" />Envoyer
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-4 pr-4">
          {reportSections.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50" onClick={() => toggleSection(section.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
                    {section.id === "attendees" && <Badge variant="secondary" className="text-xs">{presentCount}/{attendeesWithType.length}</Badge>}
                    {section.id === "observations" && <Badge variant="secondary" className="text-xs">{meetingObservations.length}</Badge>}
                  </div>
                  {section.expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </CardHeader>

              {section.expanded && (
                <CardContent className="pt-0 pb-4">
                  {section.id === "header" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Titre</Label>
                          <Input value={localMeeting.title} onChange={(e) => setLocalMeeting({ ...localMeeting, title: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Numéro</Label>
                          <Input value={localMeeting.meeting_number?.toString() || ""} disabled className="bg-muted" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date et heure</Label>
                          <InlineDatePicker value={parseISO(localMeeting.meeting_date)} onChange={(date) => date && setLocalMeeting({ ...localMeeting, meeting_date: date.toISOString() })} className="w-full" />
                        </div>
                        <div className="space-y-2">
                          <Label>Lieu</Label>
                          <Input value={localMeeting.location || ""} onChange={(e) => setLocalMeeting({ ...localMeeting, location: e.target.value })} placeholder="Sur site, bureau..." />
                        </div>
                      </div>
                    </div>
                  )}

                  {section.id === "attendees" && (
                    <AttendeesSection
                      attendees={attendeesWithType}
                      contacts={allContacts}
                      companies={companies}
                      redactorName={profile?.full_name || null}
                      selectedContactToAdd={selectedContactToAdd}
                      onSelectedContactChange={setSelectedContactToAdd}
                      onAddAttendee={handleAddAttendee}
                      onRemoveAttendee={(idx) => {
                        const attendees = [...(localMeeting.attendees || [])];
                        attendees.splice(idx, 1);
                        setLocalMeeting({ ...localMeeting, attendees });
                      }}
                      onTogglePresence={(idx) => {
                        const attendees = [...(localMeeting.attendees || [])];
                        attendees[idx] = { ...attendees[idx], present: !attendees[idx].present };
                        setLocalMeeting({ ...localMeeting, attendees });
                      }}
                      onAddMOETeam={handleAddMOEAsAttendees}
                    />
                  )}

                  {section.id === "notes" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Notes et ordre du jour</Label>
                        <AIRewriteButton text={localMeeting.notes || ""} onRewrite={(text) => setLocalMeeting({ ...localMeeting, notes: text })} />
                      </div>
                      <Textarea value={localMeeting.notes || ""} onChange={(e) => setLocalMeeting({ ...localMeeting, notes: e.target.value })} placeholder="Points abordés, décisions prises..." rows={6} className="resize-none" />
                    </div>
                  )}

                  {section.id === "attention" && (
                    <AttentionItemsSection
                      items={attentionItems}
                      companies={companies}
                      lots={lots}
                      meetingId={meeting.id}
                      onCreateItem={(item) => createAttentionItem.mutate(item)}
                      onUpdateItem={(id, updates) => updateAttentionItem.mutate({ id, ...updates })}
                      onDeleteItem={(id) => deleteAttentionItem.mutate(id)}
                    />
                  )}

                  {section.id === "observations" && (
                    <ObservationsSection
                      observations={meetingObservations}
                      allProjectObservations={observations}
                      lots={lots}
                      meetingId={meeting.id}
                      onStatusChange={(id, status) => updateObservation.mutate({ id, status, resolved_at: status === "resolved" ? new Date().toISOString() : null })}
                      onAddObservation={(obs) => createObservation.mutate({ ...obs, meeting_id: meeting.id, priority: obs.priority as any })}
                      onUpdateComment={(id, comment) => setObservationComments(prev => ({ ...prev, [id]: comment }))}
                      observationComments={observationComments}
                    />
                  )}

                  {section.id === "tasks" && (
                    <TasksSection
                      internalTasks={internalTasks}
                      externalTasks={externalTasks}
                      onCreateInternalTask={(task) => createTask.mutate({ ...task, project_id: projectId, module: "chantier" })}
                      onCreateExternalTask={(task) => setExternalTasks(prev => [...prev, { ...task, id: crypto.randomUUID() }])}
                      onToggleExternalTask={(id, completed) => setExternalTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t))}
                      onUpdateExternalTaskComment={(id, comment) => setExternalTasks(prev => prev.map(t => t.id === id ? { ...t, comment } : t))}
                      onToggleInternalTask={(id, completed) => updateTaskStatus.mutate({ id, status: completed ? "done" : "todo" })}
                      attendeeNames={attendeesWithType.map(a => ({ name: a.name, type: a.type || "other" }))}
                    />
                  )}

                  {section.id === "summary" && (
                    <div className="space-y-4">
                      {aiSummary ? (
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Synthèse générée par IA</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{aiSummary}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Cliquez sur "Synthèse AI" pour générer un résumé</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>

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
      />
    </div>
  );
}
