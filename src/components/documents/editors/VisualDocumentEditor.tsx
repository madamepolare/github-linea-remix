import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download,
  RefreshCw,
  Loader2,
  FileText,
  Eye,
  Edit3,
  Columns,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type DocumentType } from '@/lib/documentTypes';
import { LiveDocumentPreview } from './LiveDocumentPreview';

// Import specialized editors
import { PowerOfAttorneyEditor } from './PowerOfAttorneyEditor';
import { ServiceOrderEditor } from './ServiceOrderEditor';
import { InvoiceEditor } from './InvoiceEditor';
import { GenericDocumentEditor } from './GenericDocumentEditor';

// Import PDF generators
import { generatePowerOfAttorneyPDF } from '@/lib/generatePowerOfAttorneyPDF';
import { generateServiceOrderPDF } from '@/lib/generateServiceOrderPDF';
import { generateInvoicePDF } from '@/lib/generateInvoicePDF';
import { generateGenericDocumentPDF } from '@/lib/generateGenericDocumentPDF';
import { toast } from 'sonner';

type ViewMode = 'split' | 'editor' | 'preview';

interface VisualDocumentEditorProps {
  documentType: DocumentType;
  documentNumber: string;
  title: string;
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  projects?: any[];
  contacts?: any[];
  companies?: any[];
  isEditable?: boolean;
  createdAt?: string;
}

export function VisualDocumentEditor({
  documentType,
  documentNumber,
  title,
  content,
  onChange,
  projects = [],
  contacts = [],
  companies = [],
  isEditable = true,
  createdAt,
}: VisualDocumentEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [zoom, setZoom] = useState(0.5);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Auto-adjust zoom based on container width
  useEffect(() => {
    const updateZoom = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        // A4 width is 210mm ≈ 793.7px at 96dpi
        const idealZoom = Math.min((containerWidth - 48) / 793.7, 0.75);
        setZoom(Math.max(0.3, idealZoom));
      }
    };

    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, [viewMode]);

  const generatePDF = useCallback(async () => {
    setIsGeneratingPdf(true);
    try {
      let blob: Blob;
      
      switch (documentType) {
        case 'power_of_attorney':
          blob = await generatePowerOfAttorneyPDF({
            document_number: documentNumber || '',
            title: title,
            delegator_name: (content.delegator_name as string) || '',
            delegator_role: (content.delegator_role as string) || '',
            delegate_name: (content.delegate_name as string) || '',
            delegate_role: (content.delegate_role as string) || '',
            scope: (content.scope as string) || '',
            specific_powers: (content.specific_powers as string[]) || [],
            start_date: (content.start_date as string) || '',
            end_date: (content.end_date as string) || '',
          });
          break;
          
        case 'service_order':
          blob = await generateServiceOrderPDF({
            document_number: documentNumber || '',
            order_type: (content.order_type as 'start' | 'suspend' | 'resume' | 'stop') || 'start',
            project_name: (content.project_name as string) || '',
            project_address: (content.project_address as string) || '',
            client_name: (content.client_name as string) || '',
            effective_date: (content.effective_date as string) || '',
            phase_name: (content.phase_name as string) || '',
            instructions: (content.instructions as string) || '',
          });
          break;
          
        case 'invoice':
          blob = await generateInvoicePDF({
            document_number: documentNumber || '',
            invoice_date: (content.invoice_date as string) || '',
            due_date: (content.due_date as string) || '',
            client_name: (content.client_name as string) || '',
            client_address: (content.client_address as string) || '',
            project_name: (content.project_name as string) || '',
            phases: (content.phases as Array<{code: string; name: string; amount: number; percentage_invoiced: number}>) || [],
            subtotal: (content.subtotal as number) || 0,
            tva_rate: (content.tva_rate as number) || 20,
            tva_amount: (content.tva_amount as number) || 0,
            total: (content.total as number) || 0,
            payment_terms: (content.payment_terms as string) || '',
            bank_iban: (content.bank_iban as string) || '',
            bank_bic: (content.bank_bic as string) || '',
            bank_name: (content.bank_name as string) || '',
          });
          break;
          
        default:
          blob = await generateGenericDocumentPDF({
            document_number: documentNumber || '',
            document_type: documentType,
            title: title,
            content: content,
            created_at: createdAt || new Date().toISOString(),
          });
      }
      
      // Download
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${documentNumber || 'document'}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF téléchargé');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [documentType, documentNumber, title, content, createdAt]);

  const renderEditor = () => {
    const editorProps = { content, onChange: isEditable ? onChange : () => {} };
    
    switch (documentType) {
      case 'power_of_attorney':
        return <PowerOfAttorneyEditor {...editorProps} contacts={contacts} />;
      case 'service_order':
        return <ServiceOrderEditor {...editorProps} projects={projects} />;
      case 'invoice':
        return <InvoiceEditor {...editorProps} projects={projects} companies={companies} />;
      default:
        return <GenericDocumentEditor {...editorProps} documentType={documentType} />;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[600px] bg-background rounded-lg border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="split" className="h-7 px-3 gap-1.5">
                <Columns className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Split</span>
              </TabsTrigger>
              <TabsTrigger value="editor" className="h-7 px-3 gap-1.5">
                <Edit3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Édition</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="h-7 px-3 gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Aperçu</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls (only in preview modes) */}
          {viewMode !== 'editor' && (
            <div className="flex items-center gap-2 px-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
                disabled={zoom <= 0.25}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <div className="w-24">
                <Slider
                  value={[zoom]}
                  onValueChange={([v]) => setZoom(v)}
                  min={0.25}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom(Math.min(1, zoom + 0.1))}
                disabled={zoom >= 1}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          )}

          <Separator orientation="vertical" className="h-6" />

          {/* Download PDF */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2"
            onClick={generatePDF}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div 
            className={cn(
              "flex-shrink-0 border-r bg-card overflow-hidden flex flex-col",
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            )}
          >
            <ScrollArea className="flex-1">
              <div className={cn(
                "p-6",
                !isEditable && "pointer-events-none opacity-60"
              )}>
                {renderEditor()}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Preview Panel */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div 
            ref={previewContainerRef}
            className={cn(
              "flex-1 overflow-auto bg-muted/50",
              viewMode === 'preview' && 'w-full'
            )}
            style={{
              backgroundImage: `
                linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%),
                linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%),
                linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            }}
          >
            <div className="p-6 flex justify-center">
              <div 
                style={{ 
                  width: `${793.7 * zoom}px`,
                  minHeight: `${1122.5 * zoom}px`,
                }}
              >
                <LiveDocumentPreview
                  documentType={documentType}
                  documentNumber={documentNumber}
                  title={title}
                  content={content}
                  scale={zoom}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
