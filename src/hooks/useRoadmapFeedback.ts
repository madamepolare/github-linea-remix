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
  source: 'roadmap' | 'feedback_mode';
  route_path?: string;
  feedback_type?: string;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Map module slugs to route patterns
const MODULE_ROUTE_MAP: Record<string, string[]> = {
  dashboard: ['/dashboard'],
  crm: ['/crm', '/contacts', '/leads', '/companies'],
  projects: ['/projects'],
  tasks: ['/tasks'],
  commercial: ['/commercial', '/quote-builder'],
  tenders: ['/tenders'],
  invoicing: ['/invoicing', '/invoices'],
  messages: ['/messages'],
  notifications: ['/notifications'],
  team: ['/team'],
  reports: ['/reports'],
  chantier: ['/chantier'],
  documents: ['/documents'],
  portal: ['/client-portal', '/portal'],
  libraries: ['/materials', '/libraries'],
  ai: ['/ai'],
  permissions: ['/settings'],
};

export function useRoadmapFeedback(roadmapItemId: string | null, moduleSlug?: string | null) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch feedbacks for a specific roadmap item + related route feedbacks
  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['roadmap_feedback', roadmapItemId, moduleSlug],
    queryFn: async () => {
      const allFeedbacks: RoadmapFeedback[] = [];

      // 1. Fetch direct roadmap feedbacks
      if (roadmapItemId && !roadmapItemId.startsWith('static-')) {
        const { data, error } = await supabase
          .from('roadmap_feedback')
          .select('*')
          .eq('roadmap_item_id', roadmapItemId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const userIds = [...new Set(data.map(d => d.user_id))];
          let profileMap = new Map();
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, full_name, avatar_url')
              .in('user_id', userIds);
            profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
          }

          data.forEach(fb => {
            allFeedbacks.push({
              ...fb,
              source: 'roadmap',
              author: profileMap.get(fb.user_id) || null,
            });
          });
        }
      }

      // 2. Fetch feedback_entries by route if moduleSlug is provided
      if (moduleSlug && MODULE_ROUTE_MAP[moduleSlug]) {
        const routes = MODULE_ROUTE_MAP[moduleSlug];
        
        const { data: routeFeedbacks, error } = await supabase
          .from('feedback_entries')
          .select('*')
          .eq('workspace_id', activeWorkspace!.id)
          .order('created_at', { ascending: false });

        if (!error && routeFeedbacks) {
          // Filter by route patterns
          const matchingFeedbacks = routeFeedbacks.filter(fb => 
            routes.some(route => fb.route_path.startsWith(route))
          );

          const userIds = [...new Set(matchingFeedbacks.map(d => d.author_id).filter(Boolean))];
          let profileMap = new Map();
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, full_name, avatar_url')
              .in('user_id', userIds as string[]);
            profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
          }

          matchingFeedbacks.forEach(fb => {
            allFeedbacks.push({
              id: fb.id,
              roadmap_item_id: null,
              user_id: fb.author_id || '',
              content: fb.content,
              created_at: fb.created_at,
              updated_at: fb.updated_at,
              workspace_id: fb.workspace_id,
              source: 'feedback_mode',
              route_path: fb.route_path,
              feedback_type: fb.feedback_type,
              author: profileMap.get(fb.author_id) || null,
            });
          });
        }
      }

      // Sort all by created_at desc
      return allFeedbacks.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!activeWorkspace?.id && (!!roadmapItemId || !!moduleSlug),
  });

  // Fetch ALL feedbacks for the workspace (for export) - includes both sources
  const { data: allFeedbacks = [] } = useQuery({
    queryKey: ['roadmap_feedback_all', activeWorkspace?.id],
    queryFn: async () => {
      const combined: RoadmapFeedback[] = [];

      // 1. Roadmap feedbacks
      const { data: roadmapData, error: roadmapError } = await supabase
        .from('roadmap_feedback')
        .select('*')
        .eq('workspace_id', activeWorkspace!.id)
        .order('created_at', { ascending: false });

      if (!roadmapError && roadmapData) {
        const userIds = [...new Set(roadmapData.map(d => d.user_id))];
        let profileMap = new Map();
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', userIds);
          profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        }

        roadmapData.forEach(fb => {
          combined.push({
            ...fb,
            source: 'roadmap',
            author: profileMap.get(fb.user_id) || null,
          });
        });
      }

      // 2. Feedback mode entries
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback_entries')
        .select('*')
        .eq('workspace_id', activeWorkspace!.id)
        .order('created_at', { ascending: false });

      if (!feedbackError && feedbackData) {
        const userIds = [...new Set(feedbackData.map(d => d.author_id).filter(Boolean))];
        let profileMap = new Map();
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', userIds as string[]);
          profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        }

        feedbackData.forEach(fb => {
          combined.push({
            id: fb.id,
            roadmap_item_id: null,
            user_id: fb.author_id || '',
            content: fb.content,
            created_at: fb.created_at,
            updated_at: fb.updated_at,
            workspace_id: fb.workspace_id,
            source: 'feedback_mode',
            route_path: fb.route_path,
            feedback_type: fb.feedback_type,
            author: profileMap.get(fb.author_id) || null,
          });
        });
      }

      return combined.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
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
