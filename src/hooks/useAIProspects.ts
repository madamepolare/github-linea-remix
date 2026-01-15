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

export interface ProspectContact {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  linkedin?: string;
}

export interface ProspectSearchResult {
  company_name: string;
  company_website?: string;
  company_address?: string;
  company_city?: string;
  company_postal_code?: string;
  company_phone?: string;
  company_email?: string;
  company_industry?: string;
  company_size?: string;
  contacts: ProspectContact[];
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

  // Search prospects using AI (supports multiple providers)
  const searchProspects = useMutation({
    mutationFn: async ({ 
      query, 
      region, 
      industry,
      provider = "openai" 
    }: { 
      query: string; 
      region?: string; 
      industry?: string;
      provider?: "firecrawl" | "openai";
    }) => {
      const functionName = provider === "openai" ? "openai-lead-search" : "ai-prospect-search";
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { query, region, industry, count: 10 },
      });

      if (error) throw error;
      
      // Normalize response format
      if (provider === "openai" && data.leads) {
        // Transform OpenAI response to match existing format
        const prospects: ProspectSearchResult[] = data.leads.map((lead: any) => ({
          company_name: lead.company_name,
          company_website: lead.company_website,
          company_address: lead.company_address,
          company_city: lead.company_city,
          company_postal_code: lead.company_postal_code,
          company_phone: lead.company_phone,
          company_email: lead.company_email,
          company_industry: lead.company_industry,
          contacts: lead.contact_name ? [{
            name: lead.contact_name,
            email: lead.contact_email,
            phone: lead.contact_phone,
            role: lead.contact_role,
          }] : [],
          source_url: lead.source_url,
          confidence_score: lead.confidence_score,
          notes: lead.notes,
        }));
        return { prospects, citations: [], count: prospects.length };
      }
      
      return data as { prospects: ProspectSearchResult[]; citations: string[]; count: number };
    },
  });

  // Save and convert prospects in one step (simplified workflow)
  const saveAndConvertProspects = useMutation({
    mutationFn: async ({ 
      prospects: prospectsToConvert, 
      sourceQuery,
      createLeads = true,
      pipelineId,
      stageId,
    }: { 
      prospects: Array<{
        company: ProspectSearchResult;
        selectedContacts: ProspectContact[];
      }>; 
      sourceQuery: string;
      createLeads?: boolean;
      pipelineId?: string;
      stageId?: string;
    }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const results: Array<{
        companyId: string;
        contactIds: string[];
        leadId?: string;
      }> = [];

      for (const { company, selectedContacts } of prospectsToConvert) {
        // 1. Create company with industry/category from AI
        const { data: createdCompany, error: companyError } = await supabase
          .from("crm_companies")
          .insert({
            workspace_id: activeWorkspace.id,
            name: company.company_name,
            website: company.company_website || null,
            address: company.company_address || null,
            city: company.company_city || null,
            postal_code: company.company_postal_code || null,
            phone: company.company_phone || null,
            email: company.company_email || null,
            industry: company.company_industry || null,
            status: "prospect",
            notes: company.notes ? `${company.notes}\n\nSource: ${sourceQuery}` : `Source: ${sourceQuery}`,
            created_by: user?.id,
          })
          .select()
          .single();

        if (companyError) {
          console.error("Company creation error:", companyError);
          throw companyError;
        }

        const contactIds: string[] = [];

        // 2. Create contacts
        for (const contact of selectedContacts) {
          const { data: createdContact, error: contactError } = await supabase
            .from("contacts")
            .insert({
              workspace_id: activeWorkspace.id,
              name: contact.name,
              email: contact.email || null,
              phone: contact.phone || null,
              role: contact.role || null,
              crm_company_id: createdCompany.id,
              contact_type: "prospect",
              status: createLeads ? "lead" : "confirmed",
              created_by: user?.id,
            })
            .select()
            .single();

          if (contactError) {
            console.error("Contact creation error:", contactError);
            continue; // Continue with other contacts
          }

          contactIds.push(createdContact.id);
        }

        let leadId: string | undefined;

        // 3. Create lead if requested
        if (createLeads) {
          const leadData: any = {
            workspace_id: activeWorkspace.id,
            title: `Opportunité - ${company.company_name}`,
            crm_company_id: createdCompany.id,
            contact_id: contactIds[0] || null, // Link to first contact
            source: "ai_prospection",
            status: "new",
            created_by: user?.id,
          };

          // Add pipeline and stage if provided
          if (pipelineId) {
            leadData.pipeline_id = pipelineId;
          }
          if (stageId) {
            leadData.stage_id = stageId;
          }

          const { data: createdLead, error: leadError } = await supabase
            .from("leads")
            .insert(leadData)
            .select()
            .single();

          if (leadError) {
            console.error("Lead creation error:", leadError);
          } else {
            leadId = createdLead.id;
          }
        }

        // 4. Save to ai_prospects for tracking
        await supabase.from("ai_prospects").insert({
          workspace_id: activeWorkspace.id,
          company_name: company.company_name,
          company_website: company.company_website || null,
          company_city: company.company_city || null,
          company_postal_code: company.company_postal_code || null,
          company_phone: company.company_phone || null,
          company_email: company.company_email || null,
          company_industry: company.company_industry || null,
          contact_name: selectedContacts[0]?.name || null,
          contact_email: selectedContacts[0]?.email || null,
          contact_phone: selectedContacts[0]?.phone || null,
          contact_role: selectedContacts[0]?.role || null,
          source_query: sourceQuery,
          source_url: company.source_url || null,
          confidence_score: company.confidence_score || null,
          status: "converted",
          converted_company_id: createdCompany.id,
          converted_contact_id: contactIds[0] || null,
          converted_lead_id: leadId || null,
          created_by: user?.id,
        });

        results.push({
          companyId: createdCompany.id,
          contactIds,
          leadId,
        });
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-prospects"] });
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => {
      console.error("Conversion error:", error);
      toast.error("Erreur lors de l'ajout au CRM");
    },
  });

  // Legacy: Save prospects to database - one row per contact
  const saveProspects = useMutation({
    mutationFn: async ({ prospects: newProspects, sourceQuery }: { prospects: ProspectSearchResult[]; sourceQuery: string }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const prospectsToInsert: Array<{
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
        status: "new";
        created_by: string | null;
      }> = [];

      for (const p of newProspects) {
        const baseProspect = {
          workspace_id: activeWorkspace.id,
          company_name: p.company_name,
          company_website: p.company_website || null,
          company_address: p.company_address || null,
          company_city: p.company_city || null,
          company_postal_code: p.company_postal_code || null,
          company_phone: p.company_phone || null,
          company_email: p.company_email || null,
          company_industry: p.company_industry || null,
          source_query: sourceQuery,
          source_url: p.source_url || null,
          confidence_score: p.confidence_score || null,
          notes: p.notes || null,
          status: "new" as const,
          created_by: user?.id || null,
        };

        if (p.contacts && p.contacts.length > 0) {
          for (const contact of p.contacts) {
            prospectsToInsert.push({
              ...baseProspect,
              contact_name: contact.name || null,
              contact_email: contact.email || null,
              contact_phone: contact.phone || null,
              contact_role: contact.role || null,
            });
          }
        } else {
          prospectsToInsert.push({
            ...baseProspect,
            contact_name: null,
            contact_email: null,
            contact_phone: null,
            contact_role: null,
          });
        }
      }

      const { data, error } = await supabase
        .from("ai_prospects")
        .insert(prospectsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ai-prospects"] });
      toast.success(`${data.length} prospect(s) enregistré(s)`);
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
    mutationFn: async ({ 
      prospect, 
      createLead = false,
      pipelineId,
      stageId,
    }: { 
      prospect: AIProspect; 
      createLead?: boolean;
      pipelineId?: string;
      stageId?: string;
    }) => {
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
        const leadData: any = {
          workspace_id: activeWorkspace.id,
          title: `Opportunité - ${prospect.company_name}`,
          crm_company_id: company.id,
          contact_id: contactId,
          source: "ai_prospection",
          status: "new",
          created_by: user?.id,
        };

        // Add pipeline and stage if provided
        if (pipelineId) {
          leadData.pipeline_id = pipelineId;
        }
        if (stageId) {
          leadData.stage_id = stageId;
        }

        const { data: lead, error: leadError } = await supabase
          .from("leads")
          .insert(leadData)
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
    saveAndConvertProspects,
    updateProspect,
    convertProspect,
    deleteProspect,
    rejectProspect,
  };
}
