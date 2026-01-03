import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  color: string | null;
  probability: number | null;
  sort_order: number | null;
  created_at: string | null;
}

export interface Pipeline {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_default: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  stages?: PipelineStage[];
}

export function useCRMPipelines() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["crm-pipelines", activeWorkspace?.id];

  const { data: pipelines, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_pipelines")
        .select(`
          *,
          stages:crm_pipeline_stages(*)
        `)
        .eq("workspace_id", activeWorkspace!.id)
        .order("sort_order");

      if (error) throw error;

      return (data || []).map((p) => ({
        ...p,
        stages: (p.stages || []).sort(
          (a: PipelineStage, b: PipelineStage) =>
            (a.sort_order || 0) - (b.sort_order || 0)
        ),
      })) as Pipeline[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createPipeline = useMutation({
    mutationFn: async (input: { name: string; description?: string; color?: string }) => {
      const { data, error } = await supabase
        .from("crm_pipelines")
        .insert({
          workspace_id: activeWorkspace!.id,
          name: input.name,
          description: input.description,
          color: input.color,
          sort_order: pipelines?.length || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Pipeline créé" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const updatePipeline = useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; description?: string; color?: string }) => {
      const { data, error } = await supabase
        .from("crm_pipelines")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Pipeline mis à jour" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const deletePipeline = useMutation({
    mutationFn: async (id: string) => {
      // First delete all stages
      const { error: stagesError } = await supabase
        .from("crm_pipeline_stages")
        .delete()
        .eq("pipeline_id", id);

      if (stagesError) throw stagesError;

      const { error } = await supabase
        .from("crm_pipelines")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Pipeline supprimé" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const createDefaultPipeline = useMutation({
    mutationFn: async () => {
      const { data: pipeline, error: pipelineError } = await supabase
        .from("crm_pipelines")
        .insert({
          workspace_id: activeWorkspace!.id,
          name: "Pipeline Commercial",
          color: "#3B82F6",
          is_default: true,
          sort_order: 0,
        })
        .select()
        .single();

      if (pipelineError) throw pipelineError;

      const stages = [
        { name: "Nouveau", color: "#6b7280", probability: 10 },
        { name: "Contacté", color: "#3b82f6", probability: 20 },
        { name: "RDV planifié", color: "#8b5cf6", probability: 40 },
        { name: "Proposition", color: "#ec4899", probability: 60 },
        { name: "Négociation", color: "#f97316", probability: 80 },
        { name: "Gagné", color: "#22c55e", probability: 100 },
        { name: "Perdu", color: "#ef4444", probability: 0 },
      ];

      const { error: stagesError } = await supabase.from("crm_pipeline_stages").insert(
        stages.map((s, i) => ({
          pipeline_id: pipeline.id,
          name: s.name,
          color: s.color,
          probability: s.probability,
          sort_order: i,
        }))
      );

      if (stagesError) throw stagesError;

      return pipeline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  // Stage mutations
  const createStage = useMutation({
    mutationFn: async (input: { pipeline_id: string; name: string; color?: string; probability?: number }) => {
      const existingStages = pipelines?.find((p) => p.id === input.pipeline_id)?.stages || [];
      
      const { data, error } = await supabase
        .from("crm_pipeline_stages")
        .insert({
          pipeline_id: input.pipeline_id,
          name: input.name,
          color: input.color,
          probability: input.probability,
          sort_order: existingStages.length,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Étape créée" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; color?: string; probability?: number }) => {
      const { data, error } = await supabase
        .from("crm_pipeline_stages")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Étape mise à jour" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("crm_pipeline_stages")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Étape supprimée" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const reorderStages = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("crm_pipeline_stages")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  return {
    pipelines: pipelines || [],
    isLoading,
    error,
    createPipeline,
    updatePipeline,
    deletePipeline,
    createDefaultPipeline,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
  };
}
