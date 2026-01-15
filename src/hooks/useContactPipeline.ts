import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PipelineEntry {
  id: string;
  workspace_id: string;
  pipeline_id: string;
  stage_id: string;
  contact_id: string | null;
  company_id: string | null;
  entered_at: string | null;
  last_email_sent_at: string | null;
  last_inbound_email_at: string | null;
  awaiting_response: boolean | null;
  unread_replies_count: number | null;
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
    avatar_url: string | null;
    crm_company_id: string | null;
  } | null;
  company?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    industry: string | null;
    logo_url: string | null;
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

// Main hook for managing contact pipeline entries
export function useContactPipeline(pipelineId: string | undefined) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["contact-pipeline-entries", pipelineId, activeWorkspace?.id];

  const { data: entries = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!pipelineId || !activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .select(`
          *,
          contact:contacts(id, name, email, phone, role, avatar_url, crm_company_id),
          company:crm_companies(id, name, email, phone, industry, logo_url)
        `)
        .eq("pipeline_id", pipelineId)
        .eq("workspace_id", activeWorkspace.id);

      if (error) throw error;
      return (data || []) as PipelineEntry[];
    },
    enabled: !!pipelineId && !!activeWorkspace?.id,
  });

  const addEntry = useMutation({
    mutationFn: async (input: {
      stageId: string;
      contactId?: string;
      companyId?: string;
      notes?: string;
    }) => {
      if (!activeWorkspace?.id || !pipelineId) throw new Error("No workspace or pipeline");
      if (!input.contactId && !input.companyId) throw new Error("Contact ou société requis");

      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .insert({
          workspace_id: activeWorkspace.id,
          pipeline_id: pipelineId,
          stage_id: input.stageId,
          contact_id: input.contactId || null,
          company_id: input.companyId || null,
          notes: input.notes,
          entered_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Ajouté au pipeline");
    },
    onError: (error: Error) => {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        toast.error("Cet élément est déjà dans le pipeline");
      } else {
        toast.error("Erreur: " + error.message);
      }
    },
  });

  const addBulkEntries = useMutation({
    mutationFn: async (input: Array<{
      stageId: string;
      contactId?: string;
      companyId?: string;
    }>) => {
      if (!activeWorkspace?.id || !pipelineId) throw new Error("No workspace or pipeline");

      const entries = input.map(item => ({
        workspace_id: activeWorkspace.id,
        pipeline_id: pipelineId,
        stage_id: item.stageId,
        contact_id: item.contactId || null,
        company_id: item.companyId || null,
        entered_at: new Date().toISOString(),
      }));

      if (entries.length === 0) throw new Error("Aucune entrée à ajouter");

      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .insert(entries)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${data?.length || 0} entrée(s) ajoutée(s)`);
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const moveEntry = useMutation({
    mutationFn: async (input: { entryId: string; newStageId: string }) => {
      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .update({ 
          stage_id: input.newStageId,
          entered_at: new Date().toISOString(),
        })
        .eq("id", input.entryId)
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

  const removeEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_pipeline_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Retiré du pipeline");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateEntryNotes = useMutation({
    mutationFn: async (input: { entryId: string; notes: string }) => {
      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .update({ notes: input.notes })
        .eq("id", input.entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Notes mises à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const sendEmail = useMutation({
    mutationFn: async (input: {
      entryId: string;
      stageId: string;
      toEmail: string;
      subject: string;
      bodyHtml: string;
      templateId?: string;
    }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data, error } = await supabase
        .from("contact_pipeline_emails")
        .insert({
          workspace_id: activeWorkspace.id,
          entry_id: input.entryId,
          stage_id: input.stageId,
          template_id: input.templateId || null,
          to_email: input.toEmail,
          subject: input.subject,
          body_html: input.bodyHtml,
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update entry's last_email_sent_at and set awaiting_response
      await supabase
        .from("contact_pipeline_entries")
        .update({ 
          last_email_sent_at: new Date().toISOString(),
          awaiting_response: true,
        })
        .eq("id", input.entryId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    entries,
    isLoading,
    addEntry,
    addBulkEntries,
    moveEntry,
    removeEntry,
    updateEntryNotes,
    sendEmail,
  };
}

// Legacy hook for backwards compatibility
export function useContactPipelineEntries(pipelineId: string | undefined) {
  return useContactPipeline(pipelineId);
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

      // Update entry's last_email_sent_at and set awaiting_response
      await supabase
        .from("contact_pipeline_entries")
        .update({ 
          last_email_sent_at: new Date().toISOString(),
          awaiting_response: true,
        })
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
