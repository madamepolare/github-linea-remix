import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TaskExchange {
  id: string;
  task_id: string;
  workspace_id: string;
  title: string | null;
  content: string;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useTaskExchanges(taskId: string | null) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: exchanges, isLoading } = useQuery({
    queryKey: ["task_exchanges", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from("task_exchanges")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TaskExchange[];
    },
    enabled: !!taskId && !!activeWorkspace?.id,
  });

  const createExchange = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!taskId || !activeWorkspace) throw new Error("Missing task or workspace");
      const { data, error } = await supabase
        .from("task_exchanges")
        .insert({
          task_id: taskId,
          workspace_id: activeWorkspace.id,
          title,
          content,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_exchanges", taskId] });
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteExchange = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("task_exchanges")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_exchanges", taskId] });
    },
  });

  return {
    exchanges,
    isLoading,
    createExchange,
    deleteExchange,
  };
}
