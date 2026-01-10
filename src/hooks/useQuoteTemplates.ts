import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ProjectType, PhaseTemplate, PHASES_BY_PROJECT_TYPE } from '@/lib/commercialTypes';
import { Json } from '@/integrations/supabase/types';

export interface QuoteTemplatePhase {
  code: string;
  name: string;
  description: string;
  defaultPercentage: number;
  deliverables: string[];
  category: 'base' | 'complementary';
}

export interface QuoteTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  project_type: ProjectType;
  phases: QuoteTemplatePhase[];
  is_default: boolean;
  sort_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PricingGridItem {
  id: string;
  name: string;
  description?: string;
  unit: string;
  unit_price: number;
  category?: string;
  pricing_ref?: string;
}

export interface PricingGrid {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  grid_type: 'hourly' | 'daily' | 'm2' | 'fixed';
  items: PricingGridItem[];
  is_active: boolean;
  sort_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

const parsePhases = (data: Json): QuoteTemplatePhase[] => {
  if (!data || !Array.isArray(data)) return [];
  return data as unknown as QuoteTemplatePhase[];
};

const parsePricingItems = (data: Json): PricingGridItem[] => {
  if (!data || !Array.isArray(data)) return [];
  return data as unknown as PricingGridItem[];
};

export const useQuoteTemplates = (projectType?: ProjectType) => {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  // Quote Templates
  const templatesQuery = useQuery({
    queryKey: ['quote-templates', activeWorkspace?.id, projectType],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from('quote_templates')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('sort_order');

      if (projectType) {
        query = query.eq('project_type', projectType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        phases: parsePhases(t.phases)
      })) as QuoteTemplate[];
    },
    enabled: !!activeWorkspace?.id
  });

  const createTemplate = useMutation({
    mutationFn: async (input: Omit<QuoteTemplate, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('quote_templates')
        .insert({
          ...input,
          workspace_id: activeWorkspace.id,
          created_by: user?.id,
          phases: input.phases as unknown as Json
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-templates'] });
      toast.success('Template créé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création');
      console.error(error);
    }
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...input }: Partial<QuoteTemplate> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...input };
      if (input.phases) {
        updateData.phases = input.phases as unknown as Json;
      }
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('quote_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-templates'] });
      toast.success('Template mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quote_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-templates'] });
      toast.success('Template supprimé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  });

  const initializeDefaults = useMutation({
    mutationFn: async (type: ProjectType) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');

      // Check if defaults already exist
      const { data: existing } = await supabase
        .from('quote_templates')
        .select('id')
        .eq('workspace_id', activeWorkspace.id)
        .eq('project_type', type)
        .eq('is_default', true)
        .limit(1);

      if (existing && existing.length > 0) return;

      const { data: { user } } = await supabase.auth.getUser();
      const defaultPhases = PHASES_BY_PROJECT_TYPE[type];

      const { error } = await supabase
        .from('quote_templates')
        .insert({
          workspace_id: activeWorkspace.id,
          created_by: user?.id,
          name: `Mission complète ${type === 'interior' ? 'Intérieur' : type === 'architecture' ? 'Architecture' : 'Scénographie'}`,
          description: 'Template par défaut',
          project_type: type,
          is_default: true,
          phases: defaultPhases as unknown as Json
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-templates'] });
    }
  });

  // Pricing Grids
  const pricingGridsQuery = useQuery({
    queryKey: ['pricing-grids', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from('pricing_grids')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('sort_order');

      if (error) throw error;
      return (data || []).map(g => ({
        ...g,
        items: parsePricingItems(g.items)
      })) as PricingGrid[];
    },
    enabled: !!activeWorkspace?.id
  });

  const createPricingGrid = useMutation({
    mutationFn: async (input: Omit<PricingGrid, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('pricing_grids')
        .insert({
          ...input,
          workspace_id: activeWorkspace.id,
          created_by: user?.id,
          items: input.items as unknown as Json
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-grids'] });
      toast.success('Grille tarifaire créée');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création');
      console.error(error);
    }
  });

  const updatePricingGrid = useMutation({
    mutationFn: async ({ id, ...input }: Partial<PricingGrid> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...input };
      if (input.items) {
        updateData.items = input.items as unknown as Json;
      }
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('pricing_grids')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-grids'] });
      toast.success('Grille mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
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
      queryClient.invalidateQueries({ queryKey: ['pricing-grids'] });
      toast.success('Grille supprimée');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  });

  return {
    // Quote Templates
    templates: templatesQuery.data || [],
    isLoadingTemplates: templatesQuery.isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    initializeDefaults,
    // Pricing Grids
    pricingGrids: pricingGridsQuery.data || [],
    isLoadingPricingGrids: pricingGridsQuery.isLoading,
    createPricingGrid,
    updatePricingGrid,
    deletePricingGrid
  };
};
