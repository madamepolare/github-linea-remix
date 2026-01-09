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
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
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
      
      // Fetch user profiles for entries
      const userIds = [...new Set((data || []).map((e) => e.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        
        const profilesMap = new Map(
          (profiles || []).map((p) => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }])
        );
        
        return (data || []).map((entry) => ({
          ...entry,
          user: entry.user_id ? profilesMap.get(entry.user_id) || null : null,
        })) as TaskTimeEntry[];
      }
      
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
          user_id: entry.user_id || user?.id,
          started_at: entry.started_at,
          ended_at: entry.ended_at,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-time-entries", taskId] });
      toast.success("Temps enregistré");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateTimeEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskTimeEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from("task_time_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-time-entries", taskId] });
      toast.success("Temps mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteTimeEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_time_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-time-entries", taskId] });
      toast.success("Temps supprimé");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const totalMinutes = timeEntries?.reduce((sum, entry) => sum + entry.duration_minutes, 0) || 0;

  return {
    timeEntries,
    isLoading,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
  };
}
