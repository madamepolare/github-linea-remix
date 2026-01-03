import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useEffect } from "react";

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

  // Setup realtime subscription
  useEffect(() => {
    if (!activeWorkspace?.id) return;

    const channel = supabase
      .channel("leads-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `workspace_id=eq.${activeWorkspace.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkspace?.id, queryClient]);

  // Stats
  const stats = useMemo(() => {
    if (!leads) return { total: 0, totalValue: 0, weightedValue: 0, wonValue: 0, lostCount: 0 };

    const total = leads.length;
    const totalValue = leads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
    const weightedValue = leads.reduce((sum, l) => {
      const value = Number(l.estimated_value) || 0;
      const prob = (l.probability || 50) / 100;
      return sum + value * prob;
    }, 0);
    const wonValue = leads
      .filter((l) => l.status === "won" || l.won_at)
      .reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
    const lostCount = leads.filter((l) => l.status === "lost" || l.lost_at).length;

    return { total, totalValue, weightedValue, wonValue, lostCount };
  }, [leads]);

  // Group by status
  const leadsByStatus = useMemo(() => {
    if (!leads) return {};
    const grouped: Record<string, Lead[]> = {};
    leads.forEach((lead) => {
      const status = lead.status || "new";
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(lead);
    });
    return grouped;
  }, [leads]);

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
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
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
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previousLeads = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: Lead[] | undefined) =>
        old?.map((lead) => (lead.id === leadId ? { ...lead, stage_id: stageId } : lead))
      );

      return { previousLeads };
    },
    onError: (error: Error, _variables, context) => {
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
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
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
    stats,
    leadsByStatus,
    createLead,
    updateLead,
    updateLeadStage,
    deleteLead,
  };
}

export function usePipelines() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["pipelines-from-settings", activeWorkspace?.id];

  // Fetch pipelines from workspace_settings
  const { data: pipelineSettings, isLoading: loadingPipelines } = useQuery({
    queryKey: ["workspace-settings", activeWorkspace?.id, "pipelines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_settings")
        .select("*")
        .eq("workspace_id", activeWorkspace!.id)
        .eq("setting_type", "pipelines")
        .order("sort_order");

      if (error) throw error;
      return data;
    },
    enabled: !!activeWorkspace?.id,
  });

  // Fetch stages from workspace_settings
  const { data: stageSettings, isLoading: loadingStages } = useQuery({
    queryKey: ["workspace-settings", activeWorkspace?.id, "pipeline_stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_settings")
        .select("*")
        .eq("workspace_id", activeWorkspace!.id)
        .eq("setting_type", "pipeline_stages")
        .order("sort_order");

      if (error) throw error;
      return data;
    },
    enabled: !!activeWorkspace?.id,
  });

  // Helper to safely get setting value properties
  const getSettingValue = (setting: { setting_value: unknown }) => {
    const val = setting.setting_value;
    if (typeof val === 'object' && val !== null) {
      return val as Record<string, unknown>;
    }
    return {};
  };

  // Transform workspace_settings into Pipeline format
  const pipelines: Pipeline[] = useMemo(() => {
    if (!pipelineSettings) return [];

    return pipelineSettings.map((p, index) => {
      const pVal = getSettingValue(p);
      return {
        id: p.id,
        workspace_id: p.workspace_id,
        name: (pVal.label as string) || p.setting_key,
        description: (pVal.description as string) || null,
        color: (pVal.color as string) || null,
        is_default: index === 0,
        sort_order: p.sort_order,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString(),
        stages: (stageSettings || [])
          .filter((s) => {
            const sVal = getSettingValue(s);
            return sVal.pipeline_id === p.id;
          })
          .map((s) => {
            const sVal = getSettingValue(s);
            return {
              id: s.id,
              pipeline_id: p.id,
              name: (sVal.label as string) || s.setting_key,
              color: (sVal.color as string) || null,
              probability: (sVal.probability as number) || 0,
              sort_order: s.sort_order,
              created_at: s.created_at || new Date().toISOString(),
            };
          })
          .sort((a, b) => a.sort_order - b.sort_order),
      };
    });
  }, [pipelineSettings, stageSettings]);

  const createPipeline = useMutation({
    mutationFn: async (input: { name: string; description?: string; color?: string }) => {
      const { data, error } = await supabase
        .from("workspace_settings")
        .insert({
          workspace_id: activeWorkspace!.id,
          setting_type: "pipelines",
          setting_key: input.name.toLowerCase().replace(/\s+/g, "_"),
          setting_value: {
            label: input.name,
            description: input.description,
            color: input.color,
          },
          sort_order: pipelineSettings?.length || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-settings", activeWorkspace?.id] });
      toast({ title: "Pipeline créé" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const createDefaultPipeline = useMutation({
    mutationFn: async () => {
      // Create pipeline
      const { data: pipeline, error: pipelineError } = await supabase
        .from("workspace_settings")
        .insert({
          workspace_id: activeWorkspace!.id,
          setting_type: "pipelines",
          setting_key: "default",
          setting_value: {
            label: "Pipeline Commercial",
            color: "#3B82F6",
          },
          sort_order: 0,
        })
        .select()
        .single();

      if (pipelineError) throw pipelineError;

      // Create stages
      const stages = [
        { key: "new", label: "Nouveau", color: "#6b7280", probability: 10 },
        { key: "contacted", label: "Contacté", color: "#3b82f6", probability: 20 },
        { key: "meeting", label: "RDV planifié", color: "#8b5cf6", probability: 40 },
        { key: "proposal", label: "Proposition", color: "#ec4899", probability: 60 },
        { key: "negotiation", label: "Négociation", color: "#f97316", probability: 80 },
        { key: "won", label: "Gagné", color: "#22c55e", probability: 100 },
        { key: "lost", label: "Perdu", color: "#ef4444", probability: 0 },
      ];

      const { error: stagesError } = await supabase.from("workspace_settings").insert(
        stages.map((s, i) => ({
          workspace_id: activeWorkspace!.id,
          setting_type: "pipeline_stages",
          setting_key: s.key,
          setting_value: {
            label: s.label,
            color: s.color,
            probability: s.probability,
            pipeline_id: pipeline.id,
          },
          sort_order: i,
        }))
      );

      if (stagesError) throw stagesError;

      return pipeline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-settings", activeWorkspace?.id] });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  return {
    pipelines,
    isLoading: loadingPipelines || loadingStages,
    error: null,
    createPipeline,
    createDefaultPipeline,
  };
}
