import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TaskTimeEntry {
  id: string;
  workspace_id: string;
  task_id: string;
  user_id: string | null;
  description: string | null;
  duration_minutes: number;
  date: string;
  started_at: string | null;
  ended_at: string | null;
  is_billable: boolean | null;
  created_at: string | null;
}

export function useTaskTimeEntries(taskId: string | null) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: timeEntries, isLoading } = useQuery({
    queryKey: ["task-time-entries", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_time_entries")
        .select("*")
        .eq("task_id", taskId!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as TaskTimeEntry[];
    },
    enabled: !!taskId,
  });

  const createTimeEntry = useMutation({
    mutationFn: async (entry: Partial<TaskTimeEntry>) => {
      const { data, error } = await supabase
        .from("task_time_entries")
        .insert({
          duration_minutes: entry.duration_minutes!,
          date: entry.date!,
          description: entry.description,
          task_id: taskId!,
          workspace_id: activeWorkspace!.id,
          user_id: user?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-time-entries", taskId] });
      toast.success("Time entry added");
    },
    onError: (error) => {
      toast.error("Failed to add time entry: " + error.message);
    },
  });

  const deleteTimeEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_time_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-time-entries", taskId] });
      toast.success("Time entry deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete time entry: " + error.message);
    },
  });

  const totalMinutes = timeEntries?.reduce((sum, entry) => sum + entry.duration_minutes, 0) || 0;

  return {
    timeEntries,
    isLoading,
    createTimeEntry,
    deleteTimeEntry,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
  };
}
