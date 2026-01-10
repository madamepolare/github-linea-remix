import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface QuoteTheme {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  
  // Colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  header_bg_color?: string;
  
  // Typography
  heading_font: string;
  body_font: string;
  heading_size: string;
  body_size: string;
  
  // Layout
  header_style: 'classic' | 'modern' | 'minimal' | 'centered';
  show_logo: boolean;
  logo_position: 'left' | 'center' | 'right';
  logo_size: 'small' | 'medium' | 'large';
  
  // Table styling
  table_header_bg: string;
  table_border_style: 'solid' | 'dashed' | 'none';
  table_stripe_rows: boolean;
  
  // Footer
  footer_style: 'simple' | 'detailed' | 'minimal';
  show_signature_area: boolean;
  
  // AI
  reference_image_url?: string;
  ai_generated_css?: string;
  
  // Meta
  is_default: boolean;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export type QuoteThemeInput = Omit<QuoteTheme, 'id' | 'workspace_id' | 'created_at' | 'updated_at' | 'created_by'>;

export function useQuoteThemes() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const themesQuery = useQuery({
    queryKey: ['quote-themes', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      
      const { data, error } = await supabase
        .from('quote_themes')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as QuoteTheme[];
    },
    enabled: !!activeWorkspace?.id
  });

  const createTheme = useMutation({
    mutationFn: async (theme: QuoteThemeInput) => {
      if (!activeWorkspace?.id) throw new Error('No workspace selected');

      const { data, error } = await supabase
        .from('quote_themes')
        .insert({
          ...theme,
          workspace_id: activeWorkspace.id
        })
        .select()
        .single();

      if (error) throw error;
      return data as QuoteTheme;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-themes'] });
      toast.success('Thème créé avec succès');
    },
    onError: (error) => {
      console.error('Error creating theme:', error);
      toast.error('Erreur lors de la création du thème');
    }
  });

  const updateTheme = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuoteTheme> & { id: string }) => {
      const { data, error } = await supabase
        .from('quote_themes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as QuoteTheme;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-themes'] });
      toast.success('Thème mis à jour');
    },
    onError: (error) => {
      console.error('Error updating theme:', error);
      toast.error('Erreur lors de la mise à jour du thème');
    }
  });

  const deleteTheme = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quote_themes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-themes'] });
      toast.success('Thème supprimé');
    },
    onError: (error) => {
      console.error('Error deleting theme:', error);
      toast.error('Erreur lors de la suppression du thème');
    }
  });

  const setDefaultTheme = useMutation({
    mutationFn: async (themeId: string) => {
      if (!activeWorkspace?.id) throw new Error('No workspace selected');

      // First, unset all defaults
      await supabase
        .from('quote_themes')
        .update({ is_default: false })
        .eq('workspace_id', activeWorkspace.id);

      // Then set the new default
      const { data, error } = await supabase
        .from('quote_themes')
        .update({ is_default: true })
        .eq('id', themeId)
        .select()
        .single();

      if (error) throw error;
      return data as QuoteTheme;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-themes'] });
      toast.success('Thème défini par défaut');
    }
  });

  return {
    themes: themesQuery.data || [],
    isLoading: themesQuery.isLoading,
    createTheme,
    updateTheme,
    deleteTheme,
    setDefaultTheme
  };
}
