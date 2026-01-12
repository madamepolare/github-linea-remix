import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface QuickTask {
  id: string;
  title: string;
  status: "pending" | "completed";
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  created_by: string | null;
  workspace_id: string;
}

export interface QuickTaskShare {
  id: string;
  quick_task_id: string;
  shared_with_user_id: string;
  shared_by_user_id: string;
  created_at: string;
}

export function usePostItTasks() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: quickTasks, isLoading } = useQuery({
    queryKey: ["quick_tasks", activeWorkspace?.id, user?.id],
    queryFn: async () => {
      // Get tasks created by current user OR shared with current user
      const { data, error } = await supabase
        .from("quick_tasks")
        .select("*")
        .eq("workspace_id", activeWorkspace!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as QuickTask[];
    },
    enabled: !!activeWorkspace?.id && !!user?.id,
  });

  // Fetch shares for current user's tasks
  const { data: taskShares } = useQuery({
    queryKey: ["quick_task_shares", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quick_task_shares")
        .select("*");
      
      if (error) throw error;
      return data as QuickTaskShare[];
    },
    enabled: !!user?.id,
  });

  const createQuickTask = useMutation({
    mutationFn: async (input: { title: string; sharedWith?: string[] }) => {
      const { data, error } = await supabase
        .from("quick_tasks")
        .insert({
          title: input.title,
          status: "pending",
          workspace_id: activeWorkspace!.id,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;

      // If there are mentions, share the task with mentioned users
      if (input.sharedWith && input.sharedWith.length > 0) {
        const shares = input.sharedWith.map(userId => ({
          quick_task_id: data.id,
          shared_with_user_id: userId,
          shared_by_user_id: user!.id,
        }));

        const { error: shareError } = await supabase
          .from("quick_task_shares")
          .insert(shares);
        
        if (shareError) {
          console.error("Error sharing task:", shareError);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["quick_task_shares"] });
      toast.success("Post-it ajouté");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const completeQuickTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quick_tasks")
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString() 
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick_tasks"] });
      toast.success("Post-it terminé !");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const uncompleteQuickTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quick_tasks")
        .update({ 
          status: "pending", 
          completed_at: null 
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick_tasks"] });
      toast.success("Post-it remis en attente");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
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
      queryClient.invalidateQueries({ queryKey: ["quick_task_shares"] });
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const pendingCount = quickTasks?.filter((t) => t.status === "pending").length || 0;

  // Check if a task is owned by current user
  const isTaskOwner = (task: QuickTask) => task.created_by === user?.id;

  // Check if a task is shared with current user (not owner)
  const isSharedTask = (task: QuickTask) => {
    if (task.created_by === user?.id) return false;
    return taskShares?.some(s => s.quick_task_id === task.id && s.shared_with_user_id === user?.id);
  };

  // Get shares for a specific task
  const getTaskShares = (taskId: string) => {
    return taskShares?.filter(s => s.quick_task_id === taskId) || [];
  };

  return {
    quickTasks,
    isLoading,
    pendingCount,
    createQuickTask,
    completeQuickTask,
    uncompleteQuickTask,
    deleteQuickTask,
    isTaskOwner,
    isSharedTask,
    getTaskShares,
    taskShares,
  };
}
