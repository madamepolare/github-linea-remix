import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Code2,
  Eye,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  FileCode,
  ChevronDown,
  ChevronRight,
  SplitSquareHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  getSampleTemplateData, 
  renderHtmlTemplate, 
  TEMPLATE_VARIABLES,
  TEMPLATE_ARRAYS,
  TemplateData,
  TemplateVariableDefinition,
  TemplateArrayDefinition,
} from '@/lib/quoteTemplateVariables';
import { DEFAULT_HTML_TEMPLATE } from '@/lib/generateHtmlPDF';

interface QuoteHtmlEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  htmlTemplate: string;
  onHtmlChange: (html: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

// Use centralized sample data
const SAMPLE_DATA = getSampleTemplateData();

// Group variables by category
const groupedVariables = TEMPLATE_VARIABLES.reduce((acc, v) => {
  if (!acc[v.category]) acc[v.category] = [];
  acc[v.category].push(v);
  return acc;
}, {} as Record<string, TemplateVariableDefinition[]>);

const CATEGORY_LABELS: Record<string, string> = {
  document: '📄 Document',
  agency: '🏢 Agence',
  client: '👤 Client',
  project: '📐 Projet',
  financial: '💰 Financier',
  conditions: '📋 Conditions',
  dates: '📅 Dates',
  meta: '⚙️ Méta',
};

export function QuoteHtmlEditor({
  open,
  onOpenChange,
  htmlTemplate,
  onHtmlChange,
  onSave,
  isSaving = false,
}: QuoteHtmlEditorProps) {
  const [showVariables, setShowVariables] = useState(true);
  const [showArrays, setShowArrays] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['document', 'financial']);
  const [activeView, setActiveView] = useState<'split' | 'code' | 'preview'>('split');
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const currentHtml = htmlTemplate || DEFAULT_HTML_TEMPLATE;

  // Render preview
  const renderPreview = useCallback((html: string) => {
    return renderHtmlTemplate(html, SAMPLE_DATA as TemplateData);
  }, []);

  useEffect(() => {
    if (previewRef.current && activeView !== 'code') {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(renderPreview(currentHtml));
        doc.close();
      }
    }
  }, [currentHtml, activeView, renderPreview]);

  const handleCopyVariable = async (variable: string) => {
    try {
      await navigator.clipboard.writeText(`{{${variable}}}`);
      toast.success(`{{${variable}}} copié`);
    } catch {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(currentHtml);
      setCopied(true);
      toast.success('HTML copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleResetToDefault = () => {
    onHtmlChange(DEFAULT_HTML_TEMPLATE);
    toast.success('Template réinitialisé au défaut');
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/70">
                <Code2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-lg">Éditeur HTML de Devis</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Personnalisez le design avec HTML/CSS
                </p>
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <Button
                variant={activeView === 'code' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveView('code')}
              >
                <Code2 className="h-3.5 w-3.5 mr-1" />
                Code
              </Button>
              <Button
                variant={activeView === 'split' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveView('split')}
              >
                <SplitSquareHorizontal className="h-3.5 w-3.5 mr-1" />
                Split
              </Button>
              <Button
                variant={activeView === 'preview' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveView('preview')}
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Aperçu
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Variables sidebar */}
          <div className="w-72 border-r bg-muted/30 flex flex-col shrink-0">
            <div className="p-3 border-b space-y-2">
              <Button
                variant={showVariables ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setShowVariables(!showVariables)}
              >
                {showVariables ? <ChevronDown className="h-3.5 w-3.5 mr-2" /> : <ChevronRight className="h-3.5 w-3.5 mr-2" />}
                Variables simples
                <Badge variant="outline" className="ml-auto text-xs">{TEMPLATE_VARIABLES.length}</Badge>
              </Button>
              <Button
                variant={showArrays ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setShowArrays(!showArrays)}
              >
                {showArrays ? <ChevronDown className="h-3.5 w-3.5 mr-2" /> : <ChevronRight className="h-3.5 w-3.5 mr-2" />}
                Boucles (arrays)
                <Badge variant="outline" className="ml-auto text-xs">{TEMPLATE_ARRAYS.length}</Badge>
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {/* Simple variables */}
                {showVariables && Object.entries(groupedVariables).map(([category, variables]) => (
                  <Collapsible
                    key={category}
                    open={expandedCategories.includes(category)}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs font-medium h-7"
                      >
                        {expandedCategories.includes(category) ? (
                          <ChevronDown className="h-3 w-3 mr-1.5" />
                        ) : (
                          <ChevronRight className="h-3 w-3 mr-1.5" />
                        )}
                        {CATEGORY_LABELS[category] || category}
                        <span className="ml-auto text-muted-foreground">{variables.length}</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pl-4 space-y-0.5 py-1">
                        {variables.map(v => (
                          <button
                            key={v.key}
                            className="w-full text-left px-2 py-1 text-xs rounded hover:bg-accent group flex items-center justify-between"
                            onClick={() => handleCopyVariable(v.key)}
                            title={v.description}
                          >
                            <code className="text-primary font-mono text-[10px]">{`{{${v.key}}}`}</code>
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                          </button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}

                {/* Array variables */}
                {showArrays && TEMPLATE_ARRAYS.map((arr: TemplateArrayDefinition) => (
                  <Collapsible key={arr.key}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs font-medium h-7"
                      >
                        <ChevronRight className="h-3 w-3 mr-1.5" />
                        🔄 {arr.label}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pl-4 py-2 space-y-1 bg-muted/50 rounded-md m-1">
                        <p className="text-[10px] text-muted-foreground px-2 mb-2">{arr.description}</p>
                        <code className="block text-[10px] text-primary px-2 py-1 bg-background rounded">
                          {`{{#${arr.key}}}...{{/${arr.key}}}`}
                        </code>
                        <div className="pl-2 pt-2 space-y-0.5">
                          {arr.innerVariables.map(v => (
                            <button
                              key={v.key}
                              className="w-full text-left px-2 py-0.5 text-[10px] rounded hover:bg-accent group flex items-center justify-between"
                              onClick={() => handleCopyVariable(v.key)}
                              title={v.description}
                            >
                              <code className="text-secondary-foreground font-mono">{`{{${v.key}}}`}</code>
                              <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Editor / Preview area */}
          <div className={cn(
            "flex-1 flex overflow-hidden",
            activeView === 'split' && "divide-x"
          )}>
            {/* Code Editor */}
            {(activeView === 'code' || activeView === 'split') && (
              <div className={cn(
                "flex flex-col bg-background",
                activeView === 'split' ? "w-1/2" : "w-full"
              )}>
                <div className="px-3 py-2 bg-muted/50 border-b flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">template.html</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {currentHtml.length.toLocaleString()} chars
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopyHtml}>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleResetToDefault}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={currentHtml}
                  onChange={(e) => onHtmlChange(e.target.value)}
                  className="flex-1 font-mono text-xs resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-zinc-950 text-zinc-100"
                  placeholder="Entrez votre HTML ici..."
                  spellCheck={false}
                />
              </div>
            )}

            {/* Preview */}
            {(activeView === 'preview' || activeView === 'split') && (
              <div className={cn(
                "flex flex-col bg-zinc-100 dark:bg-zinc-900",
                activeView === 'split' ? "w-1/2" : "w-full"
              )}>
                <div className="px-3 py-2 bg-muted/50 border-b flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">Aperçu A4</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    Données d'exemple
                  </Badge>
                </div>
                <div className="flex-1 overflow-auto p-4 flex justify-center">
                  <div 
                    className="bg-white shadow-xl origin-top"
                    style={{ 
                      width: '210mm', 
                      minHeight: '297mm',
                      transform: activeView === 'split' ? 'scale(0.6)' : 'scale(0.75)',
                    }}
                  >
                    <iframe
                      ref={previewRef}
                      className="w-full border-0"
                      title="Preview"
                      style={{ width: '210mm', minHeight: '297mm' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/30 flex items-center justify-between shrink-0">
          <p className="text-xs text-muted-foreground">
            Cliquez sur une variable pour la copier • Syntaxe Mustache
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={onSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
