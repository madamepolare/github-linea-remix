import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tender, TenderStatus, PipelineStatus } from "@/lib/tenderTypes";

export function useTenders() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: tenders = [], isLoading } = useQuery({
    queryKey: ["tenders", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      
      const { data, error } = await supabase
        .from("tenders")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Tender[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createTender = useMutation({
    mutationFn: async (tender: {
      reference: string;
      title: string;
      description?: string | null;
      tender_type?: string;
      submission_type?: string;
      pipeline_status?: string;
      client_name?: string | null;
      client_type?: string | null;
      moa_company_id?: string | null;
      contracting_authority?: string | null;
      estimated_budget?: number | null;
      budget_disclosed?: boolean | null;
      location?: string | null;
      region?: string | null;
      procedure_type?: string | null;
      procedure_other?: string | null;
      submission_deadline?: string | null;
      site_visit_required?: boolean | null;
      site_visit_date?: string | null;
      site_visit_assigned_user_id?: string | null;
      dce_link?: string | null;
      source_platform?: string | null;
      source_url?: string | null;
      status?: string | null;
    }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");
      
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("tenders")
        .insert({
          reference: tender.reference,
          title: tender.title,
          description: tender.description ?? null,
          tender_type: tender.tender_type ?? 'architecture',
          submission_type: tender.submission_type ?? 'candidature_offre',
          pipeline_status: tender.pipeline_status ?? 'a_approuver',
          client_name: tender.client_name ?? null,
          client_type: tender.client_type ?? null,
          moa_company_id: tender.moa_company_id ?? null,
          contracting_authority: tender.contracting_authority ?? null,
          estimated_budget: tender.estimated_budget ?? null,
          budget_disclosed: tender.budget_disclosed ?? null,
          location: tender.location ?? null,
          region: tender.region ?? null,
          procedure_type: tender.procedure_type ?? null,
          procedure_other: tender.procedure_other ?? null,
          submission_deadline: tender.submission_deadline ?? null,
          site_visit_required: tender.site_visit_required ?? null,
          site_visit_date: tender.site_visit_date ?? null,
          site_visit_assigned_user_id: tender.site_visit_assigned_user_id ?? null,
          dce_link: tender.dce_link ?? null,
          source_platform: tender.source_platform ?? null,
          source_url: tender.source_url ?? null,
          status: tender.status ?? 'repere',
          workspace_id: activeWorkspace.id,
          created_by: user.user?.id ?? null,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
      toast.success("Appel d'offre créé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création de l'appel d'offre");
      console.error(error);
    },
  });

  const updateTender = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tender> & { id: string }) => {
      const { data, error } = await supabase
        .from("tenders")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Tender;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ["tender", id] });
      
      const previousTender = queryClient.getQueryData<Tender>(["tender", id]);
      
      if (previousTender) {
        queryClient.setQueryData<Tender>(["tender", id], {
          ...previousTender,
          ...updates,
        });
      }
      
      return { previousTender };
    },
    onError: (err, { id }, context) => {
      if (context?.previousTender) {
        queryClient.setQueryData(["tender", id], context.previousTender);
      }
      toast.error("Erreur lors de la mise à jour");
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(["tender", id], data);
      queryClient.invalidateQueries({ queryKey: ["tenders", activeWorkspace?.id] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: TenderStatus; notes?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const updates: Partial<Tender> = { status };
      
      if (status === 'go' || status === 'no_go') {
        updates.go_decision_date = new Date().toISOString();
        updates.go_decision_by = user.user?.id || null;
        if (notes) updates.go_decision_notes = notes;
      }
      
      const { data, error } = await supabase
        .from("tenders")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Tender;
    },
    onMutate: async ({ id, status, notes }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tender", id] });
      await queryClient.cancelQueries({ queryKey: ["tenders", activeWorkspace?.id] });
      
      // Snapshot current state
      const previousTender = queryClient.getQueryData<Tender>(["tender", id]);
      const previousTenders = queryClient.getQueryData<Tender[]>(["tenders", activeWorkspace?.id]);
      
      // Optimistically update single tender
      if (previousTender) {
        queryClient.setQueryData<Tender>(["tender", id], {
          ...previousTender,
          status,
          go_decision_notes: notes || previousTender.go_decision_notes,
          go_decision_date: new Date().toISOString(),
        });
      }
      
      // Optimistically update tenders list
      if (previousTenders) {
        queryClient.setQueryData<Tender[]>(
          ["tenders", activeWorkspace?.id],
          previousTenders.map(t => t.id === id ? {
            ...t,
            status,
            go_decision_notes: notes || t.go_decision_notes,
            go_decision_date: new Date().toISOString(),
          } : t)
        );
      }
      
      return { previousTender, previousTenders };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousTender) {
        queryClient.setQueryData(["tender", id], context.previousTender);
      }
      if (context?.previousTenders) {
        queryClient.setQueryData(["tenders", activeWorkspace?.id], context.previousTenders);
      }
      toast.error("Erreur lors de la mise à jour du statut");
    },
    onSuccess: (data, { id }) => {
      // Update with server data
      queryClient.setQueryData(["tender", id], data);
      queryClient.invalidateQueries({ queryKey: ["tenders", activeWorkspace?.id] });
      toast.success("Décision enregistrée");
    },
  });

  const deleteTender = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tenders")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
      toast.success("Concours supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  // Group tenders by pipeline status (new 3 columns)
  const tendersByPipeline = tenders.reduce((acc, tender) => {
    const status = tender.pipeline_status || 'a_approuver';
    if (!acc[status]) acc[status] = [];
    acc[status].push(tender);
    return acc;
  }, {} as Record<PipelineStatus, Tender[]>);

  // Group tenders by legacy status for backward compatibility
  const tendersByStatus = tenders.reduce((acc, tender) => {
    const status = tender.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(tender);
    return acc;
  }, {} as Record<TenderStatus, Tender[]>);

  // Stats
  const stats = {
    total: tenders.length,
    aApprouver: tenders.filter(t => t.pipeline_status === 'a_approuver' || !t.pipeline_status).length,
    enCours: tenders.filter(t => t.pipeline_status === 'en_cours').length,
    deposes: tenders.filter(t => t.pipeline_status === 'deposes').length,
    archives: tenders.filter(t => t.pipeline_status === 'archives').length,
    gagnes: tenders.filter(t => t.status === 'gagne').length,
    tauxReussite: tenders.filter(t => t.status === 'depose' || t.status === 'gagne' || t.status === 'perdu').length > 0
      ? Math.round((tenders.filter(t => t.status === 'gagne').length / tenders.filter(t => t.status === 'depose' || t.status === 'gagne' || t.status === 'perdu').length) * 100)
      : 0,
  };

  return {
    tenders,
    tendersByStatus,
    tendersByPipeline,
    stats,
    isLoading,
    createTender,
    updateTender,
    updateStatus,
    deleteTender,
  };
}

export function useTender(id: string | undefined) {
  return useQuery({
    queryKey: ["tender", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("tenders")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as Tender;
    },
    enabled: !!id,
  });
}
