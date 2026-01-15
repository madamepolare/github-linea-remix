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
      // Cascade logic: fetch emails based on entity relationships
      let allEmails: Email[] = [];
      
      switch (entityType) {
        case 'contact': {
          // Get contact details for email matching
          const { data: contact } = await supabase
            .from('contacts')
            .select('id, email, crm_company_id')
            .eq('id', entityId)
            .single();
          
          if (!contact) return [];
          
          // Fetch emails linked to contact OR matching contact's email address
          let query = supabase
            .from('crm_emails')
            .select(`*, contact:contacts(id, name, email), company:crm_companies(id, name)`)
            .order('created_at', { ascending: false });
          
          if (contact.email) {
            // Match by contact_id OR by email address (from/to) - use wildcards for ilike
            query = query.or(`contact_id.eq.${entityId},from_email.ilike.%${contact.email}%,to_email.ilike.%${contact.email}%`);
          } else {
            query = query.eq('contact_id', entityId);
          }
          
          const { data, error } = await query;
          if (error) throw error;
          allEmails = (data || []) as Email[];
          break;
        }
        
        case 'company': {
          // Get all contacts of this company
          const { data: companyContacts } = await supabase
            .from('contacts')
            .select('id, email')
            .eq('crm_company_id', entityId);
          
          const contactIds = companyContacts?.map(c => c.id) || [];
          const contactEmails = companyContacts?.map(c => c.email).filter(Boolean) || [];
          
          let query = supabase
            .from('crm_emails')
            .select(`*, contact:contacts(id, name, email), company:crm_companies(id, name)`)
            .order('created_at', { ascending: false });
          
          // Build OR conditions for company_id, contact_ids, and email addresses
          const orConditions: string[] = [`company_id.eq.${entityId}`];
          if (contactIds.length > 0) {
            orConditions.push(`contact_id.in.(${contactIds.join(',')})`);
          }
          contactEmails.forEach(email => {
            if (email) {
              orConditions.push(`from_email.ilike.${email}`);
              orConditions.push(`to_email.ilike.${email}`);
            }
          });
          
          query = query.or(orConditions.join(','));
          
          const { data, error } = await query;
          if (error) throw error;
          allEmails = (data || []) as Email[];
          break;
        }
        
        case 'project': {
          // Get project with its related company
          const { data: project } = await supabase
            .from('projects')
            .select('id, crm_company_id')
            .eq('id', entityId)
            .single();
          
          // Get project members (users, not contacts - so we skip email matching for now)
          // We focus on company contacts for project emails
          const companyId = project?.crm_company_id;
          
          let contactEmails: string[] = [];
          let contactIds: string[] = [];
          
          if (companyId) {
            const { data: companyContacts } = await supabase
              .from('contacts')
              .select('id, email')
              .eq('crm_company_id', companyId);
            
            contactIds = companyContacts?.map(c => c.id) || [];
            contactEmails = companyContacts?.map(c => c.email).filter(Boolean) as string[] || [];
          }
          
          let query = supabase
            .from('crm_emails')
            .select(`*, contact:contacts(id, name, email), company:crm_companies(id, name)`)
            .order('created_at', { ascending: false });
          
          // Build OR conditions
          const orConditions: string[] = [`project_id.eq.${entityId}`];
          if (companyId) {
            orConditions.push(`company_id.eq.${companyId}`);
          }
          if (contactIds.length > 0) {
            orConditions.push(`contact_id.in.(${contactIds.join(',')})`);
          }
          contactEmails.forEach(email => {
            orConditions.push(`from_email.ilike.${email}`);
            orConditions.push(`to_email.ilike.${email}`);
          });
          
          query = query.or(orConditions.join(','));
          
          const { data, error } = await query;
          if (error) throw error;
          allEmails = (data || []) as Email[];
          break;
        }
        
        case 'tender': {
          // Get tender candidates (partners)
          const { data: tenderCandidates } = await supabase
            .from('tender_partner_candidates')
            .select('contact_id, company_id')
            .eq('tender_id', entityId);
          
          const candidateContactIds = tenderCandidates?.map(t => t.contact_id).filter(Boolean) as string[] || [];
          const candidateCompanyIds = tenderCandidates?.map(t => t.company_id).filter(Boolean) as string[] || [];
          
          // Get emails of candidate contacts
          let candidateEmails: string[] = [];
          if (candidateContactIds.length > 0) {
            const { data: contacts } = await supabase
              .from('contacts')
              .select('email')
              .in('id', candidateContactIds);
            candidateEmails = contacts?.map(c => c.email).filter(Boolean) as string[] || [];
          }
          
          let query = supabase
            .from('crm_emails')
            .select(`*, contact:contacts(id, name, email), company:crm_companies(id, name)`)
            .order('created_at', { ascending: false });
          
          // Build OR conditions
          const orConditions: string[] = [`tender_id.eq.${entityId}`];
          if (candidateContactIds.length > 0) {
            orConditions.push(`contact_id.in.(${candidateContactIds.join(',')})`);
          }
          if (candidateCompanyIds.length > 0) {
            orConditions.push(`company_id.in.(${candidateCompanyIds.join(',')})`);
          }
          candidateEmails.forEach(email => {
            orConditions.push(`from_email.ilike.${email}`);
            orConditions.push(`to_email.ilike.${email}`);
          });
          
          query = query.or(orConditions.join(','));
          
          const { data, error } = await query;
          if (error) throw error;
          allEmails = (data || []) as Email[];
          break;
        }
        
        case 'lead': {
          // Get lead with contact/company info
          const { data: lead } = await supabase
            .from('leads')
            .select('id, contact_id, crm_company_id')
            .eq('id', entityId)
            .single();
          
          // Get contact email if linked
          let contactEmail: string | null = null;
          if (lead?.contact_id) {
            const { data: contact } = await supabase
              .from('contacts')
              .select('email')
              .eq('id', lead.contact_id)
              .single();
            contactEmail = contact?.email || null;
          }
          
          let query = supabase
            .from('crm_emails')
            .select(`*, contact:contacts(id, name, email), company:crm_companies(id, name)`)
            .order('created_at', { ascending: false });
          
          const orConditions: string[] = [`lead_id.eq.${entityId}`];
          if (lead?.contact_id) {
            orConditions.push(`contact_id.eq.${lead.contact_id}`);
          }
          if (lead?.crm_company_id) {
            orConditions.push(`company_id.eq.${lead.crm_company_id}`);
          }
          if (contactEmail) {
            orConditions.push(`from_email.ilike.${contactEmail}`);
            orConditions.push(`to_email.ilike.${contactEmail}`);
          }
          
          query = query.or(orConditions.join(','));
          
          const { data, error } = await query;
          if (error) throw error;
          allEmails = (data || []) as Email[];
          break;
        }
      }
      
      // Deduplicate by email id
      const uniqueEmails = Array.from(
        new Map(allEmails.map(e => [e.id, e])).values()
      );
      
      return uniqueEmails;
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
