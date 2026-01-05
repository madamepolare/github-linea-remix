import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  item_type: string;
  code: string;
  description: string;
  detailed_description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percentage: number;
  tva_rate: number;
  amount_ht: number;
  amount_tva: number;
  amount_ttc: number;
  phase_id?: string;
  phase_name?: string;
  percentage_completed: number;
  sort_order: number;
}

export interface Invoice {
  id: string;
  workspace_id: string;
  invoice_number: string;
  invoice_type: string;
  status: string;
  client_company_id?: string;
  client_contact_id?: string;
  client_name?: string;
  client_address?: string;
  client_city?: string;
  client_postal_code?: string;
  client_country?: string;
  client_siret?: string;
  client_vat_number?: string;
  project_id?: string;
  project_name?: string;
  project_reference?: string;
  commercial_document_id?: string;
  invoice_date: string;
  due_date?: string;
  sent_at?: string;
  paid_at?: string;
  subtotal_ht: number;
  discount_amount: number;
  discount_percentage: number;
  tva_rate: number;
  tva_amount: number;
  total_ttc: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  payment_terms?: string;
  payment_method?: string;
  bank_name?: string;
  bank_iban?: string;
  bank_bic?: string;
  chorus_pro_enabled: boolean;
  chorus_pro_service_code?: string;
  chorus_pro_engagement_number?: string;
  chorus_pro_submission_date?: string;
  chorus_pro_status?: string;
  chorus_pro_response?: Record<string, unknown> | null;
  header_text?: string;
  footer_text?: string;
  notes?: string;
  internal_notes?: string;
  pdf_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  client_company?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    postal_code?: string;
  };
  project?: {
    id: string;
    name: string;
  };
  items?: InvoiceItem[];
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  workspace_id: string;
  payment_date: string;
  amount: number;
  payment_method?: string;
  reference?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export function useInvoices(statusFilter?: string) {
  const { activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id;

  return useQuery({
    queryKey: ['invoices', workspaceId, statusFilter],
    queryFn: async () => {
      if (!workspaceId) return [];

      let query = supabase
        .from('invoices')
        .select(`
          *,
          client_company:crm_companies(id, name, address, city, postal_code),
          project:projects(id, name)
        `)
        .eq('workspace_id', workspaceId)
        .order('invoice_date', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!workspaceId,
  });
}

export function useInvoice(invoiceId: string | undefined) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;

      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client_company:crm_companies(id, name, address, city, postal_code, siret, vat_number),
          project:projects(id, name)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      // Fetch items
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('sort_order');

      if (itemsError) throw itemsError;

      return { ...invoice, items } as Invoice;
    },
    enabled: !!invoiceId && !!activeWorkspace?.id,
  });
}

export function useInvoicePayments(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice-payments', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];

      const { data, error } = await supabase
        .from('invoice_payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as InvoicePayment[];
    },
    enabled: !!invoiceId,
  });
}

export function useCreateInvoice() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: Partial<Invoice> & { items?: InvoiceItem[] }) => {
      if (!activeWorkspace?.id) throw new Error('No active workspace');

      const { items } = invoice;

      const insertData = {
        workspace_id: activeWorkspace.id,
        created_by: user?.id,
        invoice_number: '', // Will be auto-generated by trigger
        invoice_type: invoice.invoice_type || 'standard',
        status: invoice.status || 'draft',
        client_company_id: invoice.client_company_id || null,
        client_contact_id: invoice.client_contact_id || null,
        client_name: invoice.client_name || null,
        client_address: invoice.client_address || null,
        client_city: invoice.client_city || null,
        client_postal_code: invoice.client_postal_code || null,
        client_country: invoice.client_country || 'France',
        client_siret: invoice.client_siret || null,
        client_vat_number: invoice.client_vat_number || null,
        project_id: invoice.project_id || null,
        project_name: invoice.project_name || null,
        project_reference: invoice.project_reference || null,
        commercial_document_id: invoice.commercial_document_id || null,
        invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || null,
        subtotal_ht: invoice.subtotal_ht || 0,
        discount_amount: invoice.discount_amount || 0,
        discount_percentage: invoice.discount_percentage || 0,
        tva_rate: invoice.tva_rate || 20,
        tva_amount: invoice.tva_amount || 0,
        total_ttc: invoice.total_ttc || 0,
        amount_paid: invoice.amount_paid || 0,
        amount_due: invoice.amount_due || invoice.total_ttc || 0,
        currency: invoice.currency || 'EUR',
        payment_terms: invoice.payment_terms || null,
        payment_method: invoice.payment_method || null,
        bank_name: invoice.bank_name || null,
        bank_iban: invoice.bank_iban || null,
        bank_bic: invoice.bank_bic || null,
        chorus_pro_enabled: invoice.chorus_pro_enabled || false,
        chorus_pro_service_code: invoice.chorus_pro_service_code || null,
        chorus_pro_engagement_number: invoice.chorus_pro_engagement_number || null,
        header_text: invoice.header_text || null,
        footer_text: invoice.footer_text || null,
        notes: invoice.notes || null,
        internal_notes: invoice.internal_notes || null,
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Insert items if provided
      if (items && items.length > 0) {
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(items.map((item, index) => ({
            ...item,
            invoice_id: data.id,
            sort_order: index,
          })));

        if (itemsError) throw itemsError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Facture créée avec succès');
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      toast.error('Erreur lors de la création de la facture');
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, items, ...updates }: Partial<Invoice> & { id: string; items?: InvoiceItem[] }) => {
      // Remove fields that shouldn't be updated
      const { client_company, project, ...cleanUpdates } = updates as Record<string, unknown>;
      delete cleanUpdates.created_at;
      delete cleanUpdates.updated_at;
      
      const { error } = await supabase
        .from('invoices')
        .update(cleanUpdates)
        .eq('id', id);

      if (error) throw error;

      // Update items if provided
      if (items) {
        // Delete existing items
        await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', id);

        // Insert new items
        if (items.length > 0) {
          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(items.map((item, index) => ({
              ...item,
              invoice_id: id,
              sort_order: index,
            })));

          if (itemsError) throw itemsError;
        }
      }

      return { id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] });
      toast.success('Facture mise à jour');
    },
    onError: (error) => {
      console.error('Error updating invoice:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Facture supprimée');
    },
    onError: (error) => {
      console.error('Error deleting invoice:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
}

export function useAddPayment() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: { invoice_id: string; payment_date: string; amount: number; payment_method?: string; reference?: string; notes?: string }) => {
      if (!activeWorkspace?.id) throw new Error('No active workspace');

      const { data, error } = await supabase
        .from('invoice_payments')
        .insert({
          invoice_id: payment.invoice_id,
          payment_date: payment.payment_date,
          amount: payment.amount,
          payment_method: payment.payment_method,
          reference: payment.reference,
          notes: payment.notes,
          workspace_id: activeWorkspace.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update invoice amount_paid and amount_due
      const { data: payments } = await supabase
        .from('invoice_payments')
        .select('amount')
        .eq('invoice_id', payment.invoice_id);

      const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      const { data: invoice } = await supabase
        .from('invoices')
        .select('total_ttc')
        .eq('id', payment.invoice_id)
        .single();

      const amountDue = (invoice?.total_ttc || 0) - totalPaid;
      const newStatus = amountDue <= 0 ? 'paid' : 'pending';

      await supabase
        .from('invoices')
        .update({
          amount_paid: totalPaid,
          amount_due: Math.max(0, amountDue),
          status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', payment.invoice_id);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ['invoice-payments', data.invoice_id] });
      toast.success('Paiement enregistré');
    },
    onError: (error) => {
      console.error('Error adding payment:', error);
      toast.error('Erreur lors de l\'enregistrement du paiement');
    },
  });
}

export function useInvoiceStats() {
  const { activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id;

  return useQuery({
    queryKey: ['invoice-stats', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;

      const { data, error } = await supabase
        .from('invoices')
        .select('status, total_ttc, amount_due')
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      const stats = {
        total: data.length,
        draft: data.filter(i => i.status === 'draft').length,
        pending: data.filter(i => i.status === 'pending' || i.status === 'sent').length,
        paid: data.filter(i => i.status === 'paid').length,
        overdue: data.filter(i => i.status === 'overdue').length,
        totalAmount: data.reduce((sum, i) => sum + (i.total_ttc || 0), 0),
        pendingAmount: data
          .filter(i => i.status === 'pending' || i.status === 'sent')
          .reduce((sum, i) => sum + (i.amount_due || 0), 0),
        overdueAmount: data
          .filter(i => i.status === 'overdue')
          .reduce((sum, i) => sum + (i.amount_due || 0), 0),
      };

      return stats;
    },
    enabled: !!workspaceId,
  });
}
