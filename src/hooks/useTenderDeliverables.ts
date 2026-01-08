import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TenderDeliverable } from "@/lib/tenderTypes";

export function useTenderDeliverables(tenderId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: deliverables = [], isLoading } = useQuery({
    queryKey: ["tender-deliverables", tenderId],
    queryFn: async () => {
      if (!tenderId) return [];
      
      const { data, error } = await supabase
        .from("tender_deliverables")
        .select("*")
        .eq("tender_id", tenderId)
        .order("sort_order");
      
      if (error) throw error;
      return data as TenderDeliverable[];
    },
    enabled: !!tenderId,
  });

  const addDeliverable = useMutation({
    mutationFn: async (deliverable: {
      deliverable_type: string;
      name: string;
      description?: string;
      responsible_type: string;
      responsible_company_ids?: string[];
      due_date?: string;
    }) => {
      if (!tenderId) throw new Error("No tender ID");

      const { data, error } = await supabase
        .from("tender_deliverables")
        .insert({
          tender_id: tenderId,
          deliverable_type: deliverable.deliverable_type,
          name: deliverable.name,
          description: deliverable.description || null,
          responsible_type: deliverable.responsible_type,
          responsible_company_ids: deliverable.responsible_company_ids || [],
          due_date: deliverable.due_date || null,
          sort_order: deliverables.length,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-deliverables", tenderId] });
      toast.success("Livrable ajouté");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    },
  });

  const updateDeliverable = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TenderDeliverable> & { id: string }) => {
      const { data, error } = await supabase
        .from("tender_deliverables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-deliverables", tenderId] });
    },
  });

  const toggleComplete = useMutation({
    mutationFn: async (deliverableId: string) => {
      const deliverable = deliverables.find(d => d.id === deliverableId);
      if (!deliverable) throw new Error("Deliverable not found");

      const { data, error } = await supabase
        .from("tender_deliverables")
        .update({ is_completed: !deliverable.is_completed })
        .eq("id", deliverableId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-deliverables", tenderId] });
    },
  });

  const toggleMemberComplete = useMutation({
    mutationFn: async ({ deliverableId, companyId, currentValue }: { 
      deliverableId: string; 
      companyId: string; 
      currentValue: boolean;
    }) => {
      const deliverable = deliverables.find(d => d.id === deliverableId);
      if (!deliverable) throw new Error("Deliverable not found");

      const currentCompletion = (deliverable.member_completion || {}) as Record<string, boolean>;
      const newCompletion = {
        ...currentCompletion,
        [companyId]: !currentValue,
      };

      const { data, error } = await supabase
        .from("tender_deliverables")
        .update({ member_completion: newCompletion } as any)
        .eq("id", deliverableId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-deliverables", tenderId] });
    },
  });

  const deleteDeliverable = useMutation({
    mutationFn: async (deliverableId: string) => {
      const { error } = await supabase
        .from("tender_deliverables")
        .delete()
        .eq("id", deliverableId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-deliverables", tenderId] });
      toast.success("Livrable supprimé");
    },
  });

  // Calculate progress
  const progress = deliverables.length > 0
    ? Math.round((deliverables.filter(d => d.is_completed).length / deliverables.length) * 100)
    : 0;

  return {
    deliverables,
    isLoading,
    progress,
    addDeliverable,
    updateDeliverable,
    toggleComplete,
    toggleMemberComplete,
    deleteDeliverable,
  };
}
