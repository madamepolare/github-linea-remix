import { useState } from "react";
import { useChantier, ProjectMeeting, MeetingAttendee } from "@/hooks/useChantier";
import { useContacts } from "@/hooks/useContacts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { format, parseISO, isFuture, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2,
  Users,
} from "lucide-react";

interface MeetingsSectionProps {
  projectId: string;
  onSendConvocation?: (meeting: ProjectMeeting) => void;
}

export function MeetingsSection({ projectId, onSendConvocation }: MeetingsSectionProps) {
  const { meetings, meetingsLoading, createMeeting, updateMeeting, deleteMeeting } = useChantier(projectId);
  const { allContacts } = useContacts();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ProjectMeeting | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

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
      preloadFromPrevious: false, // Don't preload report data for meetings
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
    if (confirm("Supprimer cette réunion ?")) {
      deleteMeeting.mutate(id);
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

  // Filter meetings
  const filteredMeetings = meetings.filter(meeting => {
    const meetingDate = parseISO(meeting.meeting_date);
    const isUpcoming = isFuture(meetingDate) || isToday(meetingDate);

    switch (filter) {
      case "upcoming":
        return isUpcoming;
      case "past":
        return !isUpcoming;
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

  if (meetings.length === 0 && !isDialogOpen) {
    return (
      <>
        <EmptyState
          icon={Users}
          title="Aucune réunion"
          description="Planifiez des réunions de chantier et invitez les participants."
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

  const filterOptions = [
    { value: "all", label: "Toutes" },
    { value: "upcoming", label: "À venir" },
    { value: "past", label: "Passées" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-medium">Réunions</h3>
          <Badge variant="secondary">{meetings.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
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
          <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Nouvelle réunion
          </Button>
        </div>
      </div>

      {/* Meetings List */}
      <div className="grid gap-3">
        {sortedMeetings.map((meeting) => {
          const attendees = meeting.attendees || [];
          const presentCount = attendees.filter(a => a.present).length;
          const meetingDate = parseISO(meeting.meeting_date);
          const isUpcoming = isFuture(meetingDate) || isToday(meetingDate);

          return (
            <Card
              key={meeting.id}
              className={cn(
                "hover:border-primary/50 transition-colors",
                isUpcoming && "border-l-4 border-l-blue-500"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Meeting Number */}
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-muted-foreground">
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

                    {meeting.notes && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                        {meeting.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(meeting)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(meeting.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
    </div>
  );
}

// Meeting Dialog Component
interface MeetingDialogProps {
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
  contacts: { id: string; name: string; crm_company_id: string | null }[];
  onSubmit: () => void;
  isEdit: boolean;
}

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
}: MeetingDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la réunion" : "Nouvelle réunion"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input
              placeholder="Réunion de chantier n°..."
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <InlineDatePicker
                value={formDate}
                onChange={setFormDate}
                placeholder="Sélectionner une date"
              />
            </div>
            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input
                placeholder="Sur site, visio..."
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Ordre du jour, remarques..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Participants</Label>
            <div className="flex gap-2">
              <Select value={selectedContactId || ""} onValueChange={setSelectedContactId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Ajouter un participant" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={addAttendee} disabled={!selectedContactId}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formAttendees.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formAttendees.map((att, idx) => (
                  <Badge key={idx} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                    {att.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-destructive/20"
                      onClick={() => removeAttendee(idx)}
                    >
                      ×
                    </Button>
                  </Badge>
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
