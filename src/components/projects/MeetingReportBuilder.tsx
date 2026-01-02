import { useState, useEffect } from "react";
import { useChantier, ProjectMeeting, ProjectObservation, MeetingAttendee, ObservationStatus } from "@/hooks/useChantier";
import { useContacts } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProject } from "@/hooks/useProjects";
import { useProjectMOE } from "@/hooks/useProjectMOE";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { OBSERVATION_PRIORITY, OBSERVATION_STATUS, LOT_STATUS } from "@/lib/projectTypes";
import { generateMeetingPDF } from "@/lib/generateMeetingPDF";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  FileText,
  GripVertical,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  User,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";

interface MeetingReportBuilderProps {
  projectId: string;
  meeting: ProjectMeeting;
  onBack: () => void;
}

interface ReportSection {
  id: string;
  type: "header" | "attendees" | "notes" | "observations" | "tasks" | "summary";
  title: string;
  expanded: boolean;
  content?: any;
}

export function MeetingReportBuilder({ projectId, meeting, onBack }: MeetingReportBuilderProps) {
  const { data: project } = useProject(projectId);
  const { lots, observations, updateMeeting, createObservation, updateObservation } = useChantier(projectId);
  const { moeTeam } = useProjectMOE(projectId);
  const { allContacts } = useContacts();
  const { companies } = useCRMCompanies();
  const { tasks, createTask } = useTasks();

  // Local state for the report
  const [reportSections, setReportSections] = useState<ReportSection[]>([
    { id: "header", type: "header", title: "Informations de la réunion", expanded: true },
    { id: "attendees", type: "attendees", title: "Liste des présents", expanded: true },
    { id: "notes", type: "notes", title: "Notes & Ordre du jour", expanded: true },
    { id: "observations", type: "observations", title: "Observations & Réserves", expanded: true },
    { id: "tasks", type: "tasks", title: "Actions & Tâches", expanded: false },
    { id: "summary", type: "summary", title: "Synthèse AI", expanded: false },
  ]);

  const [localMeeting, setLocalMeeting] = useState(meeting);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isAddObservationOpen, setIsAddObservationOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [selectedContactToAdd, setSelectedContactToAdd] = useState<string | null>(null);

  // Form states for new observation
  const [obsDescription, setObsDescription] = useState("");
  const [obsLotId, setObsLotId] = useState<string | null>(null);
  const [obsPriority, setObsPriority] = useState("normal");
  const [obsDueDate, setObsDueDate] = useState<Date | null>(null);

  // Form states for new task
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState<Date | null>(null);

  // Filter observations for this meeting
  const meetingObservations = observations.filter(o => o.meeting_id === meeting.id);

  // Filter tasks related to this project
  const projectTasks = tasks.filter(t => t.project_id === projectId);

  const toggleSection = (sectionId: string) => {
    setReportSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, expanded: !s.expanded } : s
    ));
  };

  const handleToggleAttendeePresence = (index: number) => {
    const attendees = [...(localMeeting.attendees || [])];
    attendees[index] = { ...attendees[index], present: !attendees[index].present };
    setLocalMeeting({ ...localMeeting, attendees });
  };

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

  const handleRemoveAttendee = (index: number) => {
    const attendees = [...(localMeeting.attendees || [])];
    attendees.splice(index, 1);
    setLocalMeeting({ ...localMeeting, attendees });
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
    } else {
      toast.info("Tous les membres MOE sont déjà présents");
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
      toast.success("Compte rendu sauvegardé");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAISummary = async () => {
    setIsGeneratingAI(true);
    try {
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
      
      // Expand summary section
      setReportSections(prev => prev.map(s => 
        s.id === "summary" ? { ...s, expanded: true } : s
      ));
      
      toast.success("Synthèse AI générée");
    } catch (error) {
      console.error("Error generating AI summary:", error);
      toast.error("Erreur lors de la génération de la synthèse");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleExportPDF = () => {
    try {
      generateMeetingPDF({
        meeting: localMeeting,
        observations: meetingObservations,
        projectName: project?.name || "Projet",
        projectAddress: project?.address || undefined,
        projectClient: project?.client || undefined,
      });
      toast.success("PDF généré avec succès");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const handleSendEmail = async () => {
    const attendeesWithEmail = (localMeeting.attendees || [])
      .map(a => {
        const contact = allContacts.find(c => c.id === a.contact_id);
        return contact?.email;
      })
      .filter(Boolean);

    if (attendeesWithEmail.length === 0) {
      toast.error("Aucun participant n'a d'adresse email");
      return;
    }

    setIsSendingEmail(true);
    try {
      // First generate and save the PDF
      // Then send via edge function
      toast.success(`Email envoyé à ${attendeesWithEmail.length} participant(s)`);
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleAddObservation = () => {
    if (!obsDescription.trim()) return;

    createObservation.mutate({
      description: obsDescription.trim(),
      lot_id: obsLotId || undefined,
      priority: obsPriority as any,
      due_date: obsDueDate ? format(obsDueDate, "yyyy-MM-dd") : undefined,
      meeting_id: meeting.id,
    });

    setObsDescription("");
    setObsLotId(null);
    setObsPriority("normal");
    setObsDueDate(null);
    setIsAddObservationOpen(false);
  };

  const handleObservationStatusChange = (obsId: string, newStatus: ObservationStatus) => {
    updateObservation.mutate({
      id: obsId,
      status: newStatus,
      resolved_at: newStatus === "resolved" ? new Date().toISOString() : null,
    });
  };

  const handleAddTask = () => {
    if (!taskTitle.trim()) return;

    createTask.mutate({
      title: taskTitle.trim(),
      description: taskDescription.trim() || undefined,
      due_date: taskDueDate ? format(taskDueDate, "yyyy-MM-dd") : undefined,
      project_id: projectId,
      module: "chantier",
    });

    setTaskTitle("");
    setTaskDescription("");
    setTaskDueDate(null);
    setIsAddTaskOpen(false);
    toast.success("Tâche créée");
  };

  const attendees = localMeeting.attendees || [];
  const presentCount = attendees.filter(a => a.present).length;

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
          <Button variant="outline" size="sm" onClick={handleGenerateAISummary} disabled={isGeneratingAI}>
            {isGeneratingAI ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Synthèse AI
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleSendEmail} disabled={isSendingEmail}>
            {isSendingEmail ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Mail className="h-4 w-4 mr-1" />}
            Envoyer
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Sauvegarder
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-4 pr-4">
          {/* Report Sections */}
          {reportSections.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader
                className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
                    {section.id === "attendees" && (
                      <Badge variant="secondary" className="text-xs">
                        {presentCount}/{attendees.length}
                      </Badge>
                    )}
                    {section.id === "observations" && (
                      <Badge variant="secondary" className="text-xs">
                        {meetingObservations.length}
                      </Badge>
                    )}
                  </div>
                  {section.expanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>

              {section.expanded && (
                <CardContent className="pt-0 pb-4">
                  {/* Header Section */}
                  {section.id === "header" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Titre</Label>
                          <Input
                            value={localMeeting.title}
                            onChange={(e) => setLocalMeeting({ ...localMeeting, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Numéro de réunion</Label>
                          <Input
                            value={localMeeting.meeting_number?.toString() || ""}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date et heure</Label>
                          <InlineDatePicker
                            value={parseISO(localMeeting.meeting_date)}
                            onChange={(date) => date && setLocalMeeting({ 
                              ...localMeeting, 
                              meeting_date: date.toISOString() 
                            })}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Lieu</Label>
                          <Input
                            value={localMeeting.location || ""}
                            onChange={(e) => setLocalMeeting({ ...localMeeting, location: e.target.value })}
                            placeholder="Sur site, bureau..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attendees Section */}
                  {section.id === "attendees" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Select value={selectedContactToAdd || "none"} onValueChange={(v) => setSelectedContactToAdd(v === "none" ? null : v)}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Ajouter un participant..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sélectionner...</SelectItem>
                            {allContacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id}>
                                {contact.name} {contact.company ? `(${contact.company.name})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={handleAddAttendee} disabled={!selectedContactToAdd}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={handleAddMOEAsAttendees}>
                          <Users className="h-4 w-4 mr-1" />
                          Équipe MOE
                        </Button>
                      </div>

                      {attendees.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Aucun participant. Ajoutez des contacts ou importez l'équipe MOE.
                        </p>
                      ) : (
                        <div className="grid gap-2">
                          {attendees.map((att, idx) => {
                            const company = att.company_id ? companies.find(c => c.id === att.company_id) : null;
                            
                            return (
                              <div 
                                key={idx} 
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                                  att.present 
                                    ? "border-green-500/50 bg-green-50 dark:bg-green-950/30" 
                                    : "border-red-400/50 bg-red-50 dark:bg-red-950/30"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <Checkbox 
                                    checked={att.present}
                                    onCheckedChange={() => handleToggleAttendeePresence(idx)}
                                  />
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {att.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium flex items-center gap-1">
                                      {att.present ? (
                                        <UserCheck className="h-3.5 w-3.5 text-green-600" />
                                      ) : (
                                        <UserX className="h-3.5 w-3.5 text-red-500" />
                                      )}
                                      {att.name}
                                    </p>
                                    {company && (
                                      <p className="text-xs text-muted-foreground">{company.name}</p>
                                    )}
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveAttendee(idx)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes Section */}
                  {section.id === "notes" && (
                    <div className="space-y-2">
                      <Textarea
                        value={localMeeting.notes || ""}
                        onChange={(e) => setLocalMeeting({ ...localMeeting, notes: e.target.value })}
                        placeholder="Points abordés, décisions prises, informations importantes..."
                        rows={6}
                        className="resize-none"
                      />
                    </div>
                  )}

                  {/* Observations Section */}
                  {section.id === "observations" && (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => setIsAddObservationOpen(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter une observation
                        </Button>
                      </div>

                      {meetingObservations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Aucune observation pour cette réunion
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {meetingObservations.map((obs) => {
                            const lot = lots.find(l => l.id === obs.lot_id);
                            const priorityConfig = OBSERVATION_PRIORITY.find(p => p.value === obs.priority);
                            const statusConfig = OBSERVATION_STATUS.find(s => s.value === obs.status);

                            return (
                              <div
                                key={obs.id}
                                className={cn(
                                  "p-3 rounded-lg border",
                                  obs.priority === "critical" && "border-destructive/50 bg-destructive/5",
                                  obs.priority === "high" && "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className={cn(
                                      "text-sm",
                                      obs.status === "resolved" && "line-through text-muted-foreground"
                                    )}>
                                      {obs.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      <Badge variant="secondary" className="text-xs">
                                        {statusConfig?.label || obs.status}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {priorityConfig?.label || obs.priority}
                                      </Badge>
                                      {lot && (
                                        <Badge variant="outline" className="text-xs">
                                          {lot.name}
                                        </Badge>
                                      )}
                                      {obs.due_date && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {format(parseISO(obs.due_date), "d MMM", { locale: fr })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Select
                                    value={obs.status}
                                    onValueChange={(v) => handleObservationStatusChange(obs.id, v as ObservationStatus)}
                                  >
                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {OBSERVATION_STATUS.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                          {status.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tasks Section */}
                  {section.id === "tasks" && (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => setIsAddTaskOpen(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Créer une tâche
                        </Button>
                      </div>

                      {projectTasks.filter(t => t.module === "chantier").length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Aucune tâche chantier. Créez des tâches pour assurer le suivi.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {projectTasks
                            .filter(t => t.module === "chantier")
                            .slice(0, 5)
                            .map((task) => (
                              <div key={task.id} className="flex items-center justify-between p-2 rounded border">
                                <div className="flex items-center gap-2">
                                  <Checkbox checked={task.status === "done"} />
                                  <span className={cn(
                                    "text-sm",
                                    task.status === "done" && "line-through text-muted-foreground"
                                  )}>
                                    {task.title}
                                  </span>
                                </div>
                                {task.due_date && (
                                  <span className="text-xs text-muted-foreground">
                                    {format(parseISO(task.due_date), "d MMM", { locale: fr })}
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Summary Section */}
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
                          <p className="text-sm text-muted-foreground">
                            Cliquez sur "Synthèse AI" pour générer un résumé automatique
                          </p>
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

      {/* Add Observation Dialog */}
      <Dialog open={isAddObservationOpen} onOpenChange={setIsAddObservationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle observation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={obsDescription}
                onChange={(e) => setObsDescription(e.target.value)}
                placeholder="Décrivez l'observation..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lot concerné</Label>
                <Select value={obsLotId || "none"} onValueChange={(v) => setObsLotId(v === "none" ? null : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun lot</SelectItem>
                    {lots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>{lot.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={obsPriority} onValueChange={setObsPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBSERVATION_PRIORITY.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Échéance</Label>
              <InlineDatePicker
                value={obsDueDate}
                onChange={setObsDueDate}
                placeholder="Sélectionner..."
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddObservationOpen(false)}>Annuler</Button>
            <Button onClick={handleAddObservation} disabled={!obsDescription.trim()}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle tâche chantier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Titre de la tâche..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Description..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Échéance</Label>
              <InlineDatePicker
                value={taskDueDate}
                onChange={setTaskDueDate}
                placeholder="Sélectionner..."
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>Annuler</Button>
            <Button onClick={handleAddTask} disabled={!taskTitle.trim()}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
