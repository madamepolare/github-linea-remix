import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import type { TenderDeliverable, TenderTeamMember } from "@/lib/tenderTypes";

export function useTenderDeliverables(tenderId: string | undefined, teamMembers: TenderTeamMember[] = []) {
  const queryClient = useQueryClient();
  const hasAutoLoaded = useRef(false);

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

  // Auto-load default deliverables (DC1 + DC2 per member) when deliverables are empty
  useEffect(() => {
    const loadDefaultDeliverables = async () => {
      if (
        !tenderId || 
        isLoading || 
        deliverables.length > 0 || 
        teamMembers.length === 0 ||
        hasAutoLoaded.current
      ) return;

      hasAutoLoaded.current = true;

      const toInsert: any[] = [];
      let sortOrder = 0;

      // DC1 - only for mandataire
      toInsert.push({
        tender_id: tenderId,
        deliverable_type: "dc1",
        name: "DC1 - Lettre de candidature",
        responsible_type: "mandataire",
        responsible_company_ids: [],
        sort_order: sortOrder++,
      });

      // DC2 - one per member of the groupement
      const companies = teamMembers
        .filter(m => m.company?.id)
        .reduce((acc, m) => {
          if (!acc.find(c => c.id === m.company?.id)) {
            acc.push({
              id: m.company!.id,
              name: m.company!.name,
            });
          }
          return acc;
        }, [] as { id: string; name: string }[]);

      for (const company of companies) {
        toInsert.push({
          tender_id: tenderId,
          deliverable_type: "dc2",
          name: `DC2 - ${company.name}`,
          responsible_type: "tous",
          responsible_company_ids: [company.id],
          sort_order: sortOrder++,
        });
      }

      if (toInsert.length > 0) {
        const { error } = await supabase
          .from("tender_deliverables")
          .insert(toInsert);

        if (error) {
          console.error("Error loading default deliverables:", error);
          return;
        }

        queryClient.invalidateQueries({ queryKey: ["tender-deliverables", tenderId] });
      }
    };

    loadDefaultDeliverables();
  }, [tenderId, isLoading, deliverables.length, teamMembers, queryClient]);

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
