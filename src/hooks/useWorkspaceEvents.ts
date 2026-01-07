import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { addYears, isBefore, isAfter, startOfDay, addWeeks, addMonths } from "date-fns";

export type EventType = "meeting" | "milestone" | "reminder" | "rendu";
export type RecurrenceRule = "weekly" | "monthly" | "quarterly" | "yearly" | null;

export interface WorkspaceEvent {
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
  attendees: Array<{ email: string; name?: string; user_id?: string }>;
  recurrence_rule: RecurrenceRule;
  parent_event_id: string | null;
  project?: { name: string; color: string | null };
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

function generateRecurringInstances(event: WorkspaceEvent, startRange: Date, endRange: Date): WorkspaceEvent[] {
  if (!event.recurrence_rule || event.parent_event_id) return [];
  
  const instances: WorkspaceEvent[] = [];
  let currentDate = new Date(event.start_datetime);
  const endRecurrence = addYears(new Date(), 1);
  
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
  
  return instances.slice(0, 52);
}

export function useWorkspaceEvents() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["workspace-events", activeWorkspace?.id],
    queryFn: async (): Promise<WorkspaceEvent[]> => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("project_calendar_events")
        .select(`
          id,
          project_id,
          workspace_id,
          title,
          description,
          event_type,
          start_datetime,
          end_datetime,
          location,
          is_all_day,
          attendees,
          recurrence_rule,
          parent_event_id,
          project:projects(name, color)
        `)
        .eq("workspace_id", activeWorkspace.id)
        .order("start_datetime", { ascending: true });

      if (error) throw error;

      const typedEvents = (data || []).map(event => ({
        ...event,
        attendees: (event.attendees || []) as Array<{ email: string; name?: string; user_id?: string }>,
        recurrence_rule: event.recurrence_rule as RecurrenceRule,
        project: event.project as { name: string; color: string | null } | undefined,
      })) as WorkspaceEvent[];

      // Generate recurring instances
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
    enabled: !!activeWorkspace?.id,
  });
}
