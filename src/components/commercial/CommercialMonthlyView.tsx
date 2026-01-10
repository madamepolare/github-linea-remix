import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileText, FileSignature, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week offset (Monday = 0)
  const startDayOffset = (monthStart.getDay() + 6) % 7;
  const emptyDays = Array(startDayOffset).fill(null);

  // Group documents by date
  const documentsByDate = useMemo(() => {
    const map = new Map<string, CommercialDocument[]>();
    documents.forEach(doc => {
      const dateKey = format(parseISO(doc.created_at), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(doc);
    });
    return map;
  }, [documents]);

  // Calculate monthly totals
  const monthlyStats = useMemo(() => {
    const monthDocs = documents.filter(doc => {
      const docDate = parseISO(doc.created_at);
      return isSameMonth(docDate, currentMonth);
    });

    return {
      count: monthDocs.length,
      total: monthDocs.reduce((sum, d) => sum + (d.total_amount || 0), 0),
      accepted: monthDocs.filter(d => d.status === 'accepted' || d.status === 'signed')
        .reduce((sum, d) => sum + (d.total_amount || 0), 0),
    };
  }, [documents, currentMonth]);

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'quote': return FileText;
      case 'contract': return FileSignature;
      case 'proposal': return FileCheck;
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k€`;
    }
    return `${value}€`;
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold capitalize min-w-[160px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h2>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Aujourd'hui
          </Button>
        </div>

        {/* Monthly stats */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50">
            <span className="text-muted-foreground">{monthlyStats.count}</span>
            <span className="font-medium">docs</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50">
            <span className="font-semibold">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(monthlyStats.total)}
            </span>
          </div>
          {monthlyStats.accepted > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
              <span className="text-xs">✓</span>
              <span className="font-medium">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(monthlyStats.accepted)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 bg-muted/30 border-b">
          {weekDays.map(day => (
            <div key={day} className="px-2 py-2 text-xs font-medium text-muted-foreground text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for offset */}
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-b border-r bg-muted/10" />
          ))}

          {/* Day cells */}
          {days.map((day, i) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayDocs = documentsByDate.get(dateKey) || [];
            const isCurrentDay = isToday(day);
            const dayTotal = dayDocs.reduce((sum, d) => sum + (d.total_amount || 0), 0);

            return (
              <div 
                key={dateKey}
                className={cn(
                  "min-h-[100px] border-b border-r p-1.5 relative",
                  isCurrentDay && "bg-primary/5"
                )}
              >
                {/* Day number */}
                <div className={cn(
                  "absolute top-1 right-1 h-6 w-6 flex items-center justify-center text-xs font-medium rounded-full",
                  isCurrentDay ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}>
                  {format(day, 'd')}
                </div>

                {/* Documents */}
                <div className="mt-6 space-y-1">
                  <TooltipProvider>
                    {dayDocs.slice(0, 3).map(doc => {
                      const Icon = getDocumentIcon(doc.document_type);
                      return (
                        <Tooltip key={doc.id}>
                          <TooltipTrigger asChild>
                            <div 
                              className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity",
                                doc.status === 'accepted' || doc.status === 'signed' 
                                  ? "bg-emerald-500/10 text-emerald-700" 
                                  : doc.status === 'sent'
                                  ? "bg-blue-500/10 text-blue-700"
                                  : "bg-muted text-muted-foreground"
                              )}
                              onClick={() => navigate(`/commercial/quote/${doc.id}`)}
                            >
                              <Icon className="h-3 w-3 shrink-0" />
                              <span className="truncate flex-1">{doc.document_number}</span>
                              <span className="font-medium shrink-0">{formatCurrency(doc.total_amount || 0)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[200px]">
                            <div className="space-y-1">
                              <p className="font-medium">{doc.title}</p>
                              {doc.client_company && (
                                <p className="text-xs text-muted-foreground">{doc.client_company.name}</p>
                              )}
                              <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[doc.status])}>
                                {STATUS_LABELS[doc.status]}
                              </Badge>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                    {dayDocs.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1.5">
                        +{dayDocs.length - 3} autres
                      </div>
                    )}
                  </TooltipProvider>
                </div>

                {/* Day total */}
                {dayTotal > 0 && dayDocs.length > 1 && (
                  <div className="absolute bottom-1 left-1 text-[10px] text-muted-foreground">
                    Σ {formatCurrency(dayTotal)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
