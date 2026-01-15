import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PipelineEntry {
  id: string;
  contact_id: string | null;
  company_id: string | null;
  pipeline_id: string;
  stage_id: string;
  entered_at: string | null;
  notes: string | null;
  pipeline?: {
    id: string;
    name: string;
    color: string | null;
  };
  stage?: {
    id: string;
    name: string;
    color: string | null;
    sort_order: number;
  };
}

export function useContactPipelineEntries(options?: {
  contactId?: string;
  companyId?: string;
}) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["contact-pipeline-entries", activeWorkspace?.id, options?.contactId, options?.companyId];

  const { data: entries = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("contact_pipeline_entries")
        .select(`
          *,
          pipeline:crm_pipelines(id, name, color),
          stage:crm_pipeline_stages(id, name, color, sort_order)
        `)
        .eq("workspace_id", activeWorkspace!.id);

      if (options?.contactId) {
        query = query.eq("contact_id", options.contactId);
      }
      if (options?.companyId) {
        query = query.eq("company_id", options.companyId);
      }

      const { data, error } = await query.order("entered_at", { ascending: false });
      if (error) throw error;
      return data as PipelineEntry[];
    },
    enabled: !!activeWorkspace?.id && (!!options?.contactId || !!options?.companyId),
  });

  // Fetch all entries for all contacts/companies (for list views)
  const { data: allEntries = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ["all-contact-pipeline-entries", activeWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .select(`
          *,
          pipeline:crm_pipelines(id, name, color),
          stage:crm_pipeline_stages(id, name, color, sort_order)
        `)
        .eq("workspace_id", activeWorkspace!.id)
        .order("entered_at", { ascending: false });

      if (error) throw error;
      return data as PipelineEntry[];
    },
    enabled: !!activeWorkspace?.id && !options?.contactId && !options?.companyId,
  });

  // Group entries by contact or company ID
  const entriesByContactId = (allEntries || []).reduce((acc, entry) => {
    if (entry.contact_id) {
      if (!acc[entry.contact_id]) acc[entry.contact_id] = [];
      acc[entry.contact_id].push(entry);
    }
    return acc;
  }, {} as Record<string, PipelineEntry[]>);

  const entriesByCompanyId = (allEntries || []).reduce((acc, entry) => {
    if (entry.company_id) {
      if (!acc[entry.company_id]) acc[entry.company_id] = [];
      acc[entry.company_id].push(entry);
    }
    return acc;
  }, {} as Record<string, PipelineEntry[]>);

  // Add to pipeline
  const addToPipeline = useMutation({
    mutationFn: async ({
      contactId,
      companyId,
      pipelineId,
      stageId,
      notes,
    }: {
      contactId?: string;
      companyId?: string;
      pipelineId: string;
      stageId: string;
      notes?: string;
    }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .insert({
          workspace_id: activeWorkspace.id,
          contact_id: contactId || null,
          company_id: companyId || null,
          pipeline_id: pipelineId,
          stage_id: stageId,
          notes: notes || null,
          entered_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-pipeline-entries"] });
      queryClient.invalidateQueries({ queryKey: ["all-contact-pipeline-entries"] });
      toast.success("Ajouté au pipeline");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout au pipeline");
      console.error(error);
    },
  });

  // Update stage
  const updateStage = useMutation({
    mutationFn: async ({
      entryId,
      stageId,
    }: {
      entryId: string;
      stageId: string;
    }) => {
      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .update({ stage_id: stageId })
        .eq("id", entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-pipeline-entries"] });
      queryClient.invalidateQueries({ queryKey: ["all-contact-pipeline-entries"] });
    },
  });

  // Remove from pipeline
  const removeFromPipeline = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from("contact_pipeline_entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-pipeline-entries"] });
      queryClient.invalidateQueries({ queryKey: ["all-contact-pipeline-entries"] });
      toast.success("Retiré du pipeline");
    },
  });

  return {
    entries,
    allEntries,
    entriesByContactId,
    entriesByCompanyId,
    isLoading: isLoading || isLoadingAll,
    addToPipeline,
    updateStage,
    removeFromPipeline,
  };
}
