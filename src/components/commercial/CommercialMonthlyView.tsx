import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfYear, addMonths, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileText, FileSignature } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  CommercialDocument,
  DocumentType,
  STATUS_LABELS, 
  STATUS_COLORS,
} from '@/lib/commercialTypes';
import { cn } from '@/lib/utils';

interface CommercialMonthlyViewProps {
  documents: CommercialDocument[];
}

export const CommercialMonthlyView = ({ documents }: CommercialMonthlyViewProps) => {
  const navigate = useNavigate();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Generate 12 months for the year
  const months = useMemo(() => {
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));
  }, [currentYear]);

  // Group documents by month
  const documentsByMonth = useMemo(() => {
    const map = new Map<string, CommercialDocument[]>();
    
    documents.forEach(doc => {
      const docDate = parseISO(doc.created_at);
      const monthKey = format(docDate, 'yyyy-MM');
      if (!map.has(monthKey)) {
        map.set(monthKey, []);
      }
      map.get(monthKey)!.push(doc);
    });

    // Sort documents within each month by date (newest first)
    map.forEach((docs) => {
      docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });

    return map;
  }, [documents]);

  // Calculate yearly totals
  const yearlyStats = useMemo(() => {
    const yearDocs = documents.filter(doc => {
      const docDate = parseISO(doc.created_at);
      return docDate.getFullYear() === currentYear;
    });

    return {
      count: yearDocs.length,
      total: yearDocs.reduce((sum, d) => sum + (d.total_amount || 0), 0),
      accepted: yearDocs.filter(d => d.status === 'accepted' || d.status === 'signed')
        .reduce((sum, d) => sum + (d.total_amount || 0), 0),
    };
  }, [documents, currentYear]);

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'quote': return FileText;
      case 'contract': return FileSignature;
      default: return FileText;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k€`;
    }
    return `${value}€`;
  };

  const isCurrentMonth = (date: Date) => {
    return isSameMonth(date, new Date());
  };

  return (
    <div className="space-y-4">
      {/* Sticky header with navigation + stats */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setCurrentYear(currentYear - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[60px] text-center tabular-nums">
              {currentYear}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setCurrentYear(currentYear + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setCurrentYear(new Date().getFullYear())}
            >
              Aujourd'hui
            </Button>
          </div>

          {/* Yearly stats - same style as ListView */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50">
              <span className="text-muted-foreground">{yearlyStats.count}</span>
              <span className="font-medium">documents</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatCurrency(yearlyStats.total)}</span>
            </div>
            {yearlyStats.accepted > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
                <span className="text-xs">Accepté</span>
                <span className="font-medium">{formatCurrency(yearlyStats.accepted)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly columns */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
          {months.map((month) => {
            const monthKey = format(month, 'yyyy-MM');
            const monthDocs = documentsByMonth.get(monthKey) || [];
            const monthTotal = monthDocs.reduce((sum, d) => sum + (d.total_amount || 0), 0);
            const isCurrent = isCurrentMonth(month);

            return (
              <div 
                key={monthKey}
                className="flex flex-col w-[260px] shrink-0"
              >
                {/* Month header - minimal */}
                <div className={cn(
                  "flex items-center justify-between px-1 pb-2 mb-2 border-b",
                  isCurrent && "border-primary"
                )}>
                  <span className={cn(
                    "text-sm font-medium capitalize",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}>
                    {format(month, 'MMMM', { locale: fr })}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{monthDocs.length}</span>
                    {monthTotal > 0 && (
                      <>
                        <span>·</span>
                        <span className="font-medium text-foreground">{formatCurrencyShort(monthTotal)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Documents list - same row style as ListView */}
                <div className="flex-1 space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {monthDocs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      —
                    </p>
                  ) : (
                    monthDocs.map(doc => {
                      const Icon = getDocumentIcon(doc.document_type);
                      return (
                        <div 
                          key={doc.id}
                          className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/commercial/quote/${doc.id}`)}
                        >
                          {/* Icon */}
                          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-3 w-3 text-primary" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium truncate">
                                {doc.document_number}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={cn("text-[10px] px-1 py-0 h-4", STATUS_COLORS[doc.status])}
                              >
                                {STATUS_LABELS[doc.status]}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {doc.client_company?.name || doc.title}
                            </p>
                          </div>

                          {/* Amount */}
                          <span className="text-xs font-semibold shrink-0 tabular-nums">
                            {formatCurrencyShort(doc.total_amount || 0)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
