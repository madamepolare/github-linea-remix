// Preview panel for Communication contracts - displays PDF preview

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Download, AlertCircle, FileText } from 'lucide-react';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { generateCommunicationContractPDF } from '@/lib/generateCommunicationContractPDF';
import { buildCommunicationContractDataFromDocument } from '@/lib/communicationContractBuilder';

interface QuoteCommunicationPreviewPanelProps {
  document: Partial<QuoteDocument>;
  lines: QuoteLine[];
  zoom?: number;
  onPdfGenerated?: (blob: Blob) => void;
}

export function QuoteCommunicationPreviewPanel({
  document,
  lines,
  zoom = 1,
  onPdfGenerated
}: QuoteCommunicationPreviewPanelProps) {
  const { agencyInfo, isLoading: isLoadingAgency } = useAgencyInfo();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = useCallback(async () => {
    if (!agencyInfo) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      // Build contract data from document
      const contractData = buildCommunicationContractDataFromDocument(
        document,
        lines,
        agencyInfo
      );

      // Generate PDF
      const blob = await generateCommunicationContractPDF(contractData, {
        name: agencyInfo.name || '',
        address: agencyInfo.address,
        postal_code: agencyInfo.postal_code,
        city: agencyInfo.city,
        phone: agencyInfo.phone,
        email: agencyInfo.email,
        siret: agencyInfo.siret,
        vat_number: agencyInfo.vat_number,
        logo_url: agencyInfo.logo_url,
        signature_url: agencyInfo.signature_url
      });

      // Revoke old URL if exists
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      if (onPdfGenerated) {
        onPdfGenerated(blob);
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération du PDF');
    } finally {
      setIsGenerating(false);
    }
  }, [document, lines, agencyInfo, onPdfGenerated, pdfUrl]);

  // Auto-generate on first load with debounce
  useEffect(() => {
    if (agencyInfo && !pdfUrl && !isGenerating) {
      const timer = setTimeout(() => {
        generatePDF();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [agencyInfo]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = window.document.createElement('a');
    link.href = pdfUrl;
    link.download = `contrat-${document.document_number || 'brouillon'}.pdf`;
    link.click();
  };

  if (isLoadingAgency) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="font-medium mb-2">Erreur de génération</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={generatePDF} disabled={isGenerating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
          Réessayer
        </Button>
      </div>
    );
  }

  if (pdfUrl) {
    return (
      <div className="flex flex-col h-full">
        {/* Actions bar */}
        <div className="flex items-center justify-between p-2 bg-muted/50 border-b shrink-0">
          <span className="text-xs text-muted-foreground">
            Contrat Communication
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={generatePDF}
              disabled={isGenerating}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isGenerating ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Télécharger
            </Button>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="Aperçu du contrat Communication"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`
            }}
          />
        </div>
      </div>
    );
  }

  // Initial state - show generate button
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full bg-muted/30 rounded-lg">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <FileText className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-medium mb-2">Aperçu du contrat</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Générez un aperçu PDF du contrat de communication
      </p>
      <Button onClick={generatePDF} disabled={isGenerating}>
        {isGenerating ? (
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        {isGenerating ? 'Génération...' : 'Générer l\'aperçu'}
      </Button>
    </div>
  );
}
