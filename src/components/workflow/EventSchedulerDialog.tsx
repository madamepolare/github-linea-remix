import { useState, useMemo, useEffect } from "react";
import { format, addDays, setHours, setMinutes, startOfWeek, isSameDay, parseISO, addMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Users, Video, Phone, MapPin, Clock, Check, ChevronLeft, ChevronRight, Sparkles, Building2, UserPlus, Download, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";

import { useWorkspaceEvents } from "@/hooks/useWorkspaceEvents";
import { useTeamAbsences } from "@/hooks/useTeamAbsences";
import { useProjects } from "@/hooks/useProjects";
import { usePlanningSettings } from "@/hooks/usePlanningSettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// Event categories
const EVENT_CATEGORIES = [
  { value: "internal", label: "Point interne", icon: Users, color: "bg-blue-500", description: "Réunion d'équipe" },
  { value: "client", label: "Réunion client", icon: Building2, color: "bg-green-500", description: "Avec le client" },
  { value: "other", label: "Autre événement", icon: Calendar, color: "bg-purple-500", description: "Formation, workshop..." },
];

const MEETING_TYPES = [
  { value: "video", label: "Visioconférence", icon: Video, description: "Google Meet, Zoom..." },
  { value: "call", label: "Appel téléphonique", icon: Phone, description: "Appel classique" },
  { value: "inperson", label: "En personne", icon: MapPin, description: "Réunion physique" },
];

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 heure" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2 heures" },
  { value: 180, label: "3 heures" },
];

interface EventSchedulerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TimeSlot {
  date: Date;
  startHour: number;
  endHour: number;
  availableFor: string[]; // user_ids who are available
}

export function EventSchedulerDialog({ open, onOpenChange }: EventSchedulerDialogProps) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const { data: members } = useTeamMembers();
  
  const { data: events } = useWorkspaceEvents();
  const { data: absences } = useTeamAbsences({ status: "approved" });
  const { projects } = useProjects();
  const { planningSettings } = usePlanningSettings();

  // Form state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventCategory, setEventCategory] = useState("internal");
  const [meetingType, setMeetingType] = useState("video");
  const [duration, setDuration] = useState(60);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [location, setLocation] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteClientContacts, setInviteClientContacts] = useState<string[]>([]);
  const [sendInvitations, setSendInvitations] = useState(true);

  // Get client contacts when project is selected
  const selectedProject = useMemo(() => 
    selectedProjectId && selectedProjectId !== "__none__" ? projects?.find(p => p.id === selectedProjectId) : null,
    [projects, selectedProjectId]
  );

  const { data: clientContacts } = useQuery({
    queryKey: ["client-contacts", selectedProject?.crm_company_id],
    queryFn: async () => {
      if (!selectedProject?.crm_company_id) return [];
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, email, role, avatar_url")
        .eq("crm_company_id", selectedProject.crm_company_id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProject?.crm_company_id && eventCategory === "client",
  });

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setTitle("");
      setDescription("");
      setEventCategory("internal");
      setMeetingType("video");
      setDuration(60);
      setSelectedMembers(user?.id ? [user.id] : []);
      setSelectedProjectId("");
      setLocation("");
      setSelectedSlot(null);
      setWeekOffset(0);
      setInviteClientContacts([]);
      setSendInvitations(true);
    }
  }, [open, user]);

  // Calculate the week to display
  const weekStart = useMemo(() => {
    const today = new Date();
    return addDays(startOfWeek(today, { weekStartsOn: 1 }), weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)); // Mon-Fri
  }, [weekStart]);

  // Find available slots for all selected members
  // Find available slots - only events and absences are blocking (not tasks)
  const availableSlots = useMemo(() => {
    if (selectedMembers.length === 0) return [];

    const slots: TimeSlot[] = [];
    const durationHours = duration / 60;

    weekDays.forEach((day) => {
      // Check each hour during working hours
      for (let hour = planningSettings.agency_open_hour; hour <= planningSettings.agency_close_hour - durationHours; hour++) {
        // Skip lunch break
        if (hour >= planningSettings.lunch_start_hour && hour < planningSettings.lunch_end_hour) continue;

        const slotStart = setHours(setMinutes(day, 0), hour);
        const slotEnd = addMinutes(slotStart, duration);

        // Check availability for each selected member
        const availableFor: string[] = [];

        selectedMembers.forEach((memberId) => {
          let isAvailable = true;

          // Check absences
          absences?.forEach((absence) => {
            if (absence.user_id !== memberId) return;
            const absenceStart = parseISO(absence.start_date);
            const absenceEnd = parseISO(absence.end_date);
            if (day >= absenceStart && day <= absenceEnd) {
              isAvailable = false;
            }
          });

          // Check events (only blocking elements for availability)
          events?.forEach((event) => {
            const isAttendee = event.attendees?.some(
              (a) => a.user_id === memberId
            );
            if (!isAttendee) return;
            const eventStart = new Date(event.start_datetime);
            const eventEnd = event.end_datetime
              ? new Date(event.end_datetime)
              : addMinutes(eventStart, 60);
            if (slotStart < eventEnd && slotEnd > eventStart) {
              isAvailable = false;
            }
          });

          if (isAvailable) {
            availableFor.push(memberId);
          }
        });

        // Only add slot if at least some members are available
        if (availableFor.length > 0) {
          slots.push({
            date: day,
            startHour: hour,
            endHour: hour + durationHours,
            availableFor,
          });
        }
      }
    });

    return slots;
  }, [weekDays, selectedMembers, duration, events, absences, planningSettings]);

  // Slots where ALL selected members are available
  const perfectSlots = useMemo(() => {
    return availableSlots.filter((slot) => slot.availableFor.length === selectedMembers.length);
  }, [availableSlots, selectedMembers]);

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
    setSelectedSlot(null); // Reset slot selection when members change
  };

  // Generate ICS file content
  const generateICS = (event: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location: string;
    attendees: { email: string; name: string }[];
  }) => {
    const formatDateForICS = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const attendeesStr = event.attendees
      .filter(a => a.email)
      .map(a => `ATTENDEE;CN=${a.name}:mailto:${a.email}`)
      .join("\r\n");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Workspace//Event Scheduler//FR",
      "CALSCALE:GREGORIAN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `DTSTART:${formatDateForICS(event.startDate)}`,
      `DTEND:${formatDateForICS(event.endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
      `LOCATION:${event.location}`,
      `UID:${Date.now()}@workspace.app`,
      `DTSTAMP:${formatDateForICS(new Date())}`,
      attendeesStr,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");

    return icsContent;
  };

  const downloadICS = (event: Parameters<typeof generateICS>[0]) => {
    const ics = generateICS(event);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !title.trim() || !activeWorkspace) return;

    setIsSubmitting(true);

    try {
      const startDatetime = setHours(
        setMinutes(selectedSlot.date, 0),
        selectedSlot.startHour
      );
      const endDatetime = addMinutes(startDatetime, duration);

      // Build attendees list (team members)
      const attendees: { user_id?: string; email: string; name: string; type?: string }[] = selectedMembers.map((userId) => {
        const member = members?.find((m) => m.user_id === userId);
        return {
          user_id: userId,
          email: member?.profile?.email || "",
          name: member?.profile?.full_name || "",
          type: "team",
        };
      });

      // Add client contacts if any
      if (eventCategory === "client" && inviteClientContacts.length > 0) {
        inviteClientContacts.forEach((contactId) => {
          const contact = clientContacts?.find((c) => c.id === contactId);
          if (contact) {
            attendees.push({
              email: contact.email || "",
              name: contact.name,
              type: "client",
            });
          }
        });
      }

      const locationValue = meetingType === "video"
        ? "Visioconférence"
        : meetingType === "call"
        ? "Appel téléphonique"
        : location || "En personne";

      // Create the event
      const { error } = await supabase.from("project_calendar_events").insert({
        workspace_id: activeWorkspace.id,
        project_id: selectedProjectId && selectedProjectId !== "__none__" ? selectedProjectId : null,
        title,
        description: description || null,
        event_type: eventCategory === "internal" ? "internal_meeting" : eventCategory === "client" ? "client_meeting" : "other",
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
        location: locationValue,
        attendees,
      });

      if (error) throw error;

      // Download ICS if client contacts are invited
      if (sendInvitations && (inviteClientContacts.length > 0 || eventCategory !== "internal")) {
        downloadICS({
          title,
          description: description || "",
          startDate: startDatetime,
          endDate: endDatetime,
          location: locationValue,
          attendees,
        });
        toast.success("Réunion créée ! Fichier ICS téléchargé pour envoyer les invitations.");
      } else {
        toast.success("Réunion planifiée avec succès !");
      }

      queryClient.invalidateQueries({ queryKey: ["workspace-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSlotTime = (slot: TimeSlot) => {
    const startH = slot.startHour.toString().padStart(2, "0");
    const endH = slot.endHour.toString().padStart(2, "0");
    return `${startH}:00 - ${endH}:00`;
  };

  const toggleClientContact = (contactId: string) => {
    setInviteClientContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Assistant de planification
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 px-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 transition-colors",
                    step > s ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1 mt-4">
          <div className="space-y-4 px-1">
            {/* Step 1: Basic info + participants */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Event Category */}
                <div className="space-y-2">
                  <Label>Type d'événement</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {EVENT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => {
                          setEventCategory(cat.value);
                          setInviteClientContacts([]);
                        }}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          eventCategory === cat.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn("w-2 h-2 rounded-full mb-2", cat.color)} />
                        <div className="text-sm font-medium">{cat.label}</div>
                        <div className="text-xs text-muted-foreground">{cat.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Titre de la réunion *</Label>
                  <Input
                    placeholder="Ex: Point projet, Revue de conception..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Projet associé {eventCategory === "client" ? "*" : "(optionnel)"}</Label>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un projet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Aucun projet</SelectItem>
                        {projects?.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Durée</Label>
                    <Select
                      value={duration.toString()}
                      onValueChange={(v) => {
                        setDuration(parseInt(v));
                        setSelectedSlot(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Type de réunion</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {MEETING_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setMeetingType(type.value)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          meetingType === type.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <type.icon className="h-5 w-5 mb-1" />
                        <div className="text-sm font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {meetingType === "inperson" && (
                  <div className="space-y-2">
                    <Label>Lieu</Label>
                    <Input
                      placeholder="Adresse ou salle de réunion..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Participants ({selectedMembers.length} sélectionnés)</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto p-2 border rounded-lg">
                    {members?.map((member) => (
                      <label
                        key={member.user_id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                          selectedMembers.includes(member.user_id)
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        )}
                      >
                        <Checkbox
                          checked={selectedMembers.includes(member.user_id)}
                          onCheckedChange={() => toggleMember(member.user_id)}
                        />
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.profile?.avatar_url || ""} />
                          <AvatarFallback className="text-[10px]">
                            {(member.profile?.full_name || "?").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{member.profile?.full_name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Client contacts invitation - only for client meetings with a project */}
                {eventCategory === "client" && selectedProject?.crm_company_id && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Inviter des contacts client
                      {selectedProject.crm_company?.name && (
                        <Badge variant="secondary" className="text-xs">
                          {selectedProject.crm_company.name}
                        </Badge>
                      )}
                    </Label>
                    {clientContacts && clientContacts.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-auto p-2 border rounded-lg border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
                        {clientContacts.map((contact) => (
                          <label
                            key={contact.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                              inviteClientContacts.includes(contact.id)
                                ? "bg-green-100 dark:bg-green-900/30"
                                : "hover:bg-green-100/50 dark:hover:bg-green-900/20"
                            )}
                          >
                            <Checkbox
                              checked={inviteClientContacts.includes(contact.id)}
                              onCheckedChange={() => toggleClientContact(contact.id)}
                            />
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={contact.avatar_url || ""} />
                              <AvatarFallback className="text-[10px] bg-green-200 text-green-800">
                                {contact.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm truncate block">{contact.name}</span>
                              {contact.email && (
                                <span className="text-xs text-muted-foreground truncate block">{contact.email}</span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-3 border rounded-lg border-dashed">
                        Aucun contact trouvé pour ce client.
                      </div>
                    )}
                  </div>
                )}

                {/* Send invitations checkbox */}
                {(inviteClientContacts.length > 0 || eventCategory !== "internal") && (
                  <label className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30 cursor-pointer">
                    <Checkbox
                      checked={sendInvitations}
                      onCheckedChange={(checked) => setSendInvitations(!!checked)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Télécharger le fichier ICS
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pour envoyer les invitations via votre calendrier (Outlook, Google Calendar...)
                      </div>
                    </div>
                  </label>
                )}

                <div className="space-y-2">
                  <Label>Description (optionnel)</Label>
                  <Textarea
                    placeholder="Ordre du jour, notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Find available slot */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setWeekOffset((w) => w - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      {format(weekStart, "d MMM", { locale: fr })} -{" "}
                      {format(addDays(weekStart, 4), "d MMM yyyy", { locale: fr })}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setWeekOffset((w) => w + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {perfectSlots.length} créneaux pour tous
                  </Badge>
                </div>

                {/* Perfect slots first */}
                {perfectSlots.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-green-600 flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Créneaux disponibles pour tous ({perfectSlots.length})
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {perfectSlots.slice(0, 9).map((slot, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedSlot(slot)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            selectedSlot === slot
                              ? "border-primary bg-primary/10 ring-2 ring-primary"
                              : "border-green-200 bg-green-50 hover:border-green-400 dark:bg-green-950/30 dark:border-green-800"
                          )}
                        >
                          <div className="text-xs text-muted-foreground">
                            {format(slot.date, "EEEE d", { locale: fr })}
                          </div>
                          <div className="text-sm font-medium">{formatSlotTime(slot)}</div>
                          <div className="flex -space-x-1 mt-1">
                            {slot.availableFor.slice(0, 4).map((userId) => {
                              const member = members?.find((m) => m.user_id === userId);
                              return (
                                <Avatar key={userId} className="h-5 w-5 border-2 border-background">
                                  <AvatarImage src={member?.profile?.avatar_url || ""} />
                                  <AvatarFallback className="text-[8px]">
                                    {(member?.profile?.full_name || "?").charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              );
                            })}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {perfectSlots.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun créneau disponible pour tous les participants cette semaine.</p>
                    <p className="text-xs mt-1">Essayez une autre semaine ou réduisez le nombre de participants.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && selectedSlot && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  {/* Event category badge */}
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "text-white",
                      eventCategory === "internal" && "bg-blue-500",
                      eventCategory === "client" && "bg-green-500",
                      eventCategory === "other" && "bg-purple-500"
                    )}>
                      {EVENT_CATEGORIES.find(c => c.value === eventCategory)?.label}
                    </Badge>
                    {selectedProject && (
                      <Badge variant="outline">{selectedProject.name}</Badge>
                    )}
                  </div>

                  <h4 className="font-medium">{title}</h4>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(selectedSlot.date, "EEEE d MMMM yyyy", { locale: fr })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatSlotTime(selectedSlot)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    {meetingType === "video" && <Video className="h-4 w-4 text-muted-foreground" />}
                    {meetingType === "call" && <Phone className="h-4 w-4 text-muted-foreground" />}
                    {meetingType === "inperson" && <MapPin className="h-4 w-4 text-muted-foreground" />}
                    <span>
                      {meetingType === "video" && "Visioconférence"}
                      {meetingType === "call" && "Appel téléphonique"}
                      {meetingType === "inperson" && (location || "En personne")}
                    </span>
                  </div>
                  
                  {/* Team participants */}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex -space-x-1">
                      {selectedMembers.map((userId) => {
                        const member = members?.find((m) => m.user_id === userId);
                        return (
                          <Avatar key={userId} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={member?.profile?.avatar_url || ""} />
                            <AvatarFallback className="text-[10px]">
                              {(member?.profile?.full_name || "?").charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        );
                      })}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {selectedMembers.length} membre{selectedMembers.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Client contacts */}
                  {inviteClientContacts.length > 0 && (
                    <div className="flex items-center gap-2 border-t pt-2">
                      <Building2 className="h-4 w-4 text-green-600" />
                      <div className="flex -space-x-1">
                        {inviteClientContacts.map((contactId) => {
                          const contact = clientContacts?.find((c) => c.id === contactId);
                          return (
                            <Avatar key={contactId} className="h-6 w-6 border-2 border-background">
                              <AvatarImage src={contact?.avatar_url || ""} />
                              <AvatarFallback className="text-[10px] bg-green-100 text-green-800">
                                {(contact?.name || "?").charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          );
                        })}
                      </div>
                      <span className="text-sm text-green-600">
                        {inviteClientContacts.length} contact{inviteClientContacts.length > 1 ? "s" : ""} client
                      </span>
                    </div>
                  )}

                  {/* ICS download info */}
                  {sendInvitations && (inviteClientContacts.length > 0 || eventCategory !== "internal") && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      <Mail className="h-4 w-4" />
                      <span>Un fichier ICS sera téléchargé pour envoyer les invitations</span>
                    </div>
                  )}

                  {description && (
                    <p className="text-sm text-muted-foreground border-t pt-2 mt-2">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
              Retour
            </Button>
          )}
          
          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              disabled={!title.trim() || selectedMembers.length === 0 || (eventCategory === "client" && (!selectedProjectId || selectedProjectId === "__none__"))}
            >
              Trouver un créneau
            </Button>
          )}
          
          {step === 2 && (
            <Button onClick={() => setStep(3)} disabled={!selectedSlot}>
              Confirmer le créneau
            </Button>
          )}
          
          {step === 3 && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer la réunion"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
