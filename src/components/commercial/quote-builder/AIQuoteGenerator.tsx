import { useState } from 'react';
import { Sparkles, Loader2, Wand2, FileText, AlertCircle, Settings, Percent, Euro, Layers, ExternalLink, Target, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { QuoteDocument, QuoteLine, LINE_TYPE_LABELS } from '@/types/quoteTypes';
import { usePhaseTemplates } from '@/hooks/usePhaseTemplates';
import { usePricingGrids, PricingGrid } from '@/hooks/usePricingGrids';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

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

type GenerationMode = 'percentage' | 'fixed' | 'complete';

const GENERATION_MODES: { value: GenerationMode; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    value: 'percentage', 
    label: 'Honoraires %', 
    icon: <Percent className="h-4 w-4" />,
    description: 'Phases en % du budget'
  },
  { 
    value: 'fixed', 
    label: 'Forfaits', 
    icon: <Euro className="h-4 w-4" />,
    description: 'Prix fixes'
  },
  { 
    value: 'complete', 
    label: 'Complet', 
    icon: <Layers className="h-4 w-4" />,
    description: 'Phases % + forfaits'
  }
];

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
  const [generationMode, setGenerationMode] = useState<GenerationMode>('complete');
  const [targetBudget, setTargetBudget] = useState<string>('');
  const [selectedBpuId, setSelectedBpuId] = useState<string>('');

  // Get phase templates (liste universelle)
  const { templates: phaseTemplates } = usePhaseTemplates();
  const activePhaseTemplates = phaseTemplates.filter((t) => t.is_active);

  // Get pricing grids (BPU)
  const { pricingGrids, activeGrids } = usePricingGrids();

  const selectedBpu = pricingGrids.find(g => g.id === selectedBpuId);

  const handleGenerate = async () => {
    if (!document.project_type && !document.description) {
      toast.error('Veuillez renseigner le type de projet ou une description');
      return;
    }

    // Check for budget if generating percentage-based phases
    if ((generationMode === 'percentage' || generationMode === 'complete') && !document.construction_budget) {
      toast.error('Renseignez le budget travaux pour générer des honoraires en %');
      return;
    }

    if (activePhaseTemplates.length === 0 && (generationMode === 'percentage' || generationMode === 'complete')) {
      toast.error('Aucune phase définie. Configurez-les dans les paramètres.');
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

      // Pass BPU items if selected
      const bpuItemsForAI = selectedBpu ? (selectedBpu.items as any[]).map((item: any) => ({
        ref: item.ref || item.pricing_ref || item.code,
        name: item.name || item.designation,
        description: item.description,
        unit: item.unit,
        unit_price: item.unit_price || item.unitPrice,
        category: item.category
      })) : undefined;

      const { data, error } = await supabase.functions.invoke('generate-full-quote', {
        body: {
          projectType: document.project_type,
          projectDescription: document.description || additionalContext,
          projectBudget: document.project_budget,
          constructionBudget: document.construction_budget,
          feePercentage: document.fee_percentage,
          projectSurface: document.project_surface,
          documentType: document.document_type,
          clientInfo: document.client_company?.name,
          existingPricingItems: pricingItems,
          phaseTemplates: phaseTemplatesForAI,
          generationMode: generationMode,
          targetBudget: targetBudget ? parseFloat(targetBudget) : undefined,
          bpuItems: bpuItemsForAI,
          bpuName: selectedBpu?.name
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
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Résultat IA</CardTitle>
            </div>
            <Badge variant="secondary">{generatedQuote.lines.length} lignes</Badge>
          </div>
          <CardDescription className="text-sm">{generatedQuote.reasoning}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-2">
              {generatedQuote.lines.map((line) => (
                <div
                  key={line.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-all",
                    selectedLines.has(line.id) 
                      ? 'bg-background border-primary/30 shadow-sm' 
                      : 'bg-muted/30 border-transparent opacity-60'
                  )}
                >
                  <Checkbox
                    checked={selectedLines.has(line.id)}
                    onCheckedChange={() => toggleLine(line.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {line.phase_code && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {line.phase_code}
                        </Badge>
                      )}
                      <span className="font-medium text-sm">{line.phase_name}</span>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs ml-auto",
                          line.pricing_mode === 'percentage' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        )}
                      >
                        {line.pricing_mode === 'percentage' ? (
                          <><Percent className="h-3 w-3 mr-0.5" />{line.percentage_fee}%</>
                        ) : (
                          LINE_TYPE_LABELS[line.line_type]
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>{line.quantity} {line.unit} × {formatCurrency(line.unit_price || 0)}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(line.amount || 0)}</span>
                      {!line.is_included && (
                        <Badge variant="outline" className="text-[10px]">Option</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="pt-3 border-t space-y-3">
            {existingLines.length > 0 && (
              <div className="flex items-center gap-2">
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

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{selectedLines.size} sélectionnées</p>
                <p className="font-semibold">{formatCurrency(totalSelected)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMode('idle');
                    setGeneratedQuote(null);
                    setReplaceExisting(false);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={applySelectedLines}
                  disabled={selectedLines.size === 0}
                  variant={replaceExisting ? "destructive" : "default"}
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  {replaceExisting ? 'Remplacer' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canGenerate = 
    (generationMode === 'fixed' || 
     ((generationMode === 'percentage' || generationMode === 'complete') && 
      activePhaseTemplates.length > 0 && 
      document.construction_budget));

  return (
    <Card className="border-dashed border-primary/30">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Wand2 className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base">Génération IA</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generation mode selector - compact */}
        <ToggleGroup 
          type="single" 
          value={generationMode} 
          onValueChange={(v) => v && setGenerationMode(v as GenerationMode)}
          className="grid grid-cols-3 gap-1"
        >
          {GENERATION_MODES.map((gm) => (
            <ToggleGroupItem 
              key={gm.value} 
              value={gm.value}
              className={cn(
                "flex flex-col items-center gap-0.5 h-auto py-2 px-2 text-xs border rounded-md",
                generationMode === gm.value && "border-primary bg-primary/5"
              )}
            >
              {gm.icon}
              <span className="font-medium">{gm.label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {/* Row: Target budget + BPU selector */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Target className="h-3 w-3" />
              Budget cible
              <span className="text-muted-foreground">(optionnel)</span>
            </Label>
            <Input
              type="number"
              value={targetBudget}
              onChange={(e) => setTargetBudget(e.target.value)}
              placeholder="Ex: 15000"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <List className="h-3 w-3" />
              Grille BPU
              <span className="text-muted-foreground">(optionnel)</span>
            </Label>
            <Select value={selectedBpuId} onValueChange={setSelectedBpuId}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Aucune" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucune grille</SelectItem>
                {activeGrids.map((grid) => (
                  <SelectItem key={grid.id} value={grid.id}>
                    {grid.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Phases & BPU links */}
        {(generationMode === 'percentage' || generationMode === 'complete') && (
          <div className="flex items-center justify-between p-2 bg-muted/40 rounded-md text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{activePhaseTemplates.length} phases</span>
                <Link to="/settings/phases" target="_blank" className="text-primary hover:underline inline-flex items-center">
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              {selectedBpu && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>•</span>
                  <span>BPU: {selectedBpu.name}</span>
                  <Link to="/settings/pricing" target="_blank" className="text-primary hover:underline inline-flex items-center">
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alerts */}
        {(generationMode === 'percentage' || generationMode === 'complete') && !document.construction_budget && (
          <Alert className="py-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs">
              Renseignez le budget travaux dans "Général" pour les honoraires %.
            </AlertDescription>
          </Alert>
        )}

        {activePhaseTemplates.length === 0 && (generationMode === 'percentage' || generationMode === 'complete') && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs">
              <Link to="/settings/phases" className="underline">Configurez vos phases</Link> avant de générer.
            </AlertDescription>
          </Alert>
        )}

        {/* Context textarea */}
        <div className="space-y-1.5">
          <Label className="text-xs">Contexte additionnel</Label>
          <Textarea
            placeholder="Décrivez le projet, les besoins spécifiques..."
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            rows={2}
            className="text-sm resize-none"
          />
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !canGenerate}
          className="w-full gap-2"
          size="sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Générer
            </>
          )}
        </Button>

        {existingLines.length > 0 && (
          <p className="text-[10px] text-muted-foreground text-center">
            S'ajoutera aux {existingLines.length} lignes existantes
          </p>
        )}
      </CardContent>
    </Card>
  );
}
