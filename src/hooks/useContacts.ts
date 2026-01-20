import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useEffect, useState, useCallback } from "react";
import { Contact } from "@/lib/crmTypes";

export type { Contact };

export type ContactStatus = 'lead' | 'confirmed';

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
  status?: ContactStatus;
}

export interface UseContactsOptions {
  companyId?: string; 
  contactType?: string;
  search?: string;
  status?: ContactStatus | 'all';
  selectedTypes?: string[];
  pageSize?: number;
  letterFilter?: string;
}

export function useContacts(options?: UseContactsOptions) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const pageSize = options?.pageSize || 50;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [options?.search, options?.status, options?.contactType, options?.companyId, options?.letterFilter, JSON.stringify(options?.selectedTypes)]);

  // Build filters for the query
  const buildQuery = useCallback((countOnly = false) => {
    let query = countOnly 
      ? supabase.from("contacts").select("*", { count: "exact", head: true })
      : supabase.from("contacts").select(`*, company:crm_companies!contacts_crm_company_id_fkey(id, name, logo_url, industry, country, city)`);
    
    query = query.eq("workspace_id", activeWorkspace!.id);

    // Apply filters
    if (options?.companyId) {
      query = query.eq("crm_company_id", options.companyId);
    }

    if (options?.contactType) {
      query = query.eq("contact_type", options.contactType);
    }

    if (options?.selectedTypes && options.selectedTypes.length > 0) {
      query = query.in("contact_type", options.selectedTypes);
    }

    if (options?.status && options.status !== 'all') {
      query = query.eq("status", options.status);
    }

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,email.ilike.%${options.search}%,role.ilike.%${options.search}%`);
    }

    // Apply letter filter server-side
    if (options?.letterFilter) {
      query = query.ilike("name", `${options.letterFilter}%`);
    }

    return query;
  }, [activeWorkspace?.id, options?.companyId, options?.contactType, options?.selectedTypes, options?.status, options?.search, options?.letterFilter]);

  const queryKey = ["contacts", activeWorkspace?.id, page, pageSize, options?.search, options?.status, options?.contactType, options?.companyId, options?.letterFilter, JSON.stringify(options?.selectedTypes)];

  const { data: contacts, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await buildQuery()
        .order("name")
        .range(from, to);

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!activeWorkspace?.id,
  });

  // Count query for pagination
  const { data: totalCount = 0 } = useQuery({
    queryKey: ["contacts-count", activeWorkspace?.id, options?.search, options?.status, options?.contactType, options?.companyId, options?.letterFilter, JSON.stringify(options?.selectedTypes)],
    queryFn: async () => {
      const { count, error } = await buildQuery(true);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!activeWorkspace?.id,
  });

  // Fetch available letters for A-Z filter (across all filtered results, not just current page)
  const { data: availableLetters = [] } = useQuery({
    queryKey: ["contacts-available-letters", activeWorkspace?.id, options?.search, options?.status, options?.contactType, JSON.stringify(options?.selectedTypes)],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      
      // Build query without letter filter to get all matching contacts
      let query = supabase
        .from("contacts")
        .select("name")
        .eq("workspace_id", activeWorkspace.id);

      if (options?.companyId) {
        query = query.eq("crm_company_id", options.companyId);
      }
      if (options?.contactType) {
        query = query.eq("contact_type", options.contactType);
      }
      if (options?.selectedTypes && options.selectedTypes.length > 0) {
        query = query.in("contact_type", options.selectedTypes);
      }
      if (options?.status && options.status !== 'all') {
        query = query.eq("status", options.status);
      }
      if (options?.search) {
        query = query.or(`name.ilike.%${options.search}%,email.ilike.%${options.search}%,role.ilike.%${options.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const letters = new Set(data?.map(c => c.name?.[0]?.toUpperCase()).filter(Boolean));
      return Array.from(letters).sort();
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 60000,
  });

  // All contacts count (unfiltered) for stats
  const { data: allContactsCount = 0 } = useQuery({
    queryKey: ["contacts-all-count", activeWorkspace?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", activeWorkspace!.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!activeWorkspace?.id,
  });

  // Stats queries
  const { data: statsByStatus } = useQuery({
    queryKey: ["contacts-stats-status", activeWorkspace?.id],
    queryFn: async () => {
      const [allResult, leadResult, confirmedResult] = await Promise.all([
        supabase.from("contacts").select("*", { count: "exact", head: true }).eq("workspace_id", activeWorkspace!.id),
        supabase.from("contacts").select("*", { count: "exact", head: true }).eq("workspace_id", activeWorkspace!.id).eq("status", "lead"),
        supabase.from("contacts").select("*", { count: "exact", head: true }).eq("workspace_id", activeWorkspace!.id).eq("status", "confirmed"),
      ]);
      return {
        all: allResult.count || 0,
        lead: leadResult.count || 0,
        confirmed: confirmedResult.count || 0,
      };
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 30000,
  });

  const { data: statsByType } = useQuery({
    queryKey: ["contacts-stats-type", activeWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("contact_type")
        .eq("workspace_id", activeWorkspace!.id);
      if (error) throw error;
      
      const stats: Record<string, number> = { all: data?.length || 0 };
      data?.forEach((contact) => {
        const type = contact.contact_type || "other";
        stats[type] = (stats[type] || 0) + 1;
      });
      return stats;
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 30000,
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  // Pagination controls
  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (page < totalPages) setPage(p => p + 1);
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 1) setPage(p => p - 1);
  }, [page]);

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
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
          queryClient.invalidateQueries({ queryKey: ["contacts-count"] });
          queryClient.invalidateQueries({ queryKey: ["contacts-all-count"] });
          queryClient.invalidateQueries({ queryKey: ["contacts-stats-status"] });
          queryClient.invalidateQueries({ queryKey: ["contacts-stats-type"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkspace?.id, queryClient]);

  // Derived lists (from current page)
  const leadContacts = useMemo(() => 
    (contacts || []).filter(c => c.status === 'lead'), [contacts]
  );
  
  const confirmedContacts = useMemo(() => 
    (contacts || []).filter(c => c.status === 'confirmed'), [contacts]
  );

  // Confirm contact mutation
  const confirmContact = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("contacts")
        .update({ status: 'confirmed' as ContactStatus })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-stats-status"] });
      toast({ title: "Contact confirmé" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
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
    contacts: contacts || [],
    allContacts: contacts || [],
    allContactsCount,
    leadContacts,
    confirmedContacts,
    isLoading,
    error,
    statsByType: statsByType || {},
    statsByStatus: statsByStatus || { all: 0, lead: 0, confirmed: 0 },
    availableLetters,
    createContact,
    updateContact,
    deleteContact,
    confirmContact,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      goToPage,
      nextPage,
      prevPage,
    },
  };
}
