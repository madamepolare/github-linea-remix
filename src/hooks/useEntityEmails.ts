import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGmailConnection } from "./useGmailConnection";
import { toast } from "sonner";

export type EntityType = 'project' | 'tender' | 'lead' | 'contact' | 'company';

export interface Email {
  id: string;
  subject: string;
  body: string;
  to_email: string;
  from_email: string | null;
  direction: 'inbound' | 'outbound' | null;
  status: string | null;
  sent_at: string | null;
  received_at: string | null;
  opened_at: string | null;
  created_at: string | null;
  gmail_thread_id: string | null;
  gmail_message_id: string | null;
  is_read: boolean;
  attachments: any[];
  cc: string[];
  bcc: string[];
  reply_to_email_id: string | null;
  labels: string[];
  contact_id: string | null;
  company_id: string | null;
  lead_id: string | null;
  project_id: string | null;
  tender_id: string | null;
  contact?: { id: string; name: string; email: string | null } | null;
  company?: { id: string; name: string } | null;
}

export interface EmailThread {
  threadId: string;
  subject: string;
  emails: Email[];
  lastEmailDate: string;
  participantEmails: string[];
  unreadCount: number;
}

interface UseEntityEmailsOptions {
  entityType: EntityType;
  entityId: string;
  enabled?: boolean;
}

interface SendEmailParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  replyToEmailId?: string;
}

export function useEntityEmails({ entityType, entityId, enabled = true }: UseEntityEmailsOptions) {
  const queryClient = useQueryClient();
  const gmailConnection = useGmailConnection();

  const queryKey = ['entity-emails', entityType, entityId];

  const { data: emails = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('crm_emails')
        .select(`
          *,
          contact:contacts(id, name, email),
          company:crm_companies(id, name)
        `)
        .order('created_at', { ascending: false });

      // Build query based on entity type
      switch (entityType) {
        case 'contact':
          query = query.eq('contact_id', entityId);
          break;
        case 'company':
          // Get emails for company OR all contacts of the company
          const { data: companyContacts } = await supabase
            .from('contacts')
            .select('id')
            .eq('crm_company_id', entityId);
          
          const contactIds = companyContacts?.map(c => c.id) || [];
          if (contactIds.length > 0) {
            query = query.or(`company_id.eq.${entityId},contact_id.in.(${contactIds.join(',')})`);
          } else {
            query = query.eq('company_id', entityId);
          }
          break;
        case 'lead':
          query = query.eq('lead_id', entityId);
          break;
        case 'project':
          query = query.eq('project_id', entityId);
          break;
        case 'tender':
          query = query.eq('tender_id', entityId);
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []) as Email[];
    },
    enabled: enabled && !!entityId,
  });

  // Group emails by thread
  const threads: EmailThread[] = (() => {
    const threadMap = new Map<string, Email[]>();
    
    emails.forEach(email => {
      const threadKey = email.gmail_thread_id || email.id;
      const existing = threadMap.get(threadKey) || [];
      existing.push(email);
      threadMap.set(threadKey, existing);
    });

    return Array.from(threadMap.entries()).map(([threadId, threadEmails]) => {
      const sortedEmails = [...threadEmails].sort(
        (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      );
      
      const participantEmails = new Set<string>();
      sortedEmails.forEach(e => {
        if (e.to_email) participantEmails.add(e.to_email);
        if (e.from_email) participantEmails.add(e.from_email);
      });

      return {
        threadId,
        subject: sortedEmails[0]?.subject || '(Sans objet)',
        emails: sortedEmails,
        lastEmailDate: sortedEmails[sortedEmails.length - 1]?.created_at || '',
        participantEmails: Array.from(participantEmails),
        unreadCount: sortedEmails.filter(e => !e.is_read && e.direction === 'inbound').length,
      };
    }).sort((a, b) => new Date(b.lastEmailDate).getTime() - new Date(a.lastEmailDate).getTime());
  })();

  // Stats
  const stats = {
    total: emails.length,
    sent: emails.filter(e => e.direction === 'outbound').length,
    received: emails.filter(e => e.direction === 'inbound').length,
    unread: emails.filter(e => !e.is_read && e.direction === 'inbound').length,
  };

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ to, cc, bcc, subject, body, replyToEmailId }: SendEmailParams) => {
      const { sendEmail: sendGmailEmail, connected: gmailConnected } = gmailConnection;
      if (!gmailConnected) {
        throw new Error('Gmail non connecté. Veuillez connecter votre compte Gmail dans les paramètres.');
      }

      // Build entity context for the email
      const entityContext: Record<string, string> = {};
      switch (entityType) {
        case 'contact':
          entityContext.contactId = entityId;
          break;
        case 'company':
          entityContext.companyId = entityId;
          break;
        case 'lead':
          entityContext.leadId = entityId;
          break;
        case 'project':
          entityContext.projectId = entityId;
          break;
        case 'tender':
          entityContext.tenderId = entityId;
          break;
      }

      // Send via Gmail
      const result = await sendGmailEmail({
        to,
        cc,
        bcc,
        subject,
        body,
        replyTo: replyToEmailId,
        ...entityContext,
      });

      return result;
    },
    onSuccess: () => {
      toast.success('Email envoyé avec succès');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'email');
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from('crm_emails')
        .update({ is_read: true })
        .eq('id', emailId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    emails,
    threads,
    stats,
    isLoading,
    gmailConnected: gmailConnection.connected,
    error,
    sendEmail: sendEmailMutation.mutateAsync,
    isSending: sendEmailMutation.isPending,
    markAsRead: markAsReadMutation.mutateAsync,
  };
}
