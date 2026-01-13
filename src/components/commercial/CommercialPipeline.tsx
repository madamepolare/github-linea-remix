import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FileSignature, FileCheck, Building2, Plus, Trash2, Copy, Send, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { KanbanBoard, KanbanColumn, KanbanCard } from '@/components/shared/KanbanBoard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { 
  CommercialDocument,
  DocumentStatus,
  DocumentType
} from '@/lib/commercialTypes';
import { cn } from '@/lib/utils';

interface CommercialPipelineProps {
  documents: CommercialDocument[];
  isLoading?: boolean;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onStatusChange?: (id: string, status: DocumentStatus) => void;
  onCreateDocument?: () => void;
  kanbanHeightClass?: string;
  hideHeader?: boolean;
}

const PIPELINE_STAGES: { status: DocumentStatus; label: string; color: string }[] = [
  { status: 'draft', label: 'Brouillon', color: '#6b7280' },
  { status: 'sent', label: 'Envoyé', color: '#3b82f6' },
  { status: 'accepted', label: 'Accepté', color: '#22c55e' },
  { status: 'signed', label: 'Signé', color: '#10b981' },
  { status: 'rejected', label: 'Refusé', color: '#ef4444' },
];

export const CommercialPipeline = ({ 
  documents, 
  isLoading,
  onDelete, 
  onDuplicate,
  onStatusChange,
  onCreateDocument,
  kanbanHeightClass,
  hideHeader = false,
}: CommercialPipelineProps) => {
  const navigate = useNavigate();
  const [selectedDocument, setSelectedDocument] = useState<CommercialDocument | null>(null);

  const handleDrop = (documentId: string, _fromColumn: string, toColumn: string) => {
    onStatusChange?.(documentId, toColumn as DocumentStatus);
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

  const getTotalValue = (docs: CommercialDocument[]) => {
    return docs.reduce((sum, doc) => sum + (doc.total_amount || 0), 0);
  };

  // Calculate stats
  const stats = {
    total: documents.length,
    totalValue: documents.reduce((sum, doc) => sum + (doc.total_amount || 0), 0),
    acceptedValue: documents
      .filter(d => d.status === 'accepted' || d.status === 'signed')
      .reduce((sum, doc) => sum + (doc.total_amount || 0), 0),
  };

  const kanbanColumns: KanbanColumn<CommercialDocument>[] = PIPELINE_STAGES.map((stage) => {
    const stageDocs = documents.filter((doc) => doc.status === stage.status);
    const totalValue = getTotalValue(stageDocs);

    return {
      id: stage.status,
      label: stage.label,
      color: stage.color,
      items: stageDocs,
      metadata:
        totalValue > 0 ? (
          <span className="text-sm text-muted-foreground">€ {formatCurrency(totalValue)}</span>
        ) : undefined,
    };
  });

  return (
    <div className={cn("space-y-4", !hideHeader && "p-4 sm:p-6")}>
      {/* Stats bar */}
      {!hideHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-sm">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="font-medium">{stats.total}</span>
              <span className="text-muted-foreground hidden sm:inline">documents</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-sm">
              <span className="text-muted-foreground">€</span>
              <span className="font-medium">{formatCurrency(stats.totalValue)}</span>
              <span className="text-muted-foreground hidden sm:inline">total</span>
            </div>
            {stats.acceptedValue > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-sm text-emerald-600">
                <span>✓</span>
                <span className="font-medium">{formatCurrency(stats.acceptedValue)}</span>
                <span className="hidden sm:inline">accepté</span>
              </div>
            )}
          </div>
          {onCreateDocument && (
            <Button size="sm" className="h-8" onClick={onCreateDocument}>
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Nouveau document</span>
            </Button>
          )}
        </div>
      )}

      {/* Kanban */}
      <div className={cn("flex gap-4 overflow-x-auto pb-4", kanbanHeightClass || "h-[calc(100vh-320px)]")}>
        <KanbanBoard<CommercialDocument>
          columns={kanbanColumns}
          isLoading={isLoading}
          onDrop={handleDrop}
          getItemId={(doc) => doc.id}
          renderCard={(doc, isDragging) => (
            <CommercialKanbanCard
              document={doc}
              stageColor={PIPELINE_STAGES.find((s) => s.status === doc.status)?.color}
              onClick={() => navigate(`/commercial/quote/${doc.id}`)}
              onDuplicate={() => onDuplicate(doc.id)}
              onDelete={() => onDelete(doc.id)}
              isDragging={isDragging}
            />
          )}
          emptyColumnContent="Aucun document"
          className="px-0"
        />
      </div>
    </div>
  );
};

interface CommercialKanbanCardProps {
  document: CommercialDocument;
  stageColor?: string;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isDragging: boolean;
}

function CommercialKanbanCard({ document: doc, stageColor, onClick, onDuplicate, onDelete, isDragging }: CommercialKanbanCardProps) {
  const navigate = useNavigate();
  
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k€`;
    }
    return `${value}€`;
  };

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'quote': return FileText;
      case 'contract': return FileSignature;
    }
  };

  const Icon = getDocumentIcon(doc.document_type);

  return (
    <KanbanCard onClick={onClick} accentColor={stageColor}>
      <div className="space-y-2">
        {/* Header with icon and actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-3 w-3 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{doc.document_number}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/commercial/quote/${doc.id}`); }}>
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (confirm('Supprimer ce document ?')) {
                    onDelete();
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <p className="text-sm font-medium leading-snug line-clamp-2">{doc.title}</p>

        {/* Client */}
        {doc.client_company && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{doc.client_company.name}</span>
          </div>
        )}

        {/* Amount and date */}
        <div className="flex items-center justify-between pt-1 border-t border-border/30">
          <span className="text-xs text-muted-foreground">
            {format(new Date(doc.created_at), 'dd MMM', { locale: fr })}
          </span>
          <span className="text-sm font-semibold">
            {formatCurrency(doc.total_amount || 0)}
          </span>
        </div>
      </div>
    </KanbanCard>
  );
}
