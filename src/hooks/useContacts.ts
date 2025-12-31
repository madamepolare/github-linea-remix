import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Contact {
  id: string;
  workspace_id: string;
  crm_company_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  contact_type: string | null;
  avatar_url: string | null;
  location: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

export interface CreateContactInput {
  name: string;
  crm_company_id?: string;
  email?: string;
  phone?: string;
  role?: string;
  contact_type?: string;
  location?: string;
  notes?: string;
}

export function useContacts(options?: { companyId?: string; contactType?: string }) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["contacts", activeWorkspace?.id, options?.companyId, options?.contactType];

  const { data: contacts, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("contacts")
        .select(`
          *,
          company:crm_companies(id, name, logo_url)
        `)
        .eq("workspace_id", activeWorkspace!.id)
        .order("name");

      if (options?.companyId) {
        query = query.eq("crm_company_id", options.companyId);
      }
      if (options?.contactType) {
        query = query.eq("contact_type", options.contactType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createContact = useMutation({
    mutationFn: async (input: CreateContactInput) => {
      const { data, error } = await supabase
        .from("contacts")
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
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contact créé" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Contact> & { id: string }) => {
      const { data, error } = await supabase
        .from("contacts")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contact mis à jour" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contact supprimé" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  return {
    contacts: contacts || [],
    isLoading,
    error,
    createContact,
    updateContact,
    deleteContact,
  };
}
