import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  List, 
  FileCheck, 
  Palette, 
  X, 
  Save, 
  Download,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { QuoteGeneralTab } from './quote-builder/QuoteGeneralTab';
import { QuoteLinesEditor } from './quote-builder/QuoteLinesEditor';
import { QuoteTermsTab } from './quote-builder/QuoteTermsTab';
import { QuotePreviewPanel } from './quote-builder/QuotePreviewPanel';

interface QuoteBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: Partial<QuoteDocument>;
  lines?: QuoteLine[];
  onSave: (document: Partial<QuoteDocument>, lines: QuoteLine[]) => Promise<void>;
  isNew?: boolean;
}

export function QuoteBuilderModal({
  open,
  onOpenChange,
  document: initialDocument,
  lines: initialLines,
  onSave,
  isNew = false
}: QuoteBuilderModalProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [showPreview, setShowPreview] = useState(true);
  const [zoom, setZoom] = useState(70);
  const [isSaving, setIsSaving] = useState(false);
  
  const [document, setDocument] = useState<Partial<QuoteDocument>>({
    document_type: 'quote',
    title: '',
    status: 'draft',
    fee_mode: 'fixed',
    currency: 'EUR',
    validity_days: 30,
    total_amount: 0,
    ...initialDocument
  });
  
  const [lines, setLines] = useState<QuoteLine[]>(initialLines || []);

  // Reset when modal opens with new data
  useEffect(() => {
    if (open) {
      setDocument({
        document_type: 'quote',
        title: '',
        status: 'draft',
        fee_mode: 'fixed',
        currency: 'EUR',
        validity_days: 30,
        total_amount: 0,
        ...initialDocument
      });
      setLines(initialLines || []);
      setActiveTab('general');
    }
  }, [open, initialDocument, initialLines]);

  // Calculate totals whenever lines change
  useEffect(() => {
    const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount');
    const discountLines = lines.filter(l => l.line_type === 'discount');
    
    const subtotal = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
    const totalDiscount = discountLines.reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);
    const total = subtotal - totalDiscount;
    
    setDocument(prev => ({ ...prev, total_amount: total }));
  }, [lines]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(document, lines);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving quote:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    console.log('Download PDF');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1600px] h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
          <div className="flex items-center gap-4">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold">
                {isNew ? 'Nouveau devis' : document.title || 'Édition du devis'}
              </h2>
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
            >
              {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showPreview ? 'Masquer aperçu' : 'Afficher aperçu'}
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownloadPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button 
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor Panel */}
          <div className={`flex flex-col ${showPreview ? 'w-[60%]' : 'w-full'} border-r`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
              <div className="px-4 pt-4 pb-0 border-b bg-muted/30">
                <TabsList className="h-10">
                  <TabsTrigger value="general" className="gap-2 px-4">
                    <FileText className="h-4 w-4" />
                    Général
                  </TabsTrigger>
                  <TabsTrigger value="lines" className="gap-2 px-4">
                    <List className="h-4 w-4" />
                    Lignes
                    {lines.length > 0 && (
                      <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                        {lines.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="terms" className="gap-2 px-4">
                    <FileCheck className="h-4 w-4" />
                    Conditions
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <TabsContent value="general" className="m-0 p-6">
                  <QuoteGeneralTab 
                    document={document}
                    onDocumentChange={setDocument}
                  />
                </TabsContent>

                <TabsContent value="lines" className="m-0 p-6">
                  <QuoteLinesEditor
                    lines={lines}
                    onLinesChange={setLines}
                    document={document}
                    onDocumentChange={setDocument}
                  />
                </TabsContent>

                <TabsContent value="terms" className="m-0 p-6">
                  <QuoteTermsTab
                    document={document}
                    onDocumentChange={setDocument}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="w-[40%] flex flex-col bg-muted/30">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
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
      </DialogContent>
    </Dialog>
  );
}
