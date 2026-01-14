import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InvoiceScheduleItem } from "@/hooks/useInvoiceSchedule";
import { useInvoice, Invoice } from "@/hooks/useInvoices";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InvoiceHistoryTimeline } from "./InvoiceHistoryTimeline";
import { InvoiceLivePreview } from "@/components/invoicing/InvoiceLivePreview";
import {
  Calendar,
  Building2,
  FileText,
  CreditCard,
  Clock,
  Settings,
  History,
  Eye,
  Edit,
  Send,
  Download,
  CheckCircle,
  AlertTriangle,
  Receipt,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InvoiceDetailPanelProps {
  scheduleItem?: InvoiceScheduleItem;
  invoice?: Invoice | null;
  invoiceId?: string;
  onClose?: () => void;
  onEdit?: () => void;
}

export function InvoiceDetailPanel({
  scheduleItem,
  invoice: propInvoice,
  invoiceId,
  onClose,
  onEdit,
}: InvoiceDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("preview");
  
  // Fetch invoice if we have an ID
  const { data: fetchedInvoice, isLoading } = useInvoice(
    invoiceId || scheduleItem?.invoice?.id
  );
  
  const invoice = propInvoice || fetchedInvoice;

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const getStatusBadge = () => {
    if (!invoice) return null;
    
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
      draft: { label: "Brouillon", variant: "secondary", icon: FileText },
      sent: { label: "Envoyée", variant: "outline", icon: Send },
      paid: { label: "Payée", variant: "default", icon: CheckCircle },
      overdue: { label: "En retard", variant: "destructive", icon: AlertTriangle },
      cancelled: { label: "Annulée", variant: "secondary", icon: Receipt },
    };
    
    const config = statusConfig[invoice.status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  // If no invoice yet, show schedule item info with create option
  if (!invoice && scheduleItem) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Échéance n°{scheduleItem.schedule_number}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{scheduleItem.title}</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Montant HT</Label>
              <p className="text-lg font-semibold">{formatCurrency(scheduleItem.amount_ht)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Pourcentage</Label>
              <p className="text-lg font-semibold">{scheduleItem.percentage || 0}%</p>
            </div>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-xs">Date prévue</Label>
            <p className="font-medium">
              {format(new Date(scheduleItem.planned_date), "d MMMM yyyy", { locale: fr })}
            </p>
          </div>

          <Separator />

          <div className="text-center py-4">
            <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-4">
              Aucune facture n'a encore été créée pour cette échéance.
            </p>
            <Button onClick={onEdit}>
              <Receipt className="h-4 w-4 mr-2" />
              Créer la facture
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invoice) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-50" />
          <p>Sélectionnez une échéance pour voir les détails</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare preview data - matching InvoiceLivePreviewProps interface
  const previewFormData = {
    invoice_type: (invoice as any).document_type || 'standard',
    client_name: invoice.client_name || '',
    client_address: invoice.client_address || '',
    client_city: invoice.client_city || '',
    client_postal_code: invoice.client_postal_code || '',
    client_siret: invoice.client_siret,
    client_vat_number: invoice.client_vat_number,
    project_name: invoice.project_name,
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date || '',
    payment_terms: invoice.payment_terms,
    bank_name: invoice.bank_name,
    bank_iban: invoice.bank_iban,
    bank_bic: invoice.bank_bic,
    header_text: invoice.header_text,
    footer_text: invoice.footer_text,
    notes: invoice.notes,
  };

  const previewItems = (invoice.items || []).map((item) => ({
    id: item.id,
    code: item.code || '',
    description: item.description || '',
    quantity: item.quantity || 1,
    unit: item.unit || 'forfait',
    unit_price: item.unit_price || 0,
    discount_percentage: item.discount_percentage || 0,
    tva_rate: item.tva_rate || 20,
    amount_ht: item.amount_ht || 0,
  }));

  const previewTotals = {
    subtotalHt: invoice.subtotal_ht || 0,
    totalTva: invoice.tva_amount || 0,
    totalTtc: invoice.total_ttc || 0,
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="flex flex-row items-start justify-between pb-3 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-muted-foreground">
            {invoice.project_name || 'Sans projet'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 grid grid-cols-4 shrink-0">
          <TabsTrigger value="preview" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Aperçu
          </TabsTrigger>
          <TabsTrigger value="details" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Détails
          </TabsTrigger>
          <TabsTrigger value="payment" className="text-xs">
            <CreditCard className="h-3 w-3 mr-1" />
            Paiement
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            <History className="h-3 w-3 mr-1" />
            Historique
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 p-4">
          <TabsContent value="preview" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="bg-white dark:bg-background border rounded-lg p-4 shadow-sm transform scale-[0.6] origin-top-left w-[166%]">
                <InvoiceLivePreview
                  formData={previewFormData}
                  items={previewItems}
                  totals={previewTotals}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="details" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {/* Client Info */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    Client
                  </Label>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium">{invoice.client_name || 'Non renseigné'}</p>
                    {invoice.client_address && <p>{invoice.client_address}</p>}
                    {(invoice.client_postal_code || invoice.client_city) && (
                      <p>{invoice.client_postal_code} {invoice.client_city}</p>
                    )}
                    {invoice.client_siret && (
                      <p className="text-xs text-muted-foreground mt-1">SIRET: {invoice.client_siret}</p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-muted-foreground text-xs">Date de facture</Label>
                    <p className="font-medium">
                      {format(new Date(invoice.invoice_date), "d MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Échéance</Label>
                    <p className="font-medium">
                      {invoice.due_date 
                        ? format(new Date(invoice.due_date), "d MMM yyyy", { locale: fr })
                        : '—'
                      }
                    </p>
                  </div>
                </div>

                {/* Amounts */}
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total HT</span>
                    <span>{formatCurrency(invoice.subtotal_ht)}</span>
                  </div>
                  {invoice.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remise</span>
                      <span className="text-destructive">-{formatCurrency(invoice.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA ({invoice.tva_rate}%)</span>
                    <span>{formatCurrency(invoice.tva_amount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total TTC</span>
                    <span className="text-primary">{formatCurrency(invoice.total_ttc)}</span>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-muted-foreground text-xs">Notes</Label>
                      <p className="text-sm mt-1">{invoice.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="payment" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {/* Payment Status */}
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold mb-1">
                    {formatCurrency(invoice.amount_paid)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    payé sur {formatCurrency(invoice.total_ttc)}
                  </p>
                  {invoice.amount_due > 0 && (
                    <p className="text-sm font-medium text-destructive mt-2">
                      Reste à payer: {formatCurrency(invoice.amount_due)}
                    </p>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <Label className="text-muted-foreground text-xs">Mode de paiement</Label>
                  <p className="font-medium">{invoice.payment_method || 'Non spécifié'}</p>
                </div>

                {/* Payment Terms */}
                <div>
                  <Label className="text-muted-foreground text-xs">Conditions de paiement</Label>
                  <p className="text-sm">{invoice.payment_terms || 'Non spécifié'}</p>
                </div>

                {/* Bank Info */}
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-muted-foreground">
                    <CreditCard className="h-3.5 w-3.5" />
                    Coordonnées bancaires
                  </Label>
                  {invoice.bank_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Banque</p>
                      <p className="text-sm font-medium">{invoice.bank_name}</p>
                    </div>
                  )}
                  {invoice.bank_iban && (
                    <div>
                      <p className="text-xs text-muted-foreground">IBAN</p>
                      <p className="text-sm font-mono">{invoice.bank_iban}</p>
                    </div>
                  )}
                  {invoice.bank_bic && (
                    <div>
                      <p className="text-xs text-muted-foreground">BIC</p>
                      <p className="text-sm font-mono">{invoice.bank_bic}</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="h-full m-0">
            <ScrollArea className="h-full">
              <InvoiceHistoryTimeline invoiceId={invoice.id} />
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>

      {/* Actions Footer */}
      <div className="p-4 border-t shrink-0 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          PDF
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <Send className="h-4 w-4 mr-2" />
          Envoyer
        </Button>
        {invoice.status !== 'paid' && (
          <Button size="sm" className="flex-1">
            <CreditCard className="h-4 w-4 mr-2" />
            Paiement
          </Button>
        )}
      </div>
    </Card>
  );
}
