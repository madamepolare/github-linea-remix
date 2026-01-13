import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface QuickTask {
  id: string;
  workspace_id: string;
  title: string;
  due_date: string | null;
  status: 'pending' | 'completed';
  created_by: string | null;
  completed_at: string | null;
  created_at: string | null;
}

export function useQuickTasksDB() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: quickTasks, isLoading } = useQuery({
    queryKey: ["quick_tasks", activeWorkspace?.id, user?.id],
    queryFn: async () => {
      // Get tasks created by current user only
      const { data, error } = await supabase
        .from("quick_tasks")
        .select("*")
        .eq("workspace_id", activeWorkspace!.id)
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as QuickTask[];
    },
    enabled: !!activeWorkspace?.id && !!user?.id,
  });

  const pendingTasks = quickTasks?.filter(t => t.status === 'pending') || [];
  const completedTasks = quickTasks?.filter(t => t.status === 'completed') || [];

  const createQuickTask = useMutation({
    mutationFn: async ({ title, due_date }: { title: string; due_date?: string }) => {
      const { data, error } = await supabase
        .from("quick_tasks")
        .insert({
          title,
          due_date: due_date || null,
          workspace_id: activeWorkspace!.id,
          created_by: user?.id,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data as QuickTask;
    },
    onMutate: async ({ title, due_date }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["quick_tasks", activeWorkspace?.id] });
      
      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<QuickTask[]>(["quick_tasks", activeWorkspace?.id]);
      
      // Optimistically add the new task
      const optimisticTask: QuickTask = {
        id: `temp-${Date.now()}`,
        workspace_id: activeWorkspace!.id,
        title,
        due_date: due_date || null,
        status: 'pending',
        created_by: user?.id || null,
        completed_at: null,
        created_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData<QuickTask[]>(
        ["quick_tasks", activeWorkspace?.id],
        (old) => [optimisticTask, ...(old || [])]
      );
      
      return { previousTasks };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["quick_tasks", activeWorkspace?.id], context.previousTasks);
      }
      toast.error("Erreur: " + error.message);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["quick_tasks", activeWorkspace?.id] });
    },
  });

  const toggleQuickTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from("quick_tasks")
        .update({
          status: completed ? 'completed' : 'pending',
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick_tasks"] });
    },
  });

  const deleteQuickTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quick_tasks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick_tasks"] });
    },
  });

  return {
    quickTasks,
    pendingTasks,
    completedTasks,
    isLoading,
    createQuickTask,
    toggleQuickTask,
    deleteQuickTask,
  };
}
