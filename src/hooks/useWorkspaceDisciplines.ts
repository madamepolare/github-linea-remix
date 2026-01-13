import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { type DisciplineSlug, getAvailableDisciplines } from "@/lib/tenderDisciplineConfig";

export interface WorkspaceDiscipline {
  id: string;
  workspace_id: string;
  discipline_slug: DisciplineSlug;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

const ALL_DISCIPLINES: DisciplineSlug[] = ['architecture', 'scenographie', 'communication'];

export function useWorkspaceDisciplines() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  // Fetch workspace disciplines
  const { data: disciplines, isLoading } = useQuery({
    queryKey: ['workspace-disciplines', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from('workspace_disciplines')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as WorkspaceDiscipline[];
    },
    enabled: !!activeWorkspace?.id,
  });

  // Get active disciplines (or all if none configured)
  const activeDisciplines: DisciplineSlug[] = disciplines && disciplines.length > 0
    ? disciplines.filter(d => d.is_active).map(d => d.discipline_slug as DisciplineSlug)
    : ALL_DISCIPLINES;

  // Get active discipline objects with full info
  const activeDisciplineConfigs = getAvailableDisciplines().filter(
    d => activeDisciplines.includes(d.slug)
  );

  // Check if a discipline is active
  const isDisciplineActive = (slug: DisciplineSlug): boolean => {
    if (!disciplines || disciplines.length === 0) return true; // Default: all active
    const config = disciplines.find(d => d.discipline_slug === slug);
    return config?.is_active ?? true;
  };

  // Toggle discipline active state
  const toggleDiscipline = useMutation({
    mutationFn: async ({ slug, isActive }: { slug: DisciplineSlug; isActive: boolean }) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');

      // Check if config exists
      const existing = disciplines?.find(d => d.discipline_slug === slug);

      if (existing) {
        const { error } = await supabase
          .from('workspace_disciplines')
          .update({ is_active: isActive })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Create all discipline configs if none exist
        const inserts = ALL_DISCIPLINES.map((s, idx) => ({
          workspace_id: activeWorkspace.id,
          discipline_slug: s,
          is_active: s === slug ? isActive : true,
          sort_order: idx,
        }));
        
        const { error } = await supabase
          .from('workspace_disciplines')
          .insert(inserts);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-disciplines'] });
      toast.success('Discipline mise à jour');
    },
    onError: (error) => {
      console.error('Failed to toggle discipline:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Initialize all disciplines for workspace
  const initializeDisciplines = useMutation({
    mutationFn: async () => {
      if (!activeWorkspace?.id) throw new Error('No workspace');

      const inserts = ALL_DISCIPLINES.map((slug, idx) => ({
        workspace_id: activeWorkspace.id,
        discipline_slug: slug,
        is_active: true,
        sort_order: idx,
      }));

      const { error } = await supabase
        .from('workspace_disciplines')
        .upsert(inserts, { onConflict: 'workspace_id,discipline_slug' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-disciplines'] });
    },
  });

  return {
    disciplines,
    activeDisciplines,
    activeDisciplineConfigs,
    isLoading,
    isDisciplineActive,
    toggleDiscipline,
    initializeDisciplines,
    hasConfigs: disciplines && disciplines.length > 0,
  };
}
