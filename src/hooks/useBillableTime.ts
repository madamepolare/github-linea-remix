import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BillableTimeEntry {
  id: string;
  workspace_id: string;
  project_id: string | null;
  user_id: string;
  task_id: string | null;
  description: string | null;
  duration_minutes: number;
  date: string;
  hourly_rate: number;
  invoice_id: string | null;
  invoiced_at: string | null;
  budget_envelope_id: string | null;
  status: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  project?: {
    name: string;
  };
  task?: {
    title: string;
  };
  amount: number; // Calculated: (duration_minutes / 60) * hourly_rate
}

export interface BillableTimeSummary {
  totalMinutes: number;
  totalHours: number;
  totalAmount: number;
  entriesCount: number;
  byUser: Map<string, { minutes: number; amount: number }>;
  byMonth: Map<string, { minutes: number; amount: number }>;
}

export function useBillableTime(projectId: string) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["billable-time", projectId];

  // Fetch unbilled time entries for a project
  // This includes entries with direct project_id OR entries linked via task.project_id
  const { data: entries = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeWorkspace || !projectId) return [];

      // First, get task IDs that belong to this project
      const { data: projectTasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("project_id", projectId);

      const projectTaskIds = (projectTasks || []).map(t => t.id);

      // Fetch team_time_entries with direct project_id
      const { data: directEntries, error: directError } = await supabase
        .from("team_time_entries")
        .select(`
          *,
          project:projects(name),
          task:tasks(title, project_id)
        `)
        .eq("project_id", projectId)
        .eq("workspace_id", activeWorkspace.id)
        .is("invoice_id", null)
        .order("date", { ascending: false });

      if (directError) throw directError;

      // Fetch team_time_entries linked via task (where task belongs to this project)
      let taskLinkedEntries: typeof directEntries = [];
      if (projectTaskIds.length > 0) {
        const { data: taskEntries, error: taskError } = await supabase
          .from("team_time_entries")
          .select(`
            *,
            project:projects(name),
            task:tasks(title, project_id)
          `)
          .in("task_id", projectTaskIds)
          .eq("workspace_id", activeWorkspace.id)
          .is("invoice_id", null)
          .order("date", { ascending: false });

        if (taskError) throw taskError;
        taskLinkedEntries = taskEntries || [];
      }

      // Merge and deduplicate entries
      const allEntriesMap = new Map<string, typeof directEntries[0]>();
      [...(directEntries || []), ...taskLinkedEntries].forEach(entry => {
        allEntriesMap.set(entry.id, entry);
      });
      const allEntries = Array.from(allEntriesMap.values());

      // Fetch user profiles
      const userIds = [...new Set(allEntries.map(e => e.user_id).filter(Boolean))];
      let profilesMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        profilesMap = new Map(
          (profiles || []).map(p => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }])
        );
      }

      // Get workspace daily rate as fallback
      const { data: workspaceData } = await supabase
        .from("workspaces")
        .select("daily_rate")
        .eq("id", activeWorkspace.id)
        .single();

      const defaultHourlyRate = (workspaceData?.daily_rate || 0) / 8;

      return allEntries.map(entry => {
        const hourlyRate = entry.hourly_rate || defaultHourlyRate;
        const amount = (entry.duration_minutes / 60) * hourlyRate;
        
        return {
          ...entry,
          user: profilesMap.get(entry.user_id) || null,
          hourly_rate: hourlyRate,
          amount,
        } as BillableTimeEntry;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!activeWorkspace && !!projectId,
  });

  // Calculate summary
  const summary: BillableTimeSummary = {
    totalMinutes: entries.reduce((sum, e) => sum + e.duration_minutes, 0),
    totalHours: entries.reduce((sum, e) => sum + e.duration_minutes, 0) / 60,
    totalAmount: entries.reduce((sum, e) => sum + e.amount, 0),
    entriesCount: entries.length,
    byUser: new Map(),
    byMonth: new Map(),
  };

  entries.forEach(entry => {
    // By user
    const userKey = entry.user_id;
    const userData = summary.byUser.get(userKey) || { minutes: 0, amount: 0 };
    userData.minutes += entry.duration_minutes;
    userData.amount += entry.amount;
    summary.byUser.set(userKey, userData);

    // By month
    const monthKey = entry.date.substring(0, 7); // YYYY-MM
    const monthData = summary.byMonth.get(monthKey) || { minutes: 0, amount: 0 };
    monthData.minutes += entry.duration_minutes;
    monthData.amount += entry.amount;
    summary.byMonth.set(monthKey, monthData);
  });

  // Mark entries as invoiced
  const markAsInvoiced = useMutation({
    mutationFn: async ({ entryIds, invoiceId }: { entryIds: string[]; invoiceId: string }) => {
      const { error } = await supabase
        .from("team_time_entries")
        .update({
          invoice_id: invoiceId,
          invoiced_at: new Date().toISOString(),
        })
        .in("id", entryIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Temps marqué comme facturé");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Update hourly rate for entries
  const updateHourlyRate = useMutation({
    mutationFn: async ({ entryIds, hourlyRate }: { entryIds: string[]; hourlyRate: number }) => {
      const { error } = await supabase
        .from("team_time_entries")
        .update({ hourly_rate: hourlyRate })
        .in("id", entryIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Taux horaire mis à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    entries,
    isLoading,
    error,
    summary,
    markAsInvoiced,
    updateHourlyRate,
  };
}

// Hook to get already invoiced time entries
export function useInvoicedTime(projectId: string) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["invoiced-time", projectId],
    queryFn: async () => {
      if (!activeWorkspace || !projectId) return [];

      // First, get task IDs that belong to this project
      const { data: projectTasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("project_id", projectId);

      const projectTaskIds = (projectTasks || []).map(t => t.id);

      // Fetch entries with direct project_id
      const { data: directEntries, error: directError } = await supabase
        .from("team_time_entries")
        .select(`
          *,
          project:projects(name),
          task:tasks(title, project_id),
          invoice:invoices(id, invoice_number, invoice_date)
        `)
        .eq("project_id", projectId)
        .eq("workspace_id", activeWorkspace.id)
        .not("invoice_id", "is", null)
        .order("invoiced_at", { ascending: false });

      if (directError) throw directError;

      // Fetch entries linked via task
      let taskLinkedEntries: typeof directEntries = [];
      if (projectTaskIds.length > 0) {
        const { data: taskEntries, error: taskError } = await supabase
          .from("team_time_entries")
          .select(`
            *,
            project:projects(name),
            task:tasks(title, project_id),
            invoice:invoices(id, invoice_number, invoice_date)
          `)
          .in("task_id", projectTaskIds)
          .eq("workspace_id", activeWorkspace.id)
          .not("invoice_id", "is", null)
          .order("invoiced_at", { ascending: false });

        if (taskError) throw taskError;
        taskLinkedEntries = taskEntries || [];
      }

      // Merge and deduplicate
      const allEntriesMap = new Map<string, typeof directEntries[0]>();
      [...(directEntries || []), ...taskLinkedEntries].forEach(entry => {
        allEntriesMap.set(entry.id, entry);
      });
      
      return Array.from(allEntriesMap.values())
        .sort((a, b) => new Date(b.invoiced_at || 0).getTime() - new Date(a.invoiced_at || 0).getTime());
    },
    enabled: !!activeWorkspace && !!projectId,
  });
}
