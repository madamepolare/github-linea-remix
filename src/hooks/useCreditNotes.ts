import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Invoice, InvoiceItem } from './useInvoices';

export interface CreateCreditNoteParams {
  originalInvoiceId: string;
  reason: string;
  items?: Partial<InvoiceItem>[];
  isPartial?: boolean;
}

export function useCreateCreditNote() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ originalInvoiceId, reason, items, isPartial = false }: CreateCreditNoteParams) => {
      if (!activeWorkspace?.id) throw new Error('No active workspace');

      // Fetch original invoice
      const { data: originalInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          client_company:crm_companies(id, name, address, city, postal_code, siret, vat_number)
        `)
        .eq('id', originalInvoiceId)
        .single();

      if (fetchError || !originalInvoice) {
        throw new Error('Facture originale non trouvée');
      }

      // Fetch original items if not provided
      let creditNoteItems = items;
      if (!creditNoteItems || creditNoteItems.length === 0) {
        const { data: originalItems } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', originalInvoiceId)
          .order('sort_order');

        creditNoteItems = originalItems?.map(item => ({
          ...item,
          id: undefined,
          invoice_id: undefined,
        })) || [];
      }

      // Calculate totals
      const subtotalHt = creditNoteItems.reduce((sum, item) => sum + (Number(item.amount_ht) || 0), 0);
      const totalTva = creditNoteItems.reduce((sum, item) => sum + (Number(item.amount_tva) || 0), 0);
      const totalTtc = creditNoteItems.reduce((sum, item) => sum + (Number(item.amount_ttc) || 0), 0);

      // Create credit note
      const creditNoteData = {
        workspace_id: activeWorkspace.id,
        created_by: user?.id,
        invoice_number: '', // Will be auto-generated
        invoice_type: 'credit_note',
        document_type: 'credit_note',
        status: 'draft',
        related_invoice_id: originalInvoiceId,
        client_company_id: originalInvoice.client_company_id,
        client_contact_id: originalInvoice.client_contact_id,
        client_name: originalInvoice.client_name,
        client_address: originalInvoice.client_address,
        client_city: originalInvoice.client_city,
        client_postal_code: originalInvoice.client_postal_code,
        client_country: originalInvoice.client_country,
        client_siret: originalInvoice.client_siret,
        client_vat_number: originalInvoice.client_vat_number,
        project_id: originalInvoice.project_id,
        project_name: originalInvoice.project_name,
        project_reference: originalInvoice.project_reference,
        invoice_date: new Date().toISOString().split('T')[0],
        subtotal_ht: subtotalHt,
        discount_amount: 0,
        discount_percentage: 0,
        tva_rate: originalInvoice.tva_rate || 20,
        tva_amount: totalTva,
        total_ttc: totalTtc,
        amount_paid: 0,
        amount_due: totalTtc,
        currency: originalInvoice.currency || 'EUR',
        payment_terms: originalInvoice.payment_terms,
        payment_method: originalInvoice.payment_method,
        bank_name: originalInvoice.bank_name,
        bank_iban: originalInvoice.bank_iban,
        bank_bic: originalInvoice.bank_bic,
        header_text: `Avoir sur facture ${originalInvoice.invoice_number}`,
        notes: reason,
        internal_notes: `Motif: ${reason}${isPartial ? ' (Avoir partiel)' : ' (Avoir total)'}`,
      };

      const { data: creditNote, error: insertError } = await supabase
        .from('invoices')
        .insert(creditNoteData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Insert credit note items
      if (creditNoteItems && creditNoteItems.length > 0) {
        const itemsToInsert = creditNoteItems.map((item, index) => ({
          invoice_id: creditNote.id,
          item_type: item.item_type || 'service',
          code: item.code || '',
          description: item.description || '',
          detailed_description: item.detailed_description || null,
          quantity: item.quantity || 1,
          unit: item.unit || 'forfait',
          unit_price: item.unit_price || 0,
          discount_percentage: item.discount_percentage || 0,
          tva_rate: item.tva_rate || 20,
          amount_ht: item.amount_ht || 0,
          amount_tva: item.amount_tva || 0,
          amount_ttc: item.amount_ttc || 0,
          phase_id: item.phase_id || null,
          phase_name: item.phase_name || null,
          percentage_completed: item.percentage_completed || 100,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return creditNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success('Avoir créé avec succès');
    },
    onError: (error) => {
      console.error('Error creating credit note:', error);
      toast.error('Erreur lors de la création de l\'avoir');
    },
  });
}

// Reasons for credit notes
export const CREDIT_NOTE_REASONS = [
  { value: 'return', label: 'Retour de produit/service' },
  { value: 'error', label: 'Erreur de facturation' },
  { value: 'discount', label: 'Remise commerciale' },
  { value: 'cancellation', label: 'Annulation de commande' },
  { value: 'partial', label: 'Annulation partielle' },
  { value: 'quality', label: 'Défaut qualité' },
  { value: 'other', label: 'Autre motif' },
];
