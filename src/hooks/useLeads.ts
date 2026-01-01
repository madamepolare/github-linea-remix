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
  sort_order: number;
  created_at: string;
}

export interface Pipeline {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  stages?: PipelineStage[];
}

export interface Lead {
  id: string;
  workspace_id: string;
  title: string;
  crm_company_id: string | null;
  contact_id: string | null;
  status: string;
  pipeline_id: string | null;
  stage_id: string | null;
  estimated_value: number | null;
  probability: number | null;
  source: string | null;
  description: string | null;
  next_action: string | null;
  next_action_date: string | null;
  assigned_to: string | null;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  contact?: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  stage?: PipelineStage | null;
}

export interface CreateLeadInput {
  title: string;
  crm_company_id?: string;
  contact_id?: string;
  pipeline_id?: string;
  stage_id?: string;
  estimated_value?: number;
  probability?: number;
  source?: string;
  description?: string;
  next_action?: string;
  next_action_date?: string;
  assigned_to?: string;
}

export function useLeads(options?: { pipelineId?: string; stageId?: string; status?: string }) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["leads", activeWorkspace?.id, options];

  const { data: leads, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select(`
          *,
          company:crm_companies(id, name, logo_url),
          contact:contacts(id, name, email),
          stage:crm_pipeline_stages(*)
        `)
        .eq("workspace_id", activeWorkspace!.id)
        .order("created_at", { ascending: false });

      if (options?.pipelineId) {
        query = query.eq("pipeline_id", options.pipelineId);
      }
      if (options?.stageId) {
        query = query.eq("stage_id", options.stageId);
      }
      if (options?.status) {
        query = query.eq("status", options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createLead = useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          workspace_id: activeWorkspace!.id,
          created_by: user!.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Opportunité créée" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const updateLeadStage = useMutation({
    mutationFn: async ({ leadId, stageId }: { leadId: string; stageId: string }) => {
      const { data, error } = await supabase
        .from("leads")
        .update({ stage_id: stageId })
        .eq("id", leadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ leadId, stageId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousLeads = queryClient.getQueryData(queryKey);

      // Optimistically update the cache
      queryClient.setQueryData(
        queryKey,
        (old: Lead[] | undefined) =>
          old?.map((lead) =>
            lead.id === leadId ? { ...lead, stage_id: stageId } : lead
          )
      );

      return { previousLeads };
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousLeads) {
        queryClient.setQueryData(queryKey, context.previousLeads);
      }
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Opportunité supprimée" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  return {
    leads: leads || [],
    isLoading,
    error,
    createLead,
    updateLead,
    updateLeadStage,
    deleteLead,
  };
}

export function usePipelines() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["pipelines", activeWorkspace?.id];

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

      // Sort stages within each pipeline
      return (data as Pipeline[]).map((p) => ({
        ...p,
        stages: p.stages?.sort((a, b) => a.sort_order - b.sort_order) || [],
      }));
    },
    enabled: !!activeWorkspace?.id,
  });

  const createPipeline = useMutation({
    mutationFn: async (input: { name: string; description?: string; color?: string }) => {
      const { data, error } = await supabase
        .from("crm_pipelines")
        .insert({
          workspace_id: activeWorkspace!.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      toast({ title: "Pipeline créé" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const createDefaultPipeline = useMutation({
    mutationFn: async () => {
      // Create the pipeline
      const { data: pipeline, error: pipelineError } = await supabase
        .from("crm_pipelines")
        .insert({
          workspace_id: activeWorkspace!.id,
          name: "Pipeline Commercial",
          is_default: true,
        })
        .select()
        .single();

      if (pipelineError) throw pipelineError;

      // Create default stages
      const stages = [
        { name: "Nouveau", color: "#6366f1", probability: 10, sort_order: 0 },
        { name: "Qualifié", color: "#8b5cf6", probability: 25, sort_order: 1 },
        { name: "Proposition", color: "#ec4899", probability: 50, sort_order: 2 },
        { name: "Négociation", color: "#f97316", probability: 75, sort_order: 3 },
        { name: "Gagné", color: "#22c55e", probability: 100, sort_order: 4 },
        { name: "Perdu", color: "#ef4444", probability: 0, sort_order: 5 },
      ];

      const { error: stagesError } = await supabase.from("crm_pipeline_stages").insert(
        stages.map((s) => ({ ...s, pipeline_id: pipeline.id }))
      );

      if (stagesError) throw stagesError;

      return pipeline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
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
    createDefaultPipeline,
  };
}
