import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoiceBuilderSheet } from "@/components/invoicing/InvoiceBuilderSheet";
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
  AlertCircle
} from "lucide-react";
import { format, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectInvoicingTabProps {
  projectId: string;
  projectName: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: "Brouillon", variant: "secondary", icon: Receipt },
  sent: { label: "Envoyée", variant: "outline", icon: Send },
  paid: { label: "Payée", variant: "default", icon: CheckCircle },
  overdue: { label: "En retard", variant: "destructive", icon: AlertCircle },
  cancelled: { label: "Annulée", variant: "secondary", icon: Receipt },
};

export function ProjectInvoicingTab({ projectId, projectName }: ProjectInvoicingTabProps) {
  const { data: invoices = [], isLoading } = useInvoices();
  const [search, setSearch] = useState("");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | undefined>(undefined);

  const projectInvoices = invoices.filter(
    (inv) => inv.project_id === projectId
  );

  const filteredInvoices = projectInvoices.filter((inv) =>
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    (inv.client_name && inv.client_name.toLowerCase().includes(search.toLowerCase()))
  );

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  // Calculate totals
  const totalTTC = projectInvoices.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0);
  const totalPaid = projectInvoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + (inv.total_ttc || 0), 0);
  const totalPending = projectInvoices.filter(inv => inv.status === "sent").reduce((sum, inv) => sum + (inv.total_ttc || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total facturé</p>
            <p className="text-2xl font-bold">{formatCurrency(totalTTC)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Payé</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une facture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setBuilderOpen(true)}>
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
            <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Créez votre première facture pour ce projet.
            </p>
            <Button onClick={() => setBuilderOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une facture
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredInvoices.map((invoice) => {
            const isOverdue = invoice.status === "sent" && invoice.due_date && isPast(new Date(invoice.due_date));
            const status = isOverdue ? statusConfig.overdue : statusConfig[invoice.status] || statusConfig.draft;
            const StatusIcon = status.icon;

            return (
              <Card key={invoice.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <StatusIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {invoice.client_name && <span>{invoice.client_name}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(invoice.invoice_date), "d MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{formatCurrency(invoice.total_ttc)}</p>
                    {invoice.due_date && (
                      <p className="text-xs text-muted-foreground">
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
                      <DropdownMenuItem onClick={() => {
                        setSelectedInvoiceId(invoice.id);
                        setBuilderOpen(true);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir / Modifier
                      </DropdownMenuItem>
                      {invoice.pdf_url && (
                        <DropdownMenuItem onClick={() => window.open(invoice.pdf_url, "_blank")}>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger PDF
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

      {/* Invoice Builder Sheet */}
      <InvoiceBuilderSheet
        open={builderOpen}
        onOpenChange={(open) => {
          setBuilderOpen(open);
          if (!open) setSelectedInvoiceId(undefined);
        }}
        invoiceId={selectedInvoiceId}
      />
    </div>
  );
}
