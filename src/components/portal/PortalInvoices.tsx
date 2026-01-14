import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Receipt, Download, CheckCircle2, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Invoice {
  id: string;
  invoice_number: string;
  title: string | null;
  status: string;
  total_amount: number | null;
  amount_paid: number | null;
  issue_date: string | null;
  due_date: string | null;
  paid_at: string | null;
  pdf_url: string | null;
  project: { id: string; name: string } | null;
}

interface PortalInvoicesProps {
  invoices: Invoice[];
}

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  draft: { label: 'Brouillon', icon: Clock, className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Envoyée', icon: Clock, className: 'bg-blue-100 text-blue-700' },
  pending: { label: 'En attente', icon: Clock, className: 'bg-amber-100 text-amber-700' },
  partially_paid: { label: 'Partiellement payée', icon: CreditCard, className: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Payée', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700' },
  overdue: { label: 'En retard', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive' },
  cancelled: { label: 'Annulée', icon: Clock, className: 'bg-muted text-muted-foreground' },
};

export function PortalInvoices({ invoices }: PortalInvoicesProps) {
  const formatAmount = (amount: number | null) => {
    if (amount === null) return '—';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune facture pour le moment</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totals = invoices.reduce(
    (acc, inv) => {
      const amount = inv.total_amount || 0;
      const paid = inv.amount_paid || 0;
      acc.total += amount;
      acc.paid += paid;
      if (inv.status === 'pending' || inv.status === 'sent' || inv.status === 'overdue') {
        acc.pending += amount - paid;
      }
      return acc;
    },
    { total: 0, paid: 0, pending: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total facturé</p>
            <p className="text-2xl font-semibold">{formatAmount(totals.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Payé</p>
            <p className="text-2xl font-semibold text-emerald-600">{formatAmount(totals.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">En attente</p>
            <p className="text-2xl font-semibold text-amber-600">{formatAmount(totals.pending)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice list */}
      <div className="space-y-3">
        {invoices.map(invoice => {
          // Determine effective status
          let effectiveStatus = invoice.status;
          if (invoice.due_date && !invoice.paid_at) {
            const daysOverdue = differenceInDays(new Date(), new Date(invoice.due_date));
            if (daysOverdue > 0 && invoice.status !== 'paid') {
              effectiveStatus = 'overdue';
            }
          }

          const config = statusConfig[effectiveStatus] || statusConfig.pending;
          const remaining = (invoice.total_amount || 0) - (invoice.amount_paid || 0);

          return (
            <Card key={invoice.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-mono text-sm text-muted-foreground">
                        {invoice.invoice_number}
                      </span>
                    </div>
                    {invoice.title && (
                      <h4 className="font-medium mb-2 line-clamp-1">{invoice.title}</h4>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={config.className}>
                        <config.icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      {invoice.project && (
                        <Badge variant="outline" className="text-xs">
                          {invoice.project.name}
                        </Badge>
                      )}
                      {invoice.issue_date && (
                        <span className="text-xs text-muted-foreground">
                          Émise le {format(new Date(invoice.issue_date), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                      {invoice.due_date && effectiveStatus !== 'paid' && (
                        <span className={`text-xs ${effectiveStatus === 'overdue' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          Échéance : {format(new Date(invoice.due_date), 'dd MMM', { locale: fr })}
                        </span>
                      )}
                      {invoice.paid_at && (
                        <span className="text-xs text-emerald-600">
                          Payée le {format(new Date(invoice.paid_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-lg">
                      {formatAmount(invoice.total_amount)}
                    </p>
                    {invoice.amount_paid && invoice.amount_paid > 0 && remaining > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Reste : {formatAmount(remaining)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  {invoice.pdf_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger PDF
                      </a>
                    </Button>
                  )}
                  {effectiveStatus !== 'paid' && effectiveStatus !== 'cancelled' && remaining > 0 && (
                    <Button size="sm" variant="default">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Payer {formatAmount(remaining)}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
