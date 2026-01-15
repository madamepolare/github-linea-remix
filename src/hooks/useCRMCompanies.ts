import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useEffect } from "react";
import {
  CRMCompany,
  CRMCompanyEnriched,
  CompanyCategory,
  CompanyType,
  CRMFilters,
} from "@/lib/crmTypes";
import { useCRMSettings } from "@/hooks/useCRMSettings";

export type { CRMCompany, CRMCompanyEnriched };

export type CompanyStatus = 'lead' | 'confirmed';

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
  status?: CompanyStatus;
  // SIRET/SIREN fields
  siren?: string;
  siret?: string;
  code_naf?: string;
  forme_juridique?: string;
  vat_number?: string;
  capital_social?: number;
  rcs_city?: string;
}

export function useCRMCompanies(filters?: Partial<CRMFilters>) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getCompanyTypesForCategory, getCompanyTypeCategory } = useCRMSettings();

  const queryKey = ["crm-companies", activeWorkspace?.id];

  // Fetch companies with contacts and leads counts
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      // Fetch companies
      const { data: companies, error: companiesError } = await supabase
        .from("crm_companies")
        .select("*")
        .eq("workspace_id", activeWorkspace!.id)
        .order("name");

      if (companiesError) throw companiesError;

      // Fetch contacts grouped by company
      const { data: contacts, error: contactsError } = await supabase
        .from("contacts")
        .select("id, name, email, phone, crm_company_id")
        .eq("workspace_id", activeWorkspace!.id);

      if (contactsError) throw contactsError;

      // Fetch leads grouped by company
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("id, crm_company_id, estimated_value")
        .eq("workspace_id", activeWorkspace!.id);

      if (leadsError) throw leadsError;

      // Enrich companies with counts
      const enrichedCompanies: CRMCompanyEnriched[] = (companies || []).map((company) => {
        const companyContacts = contacts?.filter((c) => c.crm_company_id === company.id) || [];
        const companyLeads = leads?.filter((l) => l.crm_company_id === company.id) || [];
        const primaryContact = companyContacts[0] || null;

        return {
          ...company,
          contacts_count: companyContacts.length,
          leads_count: companyLeads.length,
          leads_value: companyLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0),
          primary_contact: primaryContact
            ? {
                id: primaryContact.id,
                name: primaryContact.name,
                email: primaryContact.email,
                phone: primaryContact.phone,
              }
            : null,
        };
      });

      return enrichedCompanies;
    },
    enabled: !!activeWorkspace?.id,
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!activeWorkspace?.id) return;

    const channel = supabase
      .channel("crm-companies-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "crm_companies",
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
  const filteredCompanies = useMemo(() => {
    if (!data) return [];
    let result = [...data];

    if (filters?.category && filters.category !== "all") {
      const allowedTypes = getCompanyTypesForCategory(filters.category).map((t) => t.key);
      result = result.filter((c) => {
        const industry = c.industry || "";
        // Support legacy BET subtypes (bet_structure, bet_fluides, etc.)
        if (allowedTypes.includes("bet") && industry.startsWith("bet_")) return true;
        return allowedTypes.includes(industry as CompanyType);
      });
    }

    if (filters?.companyType && filters.companyType !== "all") {
      result = result.filter((c) => c.industry === filters.companyType);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.city?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.primary_contact?.name.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.letterFilter) {
      result = result.filter((c) =>
        c.name.toUpperCase().startsWith(filters.letterFilter!)
      );
    }

    // Sorting
    const sortBy = filters?.sortBy || "name";
    const sortDir = filters?.sortDir || "asc";
    result.sort((a, b) => {
      let aVal: any = a[sortBy as keyof CRMCompanyEnriched];
      let bVal: any = b[sortBy as keyof CRMCompanyEnriched];
      
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, filters]);

  // Stats by category
  const statsByCategory = useMemo(() => {
    if (!data) return {};
    const stats: Record<CompanyCategory, number> = {
      all: data.length,
      client: 0,
      bet: 0,
      partenaire: 0,
      societe: 0,
      fournisseur: 0,
      conseil: 0,
      admin: 0,
      autre: 0,
    };

    data.forEach((company) => {
      const industry = company.industry || "";
      const category = (industry.startsWith("bet_")
        ? "bet"
        : (getCompanyTypeCategory(industry) as CompanyCategory) || "autre") as CompanyCategory;
      stats[category] = (stats[category] || 0) + 1;
    });

    return stats;
  }, [data]);

  // Stats by status
  const statsByStatus = useMemo(() => {
    if (!data) return { all: 0, lead: 0, confirmed: 0 };
    return {
      all: data.length,
      lead: data.filter(c => c.status === 'lead').length,
      confirmed: data.filter(c => c.status === 'confirmed' || !c.status).length,
    };
  }, [data]);

  // Derived lists
  const leadCompanies = useMemo(() => 
    (data || []).filter(c => c.status === 'lead'), [data]
  );
  
  const confirmedCompanies = useMemo(() => 
    (data || []).filter(c => c.status === 'confirmed' || !c.status), [data]
  );

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
    mutationFn: async ({ id, ...input }: Partial<CRMCompanyEnriched> & { id: string }) => {
      // Remove enriched fields that don't exist in the database
      const { contacts_count, leads_count, leads_value, primary_contact, ...dbFields } = input as any;
      
      const { data, error } = await supabase
        .from("crm_companies")
        .update(dbFields)
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

  // Confirm company mutation
  const confirmCompany = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("crm_companies")
        .update({ status: 'confirmed' as CompanyStatus })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
      toast({ title: "Entreprise confirmée" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  return {
    companies: filteredCompanies,
    allCompanies: data || [],
    leadCompanies,
    confirmedCompanies,
    isLoading,
    error,
    statsByCategory,
    statsByStatus,
    createCompany,
    updateCompany,
    deleteCompany,
    confirmCompany,
  };
}
