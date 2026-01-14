import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { addDays, differenceInDays, isPast, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface InvoiceReminder {
  id: string;
  invoice_id: string;
  workspace_id: string;
  reminder_type: 'before_due' | 'on_due' | 'after_due' | 'escalation';
  reminder_number: number;
  scheduled_date: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  email_subject?: string;
  email_body?: string;
  created_at: string;
}

export interface ReminderTemplate {
  id: string;
  workspace_id: string;
  name: string;
  reminder_type: 'before_due' | 'on_due' | 'after_due' | 'escalation';
  days_offset: number; // negative for before, positive for after
  email_subject: string;
  email_body: string;
  is_active: boolean;
  sort_order: number;
}

// Default reminder templates
export const DEFAULT_REMINDER_TEMPLATES = [
  {
    name: 'Rappel avant échéance',
    reminder_type: 'before_due' as const,
    days_offset: -7,
    email_subject: 'Rappel : Facture {{invoice_number}} - Échéance dans 7 jours',
    email_body: `Bonjour {{client_name}},

Nous vous rappelons que la facture n°{{invoice_number}} d'un montant de {{amount_due}} TTC arrive à échéance le {{due_date}}.

Nous vous remercions de bien vouloir procéder au règlement avant cette date.

Coordonnées bancaires :
IBAN : {{iban}}
BIC : {{bic}}

Cordialement,
{{agency_name}}`,
  },
  {
    name: 'Rappel le jour de l\'échéance',
    reminder_type: 'on_due' as const,
    days_offset: 0,
    email_subject: 'Facture {{invoice_number}} - Échéance aujourd\'hui',
    email_body: `Bonjour {{client_name}},

La facture n°{{invoice_number}} d'un montant de {{amount_due}} TTC arrive à échéance aujourd'hui.

Merci de procéder au règlement dans les meilleurs délais.

Cordialement,
{{agency_name}}`,
  },
  {
    name: 'Première relance (J+7)',
    reminder_type: 'after_due' as const,
    days_offset: 7,
    email_subject: 'Relance : Facture {{invoice_number}} impayée',
    email_body: `Bonjour {{client_name}},

Sauf erreur de notre part, la facture n°{{invoice_number}} d'un montant de {{amount_due}} TTC est toujours en attente de règlement.

Son échéance était fixée au {{due_date}}.

Nous vous serions reconnaissants de bien vouloir régulariser cette situation dans les plus brefs délais.

Cordialement,
{{agency_name}}`,
  },
  {
    name: 'Deuxième relance (J+14)',
    reminder_type: 'after_due' as const,
    days_offset: 14,
    email_subject: '2ème relance : Facture {{invoice_number}} - Action requise',
    email_body: `Bonjour {{client_name}},

Malgré notre précédent rappel, la facture n°{{invoice_number}} reste impayée.

Montant dû : {{amount_due}} TTC
Date d'échéance : {{due_date}}

Nous vous prions de régulariser cette situation sous 48 heures afin d'éviter toute action de recouvrement.

Cordialement,
{{agency_name}}`,
  },
  {
    name: 'Mise en demeure (J+30)',
    reminder_type: 'escalation' as const,
    days_offset: 30,
    email_subject: 'MISE EN DEMEURE - Facture {{invoice_number}}',
    email_body: `Bonjour {{client_name}},

La présente constitue une mise en demeure concernant la facture n°{{invoice_number}} restée impayée malgré nos relances.

Montant dû : {{amount_due}} TTC
Date d'échéance initiale : {{due_date}}
Retard de paiement : {{days_overdue}} jours

Sans régularisation dans un délai de 8 jours, nous serons contraints d'engager des procédures de recouvrement.

Cordialement,
{{agency_name}}`,
  },
];

// Calculate overdue invoices needing reminders
export function useOverdueInvoicesForReminders() {
  const { activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id;

  return useQuery({
    queryKey: ['overdue-invoices-reminders', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          client_name,
          client_company_id,
          due_date,
          amount_due,
          total_ttc,
          status,
          sent_at
        `)
        .eq('workspace_id', workspaceId)
        .in('status', ['sent', 'pending'])
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const now = new Date();
      
      return data.map(invoice => {
        const dueDate = new Date(invoice.due_date!);
        const daysOverdue = differenceInDays(now, dueDate);
        const isOverdue = isPast(dueDate);

        return {
          ...invoice,
          daysOverdue: isOverdue ? daysOverdue : -daysOverdue, // negative means days until due
          isOverdue,
          urgency: daysOverdue > 30 ? 'critical' : daysOverdue > 14 ? 'high' : daysOverdue > 7 ? 'medium' : 'low',
        };
      }).filter(inv => inv.daysOverdue > -7); // Only show invoices due within 7 days or already overdue
    },
    enabled: !!workspaceId,
  });
}

// Reminder settings - simplified version without database table
export function useReminderSettings() {
  const { activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id;

  return useQuery({
    queryKey: ['reminder-settings', workspaceId],
    queryFn: async () => {
      // Return default settings - can be extended later with database storage
      return {
        auto_reminders_enabled: false,
        reminder_templates: DEFAULT_REMINDER_TEMPLATES,
        default_reminder_email: '',
      };
    },
    enabled: !!workspaceId,
  });
}

// Generate email content from template
export function generateReminderEmail(
  template: { email_subject: string; email_body: string },
  invoice: {
    invoice_number: string;
    client_name?: string;
    amount_due: number;
    due_date: string;
    total_ttc: number;
  },
  agencyInfo: {
    name?: string;
    iban?: string;
    bic?: string;
  }
): { subject: string; body: string } {
  const now = new Date();
  const dueDate = new Date(invoice.due_date);
  const daysOverdue = Math.max(0, differenceInDays(now, dueDate));

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const replacements: Record<string, string> = {
    '{{invoice_number}}': invoice.invoice_number,
    '{{client_name}}': invoice.client_name || 'Client',
    '{{amount_due}}': formatCurrency(invoice.amount_due),
    '{{total_ttc}}': formatCurrency(invoice.total_ttc),
    '{{due_date}}': format(dueDate, 'd MMMM yyyy', { locale: fr }),
    '{{days_overdue}}': daysOverdue.toString(),
    '{{agency_name}}': agencyInfo.name || 'Notre société',
    '{{iban}}': agencyInfo.iban || 'XXXX XXXX XXXX XXXX',
    '{{bic}}': agencyInfo.bic || 'XXXXXXXXXX',
    '{{today}}': format(now, 'd MMMM yyyy', { locale: fr }),
  };

  let subject = template.email_subject;
  let body = template.email_body;

  Object.entries(replacements).forEach(([key, value]) => {
    subject = subject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    body = body.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  });

  return { subject, body };
}

// Get suggested reminder for an invoice
export function getSuggestedReminder(
  invoice: { daysOverdue: number; isOverdue: boolean },
  templates: typeof DEFAULT_REMINDER_TEMPLATES = DEFAULT_REMINDER_TEMPLATES
) {
  if (!invoice.isOverdue) {
    // Before due date
    return templates.find(t => t.reminder_type === 'before_due' && t.days_offset <= -invoice.daysOverdue);
  }

  // Find the appropriate template based on days overdue
  const afterDueTemplates = templates
    .filter(t => t.reminder_type === 'after_due' || t.reminder_type === 'escalation')
    .sort((a, b) => a.days_offset - b.days_offset);

  return afterDueTemplates.find(t => invoice.daysOverdue >= t.days_offset) || afterDueTemplates[afterDueTemplates.length - 1];
}

// Log reminder sent
export function useLogReminderSent() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      reminderType,
      emailSubject,
      emailBody,
    }: {
      invoiceId: string;
      reminderType: string;
      emailSubject: string;
      emailBody: string;
    }) => {
      if (!activeWorkspace?.id) throw new Error('No active workspace');

      // Log to communications table
      const { error } = await supabase
        .from('communications')
        .insert({
          workspace_id: activeWorkspace.id,
          entity_type: 'invoice',
          entity_id: invoiceId,
          communication_type: 'email',
          title: emailSubject,
          content: emailBody,
          created_by: user?.id,
        });

      if (error) throw error;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overdue-invoices-reminders'] });
      toast.success('Relance enregistrée');
    },
    onError: (error) => {
      console.error('Error logging reminder:', error);
      toast.error('Erreur lors de l\'enregistrement');
    },
  });
}
