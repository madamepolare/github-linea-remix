import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BillingProfile {
  id: string;
  workspace_id: string;
  contact_id: string | null;
  company_id: string | null;
  
  // Identification fiscale
  siret: string | null;
  siren: string | null;
  vat_number: string | null;
  code_naf: string | null;
  
  // Forme juridique
  legal_form: string | null;
  capital_social: number | null;
  rcs_city: string | null;
  
  // Adresse facturation
  billing_address: string | null;
  billing_postal_code: string | null;
  billing_city: string | null;
  billing_country: string | null;
  
  // Contact facturation
  billing_email: string | null;
  billing_phone: string | null;
  billing_name: string | null;
  
  // Coordonnées bancaires
  iban: string | null;
  bic: string | null;
  bank_name: string | null;
  
  // Conditions de paiement
  payment_terms: string | null;
  payment_method: string | null;
  
  // TVA
  vat_type: string | null;
  vat_rate: number | null;
  
  // Remises
  default_discount_percent: number | null;
  
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type CreateBillingProfileInput = Omit<BillingProfile, "id" | "created_at" | "updated_at">;
export type UpdateBillingProfileInput = Partial<BillingProfile> & { id: string };

export function useBillingProfiles(entityType?: "contact" | "company", entityId?: string) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["billing-profiles", activeWorkspace?.id, entityType, entityId],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from("billing_profiles")
        .select("*")
        .eq("workspace_id", activeWorkspace.id);

      if (entityType === "contact" && entityId) {
        query = query.eq("contact_id", entityId);
      } else if (entityType === "company" && entityId) {
        query = query.eq("company_id", entityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BillingProfile[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createProfile = useMutation({
    mutationFn: async (input: CreateBillingProfileInput) => {
      const { data, error } = await supabase
        .from("billing_profiles")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-profiles"] });
      toast.success("Profil facturation créé");
    },
    onError: () => {
      toast.error("Erreur lors de la création");
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (input: UpdateBillingProfileInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("billing_profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-profiles"] });
      toast.success("Profil facturation mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("billing_profiles")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-profiles"] });
      toast.success("Profil facturation supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  // Get profile for specific entity
  const getProfileForEntity = (type: "contact" | "company", id: string) => {
    return profiles.find((p) => 
      type === "contact" ? p.contact_id === id : p.company_id === id
    );
  };

  return {
    profiles,
    isLoading,
    createProfile,
    updateProfile,
    deleteProfile,
    getProfileForEntity,
  };
}
