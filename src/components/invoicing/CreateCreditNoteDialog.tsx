import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, AlertCircle, FileText, Building2, Calendar, Loader2 } from 'lucide-react';
import { Invoice, InvoiceItem, useInvoice } from '@/hooks/useInvoices';
import { useCreateCreditNote, CREDIT_NOTE_REASONS } from '@/hooks/useCreditNotes';

interface CreateCreditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId?: string;
  onSuccess?: (creditNoteId: string) => void;
}

export function CreateCreditNoteDialog({
  open,
  onOpenChange,
  invoiceId,
  onSuccess,
}: CreateCreditNoteDialogProps) {
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const createCreditNote = useCreateCreditNote();

  const [creditType, setCreditType] = useState<'full' | 'partial'>('full');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const calculatePartialTotal = () => {
    if (!invoice?.items) return 0;
    return invoice.items
      .filter(item => item.id && selectedItems.has(item.id))
      .reduce((sum, item) => sum + (item.amount_ttc || 0), 0);
  };

  const handleCreate = async () => {
    if (!invoiceId) return;

    const finalReason = reason === 'other' ? customReason : CREDIT_NOTE_REASONS.find(r => r.value === reason)?.label || reason;
    
    let items: Partial<InvoiceItem>[] | undefined;
    if (creditType === 'partial' && invoice?.items) {
      items = invoice.items
        .filter(item => item.id && selectedItems.has(item.id))
        .map(item => ({
          ...item,
          id: undefined,
          invoice_id: undefined,
        }));
    }

    try {
      const result = await createCreditNote.mutateAsync({
        originalInvoiceId: invoiceId,
        reason: finalReason,
        items,
        isPartial: creditType === 'partial',
      });

      onOpenChange(false);
      onSuccess?.(result.id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isValid = reason && (creditType === 'full' || selectedItems.size > 0) && (reason !== 'other' || customReason.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle>Créer un avoir</DialogTitle>
              <DialogDescription>
                Émettez un avoir pour annuler ou corriger cette facture
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
            {/* Original Invoice Info */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{invoice.invoice_number}</span>
                      <Badge variant="outline">Facture originale</Badge>
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
                        {format(new Date(invoice.invoice_date), 'd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatCurrency(invoice.total_ttc)}</p>
                    <p className="text-xs text-muted-foreground">TTC</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credit Type Selection */}
            <div className="space-y-3">
              <Label>Type d'avoir</Label>
              <RadioGroup value={creditType} onValueChange={(v) => setCreditType(v as 'full' | 'partial')}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="flex-1 cursor-pointer">
                    <span className="font-medium">Avoir total</span>
                    <p className="text-sm text-muted-foreground">
                      Annule la totalité de la facture ({formatCurrency(invoice.total_ttc)})
                    </p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="partial" id="partial" />
                  <Label htmlFor="partial" className="flex-1 cursor-pointer">
                    <span className="font-medium">Avoir partiel</span>
                    <p className="text-sm text-muted-foreground">
                      Sélectionnez les lignes à annuler
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Partial Items Selection */}
            {creditType === 'partial' && invoice.items && invoice.items.length > 0 && (
              <div className="space-y-3">
                <Label>Lignes à annuler</Label>
                <ScrollArea className="h-[200px] rounded-lg border p-4">
                  <div className="space-y-2">
                    {invoice.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={item.id ? selectedItems.has(item.id) : false}
                          onCheckedChange={() => item.id && handleItemToggle(item.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(item.amount_ttc)}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {selectedItems.size > 0 && (
                  <div className="flex justify-end">
                    <Badge variant="secondary" className="text-purple-600">
                      Total à annuler: {formatCurrency(calculatePartialTotal())}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Reason Selection */}
            <div className="space-y-3">
              <Label>Motif de l'avoir <span className="text-destructive">*</span></Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un motif" />
                </SelectTrigger>
                <SelectContent>
                  {CREDIT_NOTE_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {reason === 'other' && (
                <Textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Précisez le motif de l'avoir..."
                  className="min-h-[80px]"
                />
              )}
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Attention
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  Un avoir sera créé en brouillon. Vous pourrez le modifier avant de l'envoyer au client.
                  L'avoir référencera automatiquement la facture d'origine.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!isValid || createCreditNote.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {createCreditNote.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Créer l'avoir
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Facture non trouvée</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
