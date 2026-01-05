import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  FileStack, 
  FileText
} from 'lucide-react';
import { useAgencyDocuments } from '@/hooks/useAgencyDocuments';
import { useCommercialDocuments } from '@/hooks/useCommercialDocuments';
import { DocumentList } from '@/components/documents/DocumentList';
import { CreateDocumentDialog } from '@/components/documents/CreateDocumentDialog';
import { DocumentsDashboard } from '@/components/documents/DocumentsDashboard';
import { type DocumentCategory } from '@/lib/documentTypes';

type DocumentSection = DocumentCategory | 'all' | 'dashboard';

const sectionDescriptions: Record<DocumentSection, string> = {
  dashboard: "Vue d'ensemble de vos documents",
  all: "Tous vos documents",
  administrative: "Documents administratifs de l'agence",
  project: "Documents liés aux projets",
  hr: "Documents ressources humaines",
  commercial: "Devis, contrats et propositions",
};

export default function Documents() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeTab = (section as DocumentSection) || 'dashboard';
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { documents, isLoading } = useAgencyDocuments();
  const { documents: commercialDocs, isLoading: commercialLoading } = useCommercialDocuments();

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeTab === 'all' || doc.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DocumentsDashboard />;

      case 'commercial':
        if (commercialLoading) {
          return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
        }
        if (commercialDocs && commercialDocs.length > 0) {
          return (
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
          );
        }
        return (
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
        );

      default:
        return (
          <DocumentList 
            documents={filteredDocuments} 
            isLoading={isLoading} 
          />
        );
    }
  };

  return (
    <PageLayout 
      title="Documents" 
      icon={FileStack}
      description={sectionDescriptions[activeTab]}
      primaryAction={activeTab !== 'dashboard' ? {
        label: "Nouveau document",
        onClick: () => setCreateDialogOpen(true)
      } : undefined}
      actions={activeTab !== 'dashboard' ? (
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      ) : undefined}
    >
      {renderContent()}

      <CreateDocumentDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </PageLayout>
  );
}
