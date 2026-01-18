import { useState } from 'react';
import { FileDown, Loader2, FileText, FileSignature } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  CommercialDocument, 
  CommercialDocumentPhase
} from '@/lib/commercialTypes';
import { generateUnifiedPDF } from '@/lib/generateUnifiedPDF';
import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { type AgencyPDFInfo } from '@/lib/pdfUtils';
import { type ContractType } from '@/hooks/useContractTypes';
import { type PDFDocumentConfig } from '@/lib/pdfBlockTypes';
import { type QuoteLine } from '@/types/quoteTypes';
import { ThemePreviewSelector } from './ThemePreviewSelector';

type PDFTemplate = 'quote' | 'contract';

interface PDFPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Partial<CommercialDocument>;
  phases: CommercialDocumentPhase[];
  total: number;
  contractType?: ContractType | null;
  selectedThemeId?: string | null;
  onThemeChange?: (themeId: string | null) => void;
}

const TEMPLATES: { id: PDFTemplate; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'quote',
    label: 'Devis',
    description: 'Format compact A4, 1 page max',
    icon: <FileText className="h-5 w-5" />
  },
  {
    id: 'contract',
    label: 'Contrat',
    description: 'Document complet multi-pages',
    icon: <FileSignature className="h-5 w-5" />
  }
];

export function PDFPreviewDialog({
  open,
  onOpenChange,
  document,
  phases,
  total,
  contractType,
  selectedThemeId,
  onThemeChange
}: PDFPreviewDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate>('quote');
  
  // Get agency info for PDF
  const { agencyInfo } = useAgencyInfo();

  // Convert agencyInfo to PDF format
  const getAgencyPDFInfo = (): AgencyPDFInfo | undefined => {
    if (!agencyInfo) return undefined;
    
    return {
      name: agencyInfo.name,
      logo_url: agencyInfo.logo_url,
      signature_url: agencyInfo.signature_url,
      address: agencyInfo.address,
      city: agencyInfo.city,
      postal_code: agencyInfo.postal_code,
      phone: agencyInfo.phone,
      email: agencyInfo.email,
      website: agencyInfo.website,
      siret: agencyInfo.siret,
      vat_number: agencyInfo.vat_number,
      capital_social: agencyInfo.capital_social,
      forme_juridique: agencyInfo.forme_juridique,
      rcs_city: agencyInfo.rcs_city,
      footer_text: agencyInfo.footer_text,
    };
  };

  // Convert phases to QuoteLines for unified generator
  const phasesToQuoteLines = (phases: CommercialDocumentPhase[]): QuoteLine[] => {
    return phases.map((phase, index) => ({
      id: phase.id,
      document_id: phase.document_id,
      phase_code: phase.phase_code,
      phase_name: phase.phase_name,
      phase_description: phase.phase_description,
      line_type: 'phase' as const,
      quantity: 1,
      unit: 'forfait',
      unit_price: phase.amount,
      amount: phase.amount,
      percentage_fee: phase.percentage_fee,
      billing_type: 'one_time' as const,
      is_optional: !phase.is_included,
      is_included: phase.is_included,
      deliverables: phase.deliverables,
      sort_order: phase.sort_order,
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const agencyPDFInfo = getAgencyPDFInfo();
      const lines = phasesToQuoteLines(phases);
      const pdfConfig: PDFDocumentConfig | null = contractType?.pdf_config || null;
      
      const pdfBlob = await generateUnifiedPDF(
        document,
        lines,
        total,
        agencyPDFInfo,
        pdfConfig,
        selectedTemplate
      );
      
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = window.document.createElement('a');
      link.href = pdfUrl;
      const templateSuffix = selectedTemplate === 'quote' ? 'devis' : selectedTemplate === 'contract' ? 'contrat' : 'proposition';
      link.download = `${document.document_number || 'document'}_${templateSuffix}.pdf`;
      link.click();
    }
  };

  const handleTemplateChange = (template: PDFTemplate) => {
    setSelectedTemplate(template);
    setPdfUrl(null); // Reset preview when template changes
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setPdfUrl(null); // Reset on close
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Générer un PDF
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Theme Selector */}
          {onThemeChange && (
            <div className="shrink-0 flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <Label className="text-sm font-medium">Thème visuel</Label>
              <ThemePreviewSelector
                selectedThemeId={selectedThemeId || null}
                onThemeChange={onThemeChange}
              />
            </div>
          )}

          {/* Template Selection */}
          <div className="shrink-0">
            <Label className="text-sm font-medium mb-3 block">Format du document</Label>
            <RadioGroup
              value={selectedTemplate}
              onValueChange={(v) => handleTemplateChange(v as PDFTemplate)}
              className="grid grid-cols-3 gap-3"
            >
              {TEMPLATES.map((template) => (
                <div key={template.id}>
                  <RadioGroupItem
                    value={template.id}
                    id={template.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={template.id}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                  >
                    <div className="mb-2 text-muted-foreground peer-data-[state=checked]:text-primary">
                      {template.icon}
                    </div>
                    <span className="font-medium">{template.label}</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      {template.description}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {!pdfUrl ? (
              <div className="flex-1 flex items-center justify-center border rounded-lg bg-muted/50">
                <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 mr-2" />
                      Générer l'aperçu
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <iframe
                  src={pdfUrl}
                  className="flex-1 w-full border rounded-lg min-h-0"
                  title="PDF Preview"
                />
                <div className="flex justify-end gap-2 pt-4 shrink-0">
                  <Button variant="outline" onClick={() => setPdfUrl(null)}>
                    Changer de format
                  </Button>
                  <Button onClick={handleDownload}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}