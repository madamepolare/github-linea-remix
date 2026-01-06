import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ContactPipelineEntry {
  id: string;
  workspace_id: string;
  pipeline_id: string;
  stage_id: string;
  contact_id: string | null;
  company_id: string | null;
  entered_at: string | null;
  last_email_sent_at: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined data
  contact?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string | null;
    crm_company_id: string | null;
    crm_company?: {
      id: string;
      name: string;
    } | null;
  } | null;
  company?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    industry: string | null;
  } | null;
}

export interface ContactPipelineEmail {
  id: string;
  workspace_id: string;
  entry_id: string;
  stage_id: string;
  template_id: string | null;
  to_email: string;
  subject: string;
  body_html: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  status: string | null;
}

export function useContactPipelineEntries(pipelineId: string | undefined) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["contact-pipeline-entries", pipelineId, activeWorkspace?.id];

  const { data: entries, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!pipelineId || !activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .select(`
          *,
          contact:contacts(id, name, email, phone, role, crm_company_id, crm_company:crm_companies(id, name)),
          company:crm_companies(id, name, email, phone, industry)
        `)
        .eq("pipeline_id", pipelineId)
        .eq("workspace_id", activeWorkspace.id);

      if (error) throw error;
      return (data || []) as ContactPipelineEntry[];
    },
    enabled: !!pipelineId && !!activeWorkspace?.id,
  });

  const addEntry = useMutation({
    mutationFn: async (input: {
      pipeline_id: string;
      stage_id: string;
      contact_id?: string;
      company_id?: string;
      notes?: string;
    }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");
      if (!input.contact_id && !input.company_id) throw new Error("Contact ou entreprise requis");

      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .insert({
          workspace_id: activeWorkspace.id,
          pipeline_id: input.pipeline_id,
          stage_id: input.stage_id,
          contact_id: input.contact_id || null,
          company_id: input.company_id || null,
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Ajouté à la pipeline");
    },
    onError: (error: Error) => {
      if (error.message.includes("unique")) {
        toast.error("Ce contact/entreprise est déjà dans la pipeline");
      } else {
        toast.error("Erreur: " + error.message);
      }
    },
  });

  const addBulkEntries = useMutation({
    mutationFn: async (input: {
      pipeline_id: string;
      stage_id: string;
      contact_ids?: string[];
      company_ids?: string[];
    }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const entries = [
        ...(input.contact_ids || []).map(id => ({
          workspace_id: activeWorkspace.id,
          pipeline_id: input.pipeline_id,
          stage_id: input.stage_id,
          contact_id: id,
          company_id: null,
        })),
        ...(input.company_ids || []).map(id => ({
          workspace_id: activeWorkspace.id,
          pipeline_id: input.pipeline_id,
          stage_id: input.stage_id,
          contact_id: null,
          company_id: id,
        })),
      ];

      if (entries.length === 0) throw new Error("Aucune entrée à ajouter");

      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .upsert(entries, { onConflict: "pipeline_id,contact_id", ignoreDuplicates: true })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${data?.length || 0} entrées ajoutées`);
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const moveEntry = useMutation({
    mutationFn: async (input: { entry_id: string; stage_id: string }) => {
      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .update({ 
          stage_id: input.stage_id,
          entered_at: new Date().toISOString(),
        })
        .eq("id", input.entry_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateEntry = useMutation({
    mutationFn: async (input: { id: string; notes?: string; last_email_sent_at?: string }) => {
      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .update(input)
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_pipeline_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Retiré de la pipeline");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    entries: entries || [],
    isLoading,
    addEntry,
    addBulkEntries,
    moveEntry,
    updateEntry,
    deleteEntry,
  };
}

export function useContactPipelineEmails(entryId: string | undefined) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["contact-pipeline-emails", entryId];

  const { data: emails, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!entryId) return [];

      const { data, error } = await supabase
        .from("contact_pipeline_emails")
        .select("*")
        .eq("entry_id", entryId)
        .order("sent_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ContactPipelineEmail[];
    },
    enabled: !!entryId,
  });

  const createEmail = useMutation({
    mutationFn: async (input: {
      entry_id: string;
      stage_id: string;
      template_id?: string;
      to_email: string;
      subject: string;
      body_html: string;
    }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data, error } = await supabase
        .from("contact_pipeline_emails")
        .insert({
          workspace_id: activeWorkspace.id,
          entry_id: input.entry_id,
          stage_id: input.stage_id,
          template_id: input.template_id || null,
          to_email: input.to_email,
          subject: input.subject,
          body_html: input.body_html,
          status: "sent",
        })
        .select()
        .single();

      if (error) throw error;

      // Update entry's last_email_sent_at
      await supabase
        .from("contact_pipeline_entries")
        .update({ last_email_sent_at: new Date().toISOString() })
        .eq("id", input.entry_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["contact-pipeline-entries"] });
      toast.success("Email enregistré");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    emails: emails || [],
    isLoading,
    createEmail,
  };
}
