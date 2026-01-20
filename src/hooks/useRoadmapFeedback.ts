import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RoadmapFeedback {
  id: string;
  roadmap_item_id: string | null;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  workspace_id: string;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useRoadmapFeedback(roadmapItemId: string | null) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch feedbacks for a specific roadmap item
  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['roadmap_feedback', roadmapItemId],
    queryFn: async () => {
      if (!roadmapItemId) return [];

      const { data, error } = await supabase
        .from('roadmap_feedback')
        .select('*')
        .eq('roadmap_item_id', roadmapItemId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get author profiles
      const userIds = [...new Set(data.map(d => d.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        return data.map(fb => ({
          ...fb,
          author: profileMap.get(fb.user_id) || null,
        })) as RoadmapFeedback[];
      }

      return data as RoadmapFeedback[];
    },
    enabled: !!roadmapItemId && !!activeWorkspace?.id,
  });

  // Fetch ALL feedbacks for the workspace (for export)
  const { data: allFeedbacks = [] } = useQuery({
    queryKey: ['roadmap_feedback_all', activeWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roadmap_feedback')
        .select('*')
        .eq('workspace_id', activeWorkspace!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get author profiles
      const userIds = [...new Set(data.map(d => d.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        return data.map(fb => ({
          ...fb,
          author: profileMap.get(fb.user_id) || null,
        })) as RoadmapFeedback[];
      }

      return data as RoadmapFeedback[];
    },
    enabled: !!activeWorkspace?.id,
  });

  // Create feedback
  const createFeedback = useMutation({
    mutationFn: async ({ roadmapItemId, content }: { roadmapItemId: string; content: string }) => {
      const { data, error } = await supabase
        .from('roadmap_feedback')
        .insert({
          roadmap_item_id: roadmapItemId,
          user_id: user!.id,
          workspace_id: activeWorkspace!.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap_feedback'] });
      queryClient.invalidateQueries({ queryKey: ['roadmap_feedback_all'] });
      toast.success('Retour envoyé !');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Delete feedback
  const deleteFeedback = useMutation({
    mutationFn: async (feedbackId: string) => {
      const { error } = await supabase
        .from('roadmap_feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap_feedback'] });
      queryClient.invalidateQueries({ queryKey: ['roadmap_feedback_all'] });
      toast.success('Retour supprimé');
    },
  });

  return {
    feedbacks,
    allFeedbacks,
    isLoading,
    createFeedback,
    deleteFeedback,
  };
}
