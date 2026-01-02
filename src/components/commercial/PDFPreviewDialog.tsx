import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  CommercialDocument, 
  CommercialDocumentPhase,
  DOCUMENT_TYPE_LABELS 
} from '@/lib/commercialTypes';
import { generateCommercialPDF } from '@/lib/generateCommercialPDF';

interface PDFPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Partial<CommercialDocument>;
  phases: CommercialDocumentPhase[];
  total: number;
}

export function PDFPreviewDialog({
  open,
  onOpenChange,
  document,
  phases,
  total
}: PDFPreviewDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const pdfBlob = await generateCommercialPDF(document, phases, total);
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
      link.download = `${document.document_number || 'document'}.pdf`;
      link.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Aperçu PDF - {DOCUMENT_TYPE_LABELS[document.document_type || 'quote']}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {!pdfUrl ? (
            <div className="flex-1 flex items-center justify-center border rounded-lg bg-muted/50">
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Générer l'aperçu PDF
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <iframe
                src={pdfUrl}
                className="flex-1 w-full border rounded-lg"
                title="PDF Preview"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPdfUrl(null)}>
                  Régénérer
                </Button>
                <Button onClick={handleDownload}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
