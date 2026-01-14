import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type InvoiceHistoryEventType = 
  | 'created' 
  | 'updated' 
  | 'sent' 
  | 'paid' 
  | 'cancelled' 
  | 'credit_note' 
  | 'reminder'
  | 'payment_received'
  | 'chorus_submitted'
  | 'chorus_accepted'
  | 'chorus_rejected';

export interface InvoiceHistoryEvent {
  id: string;
  workspace_id: string;
  invoice_id: string;
  event_type: string;
  event_date: string;
  description: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
}

export function useInvoiceHistory(invoiceId: string | undefined) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['invoice-history', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];

      const { data, error } = await supabase
        .from('invoice_history')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('event_date', { ascending: false });

      if (error) throw error;
      return data as InvoiceHistoryEvent[];
    },
    enabled: !!invoiceId,
  });

  const addEvent = useMutation({
    mutationFn: async (event: {
      invoice_id: string;
      event_type: string;
      description?: string;
      old_value?: Record<string, unknown>;
      new_value?: Record<string, unknown>;
    }) => {
      if (!activeWorkspace?.id) throw new Error('No active workspace');

      const user = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('invoice_history')
        .insert([{
          workspace_id: activeWorkspace.id,
          invoice_id: event.invoice_id,
          event_type: event.event_type,
          description: event.description,
          old_value: event.old_value as any,
          new_value: event.new_value as any,
          user_id: user.data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-history', data.invoice_id] });
    },
    onError: (error) => {
      console.error('Error adding history event:', error);
      toast.error("Erreur lors de l'ajout de l'événement");
    },
  });

  return {
    events: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addEvent,
  };
}

export function useInvoiceHistoryStats(invoiceId: string | undefined) {
  const { events } = useInvoiceHistory(invoiceId);

  const getLastEvent = (type: string) => {
    return events.find(e => e.event_type === type);
  };

  const createdEvent = getLastEvent('created');
  const sentEvent = getLastEvent('sent');
  const paidEvent = getLastEvent('paid');
  const lastReminderEvent = getLastEvent('reminder');

  return {
    createdAt: createdEvent?.event_date,
    sentAt: sentEvent?.event_date,
    paidAt: paidEvent?.event_date,
    lastReminderAt: lastReminderEvent?.event_date,
    reminderCount: events.filter(e => e.event_type === 'reminder').length,
    totalEvents: events.length,
  };
}
