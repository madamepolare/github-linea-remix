import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FileSignature, FileCheck, MoreVertical, Trash2, Copy, Send, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CommercialDocument,
  DocumentStatus,
  STATUS_LABELS, 
  STATUS_COLORS,
  DocumentType
} from '@/lib/commercialTypes';

interface CommercialPipelineProps {
  documents: CommercialDocument[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const PIPELINE_STAGES: { status: DocumentStatus; label: string; color: string }[] = [
  { status: 'draft', label: 'Brouillon', color: 'bg-muted' },
  { status: 'sent', label: 'Envoyé', color: 'bg-blue-500/10' },
  { status: 'accepted', label: 'Accepté', color: 'bg-green-500/10' },
  { status: 'signed', label: 'Signé', color: 'bg-emerald-500/10' },
  { status: 'rejected', label: 'Refusé', color: 'bg-red-500/10' },
];

export const CommercialPipeline = ({ documents, onDelete, onDuplicate }: CommercialPipelineProps) => {
  const navigate = useNavigate();

  const groupedDocuments = useMemo(() => {
    const groups: Record<DocumentStatus, CommercialDocument[]> = {
      draft: [],
      sent: [],
      accepted: [],
      signed: [],
      rejected: [],
      expired: []
    };

    documents.forEach(doc => {
      if (groups[doc.status]) {
        groups[doc.status].push(doc);
      }
    });

    return groups;
  }, [documents]);

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'quote': return FileText;
      case 'contract': return FileSignature;
      case 'proposal': return FileCheck;
    }
  };

  const calculateStageTotal = (docs: CommercialDocument[]) => {
    return docs.reduce((sum, doc) => sum + (doc.total_amount || 0), 0);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map(stage => {
        const stageDocs = groupedDocuments[stage.status] || [];
        const stageTotal = calculateStageTotal(stageDocs);
        
        return (
          <div key={stage.status} className="flex-shrink-0 w-72">
            <Card className={`h-full ${stage.color}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {stage.label}
                    <Badge variant="secondary" className="text-xs">
                      {stageDocs.length}
                    </Badge>
                  </CardTitle>
                  <span className="text-xs text-muted-foreground font-medium">
                    {new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: 'EUR',
                      maximumFractionDigits: 0 
                    }).format(stageTotal)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="space-y-2 pr-3">
                    {stageDocs.map(doc => {
                      const Icon = getDocumentIcon(doc.document_type);
                      return (
                        <Card 
                          key={doc.id}
                          className="cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => navigate(`/commercial/${doc.id}`)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0 flex-1">
                                <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                  <Icon className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium truncate">
                                    {doc.document_number}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {doc.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                                    {doc.client_company?.name || 'Aucun client'}
                                  </div>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/commercial/${doc.id}`); }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir
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
                            <div className="flex items-center justify-between mt-2 pt-2 border-t">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(doc.created_at), 'dd MMM', { locale: fr })}
                              </span>
                              <span className="text-xs font-semibold">
                                {new Intl.NumberFormat('fr-FR', { 
                                  style: 'currency', 
                                  currency: 'EUR',
                                  maximumFractionDigits: 0 
                                }).format(doc.total_amount || 0)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {stageDocs.length === 0 && (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        Aucun document
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
};
