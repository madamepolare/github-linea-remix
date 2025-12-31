import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TaskComment {
  id: string;
  workspace_id: string;
  task_id: string;
  content: string;
  mentions: string[] | null;
  author_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useTaskComments(taskId: string | null) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TaskComment[];
    },
    enabled: !!taskId,
  });

  const createComment = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from("task_comments")
        .insert({
          task_id: taskId!,
          workspace_id: activeWorkspace!.id,
          content,
          author_id: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
    onError: (error) => {
      toast.error("Failed to add comment: " + error.message);
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
    onError: (error) => {
      toast.error("Failed to delete comment: " + error.message);
    },
  });

  return {
    comments,
    isLoading,
    createComment,
    deleteComment,
  };
}
