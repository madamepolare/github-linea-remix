import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Send, FileDown, Eye, FileText } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useCommercialDocuments } from '@/hooks/useCommercialDocuments';
import { CommercialDocumentBuilder } from '@/components/commercial/CommercialDocumentBuilder';
import { DocumentPreviewPanel } from '@/components/commercial/DocumentPreviewPanel';
import { PDFPreviewDialog } from '@/components/commercial/PDFPreviewDialog';
import { 
  DocumentType, 
  DOCUMENT_TYPE_LABELS,
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
    updateDocument 
  } = useCommercialDocuments();

  const documentQuery = isNew ? { data: null, isLoading: false } : getDocument(id!);
  const phasesQuery = isNew ? { data: [], isLoading: false } : getDocumentPhases(id!);

  const [showPreview, setShowPreview] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
        navigate(`/commercial/${result.id}`, { replace: true });
      } else {
        await updateDocument.mutateAsync({
          id: id!,
          ...documentData,
          total_amount: calculateTotal()
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotal = () => {
    // For fixed/mixed mode, use total_amount directly
    if (documentData.fee_mode === 'fixed' || documentData.fee_mode === 'mixed') {
      return documentData.total_amount || 0;
    }
    // For percentage mode, calculate from budget and percentage
    if (documentData.fee_mode === 'percentage' && documentData.project_budget && documentData.fee_percentage) {
      const baseFee = documentData.project_budget * (documentData.fee_percentage / 100);
      const totalPercentage = phases
        .filter(p => p.is_included)
        .reduce((sum, p) => sum + p.percentage_fee, 0);
      return baseFee * (totalPercentage / 100);
    }
    // For hourly mode
    if (documentData.fee_mode === 'hourly' && documentData.hourly_rate) {
      return phases.filter(p => p.is_included).length * 40 * documentData.hourly_rate;
    }
    return documentData.total_amount || 0;
  };

  if (!isNew && documentQuery.isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/commercial')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-9 w-9 rounded-full bg-muted/80 flex items-center justify-center">
              <FileText className="h-[18px] w-[18px] text-foreground/70" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                {isNew ? `Nouveau ${DOCUMENT_TYPE_LABELS[documentData.document_type!]}` : documentData.document_number}
              </h1>
              <p className="text-sm text-muted-foreground">
                {documentData.title || 'Sans titre'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Masquer' : 'Aperçu'}
            </Button>
            <Button variant="outline" onClick={() => setShowPDFPreview(true)}>
              <FileDown className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            {!isNew && documentData.status === 'draft' && (
              <Button variant="default">
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 overflow-auto p-6`}>
          <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            <div className="space-y-6">
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
      />
    </MainLayout>
  );
};

export default CommercialDocument;
