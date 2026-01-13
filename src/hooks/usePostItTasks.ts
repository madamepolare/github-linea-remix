import { useMemo } from "react";
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
      // Get tasks created by current user only (shared tasks will be fetched via quick_task_shares)
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

  // Fetch tasks shared WITH current user (others' tasks shared to me)
  const { data: sharedWithMeTasks } = useQuery({
    queryKey: ["quick_tasks_shared_with_me", activeWorkspace?.id, user?.id],
    queryFn: async () => {
      // Get tasks where current user is in the shares list
      const { data: shares, error: sharesError } = await supabase
        .from("quick_task_shares")
        .select("quick_task_id")
        .eq("shared_with_user_id", user!.id);
      
      if (sharesError) throw sharesError;
      if (!shares || shares.length === 0) return [];
      
      const taskIds = shares.map(s => s.quick_task_id);
      const { data, error } = await supabase
        .from("quick_tasks")
        .select("*")
        .in("id", taskIds)
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
      queryClient.invalidateQueries({ queryKey: ["quick_tasks_shared_with_me"] });
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
      queryClient.invalidateQueries({ queryKey: ["quick_tasks_shared_with_me"] });
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
      queryClient.invalidateQueries({ queryKey: ["quick_tasks_shared_with_me"] });
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
      queryClient.invalidateQueries({ queryKey: ["quick_tasks_shared_with_me"] });
      queryClient.invalidateQueries({ queryKey: ["quick_task_shares"] });
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Combine my tasks with tasks shared with me (removing duplicates)
  const allTasks = useMemo(() => {
    const myTasks = quickTasks || [];
    const sharedTasks = sharedWithMeTasks || [];
    
    // Create a map to avoid duplicates (in case same task appears in both)
    const taskMap = new Map<string, QuickTask>();
    myTasks.forEach(t => taskMap.set(t.id, t));
    sharedTasks.forEach(t => {
      if (!taskMap.has(t.id)) {
        taskMap.set(t.id, t);
      }
    });
    
    // Sort by created_at descending
    return Array.from(taskMap.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [quickTasks, sharedWithMeTasks]);

  const pendingCount = allTasks.filter((t) => t.status === "pending").length;

  // Check if a task is owned by current user
  const isTaskOwner = (task: QuickTask) => task.created_by === user?.id;

  // Check if a task is shared with current user (not owner)
  const isSharedTask = (task: QuickTask) => {
    if (task.created_by === user?.id) return false;
    return sharedWithMeTasks?.some(t => t.id === task.id) || false;
  };

  // Get shares for a specific task
  const getTaskShares = (taskId: string) => {
    return taskShares?.filter(s => s.quick_task_id === taskId) || [];
  };

  return {
    quickTasks: allTasks,
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
    sharedWithMeTasks,
  };
}
