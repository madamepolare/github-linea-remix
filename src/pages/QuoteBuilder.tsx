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
  Trash2,
  AlertCircle,
  RefreshCw,
  Percent,
  Package,
  Calendar,
  LucideIcon
} from 'lucide-react';
import { QuoteDocument, QuoteLine, phaseToQuoteLine, quoteLineToPhase, DOCUMENT_STATUS_LABELS } from '@/types/quoteTypes';
import { QuoteGeneralTab } from '@/components/commercial/quote-builder/QuoteGeneralTab';
import { QuoteLinesEditor } from '@/components/commercial/quote-builder/QuoteLinesEditor';
import { QuoteFeesAndLinesTab } from '@/components/commercial/quote-builder/QuoteFeesAndLinesTab';
import { QuoteProductionTab } from '@/components/commercial/quote-builder/QuoteProductionTab';
import { QuotePlanningTab } from '@/components/commercial/quote-builder/QuotePlanningTab';
import { QuoteTermsTab } from '@/components/commercial/quote-builder/QuoteTermsTab';
import { QuoteMOETermsTab } from '@/components/commercial/quote-builder/QuoteMOETermsTab';
import { QuoteCommunicationTermsTab } from '@/components/commercial/quote-builder/QuoteCommunicationTermsTab';
import { QuotePreviewPanel } from '@/components/commercial/quote-builder/QuotePreviewPanel';
import { QuoteMOEPreviewPanel } from '@/components/commercial/quote-builder/QuoteMOEPreviewPanel';
import { QuoteCommunicationPreviewPanel } from '@/components/commercial/quote-builder/QuoteCommunicationPreviewPanel';
import { isArchitectureContractType, COMMUNICATION_CONTRACT_CODES, getDefaultMOEConfig } from '@/lib/moeContractDefaults';
import { isCommunicationContractType, getDefaultCommunicationConfig } from '@/lib/communicationContractDefaults';
import { generateQuotePDFSimple } from '@/lib/generateQuotePDFSimple';
import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { useCommercialDocuments } from '@/hooks/useCommercialDocuments';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ensureValidProjectType } from '@/lib/projectTypeMapping';
import { useContractTypes, BuilderTab } from '@/hooks/useContractTypes';
import { LineFeatureProvider } from '@/contexts/LineFeatureContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function QuoteBuilder() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeWorkspace, loading: authLoading } = useAuth();
  
  // Route "/commercial/quote/new" has no :id param, so treat missing id as a new document.
  const isNew = !id || id === 'new';
  const projectId = searchParams.get('project');
  const documentType = searchParams.get('type') || 'quote';
  
  const { createDocument, updateDocument, getDocument, getDocumentPhases, createPhase, updatePhase, deletePhase } = useCommercialDocuments();
  const { agencyInfo } = useAgencyInfo();
  
  // Use getDocument from the hook for existing documents
  const documentQuery = getDocument(isNew ? '' : (id || ''));
  const existingDoc = isNew ? null : documentQuery.data;
  const isLoadingDoc = isNew ? false : documentQuery.isLoading;
  const docError = isNew ? null : documentQuery.error;
  
  // Get phases for existing documents
  const phasesQuery = getDocumentPhases(isNew ? '' : (id || ''));
  const phases = phasesQuery.data;
  
  // Get contract types for dynamic tabs
  const { activeContractTypes } = useContractTypes();
  
  const [activeTab, setActiveTab] = useState('general');
  const [showPreview, setShowPreview] = useState(true);
  const [zoom, setZoom] = useState(70);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [document, setDocument] = useState<Partial<QuoteDocument>>({
    document_type: (documentType === 'quote' || documentType === 'contract') ? documentType : 'contract',
    title: '',
    status: 'draft',
    fee_mode: 'fixed',
    currency: 'EUR',
    validity_days: 30,
    total_amount: 0,
    project_type: 'architecture' // Default to architecture for contracts
  });
  
  const [lines, setLines] = useState<QuoteLine[]>([]);
  
  // Tab configuration
  const TAB_CONFIG: Record<BuilderTab, { label: string; icon: LucideIcon }> = {
    general: { label: 'Général', icon: FileText },
    fees: { label: 'Honoraires', icon: Percent },
    lines: { label: 'Lignes', icon: List },
    production: { label: 'Production', icon: Package },
    planning: { label: 'Planning', icon: Calendar },
    terms: { label: 'Conditions', icon: FileCheck }
  };
  
  // Get enabled tabs from current contract type
  const currentContractType = activeContractTypes.find(t => t.id === document.contract_type_id);
  const enabledTabs: BuilderTab[] = currentContractType?.builder_tabs || ['general', 'lines', 'terms'];

  // Merge fees and lines into single tab when both are enabled
  const hasBothFeesAndLines = currentContractType?.builder_tabs?.includes('fees') && currentContractType?.builder_tabs?.includes('lines');
  const processedTabs: BuilderTab[] = hasBothFeesAndLines
    ? enabledTabs.filter(tab => tab !== 'lines') // Remove 'lines', keep 'fees' which will show combined UI
    : enabledTabs;
  
  // Store project_id separately for the save operation
  const [linkedProjectId, setLinkedProjectId] = useState<string | undefined>(projectId || undefined);

  // Load existing document from direct fetch (not from list)
  useEffect(() => {
    if (!isNew && existingDoc) {
      setDocument({
        ...existingDoc,
        document_type: (existingDoc.document_type === 'quote' || existingDoc.document_type === 'contract') 
          ? existingDoc.document_type 
          : 'contract',
        // Ensure valid project_type
        project_type: ensureValidProjectType(existingDoc.project_type)
      });
      if (existingDoc.project?.id) {
        setLinkedProjectId(existingDoc.project.id);
      }
    }
  }, [existingDoc, isNew]);

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

  // Reset active tab if it becomes unavailable
  useEffect(() => {
    if (!processedTabs.includes(activeTab as BuilderTab)) {
      setActiveTab('general');
    }
  }, [processedTabs, activeTab]);

  // Initialize default conditions when contract type changes
  useEffect(() => {
    if (!currentContractType || document.general_conditions) return;
    
    const code = currentContractType.code || '';
    
    if (isArchitectureContractType(code)) {
      // Initialize with MOE defaults if not already set
      const moeDefaults = getDefaultMOEConfig();
      setDocument(prev => ({
        ...prev,
        general_conditions: JSON.stringify(moeDefaults)
      }));
    } else if (isCommunicationContractType(code)) {
      // Initialize with Communication defaults
      const comDefaults = getDefaultCommunicationConfig();
      setDocument(prev => ({
        ...prev,
        general_conditions: JSON.stringify(comDefaults)
      }));
    }
  }, [currentContractType?.id]);

  const handleSave = async () => {
    // Wait for auth to be ready
    if (authLoading) {
      toast.error("Chargement en cours, veuillez patienter...");
      return;
    }
    
    if (!activeWorkspace) {
      toast.error("Aucun workspace actif — reconnectez-vous si besoin.");
      return;
    }

    console.info('[QuoteBuilder] handleSave start, workspace:', activeWorkspace.id, activeWorkspace.name);
    
    setIsSaving(true);
    try {
      let documentId = id;
      let createdDocNumber: string | undefined;
      
      // Ensure valid project_type
      const projectType = ensureValidProjectType(document.project_type);
      
      if (isNew) {
        // Create new document
        const newDoc = await createDocument.mutateAsync({
          document_type: document.document_type || 'quote',
          title: document.title || 'Nouveau devis',
          project_type: projectType,
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
          contract_type_id: document.contract_type_id,
        });
        documentId = newDoc.id;
        createdDocNumber = newDoc.document_number;
        console.info('[QuoteBuilder] Created new doc', documentId, createdDocNumber);
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
          contract_type_id: document.contract_type_id,
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
      
      setHasChanges(false);
      
      // For new documents, navigate to the created document page (not list)
      if (isNew && documentId) {
        toast.success(`Devis ${createdDocNumber || ''} créé`);
        navigate(`/commercial/quote/${documentId}`, { replace: true });
      } else {
        toast.success('Devis enregistré');
      }
    } catch (error) {
      console.error('[QuoteBuilder] Error saving quote:', error);
      const msg = error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.info('Génération du PDF...');
      const blob = await generateQuotePDFSimple(document, lines, agencyInfo);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document.document_type === 'quote' ? 'devis' : 'contrat'}-${document.document_number || 'brouillon'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('PDF téléchargé');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Erreur lors de la génération du PDF');
    }
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

  // Show loading state for existing documents
  if (!isNew && isLoadingDoc) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement du document...</p>
        </div>
      </div>
    );
  }

  // Show error state if document not found
  if (!isNew && docError) {
    return (
      <div className="h-full flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold">Document introuvable</h2>
          <p className="text-muted-foreground text-sm">
            Ce document n'existe pas ou n'est pas accessible depuis votre workspace actuel.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate('/commercial/quotes')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
            <Button onClick={() => documentQuery.refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Allow clicking Save even if auth/workspace still loading so we can show a clear message.
  const canClickSave = !isSaving;

  return (
    <LineFeatureProvider contractType={currentContractType}>
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
            {(authLoading || !activeWorkspace) && (
              <p className="text-xs text-muted-foreground">
                {authLoading
                  ? 'Session en cours de chargement…'
                  : 'Aucun workspace actif — veuillez vous reconnecter.'}
              </p>
            )}
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
            disabled={!canClickSave}
            title={!activeWorkspace ? 'Aucun workspace actif' : authLoading ? 'Chargement de session…' : undefined}
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
                {processedTabs.map(tabId => {
                  const config = TAB_CONFIG[tabId];
                  const Icon = config.icon;
                  // Show line count for fees tab when it includes lines
                  const showLineCount = tabId === 'fees' && hasBothFeesAndLines && lines.length > 0;
                  const showLinesCount = tabId === 'lines' && lines.length > 0;
                  return (
                    <TabsTrigger key={tabId} value={tabId} className="gap-2 px-4">
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{config.label}</span>
                      {(showLineCount || showLinesCount) && (
                        <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                          {lines.length}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              {processedTabs.includes('general') && (
                <TabsContent value="general" className="m-0 p-6">
                  <QuoteGeneralTab 
                    document={document}
                    onDocumentChange={handleDocumentChange}
                    linkedProjectId={linkedProjectId}
                    onLinkedProjectChange={setLinkedProjectId}
                  />
                </TabsContent>
              )}

              {processedTabs.includes('fees') && (
                <TabsContent value="fees" className="m-0 p-6">
                  <QuoteFeesAndLinesTab 
                    document={document}
                    onDocumentChange={handleDocumentChange}
                    lines={lines}
                    onLinesChange={handleLinesChange}
                    showFeesSubTab={hasBothFeesAndLines}
                  />
                </TabsContent>
              )}

              {processedTabs.includes('lines') && !hasBothFeesAndLines && (
                <TabsContent value="lines" className="m-0 p-6">
                  <QuoteLinesEditor
                    lines={lines}
                    onLinesChange={handleLinesChange}
                    document={document}
                    onDocumentChange={handleDocumentChange}
                  />
                </TabsContent>
              )}

              {processedTabs.includes('production') && (
                <TabsContent value="production" className="m-0 p-6">
                  <QuoteProductionTab 
                    document={document}
                    onDocumentChange={handleDocumentChange}
                    lines={lines}
                    onLinesChange={handleLinesChange}
                  />
                </TabsContent>
              )}

              {processedTabs.includes('planning') && (
                <TabsContent value="planning" className="m-0 p-6">
                  <QuotePlanningTab 
                    document={document}
                    onDocumentChange={handleDocumentChange}
                    lines={lines}
                    onLinesChange={handleLinesChange}
                  />
                </TabsContent>
              )}

              {processedTabs.includes('terms') && (
                <TabsContent value="terms" className="m-0 p-6">
                  {isArchitectureContractType(currentContractType?.code || document.project_type || '') ? (
                    <QuoteMOETermsTab
                      document={document}
                      onDocumentChange={handleDocumentChange}
                      contractTypeConfig={currentContractType}
                    />
                  ) : isCommunicationContractType(currentContractType?.code || '') ? (
                    <QuoteCommunicationTermsTab
                      document={document}
                      onDocumentChange={handleDocumentChange}
                      contractTypeConfig={currentContractType}
                    />
                  ) : (
                    <QuoteTermsTab
                      document={document}
                      onDocumentChange={handleDocumentChange}
                    />
                  )}
                </TabsContent>
              )}
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
              {/* Use document_type to determine preview: quote = simple, contract = PDF multi-page */}
              {document.document_type === 'contract' ? (
                isArchitectureContractType(currentContractType?.code || document.project_type || '') ? (
                  <QuoteMOEPreviewPanel
                    document={document}
                    lines={lines}
                    zoom={zoom / 100}
                  />
                ) : isCommunicationContractType(currentContractType?.code || '') ? (
                  <QuoteCommunicationPreviewPanel
                    document={document}
                    lines={lines}
                    zoom={zoom / 100}
                  />
                ) : (
                  <QuotePreviewPanel
                    document={document}
                    lines={lines}
                    zoom={zoom}
                  />
                )
              ) : (
                <QuotePreviewPanel
                  document={document}
                  lines={lines}
                  zoom={zoom}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </LineFeatureProvider>
  );
}