import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, FileText, FileSignature, FileCheck, Search, MoreVertical, Trash2, Copy, Send, Eye, LayoutList, Kanban } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { CommercialPipeline } from '@/components/commercial/CommercialPipeline';
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
  const { view } = useParams();
  const { activeWorkspace, workspaces, setActiveWorkspace } = useAuth();
  const { documents, isLoading, deleteDocument, duplicateDocument, updateDocument } = useCommercialDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');

  // Derive type filter from URL
  const typeFilter: DocumentType | 'all' = 
    view === 'quotes' ? 'quote' : 
    view === 'contracts' ? 'contract' : 
    view === 'proposals' ? 'proposal' : 'all';

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
    navigate(`/commercial/quote/new?type=${type}`);
  };

  const handleDuplicate = (id: string) => {
    duplicateDocument.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteDocument.mutate(id);
  };

  const handleStatusChange = (id: string, status: DocumentStatus) => {
    updateDocument.mutate({ id, status });
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
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'pipeline' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('pipeline')}
            >
              <Kanban className="h-4 w-4" />
            </Button>
          </div>
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
        </div>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="text-xs sm:text-sm text-muted-foreground">Brouillons</div>
            <div className="text-xl sm:text-2xl font-bold">{totalDraft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="text-xs sm:text-sm text-muted-foreground">En attente</div>
            <div className="text-xl sm:text-2xl font-bold">{totalSent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="text-xs sm:text-sm text-muted-foreground">Acceptés</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{totalAccepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="text-xs sm:text-sm text-muted-foreground">CA potentiel</div>
            <div className="text-lg sm:text-2xl font-bold truncate">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(potentialRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 sm:gap-4">
          <Select 
            value={typeFilter} 
            onValueChange={(v) => {
              if (v === 'all') navigate('/commercial/all');
              else if (v === 'quote') navigate('/commercial/quotes');
              else if (v === 'contract') navigate('/commercial/contracts');
              else if (v === 'proposal') navigate('/commercial/proposals');
            }}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
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
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="sent">Envoyé</SelectItem>
              <SelectItem value="accepted">Accepté</SelectItem>
              <SelectItem value="rejected">Refusé</SelectItem>
              <SelectItem value="signed">Signé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Documents View */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : viewMode === 'pipeline' ? (
        <CommercialPipeline 
          documents={filteredDocuments}
          isLoading={isLoading}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onStatusChange={handleStatusChange}
          onCreateDocument={() => handleNewDocument('quote')}
        />
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Aucun document trouvé</p>
              {activeWorkspace && workspaces.length > 1 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Workspace actif : <span className="font-medium">{activeWorkspace.name}</span>
                </p>
              )}
            </div>

            {activeWorkspace && workspaces.length > 1 && (
              <div className="max-w-sm mx-auto">
                <Select
                  value={activeWorkspace.id}
                  onValueChange={(workspaceId) => {
                    setActiveWorkspace(workspaceId);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Changer de workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}{w.is_hidden ? ' (masqué)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Si votre devis a « disparu », il est probablement dans un autre workspace.
                </p>
              </div>
            )}

            <div>
              <Button className="mt-2" onClick={() => handleNewDocument('quote')}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un devis
              </Button>
            </div>
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
                onClick={() => navigate(`/commercial/quote/${doc.id}`)}
              >
                <CardContent className="py-3 sm:py-4 px-3 sm:px-6">
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm sm:text-base">{doc.document_number}</span>
                          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[doc.status]}`}>
                            {STATUS_LABELS[doc.status]}
                          </Badge>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                          {doc.title}
                        </div>
                        {/* Mobile: Show client and amount */}
                        <div className="flex items-center gap-2 mt-1 sm:hidden text-xs">
                          <span className="text-muted-foreground truncate">{doc.client_company?.name || 'Aucun client'}</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(doc.total_amount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium">
                          {doc.client_company?.name || 'Aucun client'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {PROJECT_TYPE_LABELS[doc.project_type]}
                        </div>
                      </div>

                      <div className="text-right hidden md:block">
                        <div className="font-semibold">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(doc.total_amount || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                            <MoreVertical className="h-4 w-4" />
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
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(doc.id); }}>
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
                                handleDelete(doc.id);
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