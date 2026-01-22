import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Euro, 
  Percent, 
  Calculator, 
  RefreshCw, 
  GripVertical,
  Target,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Download,
  Sparkles,
  Loader2,
  Layers
} from 'lucide-react';
import { QuoteDocument, QuoteLine, LINE_TYPE_COLORS } from '@/types/quoteTypes';
import { usePhaseTemplates } from '@/hooks/usePhaseTemplates';
import { getDisciplineBySlug, DisciplinePhase, DISCIPLINE_CONFIGS } from '@/lib/disciplinesConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuoteFeesTabProps {
  document: Partial<QuoteDocument>;
  onDocumentChange: (doc: Partial<QuoteDocument>) => void;
  lines: QuoteLine[];
  onLinesChange: (lines: QuoteLine[]) => void;
}

interface PhaseConfig {
  code: string;
  name: string;
  percentage: number;
  isIncluded: boolean;
  amount: number;
}

export function QuoteFeesTab({ 
  document, 
  onDocumentChange, 
  lines, 
  onLinesChange 
}: QuoteFeesTabProps) {
  const { templates } = usePhaseTemplates(document.project_type as any);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Get discipline-based phases as fallback
  const disciplinePhases = useMemo(() => {
    if (document.project_type) {
      const slug = document.project_type as keyof typeof DISCIPLINE_CONFIGS;
      if (DISCIPLINE_CONFIGS[slug]) {
        return DISCIPLINE_CONFIGS[slug].defaultPhases;
      }
    }
    return DISCIPLINE_CONFIGS.architecture.defaultPhases;
  }, [document.project_type]);

  // Initialize phases from lines or defaults
  const [phases, setPhases] = useState<PhaseConfig[]>(() => {
    const existingPhases = lines.filter(l => l.line_type === 'phase' || l.phase_code);
    if (existingPhases.length > 0) {
      return existingPhases.map(l => ({
        code: l.phase_code || l.id,
        name: l.phase_name,
        percentage: l.percentage_fee || 0,
        isIncluded: l.is_included ?? true,
        amount: l.amount || 0
      }));
    }
    return disciplinePhases.map(p => ({
      code: p.code,
      name: p.name,
      percentage: p.percentage || 0,
      isIncluded: true,
      amount: 0
    }));
  });

  const constructionBudget = document.construction_budget || 0;
  const feePercentage = document.fee_percentage || 12;

  const totalFees = useMemo(() => {
    return (constructionBudget * feePercentage) / 100;
  }, [constructionBudget, feePercentage]);

  useEffect(() => {
    const updatedPhases = phases.map(p => ({
      ...p,
      amount: p.isIncluded ? (totalFees * p.percentage) / 100 : 0
    }));
    
    const hasChanged = updatedPhases.some((p, i) => p.amount !== phases[i].amount);
    if (hasChanged) {
      setPhases(updatedPhases);
    }
  }, [totalFees, phases]);

  useEffect(() => {
    const phaseLines: QuoteLine[] = phases.map((p, index) => ({
      id: `phase-${p.code}`,
      phase_name: p.name,
      phase_code: p.code,
      line_type: 'phase',
      unit: 'forfait',
      quantity: 1,
      unit_price: p.amount,
      amount: p.amount,
      percentage_fee: p.percentage,
      is_included: p.isIncluded,
      is_optional: false,
      billing_type: 'one_time' as const,
      sort_order: index,
      deliverables: []
    }));
    
    const otherLines = lines.filter(l => l.line_type !== 'phase' && !l.phase_code);
    onLinesChange([...phaseLines, ...otherLines]);
  }, [phases]);

  const handlePhaseToggle = (code: string, checked: boolean) => {
    setPhases(prev => prev.map(p => 
      p.code === code ? { ...p, isIncluded: checked } : p
    ));
  };

  const handlePercentageChange = (code: string, percentage: number) => {
    setPhases(prev => prev.map(p => 
      p.code === code ? { ...p, percentage } : p
    ));
  };

  const handleNameChange = (code: string, name: string) => {
    setPhases(prev => prev.map(p => 
      p.code === code ? { ...p, name } : p
    ));
  };

  const handleResetToDefaults = () => {
    const defaultPhases = disciplinePhases.map(p => ({
      code: p.code,
      name: p.name,
      percentage: p.percentage || 0,
      isIncluded: true,
      amount: (totalFees * (p.percentage || 0)) / 100
    }));
    setPhases(defaultPhases);
    toast.success('Phases réinitialisées');
  };

  const toggleExpanded = (code: string) => {
    const newExpanded = new Set(expandedPhases);
    newExpanded.has(code) ? newExpanded.delete(code) : newExpanded.add(code);
    setExpandedPhases(newExpanded);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(phases);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setPhases(items);
  };

  const addPhase = (template?: { code: string; name: string; percentage?: number }) => {
    const newCode = template?.code || `P${phases.length + 1}`;
    const newPhase: PhaseConfig = {
      code: newCode,
      name: template?.name || 'Nouvelle phase',
      percentage: template?.percentage || 0,
      isIncluded: true,
      amount: 0
    };
    setPhases([...phases, newPhase]);
  };

  const deletePhase = (code: string) => {
    setPhases(prev => prev.filter(p => p.code !== code));
  };

  const duplicatePhase = (phase: PhaseConfig) => {
    const newPhase: PhaseConfig = {
      ...phase,
      code: `${phase.code}-copy`,
      name: `${phase.name} (copie)`
    };
    setPhases([...phases, newPhase]);
  };

  const handlePhaseCodeChange = (oldCode: string, newCode: string) => {
    setPhases(prev => prev.map(p => 
      p.code === oldCode ? { ...p, code: newCode } : p
    ));
  };

  // Load phases from discipline template
  const loadFromDisciplineTemplate = () => {
    const templatePhases = disciplinePhases.map(p => ({
      code: p.code,
      name: p.name,
      percentage: p.percentage || 0,
      isIncluded: true,
      amount: (totalFees * (p.percentage || 0)) / 100
    }));
    setPhases(templatePhases);
    setShowTemplateDialog(false);
    toast.success('Phases chargées depuis le template discipline');
  };

  // Load from phase templates configured in settings
  const loadFromPhaseTemplates = () => {
    const activeTemplates = templates.filter(t => t.is_active);
    if (activeTemplates.length === 0) {
      toast.error('Aucun template de phase actif');
      return;
    }
    
    const templatePhases = activeTemplates.map(t => ({
      code: t.code,
      name: t.name,
      percentage: t.default_percentage || 0,
      isIncluded: true,
      amount: (totalFees * (t.default_percentage || 0)) / 100
    }));
    setPhases(templatePhases);
    setShowTemplateDialog(false);
    toast.success('Phases chargées depuis les templates');
  };

  // Generate phases with AI
  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-phase-templates', {
        body: {
          projectType: document.project_type || 'architecture',
          projectTypeLabel: document.title || 'Projet',
          discipline: document.project_type || 'architecture',
          disciplineName: document.project_type || 'Architecture',
          customPrompt: aiPrompt || undefined
        }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Limite de requêtes dépassée, réessayez plus tard.');
          return;
        }
        if (error.message?.includes('402')) {
          toast.error('Crédits IA insuffisants.');
          return;
        }
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Convert AI response to phases
      const basePhases = (data.basePhases || []).map((p: any) => ({
        code: p.code,
        name: p.name,
        percentage: p.default_percentage || 0,
        isIncluded: true,
        amount: (totalFees * (p.default_percentage || 0)) / 100
      }));

      const compPhases = (data.complementaryPhases || []).map((p: any) => ({
        code: p.code,
        name: p.name,
        percentage: p.default_percentage || 0,
        isIncluded: false, // Complementary phases are optional by default
        amount: 0
      }));

      setPhases([...basePhases, ...compPhases]);
      setShowAIDialog(false);
      setAiPrompt('');
      toast.success(`${basePhases.length} phases de base + ${compPhases.length} phases complémentaires générées`);
    } catch (error) {
      console.error('Error generating phases:', error);
      toast.error('Erreur lors de la génération IA');
    } finally {
      setIsGenerating(false);
    }
  };

  // Adjust all phase percentages to total 100%
  const adjustTo100Percent = () => {
    const includedPhasesLocal = phases.filter(p => p.isIncluded);
    const currentTotal = includedPhasesLocal.reduce((sum, p) => sum + p.percentage, 0);
    
    if (currentTotal === 0 || includedPhasesLocal.length === 0) {
      // If no percentages set, distribute evenly
      const evenPercentage = 100 / phases.filter(p => p.isIncluded).length;
      setPhases(prev => prev.map(p => 
        p.isIncluded ? { ...p, percentage: evenPercentage } : p
      ));
    } else {
      // Scale proportionally
      const scaleFactor = 100 / currentTotal;
      setPhases(prev => prev.map(p => 
        p.isIncluded ? { ...p, percentage: Math.round(p.percentage * scaleFactor * 10) / 10 } : p
      ));
    }
    toast.success('Pourcentages ajustés à 100%');
  };

  // Adjust the global fee percentage
  const adjustFeePercentage = (delta: number) => {
    const newFeePercentage = Math.max(0, (feePercentage || 0) + delta);
    onDocumentChange({ 
      ...document, 
      fee_percentage: newFeePercentage 
    });
  };

  // Round phase percentages to nearest precision
  const roundPhasePercentages = (precision: number) => {
    setPhases(prev => prev.map(p => ({
      ...p,
      percentage: Math.round(p.percentage / precision) * precision
    })));
    toast.success(`Pourcentages arrondis à ${precision}%`);
  };

  // Get all available phase codes for dropdown
  const availablePhaseCodes = useMemo(() => {
    const disciplineCodes = disciplinePhases.map(p => ({ code: p.code, name: p.name }));
    const templateCodes = templates.filter(t => t.is_active).map(t => ({ code: t.code, name: t.name }));
    
    // Merge and dedupe
    const allCodes = [...disciplineCodes];
    templateCodes.forEach(tc => {
      if (!allCodes.find(c => c.code === tc.code)) {
        allCodes.push(tc);
      }
    });
    return allCodes;
  }, [disciplinePhases, templates]);

  const includedPhases = phases.filter(p => p.isIncluded);
  const totalPercentage = includedPhases.reduce((sum, p) => sum + p.percentage, 0);
  const totalAmount = includedPhases.reduce((sum, p) => sum + p.amount, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  return (
    <div className="space-y-4">
      {/* Budget & Fee Configuration - Compact inline */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/30 rounded-lg border border-dashed">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
            <Euro className="h-3.5 w-3.5" strokeWidth={1.25} />
            Budget travaux
          </Label>
          <Input
            type="number"
            value={constructionBudget || ''}
            onChange={(e) => onDocumentChange({ 
              ...document, 
              construction_budget: parseFloat(e.target.value) || 0 
            })}
            placeholder="150000"
            className="h-8 w-32 text-sm"
          />
          <span className="text-xs text-muted-foreground">€ HT</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
            <Percent className="h-3.5 w-3.5" strokeWidth={1.25} />
            Taux
          </Label>
          <Input
            type="number"
            value={feePercentage || ''}
            onChange={(e) => onDocumentChange({ 
              ...document, 
              fee_percentage: parseFloat(e.target.value) || 0 
            })}
            placeholder="12"
            step="0.5"
            className="h-8 w-20 text-sm"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>

        {constructionBudget > 0 && (
          <>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Calculator className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.25} />
              <span className="text-sm font-semibold text-primary">
                {formatCurrency(totalFees)}
              </span>
            </div>
          </>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Checkbox
            id="disclose-budget"
            checked={document.construction_budget_disclosed ?? false}
            onCheckedChange={(checked) => 
              onDocumentChange({ 
                ...document, 
                construction_budget_disclosed: checked as boolean 
              })
            }
            className="h-4 w-4"
          />
          <Label htmlFor="disclose-budget" className="text-xs text-muted-foreground">
            Afficher sur doc
          </Label>
        </div>

        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleResetToDefaults}
          className="h-8 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.25} />
          Réinit.
        </Button>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.25} />
              Ajouter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => addPhase()}>
              <Target className="h-4 w-4 mr-2" strokeWidth={1.25} />
              Phase libre
            </DropdownMenuItem>
            {templates.filter(t => t.is_active).length > 0 && (
              <>
                <DropdownMenuSeparator />
                {templates.filter(t => t.is_active).map(t => (
                  <DropdownMenuItem 
                    key={t.code} 
                    onClick={() => addPhase({ code: t.code, name: t.name, percentage: t.default_percentage })}
                  >
                    <Badge variant="outline" className="mr-2 text-xs font-mono">{t.code}</Badge>
                    {t.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Load template button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs gap-1.5"
          onClick={() => setShowTemplateDialog(true)}
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.25} />
          Charger template
        </Button>

        {/* AI generation button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs gap-1.5"
          onClick={() => setShowAIDialog(true)}
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.25} />
          Générer IA
        </Button>
      </div>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Charger un template de phases
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid gap-2">
              <div
                onClick={loadFromDisciplineTemplate}
                className="p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.25} />
                  <span className="font-medium">Template discipline</span>
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {disciplinePhases.length} phases
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  Phases standards pour {document.project_type || 'architecture'}
                </p>
              </div>

              {templates.filter(t => t.is_active).length > 0 && (
                <div
                  onClick={loadFromPhaseTemplates}
                  className="p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">Templates personnalisés</span>
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {templates.filter(t => t.is_active).length} phases
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Phases configurées dans les paramètres
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Génération IA des phases
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm">Description du projet (optionnel)</Label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Rénovation d'un appartement haussmannien de 120m², création d'une cuisine ouverte..."
                className="min-h-[100px] text-sm"
              />
              <p className="text-xs text-muted-foreground">
                L'IA génèrera des phases adaptées à votre projet. Laissez vide pour les phases standards.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAIDialog(false);
                  setAiPrompt('');
                }}
              >
                Annuler
              </Button>
              <Button
                className="flex-1"
                onClick={generateWithAI}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer les phases
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phases List - Same UI as QuoteLinesEditor */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="phases">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {phases.map((phase, index) => (
                <Draggable key={phase.code} draggableId={phase.code} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn(
                        snapshot.isDragging && "opacity-90 shadow-xl ring-2 ring-primary/50 rounded-lg"
                      )}
                    >
                      <Collapsible open={expandedPhases.has(phase.code)}>
                        <div
                          className={cn(
                            "border rounded-xl transition-all",
                            !phase.isIncluded && 'border-dashed border-muted-foreground/30 bg-muted/20',
                            expandedPhases.has(phase.code) && 'shadow-md ring-1 ring-primary/10'
                          )}
                        >
                          {/* Compact header */}
                          <div className="flex items-center gap-2 p-3">
                            {/* Drag handle */}
                            <div 
                              {...provided.dragHandleProps}
                              className="cursor-grab shrink-0 p-1 hover:bg-muted rounded active:cursor-grabbing"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            
                            {/* Type icon */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={cn("p-1.5 rounded-lg shrink-0 cursor-default", LINE_TYPE_COLORS.phase)}>
                                  <Target className="h-4 w-4" strokeWidth={1.25} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Phase mission</p>
                              </TooltipContent>
                            </Tooltip>

                            {/* Phase code dropdown */}
                            <Select 
                              value={phase.code} 
                              onValueChange={(newCode) => handlePhaseCodeChange(phase.code, newCode)}
                            >
                              <SelectTrigger className="h-8 w-[90px] shrink-0 text-xs font-mono bg-muted/50 border-muted">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Current value always available */}
                                {!availablePhaseCodes.find(c => c.code === phase.code) && (
                                  <SelectItem value={phase.code}>
                                    {phase.code}
                                  </SelectItem>
                                )}
                                {availablePhaseCodes.map(c => (
                                  <SelectItem key={c.code} value={c.code}>
                                    <span className="font-mono">{c.code}</span>
                                    <span className="text-muted-foreground ml-1.5">- {c.name}</span>
                                  </SelectItem>
                                ))}
                                {/* Custom option */}
                                <SelectItem value="__custom__" disabled className="text-muted-foreground">
                                  — Personnalisé —
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Title */}
                            <div className="flex-1 min-w-0">
                              <Input
                                value={phase.name}
                                onChange={(e) => handleNameChange(phase.code, e.target.value)}
                                className="h-8 font-medium border-transparent hover:border-input focus:border-input bg-transparent text-sm"
                                placeholder="Nom de la phase..."
                              />
                            </div>

                            {/* Percentage input */}
                            <div className="flex items-center h-8 bg-muted/40 rounded-lg overflow-hidden">
                              <Input
                                type="number"
                                value={phase.percentage}
                                onChange={(e) => 
                                  handlePercentageChange(phase.code, parseFloat(e.target.value) || 0)
                                }
                                className="h-8 w-16 text-center text-sm border-0 bg-transparent tabular-nums focus:bg-muted/60"
                                step="0.5"
                                disabled={!phase.isIncluded}
                              />
                              <span className="text-xs text-muted-foreground pr-2">%</span>
                            </div>

                            {/* Amount - read-only */}
                            <div className="flex items-center h-8 bg-primary/5 border border-primary/20 rounded-lg overflow-hidden px-3 min-w-[100px]">
                              <span className="tabular-nums font-semibold text-sm text-primary">
                                {phase.isIncluded ? phase.amount.toLocaleString('fr-FR') : '—'}
                              </span>
                              <span className="text-sm text-primary/70 ml-1 font-medium">€</span>
                            </div>

                            {/* Include/Exclude toggle */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  onClick={() => handlePhaseToggle(phase.code, !phase.isIncluded)}
                                >
                                  {phase.isIncluded ? (
                                    <Eye className="h-4 w-4 text-muted-foreground" strokeWidth={1.25} />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" strokeWidth={1.25} />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {phase.isIncluded ? 'Exclure du total' : 'Inclure au total'}
                              </TooltipContent>
                            </Tooltip>

                            {/* Actions dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => duplicatePhase(phase)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Dupliquer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => deletePhase(phase.code)} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Expand/collapse */}
                            <CollapsibleTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 shrink-0"
                                onClick={() => toggleExpanded(phase.code)}
                              >
                                {expandedPhases.has(phase.code) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>

                          {/* Expanded content */}
                          <CollapsibleContent>
                            <div className="border-t bg-gradient-to-b from-muted/30 to-transparent p-4">
                              <p className="text-xs text-muted-foreground">
                                Détails de la phase à venir (livrables, équipe assignée, dates...)
                              </p>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Summary footer with auto-adjust */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Total phases</span>
            <Badge 
              variant={Math.abs(totalPercentage - 100) < 0.1 ? 'default' : 'destructive'}
              className="font-mono text-xs"
            >
              {totalPercentage.toFixed(1)}%
            </Badge>
            {Math.abs(totalPercentage - 100) >= 0.1 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={adjustTo100Percent}
              >
                <Calculator className="h-3.5 w-3.5" strokeWidth={1.25} />
                Ajuster à 100%
              </Button>
            )}
          </div>
          <span className="text-lg font-bold tabular-nums">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {/* Budget adjustment buttons */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">Ajuster le taux</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => adjustFeePercentage(-1)}
            >
              -1%
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => adjustFeePercentage(-0.5)}
            >
              -0.5%
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-green-500 hover:text-green-600 hover:bg-green-50"
              onClick={() => adjustFeePercentage(0.5)}
            >
              +0.5%
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => adjustFeePercentage(1)}
            >
              +1%
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  <Percent className="h-3 w-3 mr-1" strokeWidth={1.25} />
                  Arrondir
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => roundPhasePercentages(1)}>
                  Arrondir à 1%
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => roundPhasePercentages(5)}>
                  Arrondir à 5%
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => roundPhasePercentages(10)}>
                  Arrondir à 10%
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
