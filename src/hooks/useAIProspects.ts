import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AIProspect {
  id: string;
  workspace_id: string;
  company_name: string;
  company_website: string | null;
  company_address: string | null;
  company_city: string | null;
  company_postal_code: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_industry: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_role: string | null;
  source_query: string;
  source_url: string | null;
  confidence_score: number | null;
  notes: string | null;
  status: "new" | "reviewed" | "converted" | "rejected";
  converted_company_id: string | null;
  converted_contact_id: string | null;
  converted_lead_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ProspectSearchResult {
  company_name: string;
  company_website?: string;
  company_address?: string;
  company_city?: string;
  company_phone?: string;
  company_email?: string;
  company_industry?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_role?: string;
  notes?: string;
  source_url?: string;
  confidence_score?: number;
}

export function useAIProspects() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all prospects
  const { data: prospects = [], isLoading, refetch } = useQuery({
    queryKey: ["ai-prospects", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("ai_prospects")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AIProspect[];
    },
    enabled: !!activeWorkspace?.id,
  });

  // Search prospects using AI
  const searchProspects = useMutation({
    mutationFn: async ({ query, region, industry }: { query: string; region?: string; industry?: string }) => {
      const { data, error } = await supabase.functions.invoke("ai-prospect-search", {
        body: { query, region, industry },
      });

      if (error) throw error;
      return data as { prospects: ProspectSearchResult[]; citations: string[]; count: number };
    },
  });

  // Save prospects to database
  const saveProspects = useMutation({
    mutationFn: async ({ prospects: newProspects, sourceQuery }: { prospects: ProspectSearchResult[]; sourceQuery: string }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const prospectsToInsert = newProspects.map((p) => ({
        workspace_id: activeWorkspace.id,
        company_name: p.company_name,
        company_website: p.company_website || null,
        company_address: p.company_address || null,
        company_city: p.company_city || null,
        company_phone: p.company_phone || null,
        company_email: p.company_email || null,
        company_industry: p.company_industry || null,
        contact_name: p.contact_name || null,
        contact_email: p.contact_email || null,
        contact_phone: p.contact_phone || null,
        contact_role: p.contact_role || null,
        source_query: sourceQuery,
        source_url: p.source_url || null,
        confidence_score: p.confidence_score || null,
        notes: p.notes || null,
        status: "new" as const,
        created_by: user?.id || null,
      }));

      const { data, error } = await supabase
        .from("ai_prospects")
        .insert(prospectsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-prospects"] });
      toast.success("Prospects enregistrés");
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  // Update prospect status
  const updateProspect = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AIProspect> & { id: string }) => {
      const { data, error } = await supabase
        .from("ai_prospects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-prospects"] });
    },
  });

  // Convert prospect to company + contact + lead
  const convertProspect = useMutation({
    mutationFn: async ({ prospect, createLead = false }: { prospect: AIProspect; createLead?: boolean }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      // 1. Create company
      const { data: company, error: companyError } = await supabase
        .from("crm_companies")
        .insert({
          workspace_id: activeWorkspace.id,
          name: prospect.company_name,
          website: prospect.company_website,
          address: prospect.company_address,
          city: prospect.company_city,
          phone: prospect.company_phone,
          email: prospect.company_email,
          industry: prospect.company_industry,
          notes: prospect.notes,
          created_by: user?.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      let contactId: string | null = null;
      let leadId: string | null = null;

      // 2. Create contact if we have contact info
      if (prospect.contact_name) {
        const { data: contact, error: contactError } = await supabase
          .from("contacts")
          .insert({
            workspace_id: activeWorkspace.id,
            name: prospect.contact_name,
            email: prospect.contact_email,
            phone: prospect.contact_phone,
            role: prospect.contact_role,
            crm_company_id: company.id,
            created_by: user?.id,
          })
          .select()
          .single();

        if (contactError) throw contactError;
        contactId = contact.id;
      }

      // 3. Create lead if requested
      if (createLead) {
        const { data: lead, error: leadError } = await supabase
          .from("leads")
          .insert({
            workspace_id: activeWorkspace.id,
            title: `Opportunité - ${prospect.company_name}`,
            crm_company_id: company.id,
            contact_id: contactId,
            source: "ai_prospection",
            status: "new",
            created_by: user?.id,
          })
          .select()
          .single();

        if (leadError) throw leadError;
        leadId = lead.id;
      }

      // 4. Update prospect status
      await supabase
        .from("ai_prospects")
        .update({
          status: "converted",
          converted_company_id: company.id,
          converted_contact_id: contactId,
          converted_lead_id: leadId,
        })
        .eq("id", prospect.id);

      return { company, contactId, leadId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-prospects"] });
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Prospect converti avec succès");
    },
    onError: (error) => {
      console.error("Convert error:", error);
      toast.error("Erreur lors de la conversion");
    },
  });

  // Delete prospect
  const deleteProspect = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ai_prospects")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-prospects"] });
      toast.success("Prospect supprimé");
    },
  });

  // Reject prospect
  const rejectProspect = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ai_prospects")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-prospects"] });
    },
  });

  return {
    prospects,
    isLoading,
    refetch,
    searchProspects,
    saveProspects,
    updateProspect,
    convertProspect,
    deleteProspect,
    rejectProspect,
  };
}
