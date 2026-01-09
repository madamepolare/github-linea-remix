import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useEffect } from "react";
import { Contact } from "@/lib/crmTypes";

export type { Contact };

export interface CreateContactInput {
  name: string;
  first_name?: string;
  last_name?: string;
  gender?: 'male' | 'female' | 'other';
  crm_company_id?: string;
  email?: string;
  phone?: string;
  role?: string;
  contact_type?: string;
  location?: string;
  avatar_url?: string;
  notes?: string;
}

export function useContacts(options?: { 
  companyId?: string; 
  contactType?: string;
  search?: string;
}) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["contacts", activeWorkspace?.id];

  const { data: contacts, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          company:crm_companies(id, name, logo_url, industry)
        `)
        .eq("workspace_id", activeWorkspace!.id)
        .order("name");

      if (error) throw error;
      return data as (Contact & { company: { id: string; name: string; logo_url: string | null; industry: string | null } | null })[];
    },
    enabled: !!activeWorkspace?.id,
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!activeWorkspace?.id) return;

    const channel = supabase
      .channel("contacts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contacts",
          filter: `workspace_id=eq.${activeWorkspace.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkspace?.id, queryClient, queryKey]);

  // Apply filters
  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    let result = [...contacts];

    if (options?.companyId) {
      result = result.filter((c) => c.crm_company_id === options.companyId);
    }

    if (options?.contactType) {
      result = result.filter((c) => c.contact_type === options.contactType);
    }

    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.role?.toLowerCase().includes(searchLower) ||
          c.company?.name.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [contacts, options]);

  // Stats by contact type
  const statsByType = useMemo(() => {
    if (!contacts) return {};
    const stats: Record<string, number> = {
      all: contacts.length,
    };

    contacts.forEach((contact) => {
      const type = contact.contact_type || "other";
      stats[type] = (stats[type] || 0) + 1;
    });

    return stats;
  }, [contacts]);

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
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
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
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
      toast({ title: "Contact supprimé" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  return {
    contacts: filteredContacts,
    allContacts: contacts || [],
    isLoading,
    error,
    statsByType,
    createContact,
    updateContact,
    deleteContact,
  };
}
