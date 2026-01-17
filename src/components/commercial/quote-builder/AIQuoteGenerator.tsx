import { useState } from 'react';
import { Sparkles, Loader2, Wand2, FileText, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { QuoteDocument, QuoteLine, LINE_TYPE_LABELS } from '@/types/quoteTypes';
import { usePhaseTemplates } from '@/hooks/usePhaseTemplates';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface AIQuoteGeneratorProps {
  document: Partial<QuoteDocument>;
  existingLines: QuoteLine[];
  onLinesGenerated: (lines: QuoteLine[]) => void;
  onDocumentChange: (doc: Partial<QuoteDocument>) => void;
  pricingItems?: any[];
}

interface GeneratedQuote {
  title: string;
  lines: QuoteLine[];
  feePercentage?: number;
  reasoning: string;
}

export function AIQuoteGenerator({
  document,
  existingLines,
  onLinesGenerated,
  onDocumentChange,
  pricingItems
}: AIQuoteGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedQuote, setGeneratedQuote] = useState<GeneratedQuote | null>(null);
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'idle' | 'generating' | 'review'>('idle');
  const [replaceExisting, setReplaceExisting] = useState(false);

  // Get phase templates for the project type
  const projectType = document.project_type as 'interior' | 'architecture' | 'scenography' | undefined;
  const { templates: phaseTemplates } = usePhaseTemplates(projectType);
  const activePhaseTemplates = phaseTemplates.filter(t => t.is_active);

  const handleGenerate = async () => {
    if (!document.project_type && !document.description) {
      toast.error('Veuillez renseigner le type de projet ou une description');
      return;
    }

    if (activePhaseTemplates.length === 0) {
      toast.error('Aucune phase définie pour ce type de projet. Configurez-les dans les paramètres.');
      return;
    }

    setIsGenerating(true);
    setMode('generating');

    try {
      // Pass phase templates to edge function so AI only uses defined phases
      const phaseTemplatesForAI = activePhaseTemplates.map(t => ({
        code: t.code,
        name: t.name,
        description: t.description,
        default_percentage: t.default_percentage,
        category: t.category,
        deliverables: t.deliverables
      }));

      const { data, error } = await supabase.functions.invoke('generate-full-quote', {
        body: {
          projectType: document.project_type,
          projectDescription: document.description || additionalContext,
          projectBudget: document.project_budget,
          projectSurface: document.project_surface,
          documentType: document.document_type,
          clientInfo: document.client_company?.name,
          existingPricingItems: pricingItems,
          phaseTemplates: phaseTemplatesForAI
        }
      });

      if (error) throw error;

      const result = data as GeneratedQuote;
      setGeneratedQuote(result);
      
      // Select all lines by default
      setSelectedLines(new Set(result.lines.map(l => l.id)));
      setMode('review');

      // Update document title if suggested
      if (result.title && !document.title) {
        onDocumentChange({ ...document, title: result.title });
      }

      toast.success('Devis généré par l\'IA');

    } catch (error) {
      console.error('Error generating quote:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération');
      setMode('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleLine = (lineId: string) => {
    const newSelected = new Set(selectedLines);
    if (newSelected.has(lineId)) {
      newSelected.delete(lineId);
    } else {
      newSelected.add(lineId);
    }
    setSelectedLines(newSelected);
  };

  const applySelectedLines = () => {
    if (!generatedQuote) return;

    const linesToAdd = generatedQuote.lines.filter(l => selectedLines.has(l.id));
    
    // Replace existing lines or merge based on user choice
    if (replaceExisting || existingLines.length === 0) {
      // Replace all lines with generated ones
      const newLines = linesToAdd.map((line, idx) => ({
        ...line,
        id: `line-${Date.now()}-${idx}`,
        sort_order: idx
      }));
      onLinesGenerated(newLines);
    } else {
      // Add to existing lines
      const maxSortOrder = Math.max(...existingLines.map(l => l.sort_order || 0), -1);
      const newLines = linesToAdd.map((line, idx) => ({
        ...line,
        id: `line-${Date.now()}-${idx}`,
        sort_order: maxSortOrder + idx + 1
      }));
      onLinesGenerated([...existingLines, ...newLines]);
    }

    setMode('idle');
    setGeneratedQuote(null);
    setReplaceExisting(false);
    toast.success(replaceExisting 
      ? `${linesToAdd.length} lignes remplacent les existantes` 
      : `${linesToAdd.length} lignes ajoutées au devis`
    );
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const totalSelected = generatedQuote?.lines
    .filter(l => selectedLines.has(l.id) && l.is_included)
    .reduce((sum, l) => sum + (l.amount || 0), 0) || 0;

  if (mode === 'review' && generatedQuote) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Devis généré par l'IA</CardTitle>
            </div>
            <Badge variant="secondary">{generatedQuote.lines.length} lignes</Badge>
          </div>
          <CardDescription>{generatedQuote.reasoning}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {generatedQuote.lines.map((line) => (
                <div
                  key={line.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    selectedLines.has(line.id) 
                      ? 'bg-background border-primary/30' 
                      : 'bg-muted/50 border-transparent'
                  }`}
                >
                  <Checkbox
                    checked={selectedLines.has(line.id)}
                    onCheckedChange={() => toggleLine(line.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {line.phase_code && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {line.phase_code}
                        </Badge>
                      )}
                      <span className="font-medium truncate">{line.phase_name}</span>
                      <Badge variant="secondary" className="text-xs ml-auto shrink-0">
                        {LINE_TYPE_LABELS[line.line_type]}
                      </Badge>
                    </div>
                    {line.phase_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {line.phase_description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-muted-foreground">
                        {line.quantity} {line.unit} × {formatCurrency(line.unit_price || 0)}
                      </span>
                      <span className="font-semibold">{formatCurrency(line.amount || 0)}</span>
                      {!line.is_included && (
                        <Badge variant="outline" className="text-xs">Option</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {existingLines.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t mb-2">
              <Checkbox
                id="replace-existing"
                checked={replaceExisting}
                onCheckedChange={(checked) => setReplaceExisting(checked === true)}
              />
              <Label htmlFor="replace-existing" className="text-sm font-normal cursor-pointer">
                Remplacer les {existingLines.length} lignes existantes
              </Label>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedLines.size} lignes sélectionnées
              </p>
              <p className="font-semibold">Total: {formatCurrency(totalSelected)}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMode('idle');
                  setGeneratedQuote(null);
                  setReplaceExisting(false);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={applySelectedLines}
                disabled={selectedLines.size === 0}
                variant={replaceExisting ? "destructive" : "default"}
              >
                <FileText className="h-4 w-4 mr-2" />
                {replaceExisting ? 'Remplacer' : 'Ajouter'} ({selectedLines.size})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Génération IA</CardTitle>
        </div>
        <CardDescription>
          Générez automatiquement les lignes du devis basé sur le contexte du projet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phase templates info */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {activePhaseTemplates.length} phases définies pour <strong>{document.project_type || 'ce projet'}</strong>
            </span>
          </div>
          <Link to="/settings/phases" target="_blank" className="text-xs text-primary hover:underline">
            Gérer →
          </Link>
        </div>

        {activePhaseTemplates.length === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucune phase définie pour ce type de projet. 
              <Link to="/settings/phases" className="underline ml-1">Configurez vos phases</Link> avant de générer un devis.
            </AlertDescription>
          </Alert>
        )}

        {!document.project_type && !document.description && !document.project_budget && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Renseignez le type de projet, une description ou un budget dans l'onglet "Général" pour de meilleurs résultats.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Contexte additionnel (optionnel)</Label>
          <Textarea
            placeholder="Décrivez le projet, les besoins spécifiques, le périmètre de la mission..."
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || activePhaseTemplates.length === 0}
          className="w-full gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Générer le devis avec l'IA
            </>
          )}
        </Button>

        {existingLines.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Les lignes générées seront ajoutées à vos {existingLines.length} lignes existantes
          </p>
        )}
      </CardContent>
    </Card>
  );
}
