import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CRMCompany {
  id: string;
  workspace_id: string;
  name: string;
  industry: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  logo_url: string | null;
  notes: string | null;
  bet_specialties: string[] | null;
  billing_email: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  contacts_count?: number;
}

export interface CreateCompanyInput {
  name: string;
  industry?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  notes?: string;
  bet_specialties?: string[];
  billing_email?: string;
}

export function useCRMCompanies(options?: { industry?: string }) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["crm-companies", activeWorkspace?.id, options?.industry];

  const { data: companies, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("crm_companies")
        .select("*")
        .eq("workspace_id", activeWorkspace!.id)
        .order("name");

      if (options?.industry) {
        query = query.eq("industry", options.industry);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CRMCompany[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createCompany = useMutation({
    mutationFn: async (input: CreateCompanyInput) => {
      const { data, error } = await supabase
        .from("crm_companies")
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
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
      toast({ title: "Entreprise créée" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CRMCompany> & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_companies")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
      toast({ title: "Entreprise mise à jour" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
      toast({ title: "Entreprise supprimée" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  return {
    companies: companies || [],
    isLoading,
    error,
    createCompany,
    updateCompany,
    deleteCompany,
  };
}
