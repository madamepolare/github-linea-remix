import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WorkspaceCalendar {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  is_default: boolean;
  visibility: "all" | "members" | "admins";
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceCalendarEvent {
  id: string;
  workspace_id: string;
  calendar_id: string;
  title: string;
  description: string | null;
  event_type: "event" | "meeting" | "deadline" | "reminder" | "holiday" | "other";
  start_datetime: string;
  end_datetime: string | null;
  is_all_day: boolean;
  location: string | null;
  attendees: Array<{ email: string; name?: string }>;
  recurrence_rule: string | null;
  recurrence_end_date: string | null;
  color: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  visibility?: "all" | "members" | "admins";
}

export interface CreateCalendarEventInput {
  calendar_id: string;
  title: string;
  description?: string;
  event_type?: "event" | "meeting" | "deadline" | "reminder" | "holiday" | "other";
  start_datetime: string;
  end_datetime?: string;
  is_all_day?: boolean;
  location?: string;
  attendees?: Array<{ email: string; name?: string }>;
  recurrence_rule?: string;
  recurrence_end_date?: string;
  color?: string;
}

export function useWorkspaceCalendars() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: calendars = [], isLoading, error } = useQuery({
    queryKey: ["workspace-calendars", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];

      const { data, error } = await supabase
        .from("workspace_calendars")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as WorkspaceCalendar[];
    },
    enabled: !!activeWorkspace,
  });

  const createCalendar = useMutation({
    mutationFn: async (input: CreateCalendarInput) => {
      if (!activeWorkspace || !user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("workspace_calendars")
        .insert({
          workspace_id: activeWorkspace.id,
          created_by: user.id,
          name: input.name,
          description: input.description,
          color: input.color || "#10B981",
          icon: input.icon || "calendar",
          visibility: input.visibility || "all",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-calendars"] });
      toast.success("Calendrier créé");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateCalendar = useMutation({
    mutationFn: async (input: Partial<WorkspaceCalendar> & { id: string }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("workspace_calendars")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-calendars"] });
      toast.success("Calendrier mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteCalendar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workspace_calendars")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-calendars"] });
      toast.success("Calendrier supprimé");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    calendars,
    isLoading,
    error,
    createCalendar,
    updateCalendar,
    deleteCalendar,
  };
}

export function useWorkspaceCalendarEvents(calendarId?: string) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ["workspace-calendar-events", activeWorkspace?.id, calendarId],
    queryFn: async () => {
      if (!activeWorkspace) return [];

      let query = supabase
        .from("workspace_calendar_events")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("start_datetime", { ascending: true });

      if (calendarId) {
        query = query.eq("calendar_id", calendarId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(event => ({
        ...event,
        attendees: (event.attendees || []) as Array<{ email: string; name?: string }>,
      })) as WorkspaceCalendarEvent[];
    },
    enabled: !!activeWorkspace,
  });

  const createEvent = useMutation({
    mutationFn: async (input: CreateCalendarEventInput) => {
      if (!activeWorkspace || !user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("workspace_calendar_events")
        .insert({
          workspace_id: activeWorkspace.id,
          created_by: user.id,
          calendar_id: input.calendar_id,
          title: input.title,
          description: input.description,
          event_type: input.event_type || "event",
          start_datetime: input.start_datetime,
          end_datetime: input.end_datetime,
          is_all_day: input.is_all_day || false,
          location: input.location,
          attendees: input.attendees || [],
          recurrence_rule: input.recurrence_rule,
          recurrence_end_date: input.recurrence_end_date,
          color: input.color,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-calendar-events"] });
      toast.success("Événement créé");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateEvent = useMutation({
    mutationFn: async (input: Partial<WorkspaceCalendarEvent> & { id: string }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("workspace_calendar_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-calendar-events"] });
      toast.success("Événement mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workspace_calendar_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-calendar-events"] });
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
