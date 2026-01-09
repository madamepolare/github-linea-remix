import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Campaign {
  id: string;
  workspace_id: string;
  project_id: string | null;
  client_company_id: string | null;
  name: string;
  description: string | null;
  campaign_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  launch_date: string | null;
  budget_total: number | null;
  budget_spent: number | null;
  currency: string;
  objectives: string[];
  target_kpis: Record<string, number>;
  actual_kpis: Record<string, number>;
  brief_content: string | null;
  brief_attachments: unknown[];
  tags: string[];
  color: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignFormData {
  name: string;
  description?: string;
  campaign_type: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  launch_date?: string;
  budget_total?: number;
  objectives?: string[];
  target_kpis?: Record<string, number>;
  brief_content?: string;
  tags?: string[];
  color?: string;
  project_id?: string;
  client_company_id?: string;
}

export const CAMPAIGN_TYPES = [
  { value: 'digital', label: 'Digital', icon: 'Globe' },
  { value: 'print', label: 'Print', icon: 'Newspaper' },
  { value: 'tv', label: 'TV', icon: 'Tv' },
  { value: 'radio', label: 'Radio', icon: 'Radio' },
  { value: 'multi-channel', label: 'Multi-canal', icon: 'Layers' },
  { value: 'event', label: 'Événementiel', icon: 'Calendar' },
];

export const CAMPAIGN_STATUSES = [
  { value: 'draft', label: 'Brouillon', color: 'bg-muted' },
  { value: 'planning', label: 'Planification', color: 'bg-blue-500' },
  { value: 'production', label: 'Production', color: 'bg-amber-500' },
  { value: 'live', label: 'En cours', color: 'bg-green-500' },
  { value: 'completed', label: 'Terminée', color: 'bg-primary' },
  { value: 'archived', label: 'Archivée', color: 'bg-muted-foreground' },
];

export function useCampaigns() {
  const { activeWorkspace } = useAuth();
  
  return useQuery({
    queryKey: ['campaigns', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          project:projects(id, name),
          client:crm_companies(id, name)
        `)
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (Campaign & { project: { id: string; name: string } | null; client: { id: string; name: string } | null })[];
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useCampaign(id: string | undefined) {
  const { activeWorkspace } = useAuth();
  
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          project:projects(id, name),
          client:crm_companies(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Campaign & { project: { id: string; name: string } | null; client: { id: string; name: string } | null };
    },
    enabled: !!id && !!activeWorkspace?.id,
  });
}

export function useCampaignMutations() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  
  const createCampaign = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      if (!activeWorkspace?.id) throw new Error('No workspace selected');
      
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          ...data,
          workspace_id: activeWorkspace.id,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campagne créée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de la campagne');
      console.error(error);
    },
  });
  
  const updateCampaign = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CampaignFormData> }) => {
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return campaign;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] });
      toast.success('Campagne mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    },
  });
  
  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campagne supprimée');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    },
  });
  
  return { createCampaign, updateCampaign, deleteCampaign };
}
