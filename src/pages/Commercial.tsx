import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, FileSignature, FileCheck, Search, MoreVertical, Trash2, Copy, Send, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCommercialDocuments } from '@/hooks/useCommercialDocuments';
import { 
  DocumentType, 
  DocumentStatus,
  DOCUMENT_TYPE_LABELS, 
  STATUS_LABELS, 
  STATUS_COLORS,
  PROJECT_TYPE_LABELS
} from '@/lib/commercialTypes';

const Commercial = () => {
  const navigate = useNavigate();
  const { documents, isLoading, deleteDocument } = useCommercialDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.client_company?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // KPIs
  const totalDraft = documents.filter(d => d.status === 'draft').length;
  const totalSent = documents.filter(d => d.status === 'sent').length;
  const totalAccepted = documents.filter(d => d.status === 'accepted' || d.status === 'signed').length;
  const potentialRevenue = documents
    .filter(d => d.status === 'sent')
    .reduce((sum, d) => sum + (d.total_amount || 0), 0);

  const handleNewDocument = (type: DocumentType) => {
    navigate(`/commercial/new?type=${type}`);
  };

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'quote': return FileText;
      case 'contract': return FileSignature;
      case 'proposal': return FileCheck;
    }
  };

  return (
    <PageLayout
      title="Commercial"
      description="Gérez vos devis, contrats et propositions commerciales"
      icon={FileText}
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau document
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleNewDocument('quote')}>
              <FileText className="h-4 w-4 mr-2" />
              Devis
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNewDocument('contract')}>
              <FileSignature className="h-4 w-4 mr-2" />
              Contrat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNewDocument('proposal')}>
              <FileCheck className="h-4 w-4 mr-2" />
              Proposition
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Brouillons</div>
            <div className="text-2xl font-bold">{totalDraft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">En attente</div>
            <div className="text-2xl font-bold">{totalSent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Acceptés</div>
            <div className="text-2xl font-bold text-green-600">{totalAccepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">CA potentiel</div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(potentialRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as DocumentType | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="quote">Devis</SelectItem>
            <SelectItem value="contract">Contrats</SelectItem>
            <SelectItem value="proposal">Propositions</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DocumentStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="sent">Envoyé</SelectItem>
            <SelectItem value="accepted">Accepté</SelectItem>
            <SelectItem value="rejected">Refusé</SelectItem>
            <SelectItem value="signed">Signé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Aucun document trouvé</p>
            <Button className="mt-4" onClick={() => handleNewDocument('quote')}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un devis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => {
            const Icon = getDocumentIcon(doc.document_type);
            return (
              <Card 
                key={doc.id} 
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/commercial/${doc.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{doc.document_number}</span>
                          <Badge variant="outline" className={STATUS_COLORS[doc.status]}>
                            {STATUS_LABELS[doc.status]}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {doc.title}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden md:block">
                        <div className="text-sm font-medium">
                          {doc.client_company?.name || 'Aucun client'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {PROJECT_TYPE_LABELS[doc.project_type]}
                        </div>
                      </div>

                      <div className="text-right hidden lg:block">
                        <div className="font-semibold">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(doc.total_amount || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/commercial/${doc.id}`); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir / Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem>
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
                                deleteDocument.mutate(doc.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
};

export default Commercial;
