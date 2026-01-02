import { useState, useMemo, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useCalendarEvents, CalendarEvent } from "@/hooks/useCalendarEvents";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { useProjectDeliverables } from "@/hooks/useProjectDeliverables";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar as CalendarIcon,
  Video,
  MapPin,
  Plus,
  Users,
  Clock,
  Flag,
  CheckSquare,
  FileText,
  Milestone,
  Trash2,
} from "lucide-react";
import { format, parseISO, addHours } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import frLocale from "@fullcalendar/core/locales/fr";

interface ProjectPlanningTabProps {
  projectId: string;
}

// FullCalendar event type
interface FCEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    type: "phase" | "event" | "task" | "deliverable";
    originalData: any;
  };
}

export function ProjectPlanningTab({ projectId }: ProjectPlanningTabProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const { events, isLoading: eventsLoading, createEvent, updateEvent, deleteEvent } = useCalendarEvents(projectId);
  const { phases } = useProjectPhases(projectId);
  const { deliverables } = useProjectDeliverables(projectId);
  const { tasks } = useTasks();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentView, setCurrentView] = useState<string>("dayGridMonth");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"meeting" | "milestone" | "reminder">("meeting");
  const [formStartDate, setFormStartDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndDate, setFormEndDate] = useState("");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formLocation, setFormLocation] = useState("");
  const [formIsAllDay, setFormIsAllDay] = useState(false);
  const [formCreateMeet, setFormCreateMeet] = useState(false);

  // Project-specific tasks
  const projectTasks = useMemo(() => {
    return tasks.filter(t => t.project_id === projectId && t.due_date);
  }, [tasks, projectId]);

  // Convert all items to FullCalendar events
  const calendarEvents = useMemo<FCEvent[]>(() => {
    const fcEvents: FCEvent[] = [];

    // Phases as background events
    phases.forEach(phase => {
      if (phase.start_date && phase.end_date) {
        fcEvents.push({
          id: `phase-${phase.id}`,
          title: phase.name,
          start: phase.start_date,
          end: phase.end_date,
          allDay: true,
          backgroundColor: `${phase.color || "#3B82F6"}20`,
          borderColor: phase.color || "#3B82F6",
          textColor: phase.color || "#3B82F6",
          extendedProps: {
            type: "phase",
            originalData: phase,
          },
        });
      }
    });

    // Calendar events (meetings, milestones)
    events.forEach(event => {
      fcEvents.push({
        id: `event-${event.id}`,
        title: event.title,
        start: event.start_datetime,
        end: event.end_datetime || undefined,
        allDay: event.is_all_day,
        backgroundColor: event.event_type === "meeting" ? "#8B5CF6" : 
                         event.event_type === "milestone" ? "#F59E0B" : "#6B7280",
        borderColor: "transparent",
        textColor: "#FFFFFF",
        extendedProps: {
          type: "event",
          originalData: event,
        },
      });
    });

    // Deliverables
    deliverables.forEach(deliverable => {
      if (deliverable.due_date) {
        fcEvents.push({
          id: `deliverable-${deliverable.id}`,
          title: `📦 ${deliverable.name}`,
          start: deliverable.due_date,
          allDay: true,
          backgroundColor: deliverable.status === "delivered" || deliverable.status === "validated" 
            ? "#10B981" : "#EF4444",
          borderColor: "transparent",
          textColor: "#FFFFFF",
          extendedProps: {
            type: "deliverable",
            originalData: deliverable,
          },
        });
      }
    });

    // Tasks
    projectTasks.forEach(task => {
      if (task.due_date) {
        fcEvents.push({
          id: `task-${task.id}`,
          title: `✓ ${task.title}`,
          start: task.due_date,
          allDay: true,
          backgroundColor: task.status === "done" ? "#10B981" : "#3B82F6",
          borderColor: "transparent",
          textColor: "#FFFFFF",
          extendedProps: {
            type: "task",
            originalData: task,
          },
        });
      }
    });

    return fcEvents;
  }, [phases, events, deliverables, projectTasks]);

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormType("meeting");
    setFormStartDate("");
    setFormStartTime("09:00");
    setFormEndDate("");
    setFormEndTime("10:00");
    setFormLocation("");
    setFormIsAllDay(false);
    setFormCreateMeet(false);
  };

  const openCreateDialog = (date?: Date) => {
    resetForm();
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      setFormStartDate(dateStr);
      setFormEndDate(dateStr);
    }
    setIsCreateOpen(true);
  };

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || "");
    setFormType(event.event_type);
    setFormStartDate(format(parseISO(event.start_datetime), "yyyy-MM-dd"));
    setFormStartTime(format(parseISO(event.start_datetime), "HH:mm"));
    if (event.end_datetime) {
      setFormEndDate(format(parseISO(event.end_datetime), "yyyy-MM-dd"));
      setFormEndTime(format(parseISO(event.end_datetime), "HH:mm"));
    }
    setFormLocation(event.location || "");
    setFormIsAllDay(event.is_all_day);
    setFormCreateMeet(!!event.google_meet_link);
  };

  const handleCreate = () => {
    if (!formTitle.trim() || !formStartDate) return;

    const startDatetime = formIsAllDay 
      ? `${formStartDate}T00:00:00`
      : `${formStartDate}T${formStartTime}:00`;
    
    const endDatetime = formEndDate
      ? formIsAllDay 
        ? `${formEndDate}T23:59:59`
        : `${formEndDate}T${formEndTime}:00`
      : undefined;

    createEvent.mutate({
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      event_type: formType,
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      location: formLocation.trim() || undefined,
      is_all_day: formIsAllDay,
      create_google_meet: formCreateMeet,
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingEvent || !formTitle.trim() || !formStartDate) return;

    const startDatetime = formIsAllDay 
      ? `${formStartDate}T00:00:00`
      : `${formStartDate}T${formStartTime}:00`;
    
    const endDatetime = formEndDate
      ? formIsAllDay 
        ? `${formEndDate}T23:59:59`
        : `${formEndDate}T${formEndTime}:00`
      : null;

    updateEvent.mutate({
      id: editingEvent.id,
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      event_type: formType,
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      location: formLocation.trim() || null,
      is_all_day: formIsAllDay,
    });

    setEditingEvent(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!editingEvent) return;
    if (confirm("Supprimer cet événement ?")) {
      deleteEvent.mutate(editingEvent.id);
      setEditingEvent(null);
      resetForm();
    }
  };

  const handleEventClick = (info: any) => {
    const { type, originalData } = info.event.extendedProps;
    
    if (type === "event") {
      openEditDialog(originalData);
    }
    // For phases, tasks, deliverables - just show info for now
    // Could open their respective edit dialogs
  };

  const handleDateClick = (info: any) => {
    openCreateDialog(info.date);
  };

  const handleEventDrop = (info: any) => {
    const { type, originalData } = info.event.extendedProps;
    
    if (type === "event") {
      const newStart = info.event.start;
      const newEnd = info.event.end;
      
      updateEvent.mutate({
        id: originalData.id,
        start_datetime: newStart.toISOString(),
        end_datetime: newEnd?.toISOString() || null,
      });
    } else {
      // Revert for non-event types
      info.revert();
    }
  };

  if (eventsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-violet-500" />
              <span>Réunions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span>Jalons</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Tâches</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Livrables</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm border-2 border-primary/50 bg-primary/10" />
              <span>Phases</span>
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => openCreateDialog()}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nouvel événement
        </Button>
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-lg border p-4 calendar-container">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={frLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,dayGridYear",
          }}
          events={calendarEvents}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={3}
          weekends={true}
          nowIndicator={true}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventDrop}
          height="auto"
          aspectRatio={1.8}
          buttonText={{
            today: "Aujourd'hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
            year: "Année",
          }}
          views={{
            dayGridYear: {
              type: "dayGrid",
              duration: { years: 1 },
              buttonText: "Année",
            },
          }}
          eventContent={(eventInfo) => {
            const { type } = eventInfo.event.extendedProps;
            return (
              <div className={cn(
                "px-1 py-0.5 text-xs truncate rounded",
                type === "phase" && "opacity-70 font-medium"
              )}>
                {eventInfo.event.title}
              </div>
            );
          }}
        />
      </div>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isCreateOpen || !!editingEvent} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingEvent(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {formType === "meeting" ? <Video className="h-4 w-4" /> : 
               formType === "milestone" ? <Milestone className="h-4 w-4" /> :
               <Clock className="h-4 w-4" />}
              {editingEvent ? "Modifier l'événement" : "Nouvel événement"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Réunion
                    </div>
                  </SelectItem>
                  <SelectItem value="milestone">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Jalon
                    </div>
                  </SelectItem>
                  <SelectItem value="reminder">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Rappel
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Réunion de chantier n°3"
              />
            </div>

            {/* All day switch */}
            <div className="flex items-center justify-between">
              <Label>Journée entière</Label>
              <Switch checked={formIsAllDay} onCheckedChange={setFormIsAllDay} />
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date début *</Label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
              {!formIsAllDay && (
                <div className="space-y-2">
                  <Label>Heure début</Label>
                  <Input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                  />
                </div>
              )}
            </div>

            {formType === "meeting" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Date fin</Label>
                  <Input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                  />
                </div>
                {!formIsAllDay && (
                  <div className="space-y-2">
                    <Label>Heure fin</Label>
                    <Input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Location */}
            {formType === "meeting" && (
              <div className="space-y-2">
                <Label>Lieu</Label>
                <Input
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Ex: Bureau ou adresse chantier"
                />
              </div>
            )}

            {/* Google Meet */}
            {formType === "meeting" && !editingEvent && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-violet-500" />
                  <span className="text-sm">Créer un Google Meet</span>
                </div>
                <Switch 
                  checked={formCreateMeet} 
                  onCheckedChange={setFormCreateMeet}
                  disabled // Will be enabled once Google OAuth is configured
                />
              </div>
            )}

            {/* Show existing Meet link */}
            {editingEvent?.google_meet_link && (
              <div className="p-3 bg-violet-500/10 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Video className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-medium">Google Meet</span>
                </div>
                <a 
                  href={editingEvent.google_meet_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-violet-600 hover:underline"
                >
                  {editingEvent.google_meet_link}
                </a>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Notes ou détails..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            {editingEvent && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            )}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingEvent(null);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button onClick={editingEvent ? handleUpdate : handleCreate}>
                {editingEvent ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar CSS overrides */}
      <style>{`
        .calendar-container .fc {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: hsl(var(--secondary));
          --fc-button-border-color: hsl(var(--border));
          --fc-button-text-color: hsl(var(--foreground));
          --fc-button-hover-bg-color: hsl(var(--accent));
          --fc-button-hover-border-color: hsl(var(--border));
          --fc-button-active-bg-color: hsl(var(--primary));
          --fc-button-active-border-color: hsl(var(--primary));
          --fc-today-bg-color: hsl(var(--primary) / 0.1);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: hsl(var(--muted));
          --fc-event-border-color: transparent;
        }

        .calendar-container .fc .fc-button {
          font-size: 0.75rem;
          padding: 0.4rem 0.75rem;
          font-weight: 500;
          border-radius: 0.375rem;
        }

        .calendar-container .fc .fc-toolbar-title {
          font-size: 1rem;
          font-weight: 600;
        }

        .calendar-container .fc .fc-daygrid-day-number {
          font-size: 0.75rem;
          padding: 4px 8px;
        }

        .calendar-container .fc .fc-col-header-cell-cushion {
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .calendar-container .fc .fc-event {
          border-radius: 0.25rem;
          font-size: 0.7rem;
          cursor: pointer;
        }

        .calendar-container .fc .fc-daygrid-event {
          margin: 1px 2px;
        }

        .calendar-container .fc .fc-timegrid-slot-label {
          font-size: 0.7rem;
        }

        .calendar-container .fc .fc-daygrid-more-link {
          font-size: 0.7rem;
          color: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
}
