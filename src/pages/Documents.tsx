import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  FileStack, 
  Building2, 
  Briefcase, 
  Users,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAgencyDocuments } from '@/hooks/useAgencyDocuments';
import { useCommercialDocuments } from '@/hooks/useCommercialDocuments';
import { DocumentList } from '@/components/documents/DocumentList';
import { CreateDocumentDialog } from '@/components/documents/CreateDocumentDialog';
import { 
  DOCUMENT_CATEGORY_LABELS, 
  type DocumentCategory 
} from '@/lib/documentTypes';

export default function Documents() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DocumentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { documents, isLoading, stats } = useAgencyDocuments();
  const { documents: commercialDocs, isLoading: commercialLoading } = useCommercialDocuments();

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeTab === 'all' || doc.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const commercialCount = commercialDocs?.length || 0;

  return (
    <PageLayout 
      title="Documents" 
      icon={FileStack}
      description="Gérez tous vos documents administratifs, projets et RH"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.thisMonth || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures en cours</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.invoicesInProgress || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau document
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocumentCategory | 'all')}>
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="gap-2">
            <FileStack className="h-4 w-4" />
            Tous
            <Badge variant="secondary" className="ml-1">{documents.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="administrative" className="gap-2">
            <Building2 className="h-4 w-4" />
            {DOCUMENT_CATEGORY_LABELS.administrative}
            <Badge variant="secondary" className="ml-1">
              {documents.filter(d => d.category === 'administrative').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="project" className="gap-2">
            <Briefcase className="h-4 w-4" />
            {DOCUMENT_CATEGORY_LABELS.project}
            <Badge variant="secondary" className="ml-1">
              {documents.filter(d => d.category === 'project').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="hr" className="gap-2">
            <Users className="h-4 w-4" />
            {DOCUMENT_CATEGORY_LABELS.hr}
            <Badge variant="secondary" className="ml-1">
              {documents.filter(d => d.category === 'hr').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="commercial" className="gap-2">
            <FileText className="h-4 w-4" />
            {DOCUMENT_CATEGORY_LABELS.commercial}
            <Badge variant="secondary" className="ml-1">{commercialCount}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DocumentList 
            documents={filteredDocuments} 
            isLoading={isLoading} 
          />
        </TabsContent>
        <TabsContent value="administrative">
          <DocumentList 
            documents={filteredDocuments} 
            isLoading={isLoading} 
          />
        </TabsContent>
        <TabsContent value="project">
          <DocumentList 
            documents={filteredDocuments} 
            isLoading={isLoading} 
          />
        </TabsContent>
        <TabsContent value="hr">
          <DocumentList 
            documents={filteredDocuments} 
            isLoading={isLoading} 
          />
        </TabsContent>
        <TabsContent value="commercial">
          {/* Commercial documents - redirect to commercial module */}
          <div className="space-y-4">
            {commercialLoading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : commercialDocs && commercialDocs.length > 0 ? (
              <div className="grid gap-4">
                {commercialDocs.map((doc) => (
                  <Card 
                    key={doc.id} 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => navigate(`/commercial/${doc.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.document_number} • {doc.document_type === 'quote' ? 'Devis' : doc.document_type === 'contract' ? 'Contrat' : 'Proposition'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          doc.status === 'signed' ? 'default' : 
                          doc.status === 'sent' ? 'secondary' : 
                          'outline'
                        }>
                          {doc.status === 'draft' ? 'Brouillon' : 
                           doc.status === 'sent' ? 'Envoyé' : 
                           doc.status === 'signed' ? 'Signé' : 
                           doc.status === 'accepted' ? 'Accepté' : 
                           doc.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun document commercial</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/commercial')}
                >
                  Aller au module Commercial
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <CreateDocumentDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </PageLayout>
  );
}
