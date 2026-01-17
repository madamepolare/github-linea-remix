import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PhaseCategory } from "@/lib/commercialTypes";

export interface PhaseTemplate {
  id: string;
  workspace_id: string;
  project_type: string;
  code: string;
  name: string;
  description: string | null;
  default_percentage: number;
  deliverables: string[];
  color: string | null;
  sort_order: number;
  is_active: boolean;
  category: PhaseCategory;
  created_at: string;
  updated_at: string;
}

export interface CreatePhaseTemplateInput {
  project_type: string;
  code: string;
  name: string;
  description?: string;
  default_percentage?: number;
  deliverables?: string[];
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  category?: PhaseCategory;
}

export interface UpdatePhaseTemplateInput {
  id: string;
  code?: string;
  name?: string;
  description?: string | null;
  default_percentage?: number;
  deliverables?: string[];
  color?: string | null;
  sort_order?: number;
  is_active?: boolean;
  category?: PhaseCategory;
}

export function usePhaseTemplates(projectType?: string) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ["phase-templates", activeWorkspace?.id, projectType],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from("phase_templates")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("sort_order", { ascending: true });

      if (projectType) {
        query = query.eq("project_type", projectType);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        deliverables: Array.isArray(item.deliverables) ? item.deliverables : [],
        category: (item.category as PhaseCategory) || 'base'
      })) as PhaseTemplate[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreatePhaseTemplateInput) => {
      if (!activeWorkspace?.id) throw new Error("No active workspace");

      const { data, error } = await supabase
        .from("phase_templates")
        .insert({
          workspace_id: activeWorkspace.id,
          project_type: input.project_type,
          code: input.code,
          name: input.name,
          description: input.description,
          default_percentage: input.default_percentage ?? 0,
          deliverables: input.deliverables ?? [],
          color: input.color,
          sort_order: input.sort_order ?? 0,
          is_active: input.is_active ?? true,
          category: input.category ?? 'base',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-templates"] });
      toast.success("Phase créée");
    },
    onError: (error) => {
      console.error("Error creating phase template:", error);
      toast.error("Erreur lors de la création de la phase");
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async (input: UpdatePhaseTemplateInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("phase_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-templates"] });
      toast.success("Phase mise à jour");
    },
    onError: (error) => {
      console.error("Error updating phase template:", error);
      toast.error("Erreur lors de la mise à jour de la phase");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("phase_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-templates"] });
      toast.success("Phase supprimée");
    },
    onError: (error) => {
      console.error("Error deleting phase template:", error);
      toast.error("Erreur lors de la suppression de la phase");
    },
  });

  const reorderTemplates = useMutation({
    mutationFn: async (templates: { id: string; sort_order: number }[]) => {
      const updates = templates.map(({ id, sort_order }) =>
        supabase
          .from("phase_templates")
          .update({ sort_order })
          .eq("id", id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-templates"] });
    },
    onError: (error) => {
      console.error("Error reordering phase templates:", error);
      toast.error("Erreur lors du réordonnancement");
    },
  });

  // Generate phases using AI based on project type and discipline
  const generateWithAI = useMutation({
    mutationFn: async ({ projectType, discipline, customPrompt }: { 
      projectType: string; 
      discipline?: string; 
      customPrompt?: string 
    }) => {
      if (!activeWorkspace?.id) throw new Error("No active workspace");

      // Call AI edge function to generate phases
      const { data, error } = await supabase.functions.invoke('generate-phase-templates', {
        body: { projectType, discipline, customPrompt }
      });

      if (error) throw error;
      if (!data?.phases) throw new Error("No phases generated");

      // Insert generated phases
      const phasesToInsert = data.phases.map((phase: any, index: number) => ({
        workspace_id: activeWorkspace.id,
        project_type: projectType,
        code: phase.code,
        name: phase.name,
        description: phase.description,
        default_percentage: phase.defaultPercentage || 0,
        deliverables: phase.deliverables || [],
        sort_order: index,
        is_active: true,
        category: phase.category || 'base',
      }));

      const { error: insertError } = await supabase
        .from("phase_templates")
        .insert(phasesToInsert);

      if (insertError) throw insertError;

      return phasesToInsert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-templates"] });
      toast.success("Phases générées avec l'IA");
    },
    onError: (error) => {
      console.error("Error generating phases with AI:", error);
      toast.error("Erreur lors de la génération des phases");
    },
  });

  // Reset and regenerate using AI
  const resetToDefaults = useMutation({
    mutationFn: async (projectType: string) => {
      if (!activeWorkspace?.id) throw new Error("No active workspace");

      // Delete existing templates for this project type
      await supabase
        .from("phase_templates")
        .delete()
        .eq("workspace_id", activeWorkspace.id)
        .eq("project_type", projectType);

      // Generate new ones with AI
      const { data, error } = await supabase.functions.invoke('generate-phase-templates', {
        body: { projectType }
      });

      if (error) throw error;
      if (!data?.phases || data.phases.length === 0) {
        throw new Error("Aucune phase générée");
      }

      // Insert generated phases
      const phasesToInsert = data.phases.map((phase: any, index: number) => ({
        workspace_id: activeWorkspace.id,
        project_type: projectType,
        code: phase.code,
        name: phase.name,
        description: phase.description,
        default_percentage: phase.defaultPercentage || 0,
        deliverables: phase.deliverables || [],
        sort_order: index,
        is_active: true,
        category: phase.category || 'base',
      }));

      const { error: insertError } = await supabase
        .from("phase_templates")
        .insert(phasesToInsert);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-templates"] });
      toast.success("Phases réinitialisées avec l'IA");
    },
    onError: (error) => {
      console.error("Error resetting phase templates:", error);
      toast.error("Erreur lors de la réinitialisation");
    },
  });

  // Initialize defaults if empty using AI
  const initializeDefaultsIfEmpty = useMutation({
    mutationFn: async (projectType: string) => {
      if (!activeWorkspace?.id) throw new Error("No active workspace");

      // Check if templates exist for this project type
      const { data: existing } = await supabase
        .from("phase_templates")
        .select("id")
        .eq("workspace_id", activeWorkspace.id)
        .eq("project_type", projectType)
        .limit(1);

      if (existing && existing.length > 0) {
        return; // Templates already exist
      }

      // Generate with AI
      const { data, error } = await supabase.functions.invoke('generate-phase-templates', {
        body: { projectType }
      });

      if (error) {
        console.error("AI generation failed:", error);
        return; // Fail silently - user can manually add phases
      }

      if (!data?.phases || data.phases.length === 0) {
        return; // No phases to insert
      }

      const phasesToInsert = data.phases.map((phase: any, index: number) => ({
        workspace_id: activeWorkspace.id,
        project_type: projectType,
        code: phase.code,
        name: phase.name,
        description: phase.description,
        default_percentage: phase.defaultPercentage || 0,
        deliverables: phase.deliverables || [],
        sort_order: index,
        is_active: true,
        category: phase.category || 'base',
      }));

      const { error: insertError } = await supabase
        .from("phase_templates")
        .insert(phasesToInsert);

      if (insertError) {
        console.error("Error inserting generated phases:", insertError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-templates"] });
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    reorderTemplates,
    generateWithAI,
    resetToDefaults,
    initializeDefaultsIfEmpty,
  };
}
