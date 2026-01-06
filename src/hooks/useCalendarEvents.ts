import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { addWeeks, addMonths, addYears, isBefore, isAfter, startOfDay } from "date-fns";

export type EventType = "meeting" | "milestone" | "reminder" | "rendu";
export type RecurrenceRule = "weekly" | "monthly" | "quarterly" | "yearly" | null;

export interface CalendarEvent {
  id: string;
  project_id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  start_datetime: string;
  end_datetime: string | null;
  location: string | null;
  is_all_day: boolean;
  google_event_id: string | null;
  google_meet_link: string | null;
  google_calendar_id: string | null;
  attendees: Array<{ email: string; name?: string; status?: string }>;
  recurrence_rule: RecurrenceRule;
  recurrence_end_date: string | null;
  parent_event_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  event_type?: EventType;
  start_datetime: string;
  end_datetime?: string;
  location?: string;
  is_all_day?: boolean;
  attendees?: Array<{ email: string; name?: string }>;
  create_google_meet?: boolean;
  recurrence_rule?: RecurrenceRule;
  recurrence_end_date?: string;
}

// Generate recurring event instances
function generateRecurringInstances(event: CalendarEvent, startRange: Date, endRange: Date): CalendarEvent[] {
  if (!event.recurrence_rule || event.parent_event_id) return [];
  
  const instances: CalendarEvent[] = [];
  let currentDate = new Date(event.start_datetime);
  const endRecurrence = event.recurrence_end_date ? new Date(event.recurrence_end_date) : addYears(new Date(), 1);
  
  // Skip the original event date
  currentDate = getNextDate(currentDate, event.recurrence_rule);
  
  while (isBefore(currentDate, endRecurrence) && isBefore(currentDate, endRange)) {
    if (isAfter(currentDate, startRange) || isBefore(startOfDay(currentDate), startOfDay(endRange))) {
      const duration = event.end_datetime 
        ? new Date(event.end_datetime).getTime() - new Date(event.start_datetime).getTime()
        : 0;
      
      instances.push({
        ...event,
        id: `${event.id}-${currentDate.toISOString()}`,
        start_datetime: currentDate.toISOString(),
        end_datetime: duration ? new Date(currentDate.getTime() + duration).toISOString() : null,
        parent_event_id: event.id,
      });
    }
    currentDate = getNextDate(currentDate, event.recurrence_rule);
  }
  
  return instances.slice(0, 52); // Limit to 52 instances max
}

function getNextDate(date: Date, rule: RecurrenceRule): Date {
  switch (rule) {
    case "weekly":
      return addWeeks(date, 1);
    case "monthly":
      return addMonths(date, 1);
    case "quarterly":
      return addMonths(date, 3);
    case "yearly":
      return addYears(date, 1);
    default:
      return date;
  }
}

export function useCalendarEvents(projectId: string | null) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ["calendar-events", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_calendar_events")
        .select("*")
        .eq("project_id", projectId)
        .order("start_datetime", { ascending: true });

      if (error) throw error;
      
      // Type cast and handle attendees
      const typedEvents = (data || []).map(event => ({
        ...event,
        attendees: (event.attendees || []) as Array<{ email: string; name?: string; status?: string }>,
        recurrence_rule: event.recurrence_rule as RecurrenceRule,
      })) as CalendarEvent[];
      
      // Generate recurring instances for the next year
      const now = new Date();
      const endRange = addYears(now, 1);
      const allEvents = [...typedEvents];
      
      typedEvents.forEach(event => {
        if (event.recurrence_rule && !event.parent_event_id) {
          const instances = generateRecurringInstances(event, now, endRange);
          allEvents.push(...instances);
        }
      });
      
      return allEvents.sort((a, b) => 
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      );
    },
    enabled: !!projectId,
  });

  const createEvent = useMutation({
    mutationFn: async (input: CreateCalendarEventInput) => {
      if (!projectId || !activeWorkspace) throw new Error("Missing project or workspace");

      const { data, error } = await supabase
        .from("project_calendar_events")
        .insert({
          project_id: projectId,
          workspace_id: activeWorkspace.id,
          title: input.title,
          description: input.description || null,
          event_type: input.event_type || "meeting",
          start_datetime: input.start_datetime,
          end_datetime: input.end_datetime || null,
          location: input.location || null,
          is_all_day: input.is_all_day || false,
          attendees: input.attendees || [],
          recurrence_rule: input.recurrence_rule || null,
          recurrence_end_date: input.recurrence_end_date || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events", projectId] });
      toast.success("Événement créé");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateEvent = useMutation({
    mutationFn: async (input: Partial<CalendarEvent> & { id: string }) => {
      const { id, ...updates } = input;
      // Don't try to update generated recurring instances
      if (id.includes("-")) {
        throw new Error("Modifiez l'événement parent pour changer la récurrence");
      }
      const { data, error } = await supabase
        .from("project_calendar_events")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events", projectId] });
      toast.success("Événement mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      // Don't try to delete generated recurring instances
      if (id.includes("-")) {
        throw new Error("Supprimez l'événement parent pour annuler la récurrence");
      }
      const { error } = await supabase
        .from("project_calendar_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events", projectId] });
      toast.success("Événement supprimé");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
