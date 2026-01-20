import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoreVertical, 
  Trash2, 
  Copy, 
  Send, 
  Eye, 
  Building2,
  Mail,
  Download,
  FileText,
  FileSignature,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  CommercialDocument,
  STATUS_LABELS, 
} from '@/lib/commercialTypes';
import { useTableSelection } from '@/hooks/useTableSelection';
import { BulkActionsBar, type BulkAction } from '@/components/shared/BulkActionsBar';
import { cn } from '@/lib/utils';

interface CommercialListViewProps {
  documents: CommercialDocument[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkSendEmail?: (ids: string[]) => void;
}

const statusConfig: Record<string, { icon: typeof FileText; color: string; bgColor: string }> = {
  draft: { icon: FileSignature, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  sent: { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
  accepted: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
  signed: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
  rejected: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-500/10' },
  expired: { icon: AlertCircle, color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
};

export const CommercialListView = ({ 
  documents, 
  onDelete, 
  onDuplicate,
  onBulkDelete,
  onBulkSendEmail,
}: CommercialListViewProps) => {
  const navigate = useNavigate();
  
  // Use shared selection hook
  const {
    selectedIds,
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    isSelected,
    handleSelectAll,
    handleSelectOne,
    clearSelection,
  } = useTableSelection({
    items: documents,
    getItemId: (d) => d.id,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  // Calculate totals
  const totals = useMemo(() => ({
    count: documents.length,
    total: documents.reduce((sum, d) => sum + (d.total_amount || 0), 0),
    sent: documents.filter(d => d.status === 'sent').reduce((sum, d) => sum + (d.total_amount || 0), 0),
    accepted: documents.filter(d => d.status === 'accepted' || d.status === 'signed').reduce((sum, d) => sum + (d.total_amount || 0), 0),
  }), [documents]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'signed':
        return 'bg-emerald-500/10 text-emerald-600';
      case 'sent':
        return 'bg-blue-500/10 text-blue-600';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'rejected':
        return 'bg-red-500/10 text-red-600';
      case 'expired':
        return 'bg-amber-500/10 text-amber-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleBulkDelete = useCallback(() => {
    if (confirm(`Supprimer ${selectedCount} document(s) ?`)) {
      if (onBulkDelete) {
        onBulkDelete(Array.from(selectedIds));
      } else {
        selectedIds.forEach(id => onDelete(id));
      }
      clearSelection();
    }
  }, [selectedIds, selectedCount, onBulkDelete, onDelete, clearSelection]);

  const handleBulkSendEmail = useCallback(() => {
    onBulkSendEmail?.(Array.from(selectedIds));
  }, [selectedIds, onBulkSendEmail]);

  // Bulk actions configuration
  const bulkActions: BulkAction[] = useMemo(() => [
    {
      id: "email",
      label: "Envoyer",
      icon: Mail,
      onClick: handleBulkSendEmail,
      showInBar: true,
    },
    {
      id: "export",
      label: "Export",
      icon: Download,
      onClick: () => console.log("Export"),
      showInBar: true,
    },
    {
      id: "delete",
      label: "Supprimer",
      icon: Trash2,
      onClick: handleBulkDelete,
      variant: "destructive",
      showInBar: true,
    },
  ], [handleBulkDelete, handleBulkSendEmail]);

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold mb-2">Aucun document</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Créez votre premier devis pour commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with totals */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
            ref={(el) => {
              if (el) (el as any).indeterminate = isPartiallySelected;
            }}
            className="ml-1"
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{totals.count} documents</span>
            <span>•</span>
            <span className="font-medium text-foreground">{formatCurrency(totals.total)}</span>
            {totals.sent > 0 && (
              <>
                <span>•</span>
                <span className="text-blue-600">{formatCurrency(totals.sent)} en attente</span>
              </>
            )}
            {totals.accepted > 0 && (
              <>
                <span>•</span>
                <span className="text-emerald-600">{formatCurrency(totals.accepted)} accepté</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cards list */}
      <div className="space-y-2">
        {documents.map((doc, index) => {
          const docSelected = isSelected(doc.id);
          const config = statusConfig[doc.status] || statusConfig.draft;
          const StatusIcon = config.icon;
          
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
            >
              <Card 
                className={cn(
                  "group cursor-pointer hover:shadow-md transition-all duration-200",
                  docSelected && "ring-2 ring-primary/50"
                )}
                onClick={() => navigate(`/commercial/quote/${doc.id}`)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={docSelected}
                        onCheckedChange={(checked) => handleSelectOne(doc.id, checked as boolean)}
                      />
                    </div>

                    {/* Status Icon */}
                    <div 
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        config.bgColor
                      )}
                    >
                      <StatusIcon className={cn("h-5 w-5", config.color)} />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0 flex items-center gap-3 overflow-hidden">
                      {/* Title & Reference */}
                      <div className="min-w-0 w-48 lg:w-56 shrink-0">
                        <h3 className="font-semibold text-sm truncate">{doc.title}</h3>
                        <span className="text-xs font-mono text-muted-foreground">
                          {doc.document_number}
                        </span>
                      </div>

                      {/* Client */}
                      <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 w-40 shrink-0">
                        {doc.client_company ? (
                          <>
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{doc.client_company.name}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="hidden lg:block w-24 shrink-0">
                        <Badge 
                          variant="secondary"
                          className={cn("text-xs font-medium", getStatusStyle(doc.status))}
                        >
                          {STATUS_LABELS[doc.status]}
                        </Badge>
                      </div>

                      {/* Date */}
                      <div className="hidden xl:flex items-center gap-1.5 text-xs text-muted-foreground w-28 shrink-0">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0 min-w-20">
                      <span className="font-semibold text-sm tabular-nums">
                        {formatCurrency(doc.total_amount || 0)}
                      </span>
                      {/* Mobile: show status badge here */}
                      <div className="lg:hidden mt-0.5">
                        <Badge 
                          variant="secondary"
                          className={cn("text-2xs font-medium", getStatusStyle(doc.status))}
                        >
                          {STATUS_LABELS[doc.status]}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => navigate(`/commercial/quote/${doc.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(doc.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="h-4 w-4 mr-2" />
                            Envoyer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => confirm('Supprimer ce document ?') && onDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Mobile: Client info */}
                  {doc.client_company && (
                    <div className="md:hidden flex items-center gap-1.5 text-xs text-muted-foreground mt-2 ml-14">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{doc.client_company.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedCount}
        entityLabel={{ singular: "document", plural: "documents" }}
        onClearSelection={clearSelection}
        actions={bulkActions}
      />
    </div>
  );
};
