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
    queryKey: ["quick_tasks", activeWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quick_tasks")
        .select("*")
        .eq("workspace_id", activeWorkspace!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as QuickTask[];
    },
    enabled: !!activeWorkspace?.id,
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick_tasks"] });
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
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
