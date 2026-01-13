import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FileSignature, FileCheck, MoreVertical, Trash2, Copy, Send, Eye, MessageCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

interface CommercialListViewProps {
  documents: CommercialDocument[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
}

export const CommercialListView = ({ 
  documents, 
  onDelete, 
  onDuplicate,
  onUpdateNotes,
}: CommercialListViewProps) => {
  const navigate = useNavigate();
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'quote': return FileText;
      case 'contract': return FileSignature;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  // Calculate totals
  const totals = {
    count: documents.length,
    total: documents.reduce((sum, d) => sum + (d.total_amount || 0), 0),
    draft: documents.filter(d => d.status === 'draft').reduce((sum, d) => sum + (d.total_amount || 0), 0),
    sent: documents.filter(d => d.status === 'sent').reduce((sum, d) => sum + (d.total_amount || 0), 0),
    accepted: documents.filter(d => d.status === 'accepted' || d.status === 'signed').reduce((sum, d) => sum + (d.total_amount || 0), 0),
  };

  const handleOpenNotes = (doc: CommercialDocument) => {
    setEditingNotes(doc.id);
    setNotesValue((doc as any).notes || '');
  };

  const handleSaveNotes = (docId: string) => {
    onUpdateNotes?.(docId, notesValue);
    setEditingNotes(null);
    setNotesValue('');
  };

  return (
    <div className="space-y-3">
      {/* Sticky totals bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50">
            <span className="text-muted-foreground">{totals.count}</span>
            <span className="font-medium">documents</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{formatCurrency(totals.total)}</span>
          </div>
          {totals.sent > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-500/10 text-blue-600">
              <span className="text-xs">En attente</span>
              <span className="font-medium">{formatCurrency(totals.sent)}</span>
            </div>
          )}
          {totals.accepted > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
              <span className="text-xs">Accepté</span>
              <span className="font-medium">{formatCurrency(totals.accepted)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Compact list */}
      <div className="border rounded-lg overflow-hidden divide-y">
        {documents.map((doc) => {
          const Icon = getDocumentIcon(doc.document_type);
          const hasNotes = !!(doc as any).notes;
          
          return (
            <div 
              key={doc.id} 
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer group"
              onClick={() => navigate(`/commercial/quote/${doc.id}`)}
            >
              {/* Icon + Number */}
              <div className="flex items-center gap-2 min-w-0 w-[140px] shrink-0">
                <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium truncate">{doc.document_number}</span>
              </div>

              {/* Status */}
              <Badge 
                variant="outline" 
                className={cn("text-xs shrink-0", STATUS_COLORS[doc.status])}
              >
                {STATUS_LABELS[doc.status]}
              </Badge>

              {/* Title + Client */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="text-sm truncate">{doc.title}</span>
                {doc.client_company && (
                  <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                    · {doc.client_company.name}
                  </span>
                )}
              </div>

              {/* Date */}
              <span className="text-xs text-muted-foreground shrink-0 hidden md:block">
                {format(new Date(doc.created_at), 'dd/MM/yy', { locale: fr })}
              </span>

              {/* Amount */}
              <div className="text-right shrink-0 w-[90px]">
                <span className="text-sm font-semibold">
                  {formatCurrency(doc.total_amount || 0)}
                </span>
              </div>

              {/* Notes bubble */}
              <TooltipProvider>
                <Popover 
                  open={editingNotes === doc.id}
                  onOpenChange={(open) => {
                    if (!open) {
                      handleSaveNotes(doc.id);
                    }
                  }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "h-7 w-7 shrink-0",
                            hasNotes ? "text-amber-500" : "opacity-0 group-hover:opacity-100 text-muted-foreground"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenNotes(doc);
                          }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {hasNotes ? 'Voir les notes' : 'Ajouter une note'}
                    </TooltipContent>
                  </Tooltip>
                  <PopoverContent 
                    className="w-72 p-3" 
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Notes</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5"
                          onClick={() => handleSaveNotes(doc.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <Textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder="Ajouter des notes..."
                        className="min-h-[80px] text-sm resize-none"
                      />
                      {doc.updated_at && (
                        <p className="text-[10px] text-muted-foreground">
                          Modifié le {format(new Date(doc.updated_at), 'dd/MM/yy à HH:mm', { locale: fr })}
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </TooltipProvider>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { 
                    e.stopPropagation(); 
                    navigate(`/commercial/quote/${doc.id}`); 
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir / Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(doc.id); }}>
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
                        onDelete(doc.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
};
