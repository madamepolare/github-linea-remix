import { useState, useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { useCalendarEvents, CalendarEvent, RecurrenceRule } from "@/hooks/useCalendarEvents";
import { useProjectPhases, ProjectPhase } from "@/hooks/useProjectPhases";
import { useProjectMOE } from "@/hooks/useProjectMOE";
import { useProjectDeliverables } from "@/hooks/useProjectDeliverables";
import { useTasks } from "@/hooks/useTasks";
import { useTaskSchedules } from "@/hooks/useTaskSchedules";
import { useTeamTimeEntries } from "@/hooks/useTeamTimeEntries";
import { useQuickTasksDB, QuickTask } from "@/hooks/useQuickTasksDB";
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
  Zap,
  Sparkles,
  Repeat,
  History,
} from "lucide-react";
import { AIPhasePlannerDialog } from "./AIPhasePlannerDialog";
import { format, parseISO, addHours, addDays, differenceInDays, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import frLocale from "@fullcalendar/core/locales/fr";
import { toast } from "sonner";
import { TaskCreateSheet } from "@/components/tasks/TaskCreateSheet";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { Task } from "@/hooks/useTasks";

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
  display?: string;
  editable?: boolean;
  durationEditable?: boolean;
  extendedProps: {
    type: "phase" | "event" | "task" | "deliverable" | "quicktask" | "schedule" | "timeEntry";
    originalData: any;
  };
}

export function ProjectPlanningTab({ projectId }: ProjectPlanningTabProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const { events, isLoading: eventsLoading, createEvent, updateEvent, deleteEvent } = useCalendarEvents(projectId);
  const { phases, updatePhase } = useProjectPhases(projectId);
  const { moeTeam } = useProjectMOE(projectId);
  const { deliverables, createDeliverable, updateDeliverable, deleteDeliverable } = useProjectDeliverables(projectId);
  const { tasks, createTask, updateTask, deleteTask } = useTasks();
  const { data: timeEntries } = useTeamTimeEntries({ projectId });
  const { schedules } = useTaskSchedules();
  const { quickTasks, pendingTasks, createQuickTask } = useQuickTasksDB();

  // Pre-compute available attendees from MOE team
  const availableAttendees = useMemo(() => {
    const attendees: Array<{ email: string; name: string; role: string }> = [];
    moeTeam.forEach((member) => {
      if (member.contact?.email) {
        attendees.push({
          email: member.contact.email,
          name: member.contact.name,
          role: member.role,
        });
      }
      if (member.crm_company?.email) {
        attendees.push({
          email: member.crm_company.email,
          name: member.crm_company.name,
          role: member.role,
        });
      }
    });
    return attendees;
  }, [moeTeam]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentView, setCurrentView] = useState<string>("dayGridMonth");

  // Form state for events
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"meeting" | "milestone" | "reminder" | "rendu">("meeting");
  const [formStartDate, setFormStartDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndDate, setFormEndDate] = useState("");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formLocation, setFormLocation] = useState("");
  const [formIsAllDay, setFormIsAllDay] = useState(false);
  const [formCreateMeet, setFormCreateMeet] = useState(false);
  const [formRecurrence, setFormRecurrence] = useState<RecurrenceRule>(null);
  const [formRecurrenceEnd, setFormRecurrenceEnd] = useState("");
  const [formAttendees, setFormAttendees] = useState<Array<{ email: string; name?: string }>>([]);

  // Phase edit form state
  const [phaseStartDate, setPhaseStartDate] = useState("");
  const [phaseEndDate, setPhaseEndDate] = useState("");

  // Quick creation dialogs
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateDate, setQuickCreateDate] = useState<string>("");
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const [isDeliverableOpen, setIsDeliverableOpen] = useState(false);
  const [isProjectTaskSheetOpen, setIsProjectTaskSheetOpen] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [deliverableName, setDeliverableName] = useState("");
  const [deliverableDescription, setDeliverableDescription] = useState("");

  // Edit task using TaskDetailSheet
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Edit deliverable
  const [editingDeliverable, setEditingDeliverable] = useState<any | null>(null);
  const [editDeliverableName, setEditDeliverableName] = useState("");
  const [editDeliverableDescription, setEditDeliverableDescription] = useState("");
  const [editDeliverableDueDate, setEditDeliverableDueDate] = useState("");
  const [editDeliverableStatus, setEditDeliverableStatus] = useState<string>("pending");

  // Calendar filters
  const [showPhases, setShowPhases] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showQuickTasks, setShowQuickTasks] = useState(true);
  const [showDeliverables, setShowDeliverables] = useState(true);
  const [showTimeEntries, setShowTimeEntries] = useState(true);
  const [showSchedules, setShowSchedules] = useState(true);

  // AI Planner
  const [isAIPlannerOpen, setIsAIPlannerOpen] = useState(false);

  // Project-specific tasks
  const projectTasks = useMemo(() => {
    return (tasks || []).filter(t => t.project_id === projectId && t.due_date);
  }, [tasks, projectId]);

  // Project-specific schedules (future planned time slots only)
  const now = startOfDay(new Date());
  const projectSchedules = useMemo(() => {
    return (schedules || []).filter(s => {
      const isProjectMatch = s.task?.project_id === projectId || s.task?.project?.id === projectId;
      return isProjectMatch;
    });
  }, [schedules, projectId]);

  // Separate future schedules from past ones
  const futureSchedules = useMemo(() => {
    return projectSchedules.filter(s => new Date(s.end_datetime) >= now);
  }, [projectSchedules, now]);

  const pastSchedules = useMemo(() => {
    return projectSchedules.filter(s => new Date(s.end_datetime) < now);
  }, [projectSchedules, now]);

  // Quick tasks with due dates
  const quickTasksWithDates = useMemo(() => {
    return (pendingTasks || []).filter(t => t.due_date);
  }, [pendingTasks]);

  // Convert all items to FullCalendar events (with filters)
  const calendarEvents = useMemo<FCEvent[]>(() => {
    const fcEvents: FCEvent[] = [];

    // Phases as background events (editable)
    if (showPhases) {
      phases.forEach(phase => {
        if (phase.start_date && phase.end_date) {
          fcEvents.push({
            id: `phase-${phase.id}`,
            title: phase.name,
            start: phase.start_date,
            end: addDays(parseISO(phase.end_date), 1).toISOString().split("T")[0], // FullCalendar end is exclusive
            allDay: true,
            backgroundColor: `${phase.color || "#3B82F6"}30`,
            borderColor: phase.color || "#3B82F6",
            textColor: phase.color || "#3B82F6",
            display: "background",
            editable: false, // Background events are not draggable
            extendedProps: {
              type: "phase",
              originalData: phase,
            },
          });
          // Also add a regular event for the phase label (clickable & draggable)
          fcEvents.push({
            id: `phase-label-${phase.id}`,
            title: `📋 ${phase.name}`,
            start: phase.start_date,
            end: addDays(parseISO(phase.end_date), 1).toISOString().split("T")[0],
            allDay: true,
            backgroundColor: `${phase.color || "#3B82F6"}`,
            borderColor: phase.color || "#3B82F6",
            textColor: "#FFFFFF",
            editable: true,
            extendedProps: {
              type: "phase",
              originalData: phase,
            },
          });
        }
      });
    }

    // Calendar events (meetings, milestones) - fully editable
    if (showEvents) {
      events.forEach(event => {
        fcEvents.push({
          id: `event-${event.id}`,
          title: event.title,
          start: event.start_datetime,
          end: event.end_datetime || undefined,
          allDay: event.is_all_day,
          backgroundColor: event.event_type === "meeting" ? "#8B5CF6" : 
                           event.event_type === "milestone" ? "#F59E0B" : 
                           event.event_type === "rendu" ? "#3B82F6" : "#6B7280",
          borderColor: "transparent",
          textColor: "#FFFFFF",
          editable: true,
          durationEditable: true,
          extendedProps: {
            type: "event",
            originalData: event,
          },
        });
      });
    }

    // Deliverables - editable
    if (showDeliverables) {
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
            editable: true,
            durationEditable: false,
            extendedProps: {
              type: "deliverable",
              originalData: deliverable,
            },
          });
        }
      });
    }

    // Tasks - draggable to change due date
    if (showTasks) {
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
            editable: true,
            durationEditable: false,
            extendedProps: {
              type: "task",
              originalData: task,
            },
          });
        }
      });
    }

    // Quick tasks - read only for now
    if (showQuickTasks) {
      quickTasksWithDates.forEach(qt => {
        fcEvents.push({
          id: `quicktask-${qt.id}`,
          title: `⚡ ${qt.title}`,
          start: qt.due_date!,
          allDay: true,
          backgroundColor: "#F97316",
          borderColor: "transparent",
          textColor: "#FFFFFF",
          editable: false,
          extendedProps: {
            type: "quicktask",
            originalData: qt,
          },
        });
      });
    }

    // Scheduled time slots (future planned work) - Sky blue
    if (showSchedules) {
      futureSchedules.forEach(schedule => {
        fcEvents.push({
          id: `schedule-${schedule.id}`,
          title: `🕐 ${schedule.task?.title || "Temps planifié"}`,
          start: schedule.start_datetime,
          end: schedule.end_datetime,
          allDay: false,
          backgroundColor: "#0EA5E9", // Sky-500 for future
          borderColor: "transparent",
          textColor: "#FFFFFF",
          editable: false,
          durationEditable: false,
          extendedProps: {
            type: "schedule",
            originalData: schedule,
          },
        });
      });
    }

    // Past scheduled time (logged work from schedules) - Emerald
    if (showTimeEntries) {
      pastSchedules.forEach(schedule => {
        fcEvents.push({
          id: `past-schedule-${schedule.id}`,
          title: `⏱️ ${schedule.task?.title || "Temps passé"}`,
          start: schedule.start_datetime,
          end: schedule.end_datetime,
          allDay: false,
          backgroundColor: "#10B981", // Emerald for past
          borderColor: "transparent",
          textColor: "#FFFFFF",
          editable: false,
          durationEditable: false,
          extendedProps: {
            type: "timeEntry",
            originalData: schedule,
          },
        });
      });

      // Also show team time entries
      timeEntries?.forEach(entry => {
        const entryDate = parseISO(entry.date);
        const durationHours = entry.duration_minutes / 60;
        // Display at 9h by default
        const startTime = new Date(entryDate);
        startTime.setHours(9, 0, 0, 0);
        const endTime = new Date(startTime.getTime() + entry.duration_minutes * 60 * 1000);
        
        fcEvents.push({
          id: `timeentry-${entry.id}`,
          title: `⏱️ ${entry.description || entry.task?.title || "Temps passé"}`,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          allDay: false,
          backgroundColor: entry.is_billable ? "#10B981" : "#6B7280", // Emerald for billable, gray for internal
          borderColor: "transparent",
          textColor: "#FFFFFF",
          editable: false,
          durationEditable: false,
          extendedProps: {
            type: "timeEntry",
            originalData: entry,
          },
        });
      });
    }

    return fcEvents;
  }, [phases, events, deliverables, projectTasks, quickTasksWithDates, futureSchedules, pastSchedules, timeEntries, showPhases, showEvents, showTasks, showQuickTasks, showDeliverables, showSchedules, showTimeEntries]);

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
    setFormRecurrence(null);
    setFormRecurrenceEnd("");
    setFormAttendees([]);
  };

  const openCreateDialog = (date?: Date) => {
    resetForm();
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      setFormStartDate(dateStr);
      setFormEndDate(dateStr);
    }
    // Pre-populate attendees from MOE team for meetings
    setFormAttendees(availableAttendees.map(a => ({ email: a.email, name: a.name })));
    setIsCreateOpen(true);
  };

  const openEditDialog = (event: CalendarEvent) => {
    // Don't allow editing recurring instances directly
    if (event.id.includes("-")) {
      toast.info("Modifiez l'événement parent pour changer cette récurrence");
      return;
    }
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
    setFormRecurrence(event.recurrence_rule);
    setFormRecurrenceEnd(event.recurrence_end_date ? format(parseISO(event.recurrence_end_date), "yyyy-MM-dd") : "");
    setFormAttendees(event.attendees || []);
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
      recurrence_rule: formRecurrence,
      recurrence_end_date: formRecurrenceEnd || undefined,
      attendees: formAttendees.filter(a => a.email),
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
    } else if (type === "phase") {
      // Open phase edit dialog
      setEditingPhase(originalData);
      setPhaseStartDate(originalData.start_date || "");
      setPhaseEndDate(originalData.end_date || "");
    } else if (type === "task") {
      // Open TaskDetailSheet for full editing
      setEditingTask(originalData as Task);
    } else if (type === "deliverable") {
      // Open deliverable edit dialog
      setEditingDeliverable(originalData);
      setEditDeliverableName(originalData.name || "");
      setEditDeliverableDescription(originalData.description || "");
      setEditDeliverableDueDate(originalData.due_date || "");
      setEditDeliverableStatus(originalData.status || "pending");
    }
  };

  const handleDateClick = (info: any) => {
    const dateStr = format(info.date, "yyyy-MM-dd");
    setQuickCreateDate(dateStr);
    setFormEndDate(dateStr); // Also set end date for single day
    setIsQuickCreateOpen(true);
  };

  // Handle multi-day selection for creating events spanning multiple days
  const handleSelect = (info: any) => {
    const startStr = format(info.start, "yyyy-MM-dd");
    const endStr = format(addDays(info.end, -1), "yyyy-MM-dd"); // FullCalendar end is exclusive
    
    // If it's a multi-day selection (more than 1 day)
    if (differenceInDays(info.end, info.start) > 1) {
      // Open event creation directly with multi-day range
      resetForm();
      setFormStartDate(startStr);
      setFormEndDate(endStr);
      setFormIsAllDay(true);
      setIsCreateOpen(true);
    } else {
      // Single day - show quick create menu
      setQuickCreateDate(startStr);
      setFormEndDate(startStr);
      setIsQuickCreateOpen(true);
    }
  };

  const handleQuickCreateSelect = (type: "event" | "quicktask" | "deliverable" | "projecttask") => {
    setIsQuickCreateOpen(false);
    if (type === "event") {
      openCreateDialog(new Date(quickCreateDate));
    } else if (type === "quicktask") {
      setQuickTaskTitle("");
      setIsQuickTaskOpen(true);
    } else if (type === "deliverable") {
      setDeliverableName("");
      setDeliverableDescription("");
      setIsDeliverableOpen(true);
    } else if (type === "projecttask") {
      setIsProjectTaskSheetOpen(true);
    }
  };

  const handleCreateQuickTask = () => {
    if (!quickTaskTitle.trim()) return;
    createQuickTask.mutate({
      title: quickTaskTitle.trim(),
      due_date: quickCreateDate,
    });
    setIsQuickTaskOpen(false);
    setQuickTaskTitle("");
  };

  const handleCreateDeliverable = () => {
    if (!deliverableName.trim()) return;
    createDeliverable.mutate({
      name: deliverableName.trim(),
      description: deliverableDescription.trim() || null,
      due_date: quickCreateDate,
    });
    setIsDeliverableOpen(false);
    setDeliverableName("");
    setDeliverableDescription("");
  };

  const handleUpdateDeliverable = () => {
    if (!editingDeliverable || !editDeliverableName.trim()) return;
    
    updateDeliverable.mutate({
      id: editingDeliverable.id,
      name: editDeliverableName.trim(),
      description: editDeliverableDescription.trim() || null,
      due_date: editDeliverableDueDate || null,
      status: editDeliverableStatus as any,
    });
    
    setEditingDeliverable(null);
    toast.success("Livrable mis à jour");
  };

  const handleDeleteDeliverable = () => {
    if (!editingDeliverable) return;
    if (confirm("Supprimer ce livrable ?")) {
      deleteDeliverable.mutate(editingDeliverable.id);
      setEditingDeliverable(null);
    }
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
    } else if (type === "phase" && !info.event.id.startsWith("phase-label-")) {
      // Skip - background events shouldn't be dragged
      info.revert();
    } else if (type === "phase" && info.event.id.startsWith("phase-label-")) {
      // Phase label dragged - update phase dates
      const newStart = info.event.start;
      const newEnd = info.event.end;
      
      // Calculate duration to maintain it
      const originalDuration = differenceInDays(
        parseISO(originalData.end_date),
        parseISO(originalData.start_date)
      );
      
      const newStartDate = format(newStart, "yyyy-MM-dd");
      const newEndDate = newEnd 
        ? format(addDays(newEnd, -1), "yyyy-MM-dd") // FullCalendar end is exclusive
        : format(addDays(newStart, originalDuration), "yyyy-MM-dd");
      
      updatePhase.mutate({
        id: originalData.id,
        start_date: newStartDate,
        end_date: newEndDate,
      });
      toast.success("Phase déplacée");
    } else if (type === "task") {
      // Task dragged - update due date
      const newStart = info.event.start;
      const newDueDate = format(newStart, "yyyy-MM-dd");
      
      updateTask.mutate({
        id: originalData.id,
        due_date: newDueDate,
      });
      toast.success("Tâche déplacée");
    } else if (type === "deliverable") {
      // Deliverable dragged - update due date
      const newStart = info.event.start;
      const newDueDate = format(newStart, "yyyy-MM-dd");
      
      updateDeliverable.mutate({
        id: originalData.id,
        due_date: newDueDate,
      });
      toast.success("Livrable déplacé");
    } else {
      // Revert for other types
      info.revert();
    }
  };

  const handleEventResize = (info: any) => {
    const { type, originalData } = info.event.extendedProps;
    
    if (type === "event") {
      const newEnd = info.event.end;
      updateEvent.mutate({
        id: originalData.id,
        end_datetime: newEnd?.toISOString() || null,
      });
    } else if (type === "phase" && info.event.id.startsWith("phase-label-")) {
      // Phase resized
      const newStart = info.event.start;
      const newEnd = info.event.end;
      
      updatePhase.mutate({
        id: originalData.id,
        start_date: format(newStart, "yyyy-MM-dd"),
        end_date: format(addDays(newEnd, -1), "yyyy-MM-dd"),
      });
      toast.success("Phase redimensionnée");
    } else {
      info.revert();
    }
  };

  const handleUpdatePhase = () => {
    if (!editingPhase || !phaseStartDate || !phaseEndDate) return;
    
    updatePhase.mutate({
      id: editingPhase.id,
      start_date: phaseStartDate,
      end_date: phaseEndDate,
    });
    
    setEditingPhase(null);
    toast.success("Phase mise à jour");
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
      {/* Header with filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter toggles */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setShowPhases(!showPhases)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors",
                showPhases ? "bg-primary/10 border-primary/30" : "bg-muted/50 border-border opacity-50"
              )}
            >
              <div className="w-2.5 h-2.5 rounded-sm border-2 border-primary/50 bg-primary/10" />
              <span>Phases</span>
            </button>
            <button
              onClick={() => setShowEvents(!showEvents)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors",
                showEvents ? "bg-violet-500/10 border-violet-500/30" : "bg-muted/50 border-border opacity-50"
              )}
            >
              <div className="w-2.5 h-2.5 rounded bg-violet-500" />
              <span>Événements</span>
            </button>
            <button
              onClick={() => setShowTasks(!showTasks)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors",
                showTasks ? "bg-blue-500/10 border-blue-500/30" : "bg-muted/50 border-border opacity-50"
              )}
            >
              <div className="w-2.5 h-2.5 rounded bg-blue-500" />
              <span>Tâches</span>
            </button>
            <button
              onClick={() => setShowQuickTasks(!showQuickTasks)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors",
                showQuickTasks ? "bg-orange-500/10 border-orange-500/30" : "bg-muted/50 border-border opacity-50"
              )}
            >
              <div className="w-2.5 h-2.5 rounded bg-orange-500" />
              <span>Rapides</span>
            </button>
            <button
              onClick={() => setShowDeliverables(!showDeliverables)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors",
                showDeliverables ? "bg-red-500/10 border-red-500/30" : "bg-muted/50 border-border opacity-50"
              )}
            >
              <div className="w-2.5 h-2.5 rounded bg-red-500" />
              <span>Livrables</span>
            </button>
            <button
              onClick={() => setShowSchedules(!showSchedules)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors",
                showSchedules ? "bg-sky-500/10 border-sky-500/30" : "bg-muted/50 border-border opacity-50"
              )}
            >
              <div className="w-2.5 h-2.5 rounded bg-sky-500" />
              <span>Planifiés</span>
            </button>
            <button
              onClick={() => setShowTimeEntries(!showTimeEntries)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors",
                showTimeEntries ? "bg-emerald-500/10 border-emerald-500/30" : "bg-muted/50 border-border opacity-50"
              )}
            >
              <History className="w-3 h-3" />
              <span>Temps passés</span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsAIPlannerOpen(true)}>
            <Sparkles className="h-4 w-4 mr-1.5" />
            Planification IA
          </Button>
          <Button size="sm" onClick={() => openCreateDialog()}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nouvel événement
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-xl border p-6 calendar-container">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={frLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          events={calendarEvents}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={3}
          weekends={true}
          nowIndicator={true}
          select={handleSelect}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          height="auto"
          aspectRatio={1.8}
          buttonText={{
            today: "Aujourd'hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
            list: "Agenda",
          }}
          views={{
            listWeek: {
              type: "list",
              duration: { weeks: 1 },
              buttonText: "Agenda",
            },
          }}
          eventContent={(eventInfo) => {
            const { type, originalData } = eventInfo.event.extendedProps;
            
            // Icon based on type
            const getIcon = () => {
              switch (type) {
                case "phase":
                  return <Milestone className="h-3 w-3 shrink-0" />;
                case "event":
                  if (originalData?.event_type === "meeting") return <Video className="h-3 w-3 shrink-0" />;
                  if (originalData?.event_type === "milestone") return <Flag className="h-3 w-3 shrink-0" />;
                  if (originalData?.event_type === "rendu") return <FileText className="h-3 w-3 shrink-0" />;
                  return <Clock className="h-3 w-3 shrink-0" />;
                case "task":
                  return <CheckSquare className="h-3 w-3 shrink-0" />;
                case "quicktask":
                  return <Zap className="h-3 w-3 shrink-0" />;
                case "deliverable":
                  return <FileText className="h-3 w-3 shrink-0" />;
                case "schedule":
                  return <Clock className="h-3 w-3 shrink-0" />;
                case "timeEntry":
                  return <History className="h-3 w-3 shrink-0" />;
                default:
                  return null;
              }
            };
            
            // Remove emoji prefixes from title since we use icons now
            const cleanTitle = eventInfo.event.title
              .replace(/^📋\s*/, "")
              .replace(/^📦\s*/, "")
              .replace(/^✓\s*/, "")
              .replace(/^⚡\s*/, "")
              .replace(/^🕐\s*/, "")
              .replace(/^⏱️\s*/, "");
            
            return (
              <div className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 text-xs truncate rounded",
                type === "phase" && "opacity-90 font-medium"
              )}>
                {getIcon()}
                <span className="truncate">{cleanTitle}</span>
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
                  <SelectItem value="rendu">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Rendu
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

            {/* All day switch - not for meetings */}
            {formType !== "meeting" && (
              <div className="flex items-center justify-between">
                <Label>Journée entière</Label>
                <Switch checked={formIsAllDay} onCheckedChange={setFormIsAllDay} />
              </div>
            )}

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

            {/* Attendees */}
            {formType === "meeting" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Participants
                  </Label>
                  {availableAttendees.length > 0 && formAttendees.length === 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setFormAttendees(availableAttendees.map(a => ({ email: a.email, name: a.name })))}
                    >
                      Charger équipe projet
                    </Button>
                  )}
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {formAttendees.map((attendee, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                      <span className="flex-1 truncate">
                        {attendee.name || attendee.email}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setFormAttendees(formAttendees.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {formAttendees.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">
                      Aucun participant ajouté
                    </p>
                  )}
                </div>
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

            {/* Recurrence - for reminders only */}
            {formType === "reminder" && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  <Label>Récurrence</Label>
                </div>
                <Select 
                  value={formRecurrence || "none"} 
                  onValueChange={(v) => setFormRecurrence(v === "none" ? null : v as RecurrenceRule)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pas de récurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pas de récurrence</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="quarterly">Trimestriel</SelectItem>
                    <SelectItem value="yearly">Annuel</SelectItem>
                  </SelectContent>
                </Select>
                
                {formRecurrence && (
                  <div className="space-y-2">
                    <Label className="text-xs">Jusqu'au (optionnel)</Label>
                    <Input
                      type="date"
                      value={formRecurrenceEnd}
                      onChange={(e) => setFormRecurrenceEnd(e.target.value)}
                    />
                  </div>
                )}
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

      {/* Phase Edit Dialog */}
      <Dialog 
        open={!!editingPhase} 
        onOpenChange={(open) => {
          if (!open) setEditingPhase(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Modifier la phase
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div 
                className="w-3 h-3 rounded inline-block mr-2" 
                style={{ backgroundColor: editingPhase?.color || "#3B82F6" }}
              />
              <span className="font-medium">{editingPhase?.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date début</Label>
                <Input
                  type="date"
                  value={phaseStartDate}
                  onChange={(e) => setPhaseStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date fin</Label>
                <Input
                  type="date"
                  value={phaseEndDate}
                  onChange={(e) => setPhaseEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPhase(null)}>
              Annuler
            </Button>
            <Button onClick={handleUpdatePhase}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Create Selector Dialog */}
      <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              Créer pour le {quickCreateDate && format(parseISO(quickCreateDate), "d MMMM", { locale: fr })}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="h-12 justify-start gap-3"
              onClick={() => handleQuickCreateSelect("event")}
            >
              <CalendarIcon className="h-5 w-5 text-violet-500" />
              <div className="text-left">
                <div className="font-medium">Événement</div>
                <div className="text-xs text-muted-foreground">Réunion, jalon, rappel</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-12 justify-start gap-3"
              onClick={() => handleQuickCreateSelect("projecttask")}
            >
              <CheckSquare className="h-5 w-5 text-blue-500" />
              <div className="text-left">
                <div className="font-medium">Tâche projet</div>
                <div className="text-xs text-muted-foreground">Tâche avec priorité et détails</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-12 justify-start gap-3"
              onClick={() => handleQuickCreateSelect("quicktask")}
            >
              <Zap className="h-5 w-5 text-orange-500" />
              <div className="text-left">
                <div className="font-medium">Tâche rapide</div>
                <div className="text-xs text-muted-foreground">À faire rapidement</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-12 justify-start gap-3"
              onClick={() => handleQuickCreateSelect("deliverable")}
            >
              <FileText className="h-5 w-5 text-red-500" />
              <div className="text-left">
                <div className="font-medium">Livrable</div>
                <div className="text-xs text-muted-foreground">Document à remettre</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Task Creation Dialog */}
      <Dialog open={isQuickTaskOpen} onOpenChange={setIsQuickTaskOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              Nouvelle tâche rapide
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-2 bg-muted rounded text-sm text-center">
              Pour le {quickCreateDate && format(parseISO(quickCreateDate), "d MMMM yyyy", { locale: fr })}
            </div>
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Ex: Appeler le client"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateQuickTask()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickTaskOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateQuickTask} disabled={!quickTaskTitle.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deliverable Creation Dialog */}
      <Dialog open={isDeliverableOpen} onOpenChange={setIsDeliverableOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-500" />
              Nouveau livrable
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-2 bg-muted rounded text-sm text-center">
              Échéance : {quickCreateDate && format(parseISO(quickCreateDate), "d MMMM yyyy", { locale: fr })}
            </div>
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={deliverableName}
                onChange={(e) => setDeliverableName(e.target.value)}
                placeholder="Ex: Plans d'exécution"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={deliverableDescription}
                onChange={(e) => setDeliverableDescription(e.target.value)}
                placeholder="Notes ou détails..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeliverableOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateDeliverable} disabled={!deliverableName.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deliverable Edit Dialog */}
      <Dialog 
        open={!!editingDeliverable} 
        onOpenChange={(open) => !open && setEditingDeliverable(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-500" />
              Modifier le livrable
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={editDeliverableName}
                onChange={(e) => setEditDeliverableName(e.target.value)}
                placeholder="Nom du livrable"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editDeliverableDescription}
                onChange={(e) => setEditDeliverableDescription(e.target.value)}
                placeholder="Notes ou détails..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Échéance</Label>
              <Input
                type="date"
                value={editDeliverableDueDate}
                onChange={(e) => setEditDeliverableDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={editDeliverableStatus} onValueChange={setEditDeliverableStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="delivered">Livré</SelectItem>
                  <SelectItem value="validated">Validé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteDeliverable}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingDeliverable(null)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateDeliverable} disabled={!editDeliverableName.trim()}>
                Enregistrer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskCreateSheet
        open={isProjectTaskSheetOpen}
        onOpenChange={setIsProjectTaskSheetOpen}
        defaultDueDate={quickCreateDate ? parseISO(quickCreateDate) : null}
        defaultProjectId={projectId}
      />

      {/* Task Detail Sheet for full editing */}
      <TaskDetailSheet
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      />

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

      {/* AI Planner Dialog */}
      <AIPhasePlannerDialog
        open={isAIPlannerOpen}
        onOpenChange={setIsAIPlannerOpen}
        projectId={projectId}
      />
    </div>
  );
}
