import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfYear, addMonths, isSameMonth, subYears, addYears } from 'date-fns';
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
    map.forEach((docs, key) => {
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
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setCurrentYear(currentYear - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[80px] text-center">
            {currentYear}
          </h2>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setCurrentYear(currentYear + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentYear(new Date().getFullYear())}
          >
            Cette année
          </Button>
        </div>

        {/* Yearly stats */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50">
            <span className="text-muted-foreground">{yearlyStats.count}</span>
            <span className="font-medium">documents</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50">
            <span className="font-semibold">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(yearlyStats.total)}
            </span>
          </div>
          {yearlyStats.accepted > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
              <span className="text-xs">✓</span>
              <span className="font-medium">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(yearlyStats.accepted)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Monthly columns */}
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4" style={{ minWidth: 'max-content' }}>
          {months.map((month) => {
            const monthKey = format(month, 'yyyy-MM');
            const monthDocs = documentsByMonth.get(monthKey) || [];
            const monthTotal = monthDocs.reduce((sum, d) => sum + (d.total_amount || 0), 0);
            const monthAccepted = monthDocs.filter(d => d.status === 'accepted' || d.status === 'signed')
              .reduce((sum, d) => sum + (d.total_amount || 0), 0);
            const isCurrent = isCurrentMonth(month);

            return (
              <div 
                key={monthKey}
                className={cn(
                  "flex flex-col w-[220px] shrink-0 border rounded-lg overflow-hidden",
                  isCurrent && "ring-2 ring-primary/50"
                )}
              >
                {/* Month header */}
                <div className={cn(
                  "px-3 py-2 border-b",
                  isCurrent ? "bg-primary/10" : "bg-muted/30"
                )}>
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "font-medium capitalize",
                      isCurrent && "text-primary"
                    )}>
                      {format(month, 'MMMM', { locale: fr })}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {monthDocs.length}
                    </Badge>
                  </div>
                  {monthTotal > 0 && (
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-muted-foreground">
                        {formatCurrency(monthTotal)}
                      </span>
                      {monthAccepted > 0 && (
                        <span className="text-emerald-600">
                          ✓ {formatCurrency(monthAccepted)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Documents list */}
                <div className="flex-1 p-2 space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto bg-background">
                  {monthDocs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Aucun document
                    </p>
                  ) : (
                    monthDocs.map(doc => {
                      const Icon = getDocumentIcon(doc.document_type);
                      return (
                        <div 
                          key={doc.id}
                          className={cn(
                            "p-2 rounded-md border cursor-pointer hover:border-primary/50 transition-colors",
                            doc.status === 'accepted' || doc.status === 'signed' 
                              ? "bg-emerald-500/5 border-emerald-500/20" 
                              : doc.status === 'sent'
                              ? "bg-blue-500/5 border-blue-500/20"
                              : doc.status === 'rejected'
                              ? "bg-red-500/5 border-red-500/20"
                              : "bg-muted/20"
                          )}
                          onClick={() => navigate(`/commercial/quote/${doc.id}`)}
                        >
                          {/* Header row */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-xs font-medium truncate flex-1">
                              {doc.document_number}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn("text-[10px] px-1 py-0 h-4", STATUS_COLORS[doc.status])}
                            >
                              {STATUS_LABELS[doc.status]}
                            </Badge>
                          </div>

                          {/* Title */}
                          <p className="text-xs truncate mb-1" title={doc.title}>
                            {doc.title}
                          </p>

                          {/* Client + Amount */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground truncate max-w-[100px]">
                              {doc.client_company?.name || '—'}
                            </span>
                            <span className="font-semibold shrink-0">
                              {formatCurrency(doc.total_amount || 0)}
                            </span>
                          </div>

                          {/* Date */}
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {format(parseISO(doc.created_at), 'dd MMM', { locale: fr })}
                          </div>
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
