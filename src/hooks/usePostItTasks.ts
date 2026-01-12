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

export function usePostItTasks() {
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

  const createQuickTask = useMutation({
    mutationFn: async (input: { title: string }) => {
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick_tasks"] });
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
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const pendingCount = quickTasks?.filter((t) => t.status === "pending").length || 0;

  return {
    quickTasks,
    isLoading,
    pendingCount,
    createQuickTask,
    completeQuickTask,
    deleteQuickTask,
  };
}
