import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CompanyDepartment {
  id: string;
  company_id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  location: string | null;
  manager_contact_id: string | null;
  billing_contact_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentInput {
  company_id: string;
  name: string;
  description?: string;
  location?: string;
  manager_contact_id?: string;
  sort_order?: number;
}

export function useCompanyDepartments(companyId?: string) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["company-departments", companyId];

  const { data: departments, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from("company_departments")
        .select("*")
        .eq("company_id", companyId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as CompanyDepartment[];
    },
    enabled: !!companyId && !!activeWorkspace?.id,
  });

  const createDepartment = useMutation({
    mutationFn: async (input: CreateDepartmentInput) => {
      const { data, error } = await supabase
        .from("company_departments")
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
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Département créé" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const updateDepartment = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CompanyDepartment> & { id: string }) => {
      const { data, error } = await supabase
        .from("company_departments")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Département mis à jour" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const deleteDepartment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("company_departments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Département supprimé" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  return {
    departments: departments || [],
    isLoading,
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
