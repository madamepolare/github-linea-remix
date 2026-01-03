import { useState } from "react";
import { useChantier, ProjectMeeting, MeetingAttendee } from "@/hooks/useChantier";
import { useProject } from "@/hooks/useProjects";
import { useContacts } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { format, parseISO, isFuture, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { generateMeetingPDF } from "@/lib/generateMeetingPDF";
import { toast } from "sonner";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  Download,
  FileText,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2,
  Users,
} from "lucide-react";

interface MeetingsAndReportsSectionProps {
  projectId: string;
  onOpenReport: (meeting: ProjectMeeting) => void;
  onSendConvocation?: (meeting: ProjectMeeting) => void;
  showOnlyReports?: boolean;
}

export function MeetingsAndReportsSection({ 
  projectId, 
  onOpenReport,
  onSendConvocation,
  showOnlyReports = false
}: MeetingsAndReportsSectionProps) {
  const { 
    meetings, 
    meetingsLoading, 
    observations, 
    lots,
    createMeeting, 
    updateMeeting, 
    deleteMeeting,
    duplicateMeeting 
  } = useChantier(projectId);
  const { data: project } = useProject(projectId);
  const { allContacts } = useContacts();
  const { companies } = useCRMCompanies();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ProjectMeeting | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingMeeting, setLinkingMeeting] = useState<ProjectMeeting | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past" | "no-report">("all");

  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState<Date | null>(new Date());
  const [formLocation, setFormLocation] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formAttendees, setFormAttendees] = useState<MeetingAttendee[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const resetForm = () => {
    setFormTitle("");
    setFormDate(new Date());
    setFormLocation("");
    setFormNotes("");
    setFormAttendees([]);
    setEditingMeeting(null);
    setSelectedContactId(null);
  };

  const openEditDialog = (meeting: ProjectMeeting) => {
    setEditingMeeting(meeting);
    setFormTitle(meeting.title);
    setFormDate(parseISO(meeting.meeting_date));
    setFormLocation(meeting.location || "");
    setFormNotes(meeting.notes || "");
    setFormAttendees(meeting.attendees || []);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    if (!formTitle.trim() || !formDate) return;

    createMeeting.mutate({
      title: formTitle.trim(),
      meeting_date: formDate.toISOString(),
      location: formLocation.trim() || undefined,
      notes: formNotes.trim() || undefined,
      attendees: formAttendees,
    });

    setIsDialogOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingMeeting || !formTitle.trim() || !formDate) return;

    updateMeeting.mutate({
      id: editingMeeting.id,
      title: formTitle.trim(),
      meeting_date: formDate.toISOString(),
      location: formLocation.trim() || null,
      notes: formNotes.trim() || null,
      attendees: formAttendees,
    });

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette réunion et son compte rendu ?")) {
      deleteMeeting.mutate(id);
    }
  };

  const handleDuplicate = (meeting: ProjectMeeting) => {
    duplicateMeeting.mutate(meeting);
  };

  const handleClearReport = (meeting: ProjectMeeting) => {
    if (confirm("Effacer le contenu de ce compte rendu ?")) {
      updateMeeting.mutate({ id: meeting.id, report_data: null as unknown as Record<string, unknown> });
      toast.success("Compte rendu effacé");
    }
  };

  const handleLinkMeetings = (sourceMeetingId: string) => {
    if (!linkingMeeting) return;
    const sourceMeeting = meetings.find(m => m.id === sourceMeetingId);
    if (sourceMeeting?.report_data) {
      updateMeeting.mutate({ 
        id: linkingMeeting.id, 
        report_data: JSON.parse(JSON.stringify(sourceMeeting.report_data)) 
      });
      toast.success("Données du CR liées");
    }
    setLinkDialogOpen(false);
    setLinkingMeeting(null);
  };

  const handleGeneratePDF = (meeting: ProjectMeeting) => {
    const meetingObservations = observations.filter(obs => obs.meeting_id === meeting.id);
    try {
      const meetingReportData = meeting.report_data as unknown as import("@/hooks/useMeetingReportData").ReportData | null;
      const { blob, fileName } = generateMeetingPDF({
        meeting,
        observations: meetingObservations,
        projectName: project?.name || "Projet",
        projectAddress: project?.address || undefined,
        projectClient: project?.client || undefined,
        reportData: meetingReportData || undefined,
        lots: (lots || []).map(l => ({ id: l.id, name: l.name })),
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF généré");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const addAttendee = () => {
    if (!selectedContactId) return;
    const contact = allContacts.find(c => c.id === selectedContactId);
    if (!contact) return;
    
    if (formAttendees.some(a => a.contact_id === selectedContactId)) {
      toast.error("Ce contact est déjà dans la liste");
      return;
    }

    setFormAttendees([
      ...formAttendees,
      {
        contact_id: contact.id,
        company_id: contact.crm_company_id || undefined,
        name: contact.name,
        present: true,
      }
    ]);
    setSelectedContactId(null);
  };

  const removeAttendee = (index: number) => {
    setFormAttendees(formAttendees.filter((_, i) => i !== index));
  };

  // Check if a meeting has report content
  const hasReportContent = (meeting: ProjectMeeting) => {
    if (!meeting.report_data) return false;
    const data = meeting.report_data as Record<string, unknown>;
    return Boolean(
      data.context || 
      (data.lot_progress && (data.lot_progress as unknown[]).length > 0) ||
      (data.technical_decisions && (data.technical_decisions as unknown[]).length > 0) ||
      (data.blocking_points && (data.blocking_points as unknown[]).length > 0) ||
      data.general_progress
    );
  };

  // Filter meetings
  const filteredMeetings = meetings.filter(meeting => {
    const meetingDate = parseISO(meeting.meeting_date);
    const isUpcoming = isFuture(meetingDate) || isToday(meetingDate);
    const hasReport = hasReportContent(meeting);

    // If showOnlyReports mode, only show meetings with reports
    if (showOnlyReports && !hasReport) {
      return false;
    }

    switch (filter) {
      case "upcoming":
        return isUpcoming;
      case "past":
        return !isUpcoming;
      case "no-report":
        return !hasReport;
      default:
        return true;
    }
  });

  // Sort: upcoming first (by date asc), then past (by date desc)
  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    const dateA = parseISO(a.meeting_date);
    const dateB = parseISO(b.meeting_date);
    const aIsUpcoming = isFuture(dateA) || isToday(dateA);
    const bIsUpcoming = isFuture(dateB) || isToday(dateB);
    
    if (aIsUpcoming && !bIsUpcoming) return -1;
    if (!aIsUpcoming && bIsUpcoming) return 1;
    if (aIsUpcoming) return dateA.getTime() - dateB.getTime();
    return dateB.getTime() - dateA.getTime();
  });

  if (meetingsLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  // Empty state for CR mode when no reports exist
  if (showOnlyReports && sortedMeetings.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Aucun compte rendu"
        description="Les comptes rendus rédigés apparaîtront ici."
      />
    );
  }

  if (meetings.length === 0 && !isDialogOpen) {
    return (
      <>
        <EmptyState
          icon={Users}
          title="Aucune réunion"
          description="Planifiez des réunions de chantier et rédigez leurs comptes rendus."
          action={{ label: "Planifier une réunion", onClick: () => setIsDialogOpen(true) }}
        />
        <MeetingDialog
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); resetForm(); }}
          formTitle={formTitle}
          setFormTitle={setFormTitle}
          formDate={formDate}
          setFormDate={setFormDate}
          formLocation={formLocation}
          setFormLocation={setFormLocation}
          formNotes={formNotes}
          setFormNotes={setFormNotes}
          formAttendees={formAttendees}
          selectedContactId={selectedContactId}
          setSelectedContactId={setSelectedContactId}
          addAttendee={addAttendee}
          removeAttendee={removeAttendee}
          contacts={allContacts}
          onSubmit={handleCreate}
          isEdit={false}
        />
      </>
    );
  }

  // Define filters based on mode
  const filterOptions = showOnlyReports
    ? [
        { value: "all", label: "Tous" },
        { value: "past", label: "Récents" },
      ]
    : [
        { value: "all", label: "Tous" },
        { value: "upcoming", label: "À venir" },
        { value: "past", label: "Passées" },
        { value: "no-report", label: "Sans CR" },
      ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-medium">
            {showOnlyReports ? "Comptes Rendus" : "Réunions"}
          </h3>
          <Badge variant="secondary">
            {showOnlyReports ? sortedMeetings.length : meetings.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex items-center border rounded-lg p-1 bg-muted/30">
            {filterOptions.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setFilter(f.value as typeof filter)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          {!showOnlyReports && (
            <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle réunion
            </Button>
          )}
        </div>
      </div>

      {/* Meetings List */}
      <div className="grid gap-3">
        {sortedMeetings.map((meeting) => {
          const attendees = meeting.attendees || [];
          const presentCount = attendees.filter(a => a.present).length;
          const hasReport = hasReportContent(meeting);
          const meetingDate = parseISO(meeting.meeting_date);
          const isUpcoming = isFuture(meetingDate) || isToday(meetingDate);
          
          return (
            <Card 
              key={meeting.id} 
              className={cn(
                "cursor-pointer hover:border-primary/50 transition-colors",
                isUpcoming && "border-l-4 border-l-blue-500"
              )}
              onClick={() => onOpenReport(meeting)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Meeting Number */}
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                    hasReport ? "bg-green-100 dark:bg-green-950" : "bg-muted"
                  )}>
                    <span className={cn(
                      "text-lg font-bold",
                      hasReport ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                    )}>
                      {meeting.meeting_number || "#"}
                    </span>
                  </div>

                  {/* Meeting Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{meeting.title}</span>
                      {isUpcoming ? (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                          <Clock className="h-3 w-3 mr-1" />
                          À venir
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Passée
                        </Badge>
                      )}
                      {hasReport ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          CR rédigé
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                          <FileText className="h-3 w-3 mr-1" />
                          CR à rédiger
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(meetingDate, "EEEE d MMMM yyyy", { locale: fr })}
                      </span>
                      {meeting.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {meeting.location}
                        </span>
                      )}
                    </div>

                    {/* Attendees preview */}
                    {attendees.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex -space-x-1">
                          {attendees.slice(0, 5).map((att, idx) => (
                            <Avatar key={idx} className={cn("h-6 w-6 border-2 border-background", att.present ? "ring-1 ring-green-500" : "ring-1 ring-red-400")}>
                              <AvatarFallback className="text-[10px]">
                                {att.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {presentCount}/{attendees.length} présents
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {onSendConvocation && isUpcoming && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => onSendConvocation(meeting)}
                        title="Envoyer une convocation"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleGeneratePDF(meeting)}
                      title="Télécharger le PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onOpenReport(meeting)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Éditer le CR
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(meeting)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Modifier la réunion
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(meeting)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setLinkingMeeting(meeting); setLinkDialogOpen(true); }}>
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Lier à un autre CR
                        </DropdownMenuItem>
                        {onSendConvocation && (
                          <DropdownMenuItem onClick={() => onSendConvocation(meeting)}>
                            <Send className="h-4 w-4 mr-2" />
                            Envoyer une convocation
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleGeneratePDF(meeting)}>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger le PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {hasReport && (
                          <DropdownMenuItem 
                            onClick={() => handleClearReport(meeting)}
                            className="text-amber-600 focus:text-amber-600"
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Effacer le CR
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDelete(meeting.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button 
                      variant={hasReport ? "outline" : "default"}
                      size="sm"
                      onClick={() => onOpenReport(meeting)}
                    >
                      {hasReport ? "Voir le CR" : "Rédiger le CR"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMeetings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune réunion ne correspond aux filtres</p>
        </div>
      )}

      {/* Meeting Dialog */}
      <MeetingDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); resetForm(); }}
        formTitle={formTitle}
        setFormTitle={setFormTitle}
        formDate={formDate}
        setFormDate={setFormDate}
        formLocation={formLocation}
        setFormLocation={setFormLocation}
        formNotes={formNotes}
        setFormNotes={setFormNotes}
        formAttendees={formAttendees}
        selectedContactId={selectedContactId}
        setSelectedContactId={setSelectedContactId}
        addAttendee={addAttendee}
        removeAttendee={removeAttendee}
        contacts={allContacts}
        onSubmit={editingMeeting ? handleUpdate : handleCreate}
        isEdit={!!editingMeeting}
      />

      {/* Link CR Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lier à un compte rendu existant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Sélectionnez un compte rendu pour copier son contenu.
            </p>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {meetings
                  .filter(m => m.id !== linkingMeeting?.id && hasReportContent(m))
                  .map((meeting) => (
                    <Card 
                      key={meeting.id} 
                      className="cursor-pointer hover:border-primary/50"
                      onClick={() => handleLinkMeetings(meeting.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-medium">CR n°{meeting.meeting_number}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-sm">{meeting.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(meeting.meeting_date), "d MMMM yyyy", { locale: fr })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                {meetings.filter(m => m.id !== linkingMeeting?.id && hasReportContent(m)).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun autre compte rendu avec du contenu disponible
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Meeting Dialog Component
function MeetingDialog({
  isOpen,
  onClose,
  formTitle,
  setFormTitle,
  formDate,
  setFormDate,
  formLocation,
  setFormLocation,
  formNotes,
  setFormNotes,
  formAttendees,
  selectedContactId,
  setSelectedContactId,
  addAttendee,
  removeAttendee,
  contacts,
  onSubmit,
  isEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  formTitle: string;
  setFormTitle: (v: string) => void;
  formDate: Date | null;
  setFormDate: (v: Date | null) => void;
  formLocation: string;
  setFormLocation: (v: string) => void;
  formNotes: string;
  setFormNotes: (v: string) => void;
  formAttendees: MeetingAttendee[];
  selectedContactId: string | null;
  setSelectedContactId: (v: string | null) => void;
  addAttendee: () => void;
  removeAttendee: (index: number) => void;
  contacts: any[];
  onSubmit: () => void;
  isEdit: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la réunion" : "Nouvelle réunion"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Ex: Réunion de chantier"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date et heure *</Label>
              <InlineDatePicker
                value={formDate}
                onChange={setFormDate}
                placeholder="Sélectionner..."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="Sur site, Bureau..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes / Ordre du jour</Label>
            <Textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Points à aborder..."
              rows={2}
            />
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label>Participants</Label>
            <div className="flex gap-2">
              <Select value={selectedContactId || "none"} onValueChange={(v) => setSelectedContactId(v === "none" ? null : v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner un contact..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sélectionner...</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} {contact.company ? `(${contact.company.name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={addAttendee} disabled={!selectedContactId}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formAttendees.length > 0 && (
              <div className="space-y-1 mt-2">
                {formAttendees.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm">{att.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAttendee(idx)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={!formTitle.trim() || !formDate}>
            {isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
