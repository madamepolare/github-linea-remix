import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Code2,
  Eye,
  Upload,
  Wand2,
  Loader2,
  Maximize2,
  Minimize2,
  Download,
  Copy,
  Check,
  RefreshCw,
  FileCode,
  Image,
  Sparkles,
  Trash2,
  SplitSquareHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface QuoteHtmlEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  htmlTemplate: string;
  onHtmlChange: (html: string) => void;
  cssVariables?: Record<string, string>;
  onCssVariablesChange?: (vars: Record<string, string>) => void;
  fontsUsed?: string[];
  onFontsChange?: (fonts: string[]) => void;
  onSave: () => void;
  isSaving?: boolean;
}

// Sample data for preview
const SAMPLE_DATA = {
  document_number: 'DEV-2025-001',
  date: '18 janvier 2025',
  validity_date: '18 février 2025',
  agency_name: 'Mon Agence',
  agency_address: '123 Rue de l\'Exemple',
  agency_city: '75001 Paris',
  agency_phone: '01 23 45 67 89',
  agency_email: 'contact@agence.fr',
  agency_logo_url: 'https://via.placeholder.com/150x50?text=LOGO',
  client_name: 'Client Exemple SARL',
  client_address: '456 Avenue du Client',
  client_city: '69001 Lyon',
  client_email: 'client@exemple.fr',
  project_name: 'Projet Résidence Les Jardins',
  project_address: '789 Boulevard du Projet',
  project_city: 'Bordeaux',
  phases: [
    { phase_code: 'ESQ', phase_name: 'Esquisse', phase_amount: '5 000 €', phase_percentage: '10%' },
    { phase_code: 'APS', phase_name: 'Avant-Projet Sommaire', phase_amount: '10 000 €', phase_percentage: '20%' },
    { phase_code: 'APD', phase_name: 'Avant-Projet Définitif', phase_amount: '15 000 €', phase_percentage: '30%' },
    { phase_code: 'PRO', phase_name: 'Projet', phase_amount: '10 000 €', phase_percentage: '20%' },
    { phase_code: 'EXE', phase_name: 'Exécution', phase_amount: '10 000 €', phase_percentage: '20%' },
  ],
  total_ht: '50 000 €',
  tva_amount: '10 000 €',
  total_ttc: '60 000 €',
  payment_terms: 'Paiement à 30 jours',
  general_conditions: 'Conditions générales de vente applicables.',
};

const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', sans-serif; 
      font-size: 11px; 
      color: #0a0a0a;
      background: white;
      padding: 40px;
      max-width: 210mm;
      margin: 0 auto;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #7c3aed;
    }
    .logo img { max-height: 60px; }
    .agency-info { text-align: right; font-size: 10px; color: #737373; }
    .document-title { 
      font-size: 24px; 
      font-weight: 700; 
      color: #7c3aed;
      margin-bottom: 30px;
    }
    .info-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 40px; 
      margin-bottom: 40px;
    }
    .info-box { padding: 20px; background: #f9fafb; border-radius: 8px; }
    .info-box h3 { font-size: 12px; font-weight: 600; margin-bottom: 10px; color: #7c3aed; }
    .info-box p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { 
      background: #7c3aed; 
      color: white; 
      padding: 12px; 
      text-align: left;
      font-weight: 600;
    }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9fafb; }
    .totals { text-align: right; margin-top: 20px; }
    .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 8px 0; }
    .totals .total { font-size: 16px; font-weight: 700; color: #7c3aed; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #737373; }
    .signature-area { margin-top: 60px; display: flex; justify-content: flex-end; }
    .signature-box { border: 1px dashed #d1d5db; padding: 40px 60px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <img src="{{agency_logo_url}}" alt="Logo">
    </div>
    <div class="agency-info">
      <strong>{{agency_name}}</strong><br>
      {{agency_address}}<br>
      {{agency_phone}}<br>
      {{agency_email}}
    </div>
  </div>

  <h1 class="document-title">DEVIS N° {{document_number}}</h1>

  <div class="info-grid">
    <div class="info-box">
      <h3>CLIENT</h3>
      <p><strong>{{client_name}}</strong></p>
      <p>{{client_address}}</p>
      <p>{{client_email}}</p>
    </div>
    <div class="info-box">
      <h3>PROJET</h3>
      <p><strong>{{project_name}}</strong></p>
      <p>{{project_address}}</p>
      <p>{{project_city}}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th>Phase</th>
        <th style="text-align: right;">%</th>
        <th style="text-align: right;">Montant HT</th>
      </tr>
    </thead>
    <tbody>
      {{#phases}}
      <tr>
        <td>{{phase_code}}</td>
        <td>{{phase_name}}</td>
        <td style="text-align: right;">{{phase_percentage}}</td>
        <td style="text-align: right;">{{phase_amount}}</td>
      </tr>
      {{/phases}}
    </tbody>
  </table>

  <div class="totals">
    <div class="row">
      <span>Total HT</span>
      <span>{{total_ht}}</span>
    </div>
    <div class="row">
      <span>TVA (20%)</span>
      <span>{{tva_amount}}</span>
    </div>
    <div class="row total">
      <span>Total TTC</span>
      <span>{{total_ttc}}</span>
    </div>
  </div>

  <div class="signature-area">
    <div class="signature-box">
      Signature du client<br>
      <small>Date et mention "Bon pour accord"</small>
    </div>
  </div>

  <div class="footer">
    <p>{{payment_terms}} • {{general_conditions}}</p>
    <p>Devis valable jusqu'au {{validity_date}}</p>
  </div>
</body>
</html>`;

export function QuoteHtmlEditor({
  open,
  onOpenChange,
  htmlTemplate,
  onHtmlChange,
  cssVariables = {},
  onCssVariablesChange,
  fontsUsed = [],
  onFontsChange,
  onSave,
  isSaving = false,
}: QuoteHtmlEditorProps) {
  const { activeWorkspace } = useAuth();
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'split'>('split');
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const currentHtml = htmlTemplate || DEFAULT_HTML_TEMPLATE;

  // Render preview with Mustache-like variable replacement
  const renderPreview = useCallback((html: string) => {
    let rendered = html;
    
    // Replace simple variables
    Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        rendered = rendered.replace(regex, value);
      }
    });

    // Handle phases array (simplified Mustache-like)
    const phasesMatch = rendered.match(/\{\{#phases\}\}([\s\S]*?)\{\{\/phases\}\}/);
    if (phasesMatch) {
      const phaseTemplate = phasesMatch[1];
      const phasesHtml = SAMPLE_DATA.phases.map(phase => {
        let phaseHtml = phaseTemplate;
        Object.entries(phase).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          phaseHtml = phaseHtml.replace(regex, value);
        });
        return phaseHtml;
      }).join('');
      rendered = rendered.replace(/\{\{#phases\}\}[\s\S]*?\{\{\/phases\}\}/, phasesHtml);
    }

    return rendered;
  }, []);

  useEffect(() => {
    if (previewRef.current && activeTab !== 'editor') {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(renderPreview(currentHtml));
        doc.close();
      }
    }
  }, [currentHtml, activeTab, renderPreview]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerateFromImage = async () => {
    if (!referenceImage) {
      toast.error('Veuillez d\'abord uploader une image de référence');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quote-html', {
        body: { image_url: referenceImage }
      });

      if (error) throw error;

      if (data?.html) {
        onHtmlChange(data.html);
        if (data.css_variables && onCssVariablesChange) {
          onCssVariablesChange(data.css_variables);
        }
        if (data.fonts_used && onFontsChange) {
          onFontsChange(data.fonts_used);
        }
        toast.success('Template HTML généré par l\'IA !');
      }
    } catch (error) {
      console.error('Error generating HTML:', error);
      toast.error('Erreur lors de la génération du template');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(currentHtml);
      setCopied(true);
      toast.success('HTML copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleResetToDefault = () => {
    onHtmlChange(DEFAULT_HTML_TEMPLATE);
    toast.success('Template réinitialisé');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">Éditeur HTML de Devis</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Personnalisez entièrement le design de vos devis avec HTML/CSS
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {currentHtml.length.toLocaleString()} caractères
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="editor" className="text-xs h-7 px-3">
                  <Code2 className="h-3.5 w-3.5 mr-1.5" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="split" className="text-xs h-7 px-3">
                  <SplitSquareHorizontal className="h-3.5 w-3.5 mr-1.5" />
                  Split
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs h-7 px-3">
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Aperçu
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Separator orientation="vertical" className="h-6 mx-2" />

            <Button variant="ghost" size="sm" onClick={handleCopyHtml}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copié' : 'Copier'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResetToDefault}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-4 w-4 mr-1" />
              Uploader image
            </Button>
            {referenceImage && (
              <Button
                size="sm"
                onClick={handleGenerateFromImage}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-1" />
                )}
                Générer avec IA
              </Button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          {referenceImage && (
            <div className="px-6 py-3 bg-purple-50 dark:bg-purple-950/30 border-b flex items-center gap-4">
              <div className="relative w-16 h-20 rounded border overflow-hidden bg-white shrink-0">
                <img 
                  src={referenceImage} 
                  alt="Reference" 
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-0.5 right-0.5 h-5 w-5"
                  onClick={() => setReferenceImage(null)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Image de référence chargée</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cliquez sur "Générer avec IA" pour créer un template HTML qui reproduit exactement ce design.
                </p>
              </div>
            </div>
          )}

          <div className={cn(
            "h-full",
            activeTab === 'split' && "grid grid-cols-2 divide-x"
          )}>
            {/* Editor */}
            {(activeTab === 'editor' || activeTab === 'split') && (
              <div className="h-full flex flex-col">
                <div className="px-4 py-2 bg-muted/50 border-b flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">template.html</span>
                </div>
                <Textarea
                  value={currentHtml}
                  onChange={(e) => onHtmlChange(e.target.value)}
                  className="flex-1 font-mono text-xs resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Entrez votre HTML ici..."
                  style={{ minHeight: '100%' }}
                />
              </div>
            )}

            {/* Preview */}
            {(activeTab === 'preview' || activeTab === 'split') && (
              <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
                <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">Aperçu A4</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Données d'exemple
                  </Badge>
                </div>
                <div className="flex-1 overflow-auto p-6 flex justify-center">
                  <div className="bg-white shadow-xl" style={{ 
                    width: '210mm', 
                    minHeight: '297mm',
                    transform: 'scale(0.7)',
                    transformOrigin: 'top center'
                  }}>
                    <iframe
                      ref={previewRef}
                      className="w-full h-full border-0"
                      title="Preview"
                      style={{ minHeight: '297mm' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Variables disponibles : <code className="bg-muted px-1 rounded">{'{{document_number}}'}</code>,{' '}
            <code className="bg-muted px-1 rounded">{'{{client_name}}'}</code>,{' '}
            <code className="bg-muted px-1 rounded">{'{{#phases}}...{{/phases}}'}</code>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-2" />
              Enregistrer le template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
