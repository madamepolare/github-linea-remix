import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type LineCategory = 'service' | 'option' | 'expense' | 'discount';
export type BillingType = 'one_time' | 'recurring_monthly' | 'recurring_quarterly' | 'hourly' | 'daily';

export interface QuoteLineTemplate {
  id: string;
  workspace_id: string;
  contract_type_id?: string;
  name: string;
  description?: string;
  category: LineCategory;
  default_unit: string;
  default_unit_price?: number;
  default_quantity: number;
  billing_type: BillingType;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateQuoteLineTemplateInput {
  contract_type_id?: string;
  name: string;
  description?: string;
  category?: LineCategory;
  default_unit?: string;
  default_unit_price?: number;
  default_quantity?: number;
  billing_type?: BillingType;
  sort_order?: number;
}

export interface UpdateQuoteLineTemplateInput extends Partial<CreateQuoteLineTemplateInput> {
  id: string;
  is_active?: boolean;
}

export const LINE_CATEGORY_LABELS: Record<LineCategory, string> = {
  service: 'Service / Prestation',
  option: 'Option',
  expense: 'Frais',
  discount: 'Remise'
};

export const BILLING_TYPE_LABELS: Record<BillingType, string> = {
  one_time: 'Forfait unique',
  recurring_monthly: 'Mensuel',
  recurring_quarterly: 'Trimestriel',
  hourly: 'Horaire',
  daily: 'Journalier'
};

export const UNIT_OPTIONS = [
  { value: 'forfait', label: 'Forfait' },
  { value: 'h', label: 'Heure' },
  { value: 'jour', label: 'Jour' },
  { value: 'mois', label: 'Mois' },
  { value: 'm2', label: 'm²' },
  { value: 'u', label: 'Unité' },
  { value: '%', label: '%' }
];

export function useQuoteLineTemplates(contractTypeId?: string) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['quote-line-templates', activeWorkspace?.id, contractTypeId],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from('quote_line_templates')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('sort_order');

      if (contractTypeId) {
        query = query.or(`contract_type_id.eq.${contractTypeId},contract_type_id.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as QuoteLineTemplate[];
    },
    enabled: !!activeWorkspace?.id
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreateQuoteLineTemplateInput) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');

      const { data, error } = await supabase
        .from('quote_line_templates')
        .insert({
          ...input,
          workspace_id: activeWorkspace.id
        })
        .select()
        .single();

      if (error) throw error;
      return data as QuoteLineTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-line-templates'] });
      toast.success('Modèle de ligne créé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création');
      console.error(error);
    }
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...input }: UpdateQuoteLineTemplateInput) => {
      const { data, error } = await supabase
        .from('quote_line_templates')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as QuoteLineTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-line-templates'] });
      toast.success('Modèle mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quote_line_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-line-templates'] });
      toast.success('Modèle supprimé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  });

  return {
    templates: templatesQuery.data || [],
    activeTemplates: (templatesQuery.data || []).filter(t => t.is_active),
    isLoading: templatesQuery.isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate
  };
}
