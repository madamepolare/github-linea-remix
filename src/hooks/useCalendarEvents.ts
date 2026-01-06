import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type EventType = "meeting" | "milestone" | "reminder" | "rendu";

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
      return data as CalendarEvent[];
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
