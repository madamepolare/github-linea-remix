import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@/hooks/useTasks";

export interface TaskSchedule {
  id: string;
  workspace_id: string;
  task_id: string;
  user_id: string;
  start_datetime: string;
  end_datetime: string;
  is_locked: boolean;
  notes: string | null;
  color: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  task?: Task & {
    project?: { name: string; color: string | null };
  };
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface UseTaskSchedulesOptions {
  userId?: string;
  startDate?: string;
  endDate?: string;
  taskId?: string;
}

export function useTaskSchedules(options?: UseTaskSchedulesOptions) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ["task-schedules", activeWorkspace?.id, options],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from("task_schedules")
        .select(`
          *,
          task:tasks(
            id,
            title,
            status,
            priority,
            estimated_hours,
            project:projects(name, color)
          )
        `)
        .eq("workspace_id", activeWorkspace.id);

      if (options?.userId) {
        query = query.eq("user_id", options.userId);
      }

      if (options?.taskId) {
        query = query.eq("task_id", options.taskId);
      }

      if (options?.startDate) {
        query = query.gte("start_datetime", options.startDate);
      }

      if (options?.endDate) {
        query = query.lte("end_datetime", options.endDate);
      }

      const { data, error } = await query.order("start_datetime", { ascending: true });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createSchedule = useMutation({
    mutationFn: async (schedule: {
      task_id: string;
      user_id: string;
      start_datetime: string;
      end_datetime: string;
      notes?: string;
      color?: string;
    }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("task_schedules")
        .insert({
          ...schedule,
          workspace_id: activeWorkspace.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["unscheduled-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-task-ids"] });
      toast({ title: "Tâche planifiée" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from("task_schedules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-schedules"] });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("task_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["unscheduled-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-task-ids"] });
      toast({ title: "Tâche déplanifiée" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const bulkCreateSchedules = useMutation({
    mutationFn: async (schedules: Array<{
      task_id: string;
      user_id: string;
      start_datetime: string;
      end_datetime: string;
      notes?: string;
    }>) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data: { user } } = await supabase.auth.getUser();

      const schedulesWithWorkspace = schedules.map(s => ({
        ...s,
        workspace_id: activeWorkspace.id,
        created_by: user?.id,
      }));

      const { data, error } = await supabase
        .from("task_schedules")
        .insert(schedulesWithWorkspace)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["task-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["unscheduled-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-task-ids"] });
      toast({ title: `${data?.length || 0} créneaux créés` });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  return {
    schedules,
    isLoading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    bulkCreateSchedules,
  };
}

// Hook pour récupérer les tâches non planifiées
export function useUnscheduledTasks() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["unscheduled-tasks", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      // Récupérer les tâches qui n'ont pas de schedule
      const { data: scheduledTaskIds } = await supabase
        .from("task_schedules")
        .select("task_id")
        .eq("workspace_id", activeWorkspace.id);

      const scheduledIds = (scheduledTaskIds || []).map(s => s.task_id);

      let query = supabase
        .from("tasks")
        .select(`
          *,
          project:projects(id, name, color)
        `)
        .eq("workspace_id", activeWorkspace.id)
        .neq("status", "done")
        .neq("status", "archived")
        .order("priority", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false });

      if (scheduledIds.length > 0) {
        query = query.not("id", "in", `(${scheduledIds.join(",")})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkspace?.id,
  });
}
