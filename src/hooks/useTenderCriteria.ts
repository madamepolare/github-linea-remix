import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { TenderCriterion, CriterionType } from "@/lib/tenderTypes";

export function useTenderCriteria(tenderId: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: criteria = [], isLoading } = useQuery({
    queryKey: ["tender-criteria", tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tender_criteria")
        .select("*")
        .eq("tender_id", tenderId)
        .order("weight", { ascending: false });

      if (error) throw error;
      
      // Organize into hierarchy and map field names
      const mappedData = (data as any[]).map(c => ({
        ...c,
        name: c.criterion_name,
      }));
      const parentCriteria = mappedData.filter(c => !c.parent_criterion_id);
      const childCriteria = mappedData.filter(c => c.parent_criterion_id);
      
      return parentCriteria.map(parent => ({
        ...parent,
        sub_criteria: childCriteria.filter(c => c.parent_criterion_id === parent.id),
      })) as TenderCriterion[];
    },
    enabled: !!tenderId,
  });

  const addCriterion = useMutation({
    mutationFn: async (data: {
      name: string;
      weight: number;
      criterion_type: CriterionType;
      parent_criterion_id?: string;
    }) => {
      if (!profile?.active_workspace_id) throw new Error("No workspace");
      
      const { data: criterion, error } = await supabase
        .from("tender_criteria")
        .insert({
          tender_id: tenderId,
          workspace_id: profile.active_workspace_id,
          criterion_name: data.name,
          weight: data.weight,
          criterion_type: data.criterion_type,
          parent_criterion_id: data.parent_criterion_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return criterion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-criteria", tenderId] });
    },
    onError: (error) => {
      console.error("Error adding criterion:", error);
      toast.error("Erreur lors de l'ajout du critère");
    },
  });

  const updateCriterion = useMutation({
    mutationFn: async ({ id, name, ...updates }: { id: string; name?: string; weight?: number; criterion_type?: CriterionType }) => {
      const updateData: Record<string, any> = { ...updates };
      if (name !== undefined) updateData.criterion_name = name;
      
      const { data, error } = await supabase
        .from("tender_criteria")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-criteria", tenderId] });
    },
    onError: (error) => {
      console.error("Error updating criterion:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const deleteCriterion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tender_criteria")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-criteria", tenderId] });
      toast.success("Critère supprimé");
    },
    onError: (error) => {
      console.error("Error deleting criterion:", error);
      toast.error("Erreur lors de la suppression");
    },
  });

  const loadFromExtractedData = useMutation({
    mutationFn: async (extractedCriteria: Array<{ name: string; weight: number; type?: CriterionType; sub_criteria?: Array<{ name: string; weight: number }> }>) => {
      if (!profile?.active_workspace_id) throw new Error("No workspace");
      
      // Delete existing criteria first
      await supabase.from("tender_criteria").delete().eq("tender_id", tenderId);
      
      // Add new criteria
      for (const criterion of extractedCriteria) {
        const { data: parent, error: parentError } = await supabase
          .from("tender_criteria")
          .insert({
            tender_id: tenderId,
            workspace_id: profile.active_workspace_id,
            criterion_name: criterion.name,
            weight: criterion.weight,
            criterion_type: criterion.type || (criterion.name.toLowerCase().includes('prix') ? 'price' : 'technical'),
          } as any)
          .select()
          .single();

        if (parentError) throw parentError;

        // Add sub-criteria if any
        if (criterion.sub_criteria && parent) {
          for (const subCriterion of criterion.sub_criteria) {
            await supabase.from("tender_criteria").insert({
              tender_id: tenderId,
              workspace_id: profile.active_workspace_id,
              criterion_name: subCriterion.name,
              weight: subCriterion.weight,
              criterion_type: 'technical',
              parent_criterion_id: (parent as any).id,
            } as any);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-criteria", tenderId] });
      toast.success("Critères importés depuis l'analyse");
    },
    onError: (error) => {
      console.error("Error loading criteria from extracted data:", error);
      toast.error("Erreur lors de l'import des critères");
    },
  });

  // Calculate totals
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const priceWeight = criteria.filter(c => c.criterion_type === 'price').reduce((sum, c) => sum + c.weight, 0);
  const technicalWeight = criteria.filter(c => c.criterion_type === 'technical').reduce((sum, c) => sum + c.weight, 0);

  return {
    criteria,
    isLoading,
    addCriterion,
    updateCriterion,
    deleteCriterion,
    loadFromExtractedData,
    totalWeight,
    priceWeight,
    technicalWeight,
  };
}
