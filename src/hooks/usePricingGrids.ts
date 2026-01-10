import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import { Json } from '@/integrations/supabase/types';

export interface PricingGridItem {
  skill_name: string;
  experience_level: 'junior' | 'confirmed' | 'senior' | 'expert';
  hourly_rate: number;
  daily_rate: number;
}

export interface PricingGrid {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  grid_type: string | null;
  items: Json[];
  discipline_id: string | null;
  skill_id: string | null;
  experience_level: string | null;
  hourly_rate: number | null;
  daily_rate: number | null;
  currency: string;
  contract_type_id: string | null;
  billing_type: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePricingGridInput {
  name: string;
  description?: string;
  grid_type?: string;
  items?: Json[];
  discipline_id?: string;
  skill_id?: string;
  experience_level?: string;
  hourly_rate?: number;
  daily_rate?: number;
  currency?: string;
  contract_type_id?: string;
  billing_type?: string;
  sort_order?: number;
}

export interface UpdatePricingGridInput extends Partial<CreatePricingGridInput> {
  id: string;
  is_active?: boolean;
}

export function usePricingGrids(disciplineId?: string) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const workspaceId = activeWorkspace?.id;

  const { data: pricingGrids = [], isLoading, error } = useQuery({
    queryKey: ['pricing_grids', workspaceId, disciplineId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      let query = supabase
        .from('pricing_grids')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order');

      if (disciplineId) {
        query = query.eq('discipline_id', disciplineId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []) as PricingGrid[];
    },
    enabled: !!workspaceId,
  });

  const createPricingGrid = useMutation({
    mutationFn: async (input: CreatePricingGridInput) => {
      if (!workspaceId) throw new Error('No active workspace');
      
      const { data, error } = await supabase
        .from('pricing_grids')
        .insert({
          ...input,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing_grids', workspaceId] });
      toast.success('Grille tarifaire créée');
    },
    onError: (error) => {
      console.error('Error creating pricing grid:', error);
      toast.error('Erreur lors de la création');
    },
  });

  const updatePricingGrid = useMutation({
    mutationFn: async ({ id, ...updates }: UpdatePricingGridInput) => {
      const { data, error } = await supabase
        .from('pricing_grids')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing_grids', workspaceId] });
      toast.success('Grille mise à jour');
    },
    onError: (error) => {
      console.error('Error updating pricing grid:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const deletePricingGrid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_grids')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing_grids', workspaceId] });
      toast.success('Grille supprimée');
    },
    onError: (error) => {
      console.error('Error deleting pricing grid:', error);
      toast.error('Erreur lors de la suppression');
    },
  });

  const activeGrids = pricingGrids.filter(g => g.is_active);

  return {
    pricingGrids,
    activeGrids,
    isLoading,
    error,
    createPricingGrid,
    updatePricingGrid,
    deletePricingGrid,
  };
}
