import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FeedbackEntry {
  id: string;
  workspace_id: string;
  author_id: string | null;
  route_path: string;
  content: string;
  feedback_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useFeedbackEntries() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries, isLoading } = useQuery({
    queryKey: ["feedback-entries", activeWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_entries")
        .select("*")
        .eq("workspace_id", activeWorkspace!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FeedbackEntry[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createEntry = useMutation({
    mutationFn: async ({ 
      content, 
      routePath, 
      feedbackType = "suggestion" 
    }: { 
      content: string; 
      routePath: string; 
      feedbackType?: string;
    }) => {
      const { data, error } = await supabase
        .from("feedback_entries")
        .insert({
          workspace_id: activeWorkspace!.id,
          author_id: user?.id,
          route_path: routePath,
          content,
          feedback_type: feedbackType,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-entries", activeWorkspace?.id] });
      toast.success("Feedback envoyé !");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("feedback_entries")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-entries", activeWorkspace?.id] });
      toast.success("Feedback supprimé");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    entries,
    isLoading,
    createEntry,
    deleteEntry,
  };
}
