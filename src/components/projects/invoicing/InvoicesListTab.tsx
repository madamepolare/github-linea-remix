import { useState } from "react";
import { format, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { useInvoices, useInvoice, Invoice } from "@/hooks/useInvoices";
import { useAgencyInfo } from "@/hooks/useAgencyInfo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Receipt,
  Plus,
  Search,
  Download,
  Eye,
  Calendar,
  MoreHorizontal,
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  CreditCard,
  Copy,
  RefreshCw,
  Building2,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateCreditNoteDialog } from "@/components/invoicing/CreateCreditNoteDialog";
import { generateFacturXXML, downloadFacturXXML, FacturXAgencyInfo } from "@/lib/facturx";
import { toast } from "sonner";

interface InvoicesListTabProps {
  projectId: string;
  onCreateInvoice: () => void;
  onEditInvoice: (invoiceId: string) => void;
}

const DOCUMENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  invoice: { label: "Facture", color: "bg-blue-100 text-blue-700", icon: Receipt },
  proforma: { label: "Proforma", color: "bg-slate-100 text-slate-700", icon: FileText },
  advance: { label: "Acompte", color: "bg-amber-100 text-amber-700", icon: CreditCard },
  deposit: { label: "Arrhes", color: "bg-orange-100 text-orange-700", icon: CreditCard },
  credit_note: { label: "Avoir", color: "bg-purple-100 text-purple-700", icon: RefreshCw },
  final: { label: "Solde", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
  draft: { label: "Brouillon", variant: "secondary", icon: FileText },
  sent: { label: "Envoyée", variant: "outline", icon: Send },
  paid: { label: "Payée", variant: "default", icon: CheckCircle },
  overdue: { label: "En retard", variant: "destructive", icon: AlertCircle },
  cancelled: { label: "Annulée", variant: "secondary", icon: Receipt },
  pending: { label: "En attente", variant: "outline", icon: Receipt },
};

export function InvoicesListTab({ projectId, onCreateInvoice, onEditInvoice }: InvoicesListTabProps) {
  const { data: allInvoices = [], isLoading } = useInvoices();
  const { agencyInfo } = useAgencyInfo();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [creditNoteDialogOpen, setCreditNoteDialogOpen] = useState(false);
  const [selectedInvoiceForCreditNote, setSelectedInvoiceForCreditNote] = useState<string | undefined>();

  // Filter invoices for this project
  const projectInvoices = allInvoices.filter(inv => inv.project_id === projectId);

  // Apply filters
  const filteredInvoices = projectInvoices.filter((inv) => {
    const matchesSearch = 
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.client_name && inv.client_name.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchesType = typeFilter === "all" || (inv as any).document_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const handleExportFacturX = async (invoice: Invoice) => {
    if (!agencyInfo) {
      toast.error("Informations de l'agence manquantes");
      return;
    }

    try {
      // Fetch invoice items
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: items } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('sort_order');

      const agency: FacturXAgencyInfo = {
        name: agencyInfo.name || '',
        siret: agencyInfo.siret || '',
        vatNumber: agencyInfo.vat_number,
        address: agencyInfo.address || '',
        city: agencyInfo.city || '',
        postalCode: agencyInfo.postal_code || '',
        country: 'France',
        email: agencyInfo.email,
        phone: agencyInfo.phone,
        rcsCity: agencyInfo.rcs_city,
        capitalSocial: agencyInfo.capital_social,
      };

      const xml = generateFacturXXML(invoice, items || [], agency);
      downloadFacturXXML(xml, `${invoice.invoice_number}_facturx.xml`);
      toast.success("Fichier Factur-X exporté");
    } catch (error) {
      console.error('Error exporting Factur-X:', error);
      toast.error("Erreur lors de l'export");
    }
  };

  const handleCreateCreditNote = (invoiceId: string) => {
    setSelectedInvoiceForCreditNote(invoiceId);
    setCreditNoteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="sent">Envoyée</SelectItem>
              <SelectItem value="paid">Payée</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="invoice">Facture</SelectItem>
              <SelectItem value="proforma">Proforma</SelectItem>
              <SelectItem value="advance">Acompte</SelectItem>
              <SelectItem value="credit_note">Avoir</SelectItem>
              <SelectItem value="final">Solde</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onCreateInvoice}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle facture
        </Button>
      </div>

      {/* Invoices list */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {projectInvoices.length === 0 ? "Aucune facture" : "Aucun résultat"}
            </h3>
            <p className="text-muted-foreground max-w-md mb-4">
              {projectInvoices.length === 0 
                ? "Créez votre première facture pour ce projet."
                : "Aucune facture ne correspond à vos critères de recherche."}
            </p>
            {projectInvoices.length === 0 && (
              <Button onClick={onCreateInvoice}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une facture
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredInvoices.map((invoice) => {
            const isOverdue = invoice.status === "sent" && invoice.due_date && isPast(new Date(invoice.due_date));
            const statusKey = isOverdue ? "overdue" : invoice.status;
            const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.draft;
            const StatusIcon = status.icon;
            
            const docType = (invoice as any).document_type || 'invoice';
            const typeConfig = DOCUMENT_TYPE_CONFIG[docType] || DOCUMENT_TYPE_CONFIG.invoice;

            return (
              <Card key={invoice.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                    typeConfig.color
                  )}>
                    <typeConfig.icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <Badge variant={status.variant} className="text-xs">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {typeConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {invoice.client_name && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {invoice.client_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(invoice.invoice_date), "d MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{formatCurrency(invoice.total_ttc)}</p>
                    {invoice.due_date && (
                      <p className={cn(
                        "text-xs",
                        isOverdue ? "text-destructive" : "text-muted-foreground"
                      )}>
                        Échéance: {format(new Date(invoice.due_date), "d MMM", { locale: fr })}
                      </p>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditInvoice(invoice.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir / Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Dupliquer
                      </DropdownMenuItem>
                      {invoice.pdf_url && (
                        <DropdownMenuItem onClick={() => window.open(invoice.pdf_url, "_blank")}>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger PDF
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleExportFacturX(invoice)}>
                        <FileCode className="h-4 w-4 mr-2" />
                        Export Factur-X
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {invoice.status === "draft" && (
                        <DropdownMenuItem>
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer
                        </DropdownMenuItem>
                      )}
                      {(invoice.status === "sent" || invoice.status === "pending") && (
                        <DropdownMenuItem>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Enregistrer paiement
                        </DropdownMenuItem>
                      )}
                      {(invoice as any).document_type !== 'credit_note' && invoice.status !== 'draft' && (
                        <DropdownMenuItem onClick={() => handleCreateCreditNote(invoice.id)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Créer un avoir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCreditNoteDialog
        open={creditNoteDialogOpen}
        onOpenChange={setCreditNoteDialogOpen}
        invoiceId={selectedInvoiceForCreditNote}
        onSuccess={(creditNoteId) => {
          onEditInvoice(creditNoteId);
        }}
      />
    </div>
  );
}
