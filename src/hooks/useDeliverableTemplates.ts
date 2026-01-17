import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type DeliverableType = 'plan' | '3d' | 'document' | 'presentation' | 'model' | 'other';

export interface DeliverableTemplate {
  id: string;
  workspace_id: string;
  phase_template_id: string;
  name: string;
  description: string | null;
  deliverable_type: DeliverableType;
  estimated_hours: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDeliverableTemplateInput {
  phase_template_id: string;
  name: string;
  description?: string;
  deliverable_type?: DeliverableType;
  estimated_hours?: number;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateDeliverableTemplateInput {
  id: string;
  name?: string;
  description?: string | null;
  deliverable_type?: DeliverableType;
  estimated_hours?: number;
  sort_order?: number;
  is_active?: boolean;
}

export function useDeliverableTemplates(phaseTemplateId?: string) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ["deliverable-templates", activeWorkspace?.id, phaseTemplateId],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from("deliverable_templates")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("sort_order", { ascending: true });

      if (phaseTemplateId) {
        query = query.eq("phase_template_id", phaseTemplateId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DeliverableTemplate[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreateDeliverableTemplateInput) => {
      if (!activeWorkspace?.id) throw new Error("No active workspace");

      const { data, error } = await supabase
        .from("deliverable_templates")
        .insert({
          workspace_id: activeWorkspace.id,
          phase_template_id: input.phase_template_id,
          name: input.name,
          description: input.description,
          deliverable_type: input.deliverable_type ?? 'document',
          estimated_hours: input.estimated_hours ?? 0,
          sort_order: input.sort_order ?? 0,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverable-templates"] });
      toast.success("Livrable créé");
    },
    onError: (error) => {
      console.error("Error creating deliverable template:", error);
      toast.error("Erreur lors de la création du livrable");
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async (input: UpdateDeliverableTemplateInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("deliverable_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverable-templates"] });
      toast.success("Livrable mis à jour");
    },
    onError: (error) => {
      console.error("Error updating deliverable template:", error);
      toast.error("Erreur lors de la mise à jour du livrable");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("deliverable_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverable-templates"] });
      toast.success("Livrable supprimé");
    },
    onError: (error) => {
      console.error("Error deleting deliverable template:", error);
      toast.error("Erreur lors de la suppression du livrable");
    },
  });

  const reorderTemplates = useMutation({
    mutationFn: async (templates: { id: string; sort_order: number }[]) => {
      const updates = templates.map(({ id, sort_order }) =>
        supabase
          .from("deliverable_templates")
          .update({ sort_order })
          .eq("id", id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverable-templates"] });
    },
    onError: (error) => {
      console.error("Error reordering deliverable templates:", error);
      toast.error("Erreur lors du réordonnancement");
    },
  });

  // Bulk create from phase template deliverables (migration helper)
  const createFromPhaseTemplate = useMutation({
    mutationFn: async ({ phaseTemplateId, deliverables }: { phaseTemplateId: string; deliverables: string[] }) => {
      if (!activeWorkspace?.id) throw new Error("No active workspace");
      if (!deliverables.length) return [];

      const toInsert = deliverables.map((name, index) => ({
        workspace_id: activeWorkspace.id,
        phase_template_id: phaseTemplateId,
        name,
        sort_order: index,
      }));

      const { data, error } = await supabase
        .from("deliverable_templates")
        .insert(toInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverable-templates"] });
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
    createFromPhaseTemplate,
  };
}

// Export constants for UI
export const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  plan: 'Plan',
  '3d': 'Vue 3D',
  document: 'Document',
  presentation: 'Présentation',
  model: 'Maquette',
  other: 'Autre',
};

export const DELIVERABLE_TYPE_ICONS: Record<DeliverableType, string> = {
  plan: 'FileImage',
  '3d': 'Box',
  document: 'FileText',
  presentation: 'Presentation',
  model: 'Cube',
  other: 'File',
};
