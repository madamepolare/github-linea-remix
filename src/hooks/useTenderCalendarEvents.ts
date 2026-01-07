import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TenderCalendarEvent {
  tender_id: string;
  title: string;
  description?: string;
  event_type: "meeting" | "milestone" | "reminder";
  start_datetime: string;
  end_datetime?: string;
  location?: string;
  attendees?: Array<{ user_id?: string; email?: string; name?: string }>;
}

export function useTenderCalendarEvents() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const createTenderEvent = useMutation({
    mutationFn: async (event: TenderCalendarEvent) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      // First, check if an event already exists for this tender and type
      const { data: existing } = await supabase
        .from("project_calendar_events")
        .select("id")
        .eq("workspace_id", activeWorkspace.id)
        .eq("description", `tender:${event.tender_id}`)
        .eq("event_type", event.event_type);

      // If exists, update it
      if (existing && existing.length > 0) {
        const { data, error } = await supabase
          .from("project_calendar_events")
          .update({
            title: event.title,
            start_datetime: event.start_datetime,
            end_datetime: event.end_datetime || null,
            location: event.location || null,
            attendees: event.attendees || [],
          })
          .eq("id", existing[0].id)
          .select()
          .single();

        if (error) throw error;
        return { data, updated: true };
      }

      // Create new event
      const { data, error } = await supabase
        .from("project_calendar_events")
        .insert({
          workspace_id: activeWorkspace.id,
          project_id: null, // Tender events are not linked to projects
          title: event.title,
          description: `tender:${event.tender_id}`, // Tag to identify tender events
          event_type: event.event_type,
          start_datetime: event.start_datetime,
          end_datetime: event.end_datetime || null,
          location: event.location || null,
          is_all_day: false,
          attendees: event.attendees || [],
          recurrence_rule: null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return { data, updated: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-events"] });
      toast.success(result.updated ? "Événement mis à jour dans l'agenda" : "Événement ajouté à l'agenda");
    },
    onError: (error) => {
      console.error("Error creating tender event:", error);
      toast.error("Erreur lors de l'ajout à l'agenda");
    },
  });

  const deleteTenderEvent = useMutation({
    mutationFn: async ({ tenderId, eventType }: { tenderId: string; eventType: string }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { error } = await supabase
        .from("project_calendar_events")
        .delete()
        .eq("workspace_id", activeWorkspace.id)
        .eq("description", `tender:${tenderId}`)
        .eq("event_type", eventType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-events"] });
    },
  });

  const addSiteVisitToCalendar = async (tender: {
    id: string;
    title: string;
    location?: string | null;
    site_visit_date: string;
  }) => {
    const endDate = new Date(tender.site_visit_date);
    endDate.setHours(endDate.getHours() + 2); // Default 2 hours duration

    return createTenderEvent.mutateAsync({
      tender_id: tender.id,
      title: `🏗️ Visite de site - ${tender.title}`,
      event_type: "meeting",
      start_datetime: tender.site_visit_date,
      end_datetime: endDate.toISOString(),
      location: tender.location || undefined,
    });
  };

  return {
    createTenderEvent,
    deleteTenderEvent,
    addSiteVisitToCalendar,
  };
}
