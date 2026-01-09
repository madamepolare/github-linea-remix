import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DisciplineSlug, 
  DisciplineConfig, 
  DisciplineTerminology,
  DISCIPLINE_CONFIGS,
  getDisciplineConfig,
  getTerminology,
} from "@/lib/disciplinesConfig";

export interface Discipline {
  id: string;
  slug: DisciplineSlug;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
}

export interface DisciplineModule {
  id: string;
  discipline_id: string;
  module_key: string;
  is_available: boolean;
  is_recommended: boolean;
  is_default_enabled: boolean;
  custom_name: string | null;
  custom_description: string | null;
  sort_order: number;
}

export function useDisciplines() {
  return useQuery({
    queryKey: ['disciplines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disciplines')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as Discipline[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useDisciplineModules(disciplineId: string | undefined) {
  return useQuery({
    queryKey: ['discipline-modules', disciplineId],
    queryFn: async () => {
      if (!disciplineId) return [];
      
      const { data, error } = await supabase
        .from('discipline_modules')
        .select('*')
        .eq('discipline_id', disciplineId)
        .order('sort_order');

      if (error) throw error;
      return data as DisciplineModule[];
    },
    enabled: !!disciplineId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useWorkspaceDiscipline() {
  const { activeWorkspace } = useAuth();
  
  return useQuery({
    queryKey: ['workspace-discipline', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return null;
      
      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          discipline_id,
          disciplines (
            id,
            slug,
            name,
            description,
            icon,
            color,
            is_active
          )
        `)
        .eq('id', activeWorkspace.id)
        .single();

      if (error) throw error;
      
      // Handle the case where disciplines might be null
      const disciplineData = data?.disciplines;
      if (!disciplineData || Array.isArray(disciplineData)) {
        return null;
      }
      
      return disciplineData as Discipline;
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDiscipline() {
  const { activeWorkspace } = useAuth();
  const { data: discipline, isLoading, error } = useWorkspaceDiscipline();
  const { data: modules } = useDisciplineModules(discipline?.id);
  
  // Default to architecture if no discipline set
  const disciplineSlug: DisciplineSlug = (discipline?.slug as DisciplineSlug) || 'architecture';
  const config = getDisciplineConfig(disciplineSlug);
  const terminology = getTerminology(disciplineSlug);
  
  // Get available module keys from DB or fallback to config
  const availableModuleKeys = modules
    ?.filter(m => m.is_available)
    .map(m => m.module_key) || config.availableModules;
  
  const recommendedModuleKeys = modules
    ?.filter(m => m.is_recommended)
    .map(m => m.module_key) || config.recommendedModules;
  
  return {
    // Raw discipline data from DB
    discipline,
    disciplineId: discipline?.id,
    
    // Discipline slug and config
    disciplineSlug,
    config,
    
    // Terminology helpers
    terminology,
    t: terminology, // Shorthand
    
    // Module availability
    availableModules: availableModuleKeys,
    recommendedModules: recommendedModuleKeys,
    
    // Helper methods
    isModuleAvailable: (moduleKey: string) => availableModuleKeys.includes(moduleKey),
    isModuleRecommended: (moduleKey: string) => recommendedModuleKeys.includes(moduleKey),
    
    // State
    isLoading,
    error,
    
    // Workspace info
    workspaceId: activeWorkspace?.id,
  };
}

// Hook for terminology context
export function useTerminology(): DisciplineTerminology {
  const { terminology } = useDiscipline();
  return terminology;
}

// Hook to get the full config
export function useDisciplineConfig(): DisciplineConfig {
  const { config } = useDiscipline();
  return config;
}
