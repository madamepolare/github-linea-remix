import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  Receipt,
  LucideIcon,
  Trophy,
  Rocket,
  ExternalLink
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { QuoteDocument, QuoteLine, phaseToQuoteLine, quoteLineToPhase, DOCUMENT_STATUS_LABELS, DocumentStatus } from '@/types/quoteTypes';
import { cn } from '@/lib/utils';
import { getOrCreatePublicQuoteLink } from '@/lib/publicQuoteLink';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuoteGeneralTab } from '@/components/commercial/quote-builder/QuoteGeneralTab';
import { QuoteLinesEditor } from '@/components/commercial/quote-builder/QuoteLinesEditor';
import { QuoteFeesAndLinesTab } from '@/components/commercial/quote-builder/QuoteFeesAndLinesTab';
import { QuoteProductionTab } from '@/components/commercial/quote-builder/QuoteProductionTab';
import { QuotePlanningTab } from '@/components/commercial/quote-builder/QuotePlanningTab';
import { QuoteInvoicingTab } from '@/components/commercial/quote-builder/QuoteInvoicingTab';
import { QuoteConditionsTab } from '@/components/commercial/quote-builder/QuoteConditionsTab';
import { QuotePreviewPanel } from '@/components/commercial/quote-builder/QuotePreviewPanel';
import { ThemePreviewSelector } from '@/components/commercial/ThemePreviewSelector';
import { isArchitectureContractType, getDefaultMOEConfig } from '@/lib/moeContractDefaults';
import { isCommunicationContractType, getDefaultCommunicationConfig } from '@/lib/communicationContractDefaults';
import { getDefaultConditionsForType, serializeConditions } from '@/lib/contractConditionsUnified';
import { downloadNativeVectorPdf } from '@/lib/generateNativePDF';
import { useQuoteThemes } from '@/hooks/useQuoteThemes';
import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { useCommercialDocuments } from '@/hooks/useCommercialDocuments';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ensureValidProjectType } from '@/lib/projectTypeMapping';
import { useContractTypes, BuilderTab } from '@/hooks/useContractTypes';
import { LineFeatureProvider } from '@/contexts/LineFeatureContext';
import type { Json } from '@/integrations/supabase/types';
import { ConvertQuoteToProjectDialog } from '@/components/commercial/ConvertQuoteToProjectDialog';
import { ConvertQuoteToSubProjectDialog } from '@/components/commercial/ConvertQuoteToSubProjectDialog';
import { CreateProjectFromQuoteDialog } from '@/components/commercial/CreateProjectFromQuoteDialog';
import { SendQuoteDialog } from '@/components/commercial/SendQuoteDialog';
import { FolderPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function QuoteBuilder() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeWorkspace, loading: authLoading } = useAuth();
  
  // Route "/commercial/quote/new" has no :id param, so treat missing id as a new document.
  const isNew = !id || id === 'new';
  const projectId = searchParams.get('project');
  const documentType = searchParams.get('type') || 'quote';
  
  const { createDocument, updateDocument, getDocument, getDocumentPhases, createPhase, updatePhase, deletePhase, acceptAndCreateProject, acceptAndCreateSubProject } = useCommercialDocuments();
  const { agencyInfo } = useAgencyInfo();
  const { themes } = useQuoteThemes();
  
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
  
  // Check if document is linked to a framework project
  const linkedProjectQuery = useQuery({
    queryKey: ['linked-project-type', existingDoc?.project?.id],
    queryFn: async () => {
      if (!existingDoc?.project?.id) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, contract_type, parent_id')
        .eq('id', existingDoc.project.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!existingDoc?.project?.id
  });
  
  // Check if the linked project has a parent that is a framework
  const parentProjectQuery = useQuery({
    queryKey: ['parent-project-framework', linkedProjectQuery.data?.parent_id],
    queryFn: async () => {
      const parentId = linkedProjectQuery.data?.parent_id;
      if (!parentId) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, contract_type')
        .eq('id', parentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!linkedProjectQuery.data?.parent_id
  });

  // Detect if document is linked to a framework project (directly or via a reference project_id pointing to framework)
  // For new quotes linked via URL param, we also check
  const frameworkParentQuery = useQuery({
    queryKey: ['framework-parent-detection', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, contract_type')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });

  const isLinkedToFrameworkProject = 
    linkedProjectQuery.data?.contract_type === 'framework' ||
    parentProjectQuery.data?.contract_type === 'framework' ||
    frameworkParentQuery.data?.contract_type === 'framework';

  const frameworkParentProject = 
    (linkedProjectQuery.data?.contract_type === 'framework' ? linkedProjectQuery.data : null) ||
    parentProjectQuery.data ||
    (frameworkParentQuery.data?.contract_type === 'framework' ? frameworkParentQuery.data : null);
  
  const [activeTab, setActiveTab] = useState('lines');
  const [showPreview, setShowPreview] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showConvertToSubProjectDialog, setShowConvertToSubProjectDialog] = useState(false);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  
  const [document, setDocument] = useState<Partial<QuoteDocument>>({
    document_type: 'quote',
    title: '',
    status: 'draft',
    fee_mode: 'fixed',
    currency: 'EUR',
    validity_days: 30,
    total_amount: 0,
    project_type: 'architecture'
  });
  
  const [lines, setLines] = useState<QuoteLine[]>([]);
  
  // Tab configuration
  const TAB_CONFIG: Record<BuilderTab, { label: string; icon: LucideIcon }> = {
    general: { label: 'Général', icon: FileText },
    fees: { label: 'Honoraires', icon: Percent },
    lines: { label: 'Lignes', icon: List },
    production: { label: 'Production', icon: Package },
    planning: { label: 'Planning', icon: Calendar },
    invoicing: { label: 'Facturation', icon: FileCheck },
    terms: { label: 'Conditions', icon: FileCheck }
  };
  
  // Get enabled tabs from current contract type
  const currentContractType = activeContractTypes.find(t => t.id === document.contract_type_id);
  const baseTabs: BuilderTab[] = currentContractType?.builder_tabs || ['general', 'lines', 'terms'];
  
  // Always include 'invoicing' tab for invoice scheduling
  const enabledTabs: BuilderTab[] = baseTabs.includes('invoicing') 
    ? baseTabs 
    : [...baseTabs.filter(t => t !== 'terms'), 'invoicing', 'terms'];

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
      const docData = {
        ...existingDoc,
        document_type: existingDoc.document_type === 'quote' ? 'quote' : 'quote',
        // Ensure valid project_type
        project_type: ensureValidProjectType(existingDoc.project_type),
        // Ensure invoice_schedule is an array
        invoice_schedule: Array.isArray(existingDoc.invoice_schedule) 
          ? existingDoc.invoice_schedule 
          : []
      };
      setDocument(docData as Partial<QuoteDocument>);
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
    
    // Use unified conditions system for all contract types
    const defaults = getDefaultConditionsForType(code);
    setDocument(prev => ({
      ...prev,
      general_conditions: serializeConditions(defaults)
    }));
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

    // Validate required fields
    const missingFields: string[] = [];
    
    if (!document.title?.trim()) {
      missingFields.push('Titre');
    }
    if (!document.client_company_id) {
      missingFields.push('Client (entreprise)');
    }
    if (!document.contract_type_id) {
      missingFields.push('Type de contrat');
    }
    
    if (missingFields.length > 0) {
      toast.error(`Champs obligatoires manquants : ${missingFields.join(', ')}`);
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
        // Update existing document - include ALL fields including document_type and invoice_schedule
        const projectType = ensureValidProjectType(document.project_type);
        await updateDocument.mutateAsync({
          id,
          document_type: document.document_type,
          title: document.title,
          description: document.description,
          status: document.status,
          project_type: projectType,
          fee_mode: document.fee_mode,
          fee_percentage: document.fee_percentage,
          hourly_rate: document.hourly_rate,
          total_amount: document.total_amount,
          project_id: linkedProjectId,
          client_company_id: document.client_company_id,
          client_contact_id: document.client_contact_id,
          validity_days: document.validity_days,
          payment_terms: document.payment_terms,
          special_conditions: document.special_conditions,
          general_conditions: document.general_conditions,
          project_address: document.project_address,
          project_city: document.project_city,
          project_surface: document.project_surface,
          project_budget: document.project_budget,
          construction_budget: document.construction_budget,
          construction_budget_disclosed: document.construction_budget_disclosed,
          contract_type_id: document.contract_type_id,
          vat_rate: document.vat_rate,
          vat_type: document.vat_type,
          header_text: document.header_text,
          footer_text: document.footer_text,
          invoice_schedule: (document.invoice_schedule || []) as Json,
        });
      }
      
      // Save lines/phases for both new and existing documents - PARALLEL for performance
      if (documentId && lines.length > 0) {
        const saveOperations: Promise<unknown>[] = [];
        
        for (const line of lines) {
          const phaseData = quoteLineToPhase(line);
          phaseData.document_id = documentId;
          
          // Check if this line already exists in the database
          const existsInDb = phases?.some(p => p.id === line.id);
          
          if (existsInDb) {
            saveOperations.push(updatePhase.mutateAsync({ id: line.id, ...phaseData }));
          } else {
            // Create new line (remove id to let DB generate)
            const { id: _lineId, ...phaseDataWithoutId } = phaseData;
            saveOperations.push(createPhase.mutateAsync(phaseDataWithoutId));
          }
        }
        
        // Delete removed lines (only for existing documents)
        if (!isNew && phases) {
          const currentLineIds = lines.map(l => l.id).filter(Boolean);
          const linesToDelete = phases.filter(p => !currentLineIds.includes(p.id));
          for (const line of linesToDelete) {
            saveOperations.push(deletePhase.mutateAsync({ id: line.id, documentId }));
          }
        }
        
        // Execute all save operations in parallel
        await Promise.all(saveOperations);
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
      toast.info('Génération du PDF en cours...');
      
      // Get selected theme
      const selectedTheme = selectedThemeId 
        ? themes.find(t => t.id === selectedThemeId)
        : themes.find(t => t.is_default);
      
      // Agency info for template
      const agencyData = {
        name: agencyInfo?.name,
        logo_url: agencyInfo?.logo_url,
        address: agencyInfo?.address,
        city: agencyInfo?.city,
        postal_code: agencyInfo?.postal_code,
        phone: agencyInfo?.phone,
        email: agencyInfo?.email,
        website: agencyInfo?.website,
        siret: agencyInfo?.siret,
        siren: agencyInfo?.siren,
        vat_number: agencyInfo?.vat_number,
        capital_social: agencyInfo?.capital_social,
        forme_juridique: agencyInfo?.forme_juridique,
        rcs_city: agencyInfo?.rcs_city,
        code_naf: agencyInfo?.code_naf,
      };
      
      const filename = `Devis ${document.document_number || 'brouillon'}`;
      
      // Download native vector PDF (jsPDF + autoTable, no rasterization)
      await downloadNativeVectorPdf(document, lines, agencyData, selectedTheme, filename);
      
      toast.success('PDF téléchargé');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error('Erreur lors du téléchargement du PDF');
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      setShowUnsavedChangesDialog(true);
      return;
    }
    navigate(-1);
  };
  
  const handleConfirmBack = () => {
    setShowUnsavedChangesDialog(false);
    navigate(-1);
  };

  // Handler for converting quote to project
  const handleConvertToProject = async (params: {
    useAIPlanning: boolean;
    projectStartDate?: string;
    projectEndDate?: string;
    selectedPhases: string[];
  }) => {
    if (!id || !phasesQuery.data) throw new Error('No document or phases');
    
    // Filter phases based on selection
    const selectedPhases = phasesQuery.data.filter(p => params.selectedPhases.includes(p.id));
    
    const result = await acceptAndCreateProject.mutateAsync({
      documentId: id,
      phases: selectedPhases,
      useAIPlanning: params.useAIPlanning,
      projectStartDate: params.projectStartDate,
      projectEndDate: params.projectEndDate
    });
    
    // Update local state to reflect accepted status
    setDocument(prev => ({ ...prev, status: 'accepted', accepted_at: new Date().toISOString() }));
    
    return result;
  };

  // Handler for converting quote to sub-project (for framework projects)
  const handleConvertToSubProject = async (params: {
    subProjectName: string;
    deadline?: string;
  }) => {
    if (!id || !frameworkParentProject) throw new Error('No document or parent project');
    
    const result = await acceptAndCreateSubProject.mutateAsync({
      documentId: id,
      parentProjectId: frameworkParentProject.id,
      subProjectName: params.subProjectName,
      deadline: params.deadline
    });
    
    // Update local state to reflect accepted status
    setDocument(prev => ({ ...prev, status: 'accepted', accepted_at: new Date().toISOString() }));
    
    return result;
  };

  // Handle "Gagné" button click - open appropriate dialog based on context
  const handleWonClick = () => {
    if (isLinkedToFrameworkProject && frameworkParentProject) {
      setShowConvertToSubProjectDialog(true);
    } else {
      setShowConvertDialog(true);
    }
  };

  // Check if document is already linked to a project
  const isLinkedToProject = !!document.project?.id;
  const isSigned = document.status === 'signed';
  const isAccepted = document.status === 'accepted';
  // Can convert: not new, not linked to project, not already accepted
  const canConvertToProject = !isNew && !isLinkedToProject && !isAccepted && !isSigned;
  // Can create project from signed quote: signed but no project yet
  const canCreateProjectFromSigned = !isNew && !isLinkedToProject && isSigned;

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
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b bg-card shrink-0 gap-3">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          {/* Document badge */}
          <Badge variant="secondary" className="shrink-0 text-xs">
            Devis
          </Badge>
          
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={document.title || ''}
                onChange={(e) => handleDocumentChange({ title: e.target.value })}
                placeholder={isNew ? 'Titre du projet... *' : 'Édition du devis *'}
                className={cn(
                  "font-semibold text-base sm:text-lg tracking-tight bg-transparent border-0 focus:ring-0 focus:outline-none w-full min-w-0 placeholder:text-muted-foreground",
                  !document.title?.trim() && "placeholder:text-destructive/60"
                )}
                required
              />
              <Select
                value={document.status || 'draft'}
                onValueChange={(v) => handleDocumentChange({ status: v as DocumentStatus })}
              >
                <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs font-medium shrink-0 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          value === 'draft' && "bg-muted-foreground",
                          value === 'sent' && "bg-blue-500",
                          value === 'accepted' && "bg-green-500",
                          value === 'rejected' && "bg-destructive",
                          value === 'expired' && "bg-amber-500",
                          value === 'signed' && "bg-primary"
                        )} />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {document.document_number || 'Brouillon'} {document.client_company?.name ? `• ${document.client_company.name}` : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {/* Toggle preview - icon only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowPreview(!showPreview)}
                className="hidden lg:flex h-8 w-8"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{showPreview ? 'Masquer aperçu' : 'Afficher aperçu'}</TooltipContent>
          </Tooltip>
          
          {/* Download PDF - icon only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleDownloadPDF}
                className="h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Télécharger PDF</TooltipContent>
          </Tooltip>
          
          {/* Public link - icon only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={async () => {
                  try {
                    if (!document.id || !document.workspace_id) return;
                    const url = await getOrCreatePublicQuoteLink({
                      documentId: document.id,
                      workspaceId: document.workspace_id,
                    });
                    await navigator.clipboard.writeText(url);
                    toast.success('Lien client copié !');
                  } catch (e) {
                    console.error(e);
                    toast.error('Impossible de générer le lien');
                  }
                }}
                disabled={isNew}
                className="h-8 w-8"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copier le lien client</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-5 mx-1" />
          
          {/* Save button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={!canClickSave}
                title={!activeWorkspace ? 'Aucun workspace actif' : authLoading ? 'Chargement de session…' : undefined}
                className="h-8 w-8"
              >
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</TooltipContent>
          </Tooltip>
          
          {/* "Gagné" button - marks as accepted and offers project/sub-project creation */}
          {canConvertToProject && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="default"
                  size="icon"
                  onClick={handleWonClick}
                  className="h-8 w-8 bg-green-600 hover:bg-green-700"
                >
                  <Trophy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isLinkedToFrameworkProject ? 'Valider' : 'Gagné'}</TooltipContent>
            </Tooltip>
          )}
          
          {/* Create project from signed quote */}
          {canCreateProjectFromSigned && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="default"
                  size="icon"
                  onClick={() => setShowCreateProjectDialog(true)}
                  className="h-8 w-8"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Créer le projet</TooltipContent>
            </Tooltip>
          )}
          
          {/* Link to project if already converted */}
          {isLinkedToProject && document.project?.id && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/projects/${document.project?.id}`)}
                  className="h-8 w-8"
                >
                  <Rocket className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voir projet</TooltipContent>
            </Tooltip>
          )}
          
          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              <DropdownMenuItem onClick={() => setShowSendDialog(true)} disabled={isNew}>
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

      {/* Locked document banner */}
      {isLinkedToProject && (
        <div className="px-3 sm:px-6 py-2 bg-green-50 border-b border-green-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <Badge variant="outline" className="bg-green-100 border-green-300 text-green-700">
              <Rocket className="h-3 w-3 mr-1" />
              Projet créé
            </Badge>
            <span className="text-sm">
              Ce devis est lié au projet <strong>{document.project?.name || 'Sans nom'}</strong>
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/projects/${document.project?.id}`)}
            className="text-green-700 hover:text-green-800 hover:bg-green-100"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Voir le projet
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel */}
        <div className={`flex flex-col ${showPreview ? 'w-full lg:w-[45%]' : 'w-full'} border-r bg-background`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
            <div className="px-4 sm:px-6 py-3 border-b bg-card shrink-0 overflow-x-auto">
              <TabsList className="h-9 w-max bg-muted/50 p-1 rounded-lg gap-0.5">
                {processedTabs.map(tabId => {
                  const config = TAB_CONFIG[tabId];
                  const Icon = config.icon;
                  // Show line count for fees tab when it includes lines
                  const showLineCount = tabId === 'fees' && hasBothFeesAndLines && lines.length > 0;
                  const showLinesCount = tabId === 'lines' && lines.length > 0;
                  return (
                    <TabsTrigger 
                      key={tabId} 
                      value={tabId} 
                      className="gap-1.5 px-3 text-xs font-medium rounded-md h-7 border-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{config.label}</span>
                      {(showLineCount || showLinesCount) && (
                        <span className="ml-0.5 text-2xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                          {lines.length}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <ScrollArea className="flex-1 bg-muted/10">
              {processedTabs.includes('general') && (
                <TabsContent value="general" className="m-0 p-4 sm:p-6">
                  <QuoteGeneralTab 
                    document={document}
                    onDocumentChange={handleDocumentChange}
                    linkedProjectId={linkedProjectId}
                    onLinkedProjectChange={setLinkedProjectId}
                  />
                </TabsContent>
              )}

              {processedTabs.includes('fees') && (
                <TabsContent value="fees" className="m-0 p-4 sm:p-6">
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
                <TabsContent value="lines" className="m-0 p-4 sm:p-6">
                  <QuoteLinesEditor
                    lines={lines}
                    onLinesChange={handleLinesChange}
                    document={document}
                    onDocumentChange={handleDocumentChange}
                  />
                </TabsContent>
              )}

              {processedTabs.includes('production') && (
                <TabsContent value="production" className="m-0 p-4 sm:p-6">
                  <QuoteProductionTab 
                    document={document}
                    onDocumentChange={handleDocumentChange}
                    lines={lines}
                    onLinesChange={handleLinesChange}
                  />
                </TabsContent>
              )}

              {processedTabs.includes('planning') && (
                <TabsContent value="planning" className="m-0 p-4 sm:p-6">
                  <QuotePlanningTab 
                    document={document}
                    onDocumentChange={handleDocumentChange}
                    lines={lines}
                    onLinesChange={handleLinesChange}
                  />
                </TabsContent>
              )}

              {processedTabs.includes('invoicing') && (
                <TabsContent value="invoicing" className="m-0 p-4 sm:p-6">
                  <QuoteInvoicingTab 
                    document={document}
                    onDocumentChange={handleDocumentChange}
                    lines={lines}
                  />
                </TabsContent>
              )}

              {processedTabs.includes('terms') && (
                <TabsContent value="terms" className="m-0 p-4 sm:p-6">
                  <QuoteConditionsTab
                    document={document}
                    onDocumentChange={handleDocumentChange}
                    contractTypeConfig={currentContractType}
                  />
                </TabsContent>
              )}
            </ScrollArea>
          </Tabs>
        </div>

        {/* Preview Panel - Hidden on mobile */}
        {showPreview && (
          <div className="hidden lg:flex lg:w-[55%] flex-col bg-muted/20 border-l min-w-0">
            <div className="flex items-center justify-between px-2 xl:px-4 py-2 border-b bg-card shrink-0">
              <span className="text-xs xl:text-sm font-medium text-muted-foreground">Aperçu</span>
              <div className="flex items-center gap-1 xl:gap-2">
                {/* Theme Selector */}
                <ThemePreviewSelector
                  selectedThemeId={selectedThemeId}
                  onThemeChange={setSelectedThemeId}
                  compact
                />
                <Separator orientation="vertical" className="h-4 xl:h-5" />
                {/* Zoom Controls */}
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                  >
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-8 text-center tabular-nums">{zoom}%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setZoom(Math.min(150, zoom + 10))}
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <QuotePreviewPanel 
                document={document} 
                lines={lines} 
                zoom={zoom}
                selectedThemeId={selectedThemeId}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Convert to project dialog (for standard projects) */}
      <ConvertQuoteToProjectDialog
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
        document={document as QuoteDocument}
        lines={lines}
        onConvert={handleConvertToProject}
      />

      {/* Convert to sub-project dialog (for framework projects) */}
      {frameworkParentProject && (
        <ConvertQuoteToSubProjectDialog
          open={showConvertToSubProjectDialog}
          onOpenChange={setShowConvertToSubProjectDialog}
          document={document as QuoteDocument}
          lines={lines}
          parentProject={frameworkParentProject}
          onConvert={handleConvertToSubProject}
        />
      )}
      
      {/* Create project from signed quote - simplified dialog */}
      <CreateProjectFromQuoteDialog
        open={showCreateProjectDialog}
        onOpenChange={setShowCreateProjectDialog}
        document={document as QuoteDocument}
        lines={lines}
        onConvert={handleConvertToProject}
      />
      
      {/* Send quote dialog */}
      <SendQuoteDialog
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
        document={document as QuoteDocument}
        onSent={() => {
          // Refresh document to get updated sent_at status
          documentQuery.refetch();
        }}
      />
      
      {/* Unsaved changes confirmation dialog */}
      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non enregistrées</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter sans sauvegarder ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBack} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Quitter sans sauvegarder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </LineFeatureProvider>
  );
}