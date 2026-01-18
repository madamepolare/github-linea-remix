import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, FileText, FileSignature, Search, LayoutList, Kanban, Calendar, Trophy } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCommercialDocuments } from '@/hooks/useCommercialDocuments';
import { useAuth } from '@/contexts/AuthContext';
import { CommercialPipeline } from '@/components/commercial/CommercialPipeline';
import { CommercialListView } from '@/components/commercial/CommercialListView';
import { CommercialMonthlyView } from '@/components/commercial/CommercialMonthlyView';
import { 
  DocumentType, 
  DocumentStatus,
} from '@/lib/commercialTypes';

const Commercial = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeWorkspace } = useAuth();
  const { documents, isLoading, deleteDocument, duplicateDocument, updateDocument } = useCommercialDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'won'>('active');
  
  // Derive viewMode from URL path
  const getViewModeFromPath = (): 'list' | 'pipeline' | 'monthly' => {
    if (location.pathname.includes('/commercial/pipeline')) return 'pipeline';
    if (location.pathname.includes('/commercial/monthly')) return 'monthly';
    return 'list';
  };
  
  const [viewMode, setViewMode] = useState<'list' | 'pipeline' | 'monthly'>(getViewModeFromPath);
  
  // Sync viewMode with URL
  useEffect(() => {
    setViewMode(getViewModeFromPath());
  }, [location.pathname]);
  
  const handleViewModeChange = (mode: 'list' | 'pipeline' | 'monthly') => {
    setViewMode(mode);
    navigate(`/commercial/${mode}`);
  };

  // Separate won documents (accepted/signed) from active ones
  const wonDocuments = documents.filter(doc => 
    doc.status === 'accepted' || doc.status === 'signed'
  );
  
  const activeDocuments = documents.filter(doc => 
    doc.status !== 'accepted' && doc.status !== 'signed'
  );

  // Apply filters on the appropriate document set
  const baseDocuments = activeTab === 'won' ? wonDocuments : activeDocuments;
  
  const filteredDocuments = baseDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.client_company?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPIs - based on active tab
  const totalDraft = activeDocuments.filter(d => d.status === 'draft').length;
  const totalSent = activeDocuments.filter(d => d.status === 'sent').length;
  const totalWon = wonDocuments.length;
  const wonRevenue = wonDocuments.reduce((sum, d) => sum + (d.total_amount || 0), 0);
  const potentialRevenue = activeDocuments
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

  const handleUpdateNotes = (id: string, notes: string) => {
    updateDocument.mutate({ id, notes } as any);
  };

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'quote': return FileText;
      case 'contract': return FileSignature;
      default: return FileText;
    }
  };

  return (
    <PageLayout
      title={activeWorkspace ? `Business · ${activeWorkspace.name}` : 'Business'}
      description="Gérez vos devis et contrats commerciaux"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'pipeline' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('pipeline')}
            >
              <Kanban className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'monthly' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('monthly')}
            >
              <Calendar className="h-4 w-4" />
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
>

      {/* Tabs for Active vs Won */}
      {viewMode !== 'monthly' && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'won')} className="mb-4">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <FileText className="h-4 w-4" />
              En cours
              <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{activeDocuments.length}</span>
            </TabsTrigger>
            <TabsTrigger value="won" className="gap-2">
              <Trophy className="h-4 w-4" />
              Gagnés
              <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{wonDocuments.length}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* KPIs - Hide for monthly view, show different KPIs based on tab */}
      {viewMode !== 'monthly' && activeTab === 'active' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
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
              <div className="text-xs sm:text-sm text-muted-foreground">CA potentiel</div>
              <div className="text-lg sm:text-2xl font-bold truncate">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(potentialRevenue)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode !== 'monthly' && activeTab === 'won' && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="text-xs sm:text-sm text-muted-foreground">Devis gagnés</div>
              <div className="text-xl sm:text-2xl font-bold text-success">{totalWon}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="text-xs sm:text-sm text-muted-foreground">CA gagné</div>
              <div className="text-lg sm:text-2xl font-bold text-success truncate">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(wonRevenue)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters - Hide for monthly view */}
      {viewMode !== 'monthly' && (
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
          {activeTab === 'active' && (
            <div className="flex gap-2 sm:gap-4">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DocumentStatus | 'all')}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sent">Envoyé</SelectItem>
                  <SelectItem value="rejected">Refusé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Documents View */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : viewMode === 'monthly' ? (
        <CommercialMonthlyView documents={documents} />
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
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Aucun document dans {activeWorkspace?.name || 'ce workspace'}
            </p>
            <Button onClick={() => handleNewDocument('quote')}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un devis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <CommercialListView
          documents={filteredDocuments}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onUpdateNotes={handleUpdateNotes}
        />
      )}
    </PageLayout>
  );
};

export default Commercial;