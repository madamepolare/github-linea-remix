import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface MediaPlanItem {
  id: string;
  workspace_id: string;
  campaign_id: string;
  channel_id: string | null;
  title: string;
  description: string | null;
  format: string | null;
  publish_date: string;
  publish_time: string | null;
  end_date: string | null;
  content_brief: string | null;
  content_url: string | null;
  attachments: unknown[];
  budget: number | null;
  actual_cost: number | null;
  status: string;
  performance_data: Record<string, unknown>;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaChannel {
  id: string;
  workspace_id: string;
  name: string;
  channel_type: string;
  platform: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MediaPlanItemFormData {
  campaign_id: string;
  channel_id?: string;
  title: string;
  description?: string;
  format?: string;
  publish_date: string;
  publish_time?: string;
  end_date?: string;
  content_brief?: string;
  content_url?: string;
  budget?: number;
  status?: string;
  assigned_to?: string;
}

export const CHANNEL_TYPES = [
  { value: 'social', label: 'Réseaux sociaux', icon: 'Users' },
  { value: 'display', label: 'Display', icon: 'Monitor' },
  { value: 'search', label: 'Search', icon: 'Search' },
  { value: 'video', label: 'Vidéo', icon: 'Video' },
  { value: 'print', label: 'Presse', icon: 'Newspaper' },
  { value: 'tv', label: 'TV', icon: 'Tv' },
  { value: 'radio', label: 'Radio', icon: 'Radio' },
  { value: 'outdoor', label: 'Affichage', icon: 'MapPin' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'other', label: 'Autre', icon: 'MoreHorizontal' },
];

export const MEDIA_ITEM_STATUSES = [
  { value: 'planned', label: 'Planifié', color: 'bg-blue-500' },
  { value: 'in_production', label: 'En production', color: 'bg-amber-500' },
  { value: 'ready', label: 'Prêt', color: 'bg-green-500' },
  { value: 'published', label: 'Publié', color: 'bg-primary' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-muted' },
];

export const FORMAT_OPTIONS = [
  { value: 'post', label: 'Post' },
  { value: 'story', label: 'Story' },
  { value: 'reel', label: 'Reel' },
  { value: 'video', label: 'Vidéo' },
  { value: 'banner', label: 'Bannière' },
  { value: 'article', label: 'Article' },
  { value: 'spot', label: 'Spot' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'other', label: 'Autre' },
];

export function useMediaChannels() {
  const { activeWorkspace } = useAuth();
  
  return useQuery({
    queryKey: ['media-channels', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      
      const { data, error } = await supabase
        .from('media_channels')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as MediaChannel[];
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useMediaPlanItems(campaignId?: string) {
  const { activeWorkspace } = useAuth();
  
  return useQuery({
    queryKey: ['media-plan-items', activeWorkspace?.id, campaignId],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      
      let query = supabase
        .from('media_plan_items')
        .select(`
          *,
          channel:media_channels(id, name, platform, color, channel_type)
        `)
        .eq('workspace_id', activeWorkspace.id)
        .order('publish_date', { ascending: true });
      
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as (MediaPlanItem & { channel: MediaChannel | null })[];
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useMediaPlanMutations() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  
  const createMediaPlanItem = useMutation({
    mutationFn: async (data: MediaPlanItemFormData) => {
      if (!activeWorkspace?.id) throw new Error('No workspace selected');
      
      const { data: item, error } = await supabase
        .from('media_plan_items')
        .insert({
          ...data,
          workspace_id: activeWorkspace.id,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-plan-items'] });
      toast.success('Élément ajouté au planning');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'ajout');
      console.error(error);
    },
  });
  
  const updateMediaPlanItem = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MediaPlanItemFormData> }) => {
      const { data: item, error } = await supabase
        .from('media_plan_items')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-plan-items'] });
      toast.success('Élément mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    },
  });
  
  const deleteMediaPlanItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('media_plan_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-plan-items'] });
      toast.success('Élément supprimé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    },
  });
  
  const createMediaChannel = useMutation({
    mutationFn: async (data: Omit<MediaChannel, 'id' | 'workspace_id' | 'created_at'>) => {
      if (!activeWorkspace?.id) throw new Error('No workspace selected');
      
      const { data: channel, error } = await supabase
        .from('media_channels')
        .insert({
          ...data,
          workspace_id: activeWorkspace.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-channels'] });
      toast.success('Canal ajouté');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'ajout du canal');
      console.error(error);
    },
  });
  
  return { createMediaPlanItem, updateMediaPlanItem, deleteMediaPlanItem, createMediaChannel };
}
