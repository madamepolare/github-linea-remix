import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, CheckCircle2, Clock, Send, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Quote {
  id: string;
  document_number: string;
  title: string;
  status: string;
  total_amount: number | null;
  valid_until: string | null;
  created_at: string;
  signed_at: string | null;
  pdf_url: string | null;
  project: { id: string; name: string } | null;
}

interface PortalQuotesProps {
  quotes: Quote[];
  token: string;
}

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  draft: { label: 'Brouillon', icon: Clock, className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Envoyé', icon: Send, className: 'bg-blue-100 text-blue-700' },
  viewed: { label: 'Consulté', icon: ExternalLink, className: 'bg-amber-100 text-amber-700' },
  accepted: { label: 'Accepté', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700' },
  signed: { label: 'Signé', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Refusé', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  expired: { label: 'Expiré', icon: Clock, className: 'bg-muted text-muted-foreground' },
};

export function PortalQuotes({ quotes, token }: PortalQuotesProps) {
  const formatAmount = (amount: number | null) => {
    if (amount === null) return '—';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun devis pour le moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {quotes.map(quote => {
        const config = statusConfig[quote.status] || statusConfig.draft;
        const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date() && quote.status !== 'signed' && quote.status !== 'accepted';

        return (
          <Card key={quote.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-mono text-sm text-muted-foreground">
                      {quote.document_number}
                    </span>
                  </div>
                  <h4 className="font-medium mb-2 line-clamp-1">{quote.title}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={isExpired ? 'bg-muted text-muted-foreground' : config.className}>
                      <config.icon className="h-3 w-3 mr-1" />
                      {isExpired ? 'Expiré' : config.label}
                    </Badge>
                    {quote.project && (
                      <Badge variant="outline" className="text-xs">
                        {quote.project.name}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(quote.created_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                    {quote.valid_until && !isExpired && (
                      <span className="text-xs text-muted-foreground">
                        Valide jusqu'au {format(new Date(quote.valid_until), 'dd MMM', { locale: fr })}
                      </span>
                    )}
                    {quote.signed_at && (
                      <span className="text-xs text-emerald-600">
                        Signé le {format(new Date(quote.signed_at), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-lg">
                    {formatAmount(quote.total_amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">HT</p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                {quote.pdf_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={quote.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger PDF
                    </a>
                  </Button>
                )}
                {(quote.status === 'sent' || quote.status === 'viewed') && !isExpired && (
                  <Button size="sm" variant="default">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Consulter et signer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
