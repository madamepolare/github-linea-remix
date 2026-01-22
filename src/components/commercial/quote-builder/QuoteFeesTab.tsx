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
  EyeOff
} from 'lucide-react';
import { QuoteDocument, QuoteLine, LINE_TYPE_COLORS } from '@/types/quoteTypes';
import { usePhaseTemplates } from '@/hooks/usePhaseTemplates';
import { getDisciplineBySlug, DisciplinePhase, DISCIPLINE_CONFIGS } from '@/lib/disciplinesConfig';
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

                            {/* Phase code badge */}
                            <Badge variant="outline" className="shrink-0 text-xs font-mono bg-muted/50 px-2">
                              {phase.code}
                            </Badge>

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

      {/* Summary footer */}
      <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Total phases</span>
          <Badge 
            variant={totalPercentage === 100 ? 'default' : 'destructive'}
            className="font-mono text-xs"
          >
            {totalPercentage.toFixed(1)}%
          </Badge>
          {totalPercentage !== 100 && (
            <span className="text-xs text-destructive">
              (devrait être 100%)
            </span>
          )}
        </div>
        <span className="text-lg font-bold tabular-nums">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}
