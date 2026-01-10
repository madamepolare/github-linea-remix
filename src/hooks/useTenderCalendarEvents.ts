import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TenderCalendarEvent {
  id?: string;
  tender_id: string;
  title: string;
  description?: string;
  event_type: "site_visit" | "meeting" | "milestone" | "reminder" | "deadline";
  start_datetime: string;
  end_datetime?: string;
  location?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  attendees?: Array<{ user_id?: string; email?: string; name?: string }>;
}

export function useTenderCalendarEvents(tenderId?: string) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  // Query events for a specific tender
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["tender-events", tenderId],
    queryFn: async () => {
      if (!activeWorkspace?.id || !tenderId) return [];
      
      const { data, error } = await supabase
        .from("tender_calendar_events")
        .select("*")
        .eq("tender_id", tenderId)
        .eq("workspace_id", activeWorkspace.id)
        .order("start_datetime", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!activeWorkspace?.id && !!tenderId,
  });

  // Create or update tender event
  const createTenderEvent = useMutation({
    mutationFn: async (event: TenderCalendarEvent) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      // Check if an event already exists for this tender and type
      const { data: existing } = await supabase
        .from("tender_calendar_events")
        .select("id")
        .eq("workspace_id", activeWorkspace.id)
        .eq("tender_id", event.tender_id)
        .eq("event_type", event.event_type);

      // If exists, update it
      if (existing && existing.length > 0) {
        const { data, error } = await supabase
          .from("tender_calendar_events")
          .update({
            title: event.title,
            description: event.description || null,
            start_datetime: event.start_datetime,
            end_datetime: event.end_datetime || null,
            location: event.location || null,
            contact_name: event.contact_name || null,
            contact_email: event.contact_email || null,
            contact_phone: event.contact_phone || null,
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
        .from("tender_calendar_events")
        .insert({
          workspace_id: activeWorkspace.id,
          tender_id: event.tender_id,
          title: event.title,
          description: event.description || null,
          event_type: event.event_type,
          start_datetime: event.start_datetime,
          end_datetime: event.end_datetime || null,
          location: event.location || null,
          contact_name: event.contact_name || null,
          contact_email: event.contact_email || null,
          contact_phone: event.contact_phone || null,
          attendees: event.attendees || [],
        })
        .select()
        .single();

      if (error) throw error;
      return { data, updated: false };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tender-events", variables.tender_id] });
      queryClient.invalidateQueries({ queryKey: ["workspace-events"] });
    },
    onError: (error) => {
      console.error("Error creating tender event:", error);
      toast.error("Erreur lors de la création de l'événement");
    },
  });

  // Delete tender event
  const deleteTenderEvent = useMutation({
    mutationFn: async ({ tenderId, eventType }: { tenderId: string; eventType: string }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { error } = await supabase
        .from("tender_calendar_events")
        .delete()
        .eq("workspace_id", activeWorkspace.id)
        .eq("tender_id", tenderId)
        .eq("event_type", eventType);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tender-events", variables.tenderId] });
      queryClient.invalidateQueries({ queryKey: ["workspace-events"] });
    },
  });

  // Sync site visit from tender data to calendar
  const syncSiteVisit = async (tender: {
    id: string;
    title: string;
    location?: string | null;
    site_visit_date: string;
    site_visit_required?: boolean | null;
    site_visit_contact_name?: string | null;
    site_visit_contact_email?: string | null;
    site_visit_contact_phone?: string | null;
    site_visit_assigned_users?: string[] | null;
  }) => {
    const startDate = new Date(tender.site_visit_date);
    const endDate = new Date(tender.site_visit_date);
    endDate.setHours(endDate.getHours() + 2); // Default 2 hours duration

    // Build attendees from assigned users - include user_id for planning grid lookup
    const attendees = tender.site_visit_assigned_users?.map(userId => ({
      user_id: userId,
    })) || [];

    return createTenderEvent.mutateAsync({
      tender_id: tender.id,
      title: `🏗️ Visite de site${tender.site_visit_required ? " (obligatoire)" : ""} - ${tender.title}`,
      description: tender.site_visit_required ? "Visite de site obligatoire" : "Visite de site",
      event_type: "site_visit",
      start_datetime: startDate.toISOString(),
      end_datetime: endDate.toISOString(),
      location: tender.location || undefined,
      contact_name: tender.site_visit_contact_name || undefined,
      contact_email: tender.site_visit_contact_email || undefined,
      contact_phone: tender.site_visit_contact_phone || undefined,
      attendees,
    });
  };

  // Sync deadline from tender data
  const syncDeadline = async (tender: {
    id: string;
    title: string;
    submission_deadline: string;
  }) => {
    return createTenderEvent.mutateAsync({
      tender_id: tender.id,
      title: `📅 Dépôt - ${tender.title}`,
      description: "Date limite de remise des offres",
      event_type: "deadline",
      start_datetime: tender.submission_deadline,
    });
  };

  // Get site visit event for a tender
  const getSiteVisitEvent = () => {
    return events.find(e => e.event_type === "site_visit");
  };

  return {
    events,
    isLoading,
    createTenderEvent,
    deleteTenderEvent,
    syncSiteVisit,
    syncDeadline,
    getSiteVisitEvent,
  };
}
