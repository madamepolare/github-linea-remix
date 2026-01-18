import { useState } from 'react';
import { FileDown, Loader2, ExternalLink, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  CommercialDocument,
  CommercialDocumentPhase,
} from '@/lib/commercialTypes';
import { generateUnifiedPDF } from '@/lib/generateUnifiedPDF';
import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { type AgencyPDFInfo } from '@/lib/pdfUtils';
import { type ContractType } from '@/hooks/useContractTypes';
import { type PDFDocumentConfig } from '@/lib/pdfBlockTypes';
import { type QuoteLine } from '@/types/quoteTypes';
import { ThemePreviewSelector } from './ThemePreviewSelector';

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

export function PDFPreviewDialog({
  open,
  onOpenChange,
  document,
  phases,
  total,
  contractType,
  selectedThemeId,
  onThemeChange,
}: PDFPreviewDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  const { agencyInfo } = useAgencyInfo();

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

  const phasesToQuoteLines = (items: CommercialDocumentPhase[]): QuoteLine[] => {
    return items.map((phase) => ({
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
        'quote'
      );

      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setZoom(100);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = window.document.createElement('a');
    link.href = pdfUrl;
    link.download = `${document.document_number || 'document'}_devis.pdf`;
    link.click();
  };

  const handleOpenNewTab = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPdfUrl(null);
      setZoom(100);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[96vw] w-[1300px] h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>PDF · Aperçu</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {onThemeChange && (
            <div className="shrink-0 flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg">
              <Label className="text-sm font-medium">Thème visuel</Label>
              <ThemePreviewSelector
                selectedThemeId={selectedThemeId || null}
                onThemeChange={onThemeChange}
              />
            </div>
          )}

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
              <div className="shrink-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setZoom((z) => Math.max(50, z - 10))}
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-12 text-center tabular-nums">
                    {zoom}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setZoom((z) => Math.min(200, z + 10))}
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => setZoom(100)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setPdfUrl(null)}>
                    Regénérer
                  </Button>
                  <Button variant="outline" onClick={handleOpenNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir
                  </Button>
                  <Button onClick={handleDownload}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </div>

              <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-background">
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  style={{ zoom: `${zoom}%` } as any}
                  title="PDF Preview"
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
