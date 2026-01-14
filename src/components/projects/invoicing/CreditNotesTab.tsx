import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Download,
  Eye,
  Calendar,
  MoreHorizontal,
  RefreshCw,
  FileText,
  Receipt,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditNotesTabProps {
  projectId: string;
  onEditInvoice: (invoiceId: string) => void;
}

export function CreditNotesTab({ projectId, onEditInvoice }: CreditNotesTabProps) {
  const { data: allInvoices = [], isLoading } = useInvoices();
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");

  // Filter credit notes for this project
  const projectCreditNotes = allInvoices.filter(
    inv => inv.project_id === projectId && (inv as any).document_type === 'credit_note'
  );

  // Get invoices that can have credit notes created
  const invoicesForCreditNote = allInvoices.filter(
    inv => inv.project_id === projectId && 
    (inv as any).document_type !== 'credit_note' &&
    inv.status !== 'draft'
  );

  // Apply search filter
  const filteredCreditNotes = projectCreditNotes.filter((inv) =>
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
  const totalCreditNotes = projectCreditNotes.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total avoirs émis</p>
              <p className="text-2xl font-bold text-purple-600">
                -{formatCurrency(totalCreditNotes)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-purple-600">
            {projectCreditNotes.length} avoir(s)
          </Badge>
        </CardContent>
      </Card>

      {/* Header & Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un avoir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer un avoir
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un avoir</DialogTitle>
              <DialogDescription>
                Sélectionnez la facture sur laquelle vous souhaitez émettre un avoir.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Facture d'origine</label>
                <Select
                  value={selectedInvoiceId}
                  onValueChange={setSelectedInvoiceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une facture" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoicesForCreditNote.map(invoice => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        <div className="flex items-center gap-2">
                          <span>{invoice.invoice_number}</span>
                          <span className="text-muted-foreground">
                            - {formatCurrency(invoice.total_ttc)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedInvoiceId && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    {(() => {
                      const invoice = invoicesForCreditNote.find(i => i.id === selectedInvoiceId);
                      if (!invoice) return null;
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Client</span>
                            <span className="text-sm font-medium">{invoice.client_name || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Date</span>
                            <span className="text-sm font-medium">
                              {format(new Date(invoice.invoice_date), "d MMM yyyy", { locale: fr })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Montant TTC</span>
                            <span className="text-sm font-medium">{formatCurrency(invoice.total_ttc)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  disabled={!selectedInvoiceId}
                  onClick={() => {
                    // TODO: Create credit note from invoice
                    setCreateDialogOpen(false);
                  }}
                >
                  Créer l'avoir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credit Notes list */}
      {filteredCreditNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {projectCreditNotes.length === 0 ? "Aucun avoir" : "Aucun résultat"}
            </h3>
            <p className="text-muted-foreground max-w-md mb-4">
              {projectCreditNotes.length === 0 
                ? "Les avoirs permettent d'annuler ou corriger des factures émises."
                : "Aucun avoir ne correspond à votre recherche."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredCreditNotes.map((creditNote) => {
            const relatedInvoice = allInvoices.find(
              inv => inv.id === (creditNote as any).related_invoice_id
            );

            return (
              <Card key={creditNote.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                    <RefreshCw className="h-5 w-5 text-purple-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{creditNote.invoice_number}</p>
                      <Badge variant="outline" className="text-xs text-purple-600">
                        Avoir
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {relatedInvoice && (
                        <span className="flex items-center gap-1">
                          <ArrowLeft className="h-3 w-3" />
                          {relatedInvoice.invoice_number}
                        </span>
                      )}
                      {creditNote.client_name && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {creditNote.client_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(creditNote.invoice_date), "d MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-purple-600">
                      -{formatCurrency(creditNote.total_ttc)}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditInvoice(creditNote.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir / Modifier
                      </DropdownMenuItem>
                      {creditNote.pdf_url && (
                        <DropdownMenuItem onClick={() => window.open(creditNote.pdf_url, "_blank")}>
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
    </div>
  );
}
