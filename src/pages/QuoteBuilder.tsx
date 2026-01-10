import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  List, 
  FileCheck, 
  ArrowLeft, 
  Save, 
  Download,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  MoreHorizontal,
  Send,
  Copy,
  Trash2
} from 'lucide-react';
import { QuoteDocument, QuoteLine, phaseToQuoteLine, quoteLineToPhase, DOCUMENT_STATUS_LABELS } from '@/types/quoteTypes';
import { QuoteGeneralTab } from '@/components/commercial/quote-builder/QuoteGeneralTab';
import { QuoteLinesEditor } from '@/components/commercial/quote-builder/QuoteLinesEditor';
import { QuoteTermsTab } from '@/components/commercial/quote-builder/QuoteTermsTab';
import { QuotePreviewPanel } from '@/components/commercial/quote-builder/QuotePreviewPanel';
import { useCommercialDocuments } from '@/hooks/useCommercialDocuments';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function QuoteBuilder() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeWorkspace } = useAuth();
  
  const isNew = id === 'new';
  const projectId = searchParams.get('project');
  const documentType = searchParams.get('type') || 'quote';
  
  const { documents, createDocument, updateDocument, getDocumentPhases, createPhase, updatePhase, deletePhase } = useCommercialDocuments();
  
  // Get phases for existing documents
  const phasesQuery = getDocumentPhases(isNew ? '' : (id || ''));
  const phases = phasesQuery.data;
  
  const [activeTab, setActiveTab] = useState('general');
  const [showPreview, setShowPreview] = useState(true);
  const [zoom, setZoom] = useState(70);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [document, setDocument] = useState<Partial<QuoteDocument>>({
    document_type: documentType as 'quote' | 'contract' | 'proposal',
    title: '',
    status: 'draft',
    fee_mode: 'fixed',
    currency: 'EUR',
    validity_days: 30,
    total_amount: 0,
    project_type: 'general'
  });
  
  const [lines, setLines] = useState<QuoteLine[]>([]);
  
  // Store project_id separately for the save operation
  const [linkedProjectId, setLinkedProjectId] = useState<string | undefined>(projectId || undefined);

  // Load existing document
  useEffect(() => {
    if (!isNew && id && documents) {
      const existingDoc = documents.find(d => d.id === id);
      if (existingDoc) {
        setDocument({
          ...existingDoc,
          document_type: existingDoc.document_type as 'quote' | 'contract' | 'proposal'
        });
        if (existingDoc.project?.id) {
          setLinkedProjectId(existingDoc.project.id);
        }
      }
    }
  }, [id, isNew, documents]);

  // Load existing phases as lines
  useEffect(() => {
    if (phases && phases.length > 0) {
      setLines(phases.map((phase, index) => phaseToQuoteLine(phase, index)));
    }
  }, [phases]);

  // Calculate totals whenever lines change
  useEffect(() => {
    const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount');
    const discountLines = lines.filter(l => l.line_type === 'discount');
    
    const subtotal = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
    const totalDiscount = discountLines.reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);
    const total = subtotal - totalDiscount;
    
    setDocument(prev => ({ ...prev, total_amount: total }));
    setHasChanges(true);
  }, [lines]);

  const handleDocumentChange = (updates: Partial<QuoteDocument>) => {
    setDocument(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleLinesChange = (newLines: QuoteLine[]) => {
    setLines(newLines);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!activeWorkspace) {
      toast.error("Aucun workspace actif — reconnectez-vous si besoin.");
      return;
    }
    
    setIsSaving(true);
    try {
      let documentId = id;
      let isNewDoc = isNew;
      
      if (isNew) {
        // Create new document
        const newDoc = await createDocument.mutateAsync({
          document_type: document.document_type || 'quote',
          title: document.title || 'Nouveau devis',
          project_type: (document.project_type || 'general') as any,
          fee_mode: document.fee_mode || 'fixed',
          description: document.description,
          client_company_id: document.client_company_id,
          client_contact_id: document.client_contact_id,
          validity_days: document.validity_days || 30,
          payment_terms: document.payment_terms,
          special_conditions: document.special_conditions,
          general_conditions: document.general_conditions,
          project_address: document.project_address,
          project_city: document.project_city,
          project_surface: document.project_surface,
          project_budget: document.project_budget,
        });
        documentId = newDoc.id;
        isNewDoc = false;
      } else if (id) {
        // Update existing document
        await updateDocument.mutateAsync({
          id,
          title: document.title,
          status: document.status,
          fee_mode: document.fee_mode,
          total_amount: document.total_amount,
          project_id: linkedProjectId,
          description: document.description,
          client_company_id: document.client_company_id,
          client_contact_id: document.client_contact_id,
          payment_terms: document.payment_terms,
          special_conditions: document.special_conditions,
          general_conditions: document.general_conditions,
          project_address: document.project_address,
          project_city: document.project_city,
          project_surface: document.project_surface,
          project_budget: document.project_budget,
        });
      }
      
      // Save lines/phases for both new and existing documents
      if (documentId && lines.length > 0) {
        for (const line of lines) {
          const phaseData = quoteLineToPhase(line);
          phaseData.document_id = documentId;
          
          // Check if this line already exists in the database
          const existsInDb = phases?.some(p => p.id === line.id);
          
          if (existsInDb) {
            await updatePhase.mutateAsync({ id: line.id, ...phaseData });
          } else {
            // Create new line (remove id to let DB generate)
            const { id: _lineId, ...phaseDataWithoutId } = phaseData;
            await createPhase.mutateAsync(phaseDataWithoutId);
          }
        }
        
        // Delete removed lines (only for existing documents)
        if (!isNew && phases) {
          const currentLineIds = lines.map(l => l.id).filter(Boolean);
          const linesToDelete = phases.filter(p => !currentLineIds.includes(p.id));
          for (const line of linesToDelete) {
            await deletePhase.mutateAsync({ id: line.id, documentId });
          }
        }
      }
      
      // Navigate after saving everything for new documents
      if (isNew && documentId) {
        navigate(`/commercial/quote/${documentId}`, { replace: true });
      }
      
      setHasChanges(false);
      toast.success('Devis enregistré');
    } catch (error) {
      console.error('Error saving quote:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    toast.info('Génération PDF à venir');
  };

  const handleBack = () => {
    if (hasChanges) {
      // TODO: Add confirmation dialog
    }
    navigate(-1);
  };

  const statusVariant = document.status === 'accepted' ? 'default' : 
                        document.status === 'sent' ? 'secondary' : 
                        document.status === 'rejected' ? 'destructive' : 'outline';

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">
                {isNew ? 'Nouveau devis' : document.title || 'Édition du devis'}
              </h1>
              {document.status && (
                <Badge variant={statusVariant} className="text-xs">
                  {DOCUMENT_STATUS_LABELS[document.status]}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {document.document_number || 'Brouillon'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="hidden lg:flex"
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? 'Masquer aperçu' : 'Afficher aperçu'}
          </Button>
          
          <Separator orientation="vertical" className="h-6 hidden lg:block" />
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownloadPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          
          <Button 
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Send className="h-4 w-4 mr-2" />
                Envoyer au client
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel */}
        <div className={`flex flex-col ${showPreview ? 'w-full lg:w-[60%]' : 'w-full'} border-r`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
            <div className="px-4 pt-4 pb-0 border-b bg-muted/30 shrink-0">
              <TabsList className="h-10">
                <TabsTrigger value="general" className="gap-2 px-4">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Général</span>
                </TabsTrigger>
                <TabsTrigger value="lines" className="gap-2 px-4">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Lignes</span>
                  {lines.length > 0 && (
                    <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                      {lines.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="terms" className="gap-2 px-4">
                  <FileCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Conditions</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <TabsContent value="general" className="m-0 p-6">
                <QuoteGeneralTab 
                  document={document}
                  onDocumentChange={handleDocumentChange}
                />
              </TabsContent>

              <TabsContent value="lines" className="m-0 p-6">
                <QuoteLinesEditor
                  lines={lines}
                  onLinesChange={handleLinesChange}
                  document={document}
                  onDocumentChange={handleDocumentChange}
                />
              </TabsContent>

              <TabsContent value="terms" className="m-0 p-6">
                <QuoteTermsTab
                  document={document}
                  onDocumentChange={handleDocumentChange}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Preview Panel - Hidden on mobile */}
        {showPreview && (
          <div className="hidden lg:flex w-[40%] flex-col bg-muted/30">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
              <span className="text-sm font-medium">Aperçu</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <QuotePreviewPanel
                document={document}
                lines={lines}
                zoom={zoom}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
