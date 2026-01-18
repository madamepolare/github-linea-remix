import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Send, FileDown, Eye, FileText, CheckCircle, FolderPlus, ExternalLink, Sparkles, Calendar, History } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCommercialDocuments } from '@/hooks/useCommercialDocuments';
import { CommercialDocumentBuilder } from '@/components/commercial/CommercialDocumentBuilder';
import { DocumentPreviewPanel } from '@/components/commercial/DocumentPreviewPanel';
import { PDFPreviewDialog } from '@/components/commercial/PDFPreviewDialog';
import { DocumentVersionHistory } from '@/components/commercial/DocumentVersionHistory';
import { ThemePreviewSelector } from '@/components/commercial/ThemePreviewSelector';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  DocumentType, 
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  CommercialDocument as CommercialDocumentType,
  CommercialDocumentPhase
} from '@/lib/commercialTypes';

const CommercialDocument = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const initialType = (searchParams.get('type') as DocumentType) || 'quote';

  const { 
    getDocument, 
    getDocumentPhases,
    createDocument, 
    updateDocument,
    acceptAndCreateProject,
    createPhase,
    updatePhase,
    deletePhase
  } = useCommercialDocuments();

  // Always call hooks unconditionally with the id, they handle enabled state internally
  const documentQuery = getDocument(isNew ? '' : (id || ''));
  const phasesQuery = getDocumentPhases(isNew ? '' : (id || ''));

  const [showPreview, setShowPreview] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  
  // State for project creation dialog
  const [useAIPlanning, setUseAIPlanning] = useState(true);
  const [projectStartDate, setProjectStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectEndDate, setProjectEndDate] = useState('');

  // Local state for document being edited
  const [documentData, setDocumentData] = useState<Partial<CommercialDocumentType>>({
    document_type: initialType,
    title: '',
    project_type: 'interior',
    fee_mode: 'fixed',
    fee_percentage: 10,
    validity_days: 30,
    status: 'draft',
    total_amount: 0
  });

  const [phases, setPhases] = useState<CommercialDocumentPhase[]>([]);

  // Load existing document data
  useEffect(() => {
    if (documentQuery.data) {
      setDocumentData(documentQuery.data);
    }
  }, [documentQuery.data]);

  useEffect(() => {
    if (phasesQuery.data) {
      setPhases(phasesQuery.data);
    }
  }, [phasesQuery.data]);

  const savePhases = async (documentId: string, existingPhases: CommercialDocumentPhase[]) => {
    try {
      // Get existing phase IDs
      const existingIds = new Set(existingPhases.map(p => p.id));
      const currentIds = new Set(phases.filter(p => p.id && !p.id.startsWith('temp-')).map(p => p.id));
      
      // Delete removed phases
      for (const existingPhase of existingPhases) {
        if (!currentIds.has(existingPhase.id)) {
          await deletePhase.mutateAsync({ id: existingPhase.id, documentId });
        }
      }
      
      // Create or update phases
      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        // Ensure deliverables is always an array
        const deliverables = Array.isArray(phase.deliverables) ? phase.deliverables : [];
        
        if (!phase.id || phase.id.startsWith('temp-') || !existingIds.has(phase.id)) {
          // Create new phase
          await createPhase.mutateAsync({
            document_id: documentId,
            phase_code: phase.phase_code || '',
            phase_name: phase.phase_name || '',
            phase_description: phase.phase_description || undefined,
            percentage_fee: phase.percentage_fee ?? 0,
            amount: phase.amount ?? 0,
            is_included: phase.is_included ?? true,
            deliverables,
            sort_order: i
          });
        } else {
          // Update existing phase
          await updatePhase.mutateAsync({
            id: phase.id,
            phase_code: phase.phase_code || '',
            phase_name: phase.phase_name || '',
            phase_description: phase.phase_description || undefined,
            percentage_fee: phase.percentage_fee ?? 0,
            amount: phase.amount ?? 0,
            is_included: phase.is_included ?? true,
            deliverables,
            sort_order: i
          });
        }
      }
    } catch (error) {
      console.error('Error saving phases:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isNew) {
        const result = await createDocument.mutateAsync({
          document_type: documentData.document_type!,
          title: documentData.title || `Nouveau ${DOCUMENT_TYPE_LABELS[documentData.document_type!]}`,
          description: documentData.description,
          client_company_id: documentData.client_company_id,
          client_contact_id: documentData.client_contact_id,
          project_type: documentData.project_type!,
          project_address: documentData.project_address,
          project_city: documentData.project_city,
          project_surface: documentData.project_surface,
          project_budget: documentData.project_budget,
          fee_mode: documentData.fee_mode,
          fee_percentage: documentData.fee_percentage,
          hourly_rate: documentData.hourly_rate,
          validity_days: documentData.validity_days,
          payment_terms: documentData.payment_terms,
          special_conditions: documentData.special_conditions,
          general_conditions: documentData.general_conditions
        });
        
        // Save phases for new document
        if (phases.length > 0) {
          await savePhases(result.id, []);
        }
        
        navigate(`/commercial/${result.id}`, { replace: true });
      } else {
        // Only send valid columns, not joined objects
        const { client_company, client_contact, project, ...updateData } = documentData as any;
        await updateDocument.mutateAsync({
          id: id!,
          ...updateData,
          total_amount: calculateTotal()
        });
        
        // Save phases for existing document
        const existingPhases = phasesQuery.data || [];
        await savePhases(id!, existingPhases);
      }
    } catch (error) {
      console.error('Error saving document:', error);
      // Error toast is already shown by the mutations
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotal = () => {
    // Always calculate from phases amounts first
    const phasesTotal = phases
      .filter(p => p.is_included)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    if (phasesTotal > 0) {
      return phasesTotal;
    }

    // Fallback to percentage calculation if phases have no direct amounts
    if (documentData.fee_mode === 'percentage' && documentData.construction_budget && documentData.fee_percentage) {
      const baseFee = documentData.construction_budget * (documentData.fee_percentage / 100);
      return baseFee;
    }
    
    // Use stored total_amount as last resort
    return documentData.total_amount || 0;
  };

  if (!isNew && documentQuery.isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-border bg-card gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/commercial')} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-9 w-9 rounded-full bg-muted/80 flex items-center justify-center shrink-0">
              <FileText className="h-[18px] w-[18px] text-foreground/70" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold truncate">
                {isNew ? `Nouveau ${DOCUMENT_TYPE_LABELS[documentData.document_type!]}` : documentData.document_number}
              </h1>
              <p className="text-sm text-muted-foreground truncate">
                {documentData.title || 'Sans titre'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{showPreview ? 'Masquer' : 'Aperçu'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPDFPreview(true)}>
              <FileDown className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </Button>
            {!isNew && documentData.status === 'draft' && (
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Send className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Envoyer</span>
              </Button>
            )}
            {!isNew && documentData.status !== 'accepted' && documentData.status !== 'signed' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Accepter & Créer projet</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Accepter le document et créer un projet ?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-4">
                        <div>
                          Cette action va :
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Marquer le {DOCUMENT_TYPE_LABELS[documentData.document_type!]} comme accepté</li>
                            <li>Créer un nouveau projet avec les informations du document</li>
                            <li>Importer les {phases.filter(p => p.is_included).length} phases du devis comme phases du projet</li>
                          </ul>
                        </div>
                        
                        <div className="pt-4 border-t border-border space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <Label htmlFor="ai-planning" className="font-medium">
                                Planification IA
                              </Label>
                            </div>
                            <Switch
                              id="ai-planning"
                              checked={useAIPlanning}
                              onCheckedChange={setUseAIPlanning}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            L'IA va suggérer automatiquement les dates de début et fin de chaque phase en fonction de la durée du projet
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="start-date" className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                Date de début
                              </Label>
                              <Input
                                id="start-date"
                                type="date"
                                value={projectStartDate}
                                onChange={(e) => setProjectStartDate(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="end-date" className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                Date de fin
                              </Label>
                              <Input
                                id="end-date"
                                type="date"
                                value={projectEndDate}
                                onChange={(e) => setProjectEndDate(e.target.value)}
                                min={projectStartDate}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        const result = await acceptAndCreateProject.mutateAsync({
                          documentId: id!,
                          phases,
                          useAIPlanning,
                          projectStartDate,
                          projectEndDate: projectEndDate || undefined
                        });
                        navigate(`/projects/${result.project.id}`);
                      }}
                      disabled={acceptAndCreateProject.isPending}
                    >
                      {useAIPlanning && <Sparkles className="h-4 w-4 mr-2" />}
                      {!useAIPlanning && <FolderPlus className="h-4 w-4 mr-2" />}
                      {acceptAndCreateProject.isPending ? 'Création en cours...' : 'Créer le projet'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {documentData.project_id && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate(`/projects/${documentData.project_id}`)}
              >
                <ExternalLink className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Voir le projet</span>
              </Button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {!isNew && documentData.status && (
          <div className="px-4 sm:px-6 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Statut:</span>
                <Badge className={STATUS_COLORS[documentData.status as keyof typeof STATUS_COLORS]}>
                  {STATUS_LABELS[documentData.status as keyof typeof STATUS_LABELS]}
                </Badge>
                <DocumentVersionHistory
                  documentId={id || ''}
                  currentDocument={documentData}
                  currentPhases={phases}
                  onRestoreVersion={(doc, restoredPhases) => {
                    setDocumentData(doc);
                    setPhases(restoredPhases);
                  }}
                />
                {documentData.project_id && (
                  <>
                    <span className="text-sm text-muted-foreground ml-2 sm:ml-4">Projet lié:</span>
                    <Badge variant="outline" className="cursor-pointer" onClick={() => navigate(`/projects/${documentData.project_id}`)}>
                      {documentData.title}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 overflow-auto p-4 sm:p-6`}>
          <div className={`grid gap-4 sm:gap-6 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            <div className="space-y-4 sm:space-y-6">
              <CommercialDocumentBuilder
                document={documentData}
                phases={phases}
                onDocumentChange={setDocumentData}
                onPhasesChange={setPhases}
                isNew={isNew}
                documentId={id}
              />
            </div>

            {showPreview && (
              <div className="hidden lg:block">
                <DocumentPreviewPanel
                  document={documentData}
                  phases={phases}
                  total={calculateTotal()}
                  selectedThemeId={selectedThemeId}
                  onThemeChange={setSelectedThemeId}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Preview Dialog */}
      <PDFPreviewDialog
        open={showPDFPreview}
        onOpenChange={setShowPDFPreview}
        document={documentData}
        phases={phases}
        total={calculateTotal()}
        selectedThemeId={selectedThemeId}
        onThemeChange={setSelectedThemeId}
      />
    </>
  );
};

export default CommercialDocument;
