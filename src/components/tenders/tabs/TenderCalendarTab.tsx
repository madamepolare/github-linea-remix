import { useState, useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { format, parseISO, addDays, addHours } from "date-fns";
import { fr } from "date-fns/locale";
import frLocale from "@fullcalendar/core/locales/fr";
import {
  Calendar,
  CalendarPlus,
  Clock,
  MapPin,
  Plus,
  Users,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface TenderCalendarTabProps {
  tenderId: string;
  tender: {
    id: string;
    title: string;
    location?: string | null;
    site_visit_date?: string | null;
    submission_deadline?: string | null;
  };
}

interface TenderEvent {
  id: string;
  tender_id: string;
  title: string;
  description?: string | null;
  event_type: "site_visit" | "meeting" | "milestone" | "reminder" | "deadline";
  start_datetime: string;
  end_datetime?: string | null;
  location?: string | null;
  attendees?: any[];
  created_at: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  site_visit: "Visite de site",
  meeting: "Réunion",
  milestone: "Jalon",
  reminder: "Rappel",
  deadline: "Échéance",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  site_visit: "#f59e0b",
  meeting: "#3b82f6",
  milestone: "#8b5cf6",
  reminder: "#10b981",
  deadline: "#ef4444",
};

export function TenderCalendarTab({ tenderId, tender }: TenderCalendarTabProps) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar>(null);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TenderEvent | null>(null);
  const [calendarView, setCalendarView] = useState<"dayGridMonth" | "timeGridWeek" | "listMonth">("dayGridMonth");
  
  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formEventType, setFormEventType] = useState<string>("meeting");
  const [formStartDate, setFormStartDate] = useState<Date | null>(null);
  const [formEndDate, setFormEndDate] = useState<Date | null>(null);
  const [formLocation, setFormLocation] = useState("");

  // Fetch tender events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["tender-events", tenderId],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      
      const { data, error } = await supabase
        .from("tender_calendar_events")
        .select("*")
        .eq("tender_id", tenderId)
        .eq("workspace_id", activeWorkspace.id)
        .order("start_datetime", { ascending: true });

      if (error) throw error;
      return data as TenderEvent[];
    },
    enabled: !!activeWorkspace?.id && !!tenderId,
  });

  // Create event mutation
  const createEvent = useMutation({
    mutationFn: async (event: Omit<TenderEvent, "id" | "created_at" | "tender_id">) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data, error } = await supabase
        .from("tender_calendar_events")
        .insert({
          ...event,
          tender_id: tenderId,
          workspace_id: activeWorkspace.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-events", tenderId] });
      toast.success("Événement créé");
    },
    onError: (error) => {
      console.error("Error creating event:", error);
      toast.error("Erreur lors de la création");
    },
  });

  // Update event mutation
  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TenderEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from("tender_calendar_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-events", tenderId] });
      toast.success("Événement mis à jour");
    },
    onError: (error) => {
      console.error("Error updating event:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  // Delete event mutation
  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tender_calendar_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-events", tenderId] });
      toast.success("Événement supprimé");
    },
    onError: (error) => {
      console.error("Error deleting event:", error);
      toast.error("Erreur lors de la suppression");
    },
  });

  // Reset form
  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormEventType("meeting");
    setFormStartDate(null);
    setFormEndDate(null);
    setFormLocation("");
  };

  // Open edit dialog
  const openEditDialog = (event: TenderEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || "");
    setFormEventType(event.event_type);
    setFormStartDate(parseISO(event.start_datetime));
    setFormEndDate(event.end_datetime ? parseISO(event.end_datetime) : null);
    setFormLocation(event.location || "");
  };

  // Handle create/update
  const handleSubmit = () => {
    if (!formTitle.trim() || !formStartDate) return;

    const eventData = {
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      event_type: formEventType as TenderEvent["event_type"],
      start_datetime: formStartDate.toISOString(),
      end_datetime: formEndDate?.toISOString() || null,
      location: formLocation.trim() || null,
    };

    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, ...eventData });
    } else {
      createEvent.mutate(eventData);
    }

    setIsCreateOpen(false);
    setEditingEvent(null);
    resetForm();
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm("Supprimer cet événement ?")) {
      deleteEvent.mutate(id);
    }
  };

  // Add site visit from tender data
  const addSiteVisitFromTender = () => {
    if (!tender.site_visit_date) return;

    const startDate = parseISO(tender.site_visit_date);
    const endDate = addHours(startDate, 2);

    createEvent.mutate({
      title: `Visite de site - ${tender.title}`,
      description: "Visite de site obligatoire",
      event_type: "site_visit",
      start_datetime: startDate.toISOString(),
      end_datetime: endDate.toISOString(),
      location: tender.location || null,
    });
  };

  // Add deadline from tender data
  const addDeadlineFromTender = () => {
    if (!tender.submission_deadline) return;

    createEvent.mutate({
      title: `Dépôt - ${tender.title}`,
      description: "Date limite de remise des offres",
      event_type: "deadline",
      start_datetime: tender.submission_deadline,
      end_datetime: null,
      location: null,
    });
  };

  // Convert events to FullCalendar format
  const calendarEvents = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start_datetime,
      end: event.end_datetime || undefined,
      backgroundColor: EVENT_TYPE_COLORS[event.event_type] || "#6366f1",
      borderColor: EVENT_TYPE_COLORS[event.event_type] || "#6366f1",
      extendedProps: {
        ...event,
      },
    }));
  }, [events]);

  // Handle event click
  const handleEventClick = (info: any) => {
    const event = events.find((e) => e.id === info.event.id);
    if (event) {
      openEditDialog(event);
    }
  };

  // Handle date select (create new event)
  const handleDateSelect = (info: any) => {
    setFormStartDate(info.start);
    setFormEndDate(info.end);
    setIsCreateOpen(true);
  };

  // Check if site visit or deadline already exists
  const hasSiteVisitEvent = events.some((e) => e.event_type === "site_visit");
  const hasDeadlineEvent = events.some((e) => e.event_type === "deadline");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tender.site_visit_date && !hasSiteVisitEvent && (
            <Button size="sm" variant="outline" onClick={addSiteVisitFromTender}>
              <MapPin className="h-4 w-4 mr-1.5" />
              Ajouter visite de site
            </Button>
          )}
          {tender.submission_deadline && !hasDeadlineEvent && (
            <Button size="sm" variant="outline" onClick={addDeadlineFromTender}>
              <Clock className="h-4 w-4 mr-1.5" />
              Ajouter échéance
            </Button>
          )}
        </div>
        <Button size="sm" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nouvel événement
        </Button>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          <div className="calendar-container">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView={calendarView}
              locale={frLocale}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,listMonth",
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              selectable
              select={handleDateSelect}
              height="auto"
              dayMaxEvents={3}
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                meridiem: false,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming events list */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Événements à venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {events
                .filter((e) => new Date(e.start_datetime) >= new Date())
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => openEditDialog(event)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type] }}
                      />
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(event.start_datetime), "EEEE d MMMM à HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {EVENT_TYPE_LABELS[event.event_type]}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingEvent} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingEvent(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Modifier l'événement" : "Nouvel événement"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Titre de l'événement"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formEventType} onValueChange={setFormEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="site_visit">Visite de site</SelectItem>
                  <SelectItem value="meeting">Réunion</SelectItem>
                  <SelectItem value="milestone">Jalon</SelectItem>
                  <SelectItem value="reminder">Rappel</SelectItem>
                  <SelectItem value="deadline">Échéance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début *</Label>
                <Input
                  type="datetime-local"
                  value={formStartDate ? format(formStartDate, "yyyy-MM-dd'T'HH:mm") : ""}
                  onChange={(e) => setFormStartDate(e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input
                  type="datetime-local"
                  value={formEndDate ? format(formEndDate, "yyyy-MM-dd'T'HH:mm") : ""}
                  onChange={(e) => setFormEndDate(e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="Adresse ou lieu"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Notes ou description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {editingEvent && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  handleDelete(editingEvent.id);
                  setEditingEvent(null);
                  resetForm();
                }}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Supprimer
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => {
                setIsCreateOpen(false);
                setEditingEvent(null);
                resetForm();
              }}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={!formTitle.trim() || !formStartDate}>
                {editingEvent ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
