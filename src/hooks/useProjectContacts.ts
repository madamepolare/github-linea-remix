import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProjectContact {
  id: string;
  project_id: string;
  contact_id: string;
  workspace_id: string;
  role: string;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contact?: {
    id: string;
    name: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    role: string | null;
    avatar_url: string | null;
    crm_company_id: string | null;
  };
}

export const CONTACT_ROLES = [
  { value: "operational", label: "Contact opérationnel" },
  { value: "billing", label: "Contact facturation" },
  { value: "decision_maker", label: "Décisionnaire" },
  { value: "technical", label: "Contact technique" },
  { value: "other", label: "Autre" },
];

export function useProjectContacts(projectId: string | null) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: contacts, isLoading, error } = useQuery({
    queryKey: ["project-contacts", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_contacts")
        .select(`
          *,
          contact:contact_id (
            id,
            name,
            first_name,
            last_name,
            email,
            phone,
            role,
            avatar_url,
            crm_company_id
          )
        `)
        .eq("project_id", projectId)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ProjectContact[];
    },
    enabled: !!projectId,
  });

  const addContact = useMutation({
    mutationFn: async ({ 
      contactId, 
      role = "operational", 
      isPrimary = false,
      notes = null 
    }: { 
      contactId: string; 
      role?: string; 
      isPrimary?: boolean;
      notes?: string | null;
    }) => {
      if (!projectId || !activeWorkspace?.id) {
        throw new Error("Missing project or workspace");
      }

      // If this is marked as primary, unset other primaries first
      if (isPrimary) {
        await supabase
          .from("project_contacts")
          .update({ is_primary: false })
          .eq("project_id", projectId);
      }

      const { data, error } = await supabase
        .from("project_contacts")
        .insert({
          project_id: projectId,
          contact_id: contactId,
          workspace_id: activeWorkspace.id,
          role,
          is_primary: isPrimary,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-contacts", projectId] });
      toast.success("Contact ajouté au projet");
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Ce contact est déjà associé au projet");
      } else {
        toast.error("Erreur lors de l'ajout du contact");
      }
      console.error(error);
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: { 
      id: string; 
      role?: string; 
      is_primary?: boolean;
      notes?: string | null;
    }) => {
      // If setting as primary, unset other primaries first
      if (updates.is_primary) {
        await supabase
          .from("project_contacts")
          .update({ is_primary: false })
          .eq("project_id", projectId!);
      }

      const { data, error } = await supabase
        .from("project_contacts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-contacts", projectId] });
      toast.success("Contact mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  const removeContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-contacts", projectId] });
      toast.success("Contact retiré du projet");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  const primaryContact = contacts?.find(c => c.is_primary);
  const operationalContacts = contacts?.filter(c => c.role === "operational") || [];
  const billingContacts = contacts?.filter(c => c.role === "billing") || [];

  return {
    contacts: contacts || [],
    primaryContact,
    operationalContacts,
    billingContacts,
    isLoading,
    error,
    addContact,
    updateContact,
    removeContact,
  };
}
