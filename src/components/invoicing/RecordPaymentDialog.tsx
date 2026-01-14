import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Calendar,
  Building2,
  FileText,
  Loader2,
  CheckCircle,
  Euro,
} from 'lucide-react';
import { useInvoice, useAddPayment } from '@/hooks/useInvoices';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId?: string;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'prelevement', label: 'Prélèvement' },
  { value: 'especes', label: 'Espèces' },
];

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  onSuccess,
}: RecordPaymentDialogProps) {
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const addPayment = useAddPayment();

  const [formData, setFormData] = useState({
    amount: 0,
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'virement',
    reference: '',
    notes: '',
  });

  // Reset form when invoice changes
  const [initialized, setInitialized] = useState(false);
  
  if (invoice && !initialized && open) {
    setFormData(prev => ({
      ...prev,
      amount: invoice.amount_due || 0,
    }));
    setInitialized(true);
  }
  
  // Reset when dialog closes
  if (!open && initialized) {
    setInitialized(false);
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const handleSubmit = async () => {
    if (!invoiceId || formData.amount <= 0) return;

    try {
      await addPayment.mutateAsync({
        invoice_id: invoiceId,
        amount: formData.amount,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isFullPayment = formData.amount >= (invoice?.amount_due || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle>Enregistrer un paiement</DialogTitle>
              <DialogDescription>
                Enregistrez le paiement reçu pour cette facture
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : invoice ? (
          <div className="space-y-6">
            {/* Invoice Info */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{invoice.invoice_number}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {invoice.client_name && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {invoice.client_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(invoice.invoice_date), 'd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatCurrency(invoice.total_ttc)}</p>
                    <p className="text-xs text-muted-foreground">Total TTC</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Déjà payé</span>
                  <span className="text-sm font-medium text-emerald-600">
                    {formatCurrency(invoice.amount_paid)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-medium">Reste à payer</span>
                  <span className="text-lg font-bold text-amber-600">
                    {formatCurrency(invoice.amount_due)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Montant reçu <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={invoice.amount_due || 0}
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="pl-9"
                    />
                  </div>
                  {isFullPayment && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Paiement intégral
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Date de paiement <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mode de paiement</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Référence du paiement</Label>
                <Input
                  placeholder="N° de virement, chèque, etc."
                  value={formData.reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Notes internes sur ce paiement..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Actions */}
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={formData.amount <= 0 || addPayment.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {addPayment.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enregistrer le paiement
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Facture non trouvée
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
