import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TenderLotCriterion {
  id?: string;
  lot_id?: string;
  name: string;
  weight: number;
  type: "technical" | "financial";
  description?: string;
  sort_order?: number;
}

export interface TenderLot {
  id?: string;
  tender_id?: string;
  numero: number;
  intitule: string;
  domaine?: string;
  attribution_type: "mono" | "multi";
  nb_attributaires?: number;
  budget_min?: number;
  budget_max?: number;
  description?: string;
  sort_order?: number;
  workspace_id?: string;
  criteria?: TenderLotCriterion[];
}

export function useTenderLots(tenderId?: string) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: lots = [], isLoading } = useQuery({
    queryKey: ["tender-lots", tenderId],
    queryFn: async () => {
      if (!tenderId || !activeWorkspace) return [];
      
      const { data, error } = await supabase
        .from("tender_lots")
        .select(`
          *,
          criteria:tender_lot_criteria(*)
        `)
        .eq("tender_id", tenderId)
        .eq("workspace_id", activeWorkspace.id)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as (TenderLot & { criteria: TenderLotCriterion[] })[];
    },
    enabled: !!tenderId && !!activeWorkspace,
  });

  const createLot = useMutation({
    mutationFn: async (lot: Omit<TenderLot, "id" | "workspace_id">) => {
      if (!activeWorkspace) throw new Error("No active workspace");
      
      const { data, error } = await supabase
        .from("tender_lots")
        .insert([{
          tender_id: lot.tender_id,
          numero: lot.numero,
          intitule: lot.intitule,
          domaine: lot.domaine,
          attribution_type: lot.attribution_type,
          nb_attributaires: lot.nb_attributaires,
          budget_min: lot.budget_min,
          budget_max: lot.budget_max,
          description: lot.description,
          sort_order: lot.sort_order,
          workspace_id: activeWorkspace.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-lots", tenderId] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du lot");
      console.error(error);
    },
  });

  const updateLot = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TenderLot> & { id: string }) => {
      const { data, error } = await supabase
        .from("tender_lots")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-lots", tenderId] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour du lot");
      console.error(error);
    },
  });

  const deleteLot = useMutation({
    mutationFn: async (lotId: string) => {
      const { error } = await supabase
        .from("tender_lots")
        .delete()
        .eq("id", lotId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-lots", tenderId] });
      toast.success("Lot supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression du lot");
      console.error(error);
    },
  });

  const createCriterion = useMutation({
    mutationFn: async (criterion: Omit<TenderLotCriterion, "id">) => {
      const { data, error } = await supabase
        .from("tender_lot_criteria")
        .insert([{
          lot_id: criterion.lot_id,
          name: criterion.name,
          weight: criterion.weight,
          type: criterion.type,
          description: criterion.description,
          sort_order: criterion.sort_order,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-lots", tenderId] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du critère");
      console.error(error);
    },
  });

  const updateCriterion = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TenderLotCriterion> & { id: string }) => {
      const { data, error } = await supabase
        .from("tender_lot_criteria")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-lots", tenderId] });
    },
  });

  const deleteCriterion = useMutation({
    mutationFn: async (criterionId: string) => {
      const { error } = await supabase
        .from("tender_lot_criteria")
        .delete()
        .eq("id", criterionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-lots", tenderId] });
    },
  });

  // Bulk create lots with criteria (for initial creation)
  const createLotsWithCriteria = useMutation({
    mutationFn: async ({ 
      tenderId, 
      lots: lotsData 
    }: { 
      tenderId: string; 
      lots: TenderLot[] 
    }) => {
      if (!activeWorkspace) throw new Error("No active workspace");

      for (const lot of lotsData) {
        const { criteria, ...lotData } = lot;
        
        // Create lot
        const { data: createdLot, error: lotError } = await supabase
          .from("tender_lots")
          .insert({
            ...lotData,
            tender_id: tenderId,
            workspace_id: activeWorkspace.id,
          })
          .select()
          .single();

        if (lotError) throw lotError;

        // Create criteria for this lot
        if (criteria && criteria.length > 0) {
          const criteriaWithLotId = criteria.map(c => ({
            ...c,
            lot_id: createdLot.id,
          }));

          const { error: criteriaError } = await supabase
            .from("tender_lot_criteria")
            .insert(criteriaWithLotId);

          if (criteriaError) throw criteriaError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-lots"] });
      toast.success("Lots créés avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création des lots");
      console.error(error);
    },
  });

  return {
    lots,
    isLoading,
    createLot,
    updateLot,
    deleteLot,
    createCriterion,
    updateCriterion,
    deleteCriterion,
    createLotsWithCriteria,
  };
}
