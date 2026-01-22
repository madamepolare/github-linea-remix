import { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  Plus, 
  GripVertical, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Package,
  Gift,
  Receipt,
  MinusCircle,
  Grid3X3,
  Sparkles,
  FolderPlus,
  Folder,
  Download,
  Layers,
  TrendingUp,
  TrendingDown,
  Target,
  Circle,
  Loader2,
  Euro,
  Percent,
  Calculator
} from 'lucide-react';
import { QuoteDocument, QuoteLine, LINE_TYPE_COLORS } from '@/types/quoteTypes';
import { supabase } from '@/integrations/supabase/client';
import { usePhaseTemplates } from '@/hooks/usePhaseTemplates';
import { useQuoteTemplates } from '@/hooks/useQuoteTemplates';
import { AIQuoteGenerator } from './AIQuoteGenerator';
import { QuoteLineItem } from './QuoteLineItem';
import { QuoteLineItemCompact } from './QuoteLineItemCompact';
import { QuoteMarginSummary } from './QuoteMarginSummary';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useLineFeatures } from '@/contexts/LineFeatureContext';
import { cn } from '@/lib/utils';
import { QuickQuoteLineRow } from './QuickQuoteLineRow';
import { DeleteDialog } from '@/components/ui/patterns/confirm-dialog';

interface QuoteLinesEditorProps {
  lines: QuoteLine[];
  onLinesChange: (lines: QuoteLine[]) => void;
  document: Partial<QuoteDocument>;
  onDocumentChange: (doc: Partial<QuoteDocument>) => void;
}

function generateId() {
  return `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function QuoteLinesEditor({
  lines,
  onLinesChange,
  document,
  onDocumentChange
}: QuoteLinesEditorProps) {
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  
  // Global toggle for percentage pricing mode
  const [percentageModeEnabled, setPercentageModeEnabled] = useState(() => {
    // Initialize based on existing lines
    return lines.some(l => l.pricing_mode === 'percentage');
  });

  // Get feature flags from context
  const features = useLineFeatures();

  const projectType = document.project_type as string | undefined;
  const { templates: phaseTemplates } = usePhaseTemplates(projectType);
  const { templates: quoteTemplates, pricingGrids } = useQuoteTemplates();
  const { data: teamMembers } = useTeamMembers();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  // Get all groups
  const groups = lines.filter(l => l.line_type === 'group');
  const getGroupLines = (groupId: string) => lines.filter(l => l.group_id === groupId && l.line_type !== 'group');
  
  // Separate lines into percentage-based and fixed-based sections
  const percentageLines = useMemo(() => 
    lines
      .filter(l => l.pricing_mode === 'percentage' && !l.group_id && l.line_type !== 'group')
      .sort((a, b) => {
        const aCode = a.phase_code || 'zzz';
        const bCode = b.phase_code || 'zzz';
        if (aCode !== bCode) return aCode.localeCompare(bCode);
        return (a.sort_order || 0) - (b.sort_order || 0);
      }),
    [lines]
  );

  const fixedLines = useMemo(() => 
    lines
      .filter(l => l.pricing_mode !== 'percentage' && !l.group_id && l.line_type !== 'group')
      .sort((a, b) => {
        const aCode = a.phase_code || 'zzz';
        const bCode = b.phase_code || 'zzz';
        if (aCode !== bCode) return aCode.localeCompare(bCode);
        return (a.sort_order || 0) - (b.sort_order || 0);
      }),
    [lines]
  );
  
  const getGroupSubtotal = (groupId: string) => {
    return getGroupLines(groupId).filter(l => l.is_included && l.line_type !== 'discount').reduce((sum, l) => sum + (l.amount || 0), 0);
  };

  // Calculate totals per section
  const percentageTotal = useMemo(() => 
    percentageLines.filter(l => l.is_included).reduce((sum, l) => sum + (l.amount || 0), 0),
    [percentageLines]
  );

  const totalPercentage = useMemo(() => 
    percentageLines.filter(l => l.is_included).reduce((sum, l) => sum + (l.percentage_fee || 0), 0),
    [percentageLines]
  );

  // Check if any lines use percentage pricing mode
  const hasPercentageLines = percentageLines.length > 0;

  // Construction budget and fee percentage for percentage-based calculations
  const constructionBudget = document.construction_budget || 0;
  const feePercentage = document.fee_percentage || 12;
  const totalFees = useMemo(() => (constructionBudget * feePercentage) / 100, [constructionBudget, feePercentage]);

  // Auto-recalculate amounts for percentage-based lines when budget/fee changes
  useEffect(() => {
    if (!hasPercentageLines || constructionBudget === 0) return;
    
    const updatedLines = lines.map(line => {
      if (line.pricing_mode === 'percentage' && line.percentage_fee !== undefined) {
        const newAmount = (totalFees * line.percentage_fee) / 100;
        if (Math.abs(newAmount - (line.amount || 0)) > 0.01) {
          return { ...line, amount: newAmount, unit_price: newAmount };
        }
      }
      return line;
    });
    
    const hasChanged = updatedLines.some((l, i) => l.amount !== lines[i].amount);
    if (hasChanged) {
      onLinesChange(updatedLines);
    }
  }, [totalFees, hasPercentageLines]);

  // Calculate totals
  const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');
  const discountLines = lines.filter(l => l.line_type === 'discount');
  const subtotal = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalDiscount = discountLines.reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);
  const totalHT = subtotal - totalDiscount;
  const tva = totalHT * ((document.vat_rate || 20) / 100);
  const totalTTC = totalHT + tva;

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedLines);
    newExpanded.has(id) ? newExpanded.delete(id) : newExpanded.add(id);
    setExpandedLines(newExpanded);
  };

  const toggleGroupExpanded = (id: string) => {
    const newExpanded = new Set(expandedGroups);
    newExpanded.has(id) ? newExpanded.delete(id) : newExpanded.add(id);
    setExpandedGroups(newExpanded);
  };

  const addGroup = () => {
    const newGroup: QuoteLine = {
      id: generateId(), phase_name: '', line_type: 'group',
      quantity: 0, unit: 'forfait', unit_price: 0, amount: 0,
      billing_type: 'one_time', is_optional: false, is_included: true, sort_order: lines.length
    };
    onLinesChange([...lines, newGroup]);
    setExpandedGroups(new Set([...expandedGroups, newGroup.id]));
  };

  const addLine = (type: QuoteLine['line_type'] = 'service', groupId?: string) => {
    const newLine: QuoteLine = {
      id: generateId(), phase_name: '', line_type: type, group_id: groupId,
      quantity: 1, unit: 'forfait', unit_price: 0, amount: 0,
      billing_type: 'one_time', is_optional: type === 'option', is_included: type !== 'option', sort_order: lines.length
    };
    onLinesChange([...lines, newLine]);
    setExpandedLines(new Set([...expandedLines, newLine.id]));
  };

  const addLineFromTemplate = (template: any, usePricingMode: 'percentage' | 'fixed' = 'percentage') => {
    const percentage = template.default_percentage || 10;
    const amount = usePricingMode === 'percentage' && constructionBudget > 0 
      ? (totalFees * percentage) / 100 
      : 0;
    
    const newLine: QuoteLine = {
      id: generateId(), 
      phase_code: template.code, 
      phase_name: template.name,
      phase_description: template.description, 
      line_type: 'phase',
      pricing_mode: usePricingMode,
      quantity: 1, 
      unit: 'forfait', 
      unit_price: amount, 
      amount: amount,
      percentage_fee: percentage, 
      billing_type: 'one_time',
      is_optional: false, 
      is_included: true, 
      deliverables: template.deliverables || [], 
      sort_order: lines.length
    };
    onLinesChange([...lines, newLine]);
  };

  const addLineFromPricingGrid = (item: any) => {
    const newLine: QuoteLine = {
      id: generateId(), 
      phase_name: item.name, 
      phase_description: item.description,
      pricing_ref: item.pricing_ref, // Transfer BPU reference
      line_type: 'service', 
      quantity: 1, 
      unit: item.unit || 'forfait',
      unit_price: item.unit_price || 0, 
      amount: item.unit_price || 0,
      billing_type: 'one_time', 
      is_optional: false, 
      is_included: true, 
      sort_order: lines.length
    };
    onLinesChange([...lines, newLine]);
  };

  // Load a complete quote template (all phases)
  const loadQuoteTemplate = (template: any, targetBudget?: number) => {
    const newLines: QuoteLine[] = template.phases.map((phase: any, index: number) => {
      const unitPrice = phase.defaultUnitPrice || 0;
      return {
        id: generateId(),
        phase_code: phase.code,
        phase_name: phase.name,
        phase_description: phase.description || '',
        line_type: 'phase' as const,
        quantity: 1,
        unit: 'forfait',
        unit_price: unitPrice,
        amount: unitPrice,
        percentage_fee: phase.defaultPercentage || 0,
        billing_type: 'one_time' as const,
        is_optional: phase.category === 'complementary',
        is_included: phase.category !== 'complementary',
        deliverables: phase.deliverables || [],
        sort_order: lines.length + index
      };
    });
    
    // If target budget provided, distribute using AI
    if (targetBudget && targetBudget > 0) {
      loadTemplateWithBudget(template, newLines, targetBudget);
    } else {
      onLinesChange([...lines, ...newLines]);
    }
  };

  // Load template and distribute budget with AI
  const loadTemplateWithBudget = async (template: any, templateLines: QuoteLine[], targetBudget: number) => {
    try {
      const linesInfo = templateLines
        .filter(l => l.line_type !== 'group' && l.line_type !== 'discount')
        .map(l => ({
          id: l.id,
          name: l.phase_name,
          description: l.phase_description,
          type: l.line_type,
          current_price: l.unit_price || 0,
          percentage: l.percentage_fee || 0
        }));
      
      const { data, error } = await supabase.functions.invoke('distribute-budget', {
        body: {
          targetBudget,
          lines: linesInfo,
          projectType: document.project_type,
          projectDescription: document.description || document.title
        }
      });
      
      if (error) throw error;
      
      // Apply the AI-generated prices
      const priceMap = new Map<string, number>(data.lines.map((l: { id: string; price: number }) => [l.id, l.price]));
      const updatedLines: QuoteLine[] = templateLines.map(line => {
        if (line.line_type === 'group' || line.line_type === 'discount') return line;
        const newPrice = priceMap.get(line.id);
        if (newPrice !== undefined) {
          return {
            ...line,
            unit_price: newPrice,
            amount: (line.quantity || 1) * newPrice
          };
        }
        return line;
      });
      
      onLinesChange([...lines, ...updatedLines]);
    } catch (error) {
      console.error('Error distributing budget with AI:', error);
      // Fallback: distribute proportionally based on percentages
      const totalPercentage = templateLines.reduce((sum, l) => sum + (l.percentage_fee || 0), 0) || templateLines.length;
      const updatedLines = templateLines.map(line => {
        const proportion = (line.percentage_fee || (100 / templateLines.length)) / (totalPercentage || 100);
        const newPrice = Math.round(targetBudget * proportion);
        return {
          ...line,
          unit_price: newPrice,
          amount: (line.quantity || 1) * newPrice
        };
      });
      onLinesChange([...lines, ...updatedLines]);
    }
  };

  const updateLine = (id: string, updates: Partial<QuoteLine>) => {
    onLinesChange(lines.map(line => {
      if (line.id === id) {
        const updated = { ...line, ...updates };
        if ('quantity' in updates || 'unit_price' in updates) {
          updated.amount = (updated.quantity || 1) * (updated.unit_price || 0);
        }
        return updated;
      }
      return line;
    }));
  };

  const duplicateLine = (line: QuoteLine) => {
    const newLine: QuoteLine = { ...line, id: generateId(), phase_name: `${line.phase_name} (copie)`, sort_order: lines.length };
    onLinesChange([...lines, newLine]);
  };

  const deleteLine = (id: string) => {
    const lineToDelete = lines.find(l => l.id === id);
    if (lineToDelete?.line_type === 'group') {
      onLinesChange(lines.filter(l => l.id !== id).map(l => l.group_id === id ? { ...l, group_id: undefined } : l));
    } else {
      onLinesChange(lines.filter(l => l.id !== id));
    }
  };

  const assignToGroup = (lineId: string, groupId: string | undefined) => {
    onLinesChange(lines.map(l => l.id === lineId ? { ...l, group_id: groupId } : l));
  };

  // Adjust budget by percentage
  const adjustBudget = (percentage: number) => {
    const multiplier = 1 + percentage;
    const updatedLines = lines.map(line => {
      if (line.line_type === 'group' || line.line_type === 'discount') return line;
      const newUnitPrice = (line.unit_price || 0) * multiplier;
      const newAmount = (line.quantity || 1) * newUnitPrice;
      return { ...line, unit_price: Math.round(newUnitPrice * 100) / 100, amount: Math.round(newAmount * 100) / 100 };
    });
    onLinesChange(updatedLines);
  };

  // Adjust to target budget
  const adjustToTarget = (targetBudget: number) => {
    if (totalHT === 0) return;
    const ratio = targetBudget / totalHT;
    const updatedLines = lines.map(line => {
      if (line.line_type === 'group' || line.line_type === 'discount') return line;
      const newUnitPrice = (line.unit_price || 0) * ratio;
      const newAmount = (line.quantity || 1) * newUnitPrice;
      return { ...line, unit_price: Math.round(newUnitPrice * 100) / 100, amount: Math.round(newAmount * 100) / 100 };
    });
    onLinesChange(updatedLines);
  };

  // Round prices to nearest 10 or 100
  const roundPrices = (precision: number = 10) => {
    const updatedLines = lines.map(line => {
      if (line.line_type === 'group' || line.line_type === 'discount') return line;
      const newUnitPrice = Math.round((line.unit_price || 0) / precision) * precision;
      const newAmount = (line.quantity || 1) * newUnitPrice;
      return { ...line, unit_price: newUnitPrice, amount: newAmount };
    });
    onLinesChange(updatedLines);
  };

  // Handle drag & drop
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    
    // If dropped in same place, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const draggedLine = lines.find(l => l.id === draggableId);
    if (!draggedLine || draggedLine.line_type === 'group') return;

    // Handle section-based droppable IDs (percentage, fixed, or group IDs)
    const isPercentageSection = (id: string) => id === 'percentage';
    const isFixedSection = (id: string) => id === 'fixed';
    const isSection = (id: string) => isPercentageSection(id) || isFixedSection(id);

    // Determine source and destination group IDs (null for sections)
    const sourceGroupId = isSection(source.droppableId) ? undefined : source.droppableId;
    const destGroupId = isSection(destination.droppableId) ? undefined : destination.droppableId;

    // Determine pricing mode based on destination section
    let newPricingMode = draggedLine.pricing_mode;
    if (isPercentageSection(destination.droppableId) && draggedLine.line_type === 'phase') {
      newPricingMode = 'percentage';
    } else if (isFixedSection(destination.droppableId)) {
      newPricingMode = 'fixed';
    }

    // Update the line's group assignment and pricing mode
    const updatedLines = lines.map(l => {
      if (l.id === draggableId) {
        const updates: Partial<QuoteLine> = { group_id: destGroupId };
        if (newPricingMode !== draggedLine.pricing_mode) {
          updates.pricing_mode = newPricingMode;
          // Recalculate amount when switching to percentage mode
          if (newPricingMode === 'percentage' && constructionBudget > 0 && l.percentage_fee) {
            const newAmount = (totalFees * l.percentage_fee) / 100;
            updates.amount = newAmount;
            updates.unit_price = newAmount;
          }
        }
        return { ...l, ...updates };
      }
      return l;
    });

    // Reorder within the destination section/group
    let destLines: QuoteLine[];
    if (isPercentageSection(destination.droppableId)) {
      destLines = updatedLines.filter(l => l.pricing_mode === 'percentage' && !l.group_id && l.line_type !== 'group');
    } else if (isFixedSection(destination.droppableId)) {
      destLines = updatedLines.filter(l => l.pricing_mode !== 'percentage' && !l.group_id && l.line_type !== 'group');
    } else if (destGroupId) {
      destLines = updatedLines.filter(l => l.group_id === destGroupId && l.line_type !== 'group');
    } else {
      destLines = updatedLines.filter(l => !l.group_id && l.line_type !== 'group');
    }
    
    // Remove the dragged line from its current position
    const withoutDragged = destLines.filter(l => l.id !== draggableId);
    const draggedLineUpdated = updatedLines.find(l => l.id === draggableId)!;
    
    // Insert at new position
    withoutDragged.splice(destination.index, 0, draggedLineUpdated);
    
    // Update sort orders
    const finalLines = updatedLines.map(line => {
      if (line.line_type === 'group') return line;
      
      const inDest = withoutDragged.some(l => l.id === line.id);
      
      if (inDest) {
        const newIndex = withoutDragged.findIndex(l => l.id === line.id);
        if (newIndex !== -1) {
          return { ...line, sort_order: newIndex };
        }
      }
      return line;
    });

    onLinesChange(finalLines);
  };

  const baseTemplates = phaseTemplates.filter(t => t.category === 'base' && t.is_active);
  const complementaryTemplates = phaseTemplates.filter(t => t.category === 'complementary' && t.is_active);
  const activePricingGrids = pricingGrids.filter(g => g.is_active && g.items?.length > 0);
  const allPricingItems = activePricingGrids.flatMap(grid => (grid.items || []).map((item: any) => ({ name: item.name, unit_price: item.unit_price, unit: item.unit })));

  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateBudget, setTemplateBudget] = useState('');
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const handleLoadTemplateWithBudget = async () => {
    if (!selectedTemplate) return;
    
    const budget = parseFloat(templateBudget) || 0;
    setIsLoadingTemplate(true);
    
    try {
      await loadQuoteTemplate(selectedTemplate, budget > 0 ? budget : undefined);
      setShowTemplateDialog(false);
      setSelectedTemplate(null);
      setTemplateBudget('');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const renderDraggableLine = (line: QuoteLine, index: number, isInGroup: boolean) => (
    <Draggable key={line.id} draggableId={line.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            snapshot.isDragging && "opacity-90 shadow-xl ring-2 ring-primary/50 rounded-lg"
          )}
        >
          <QuoteLineItemCompact
            line={line}
            index={index}
            isInGroup={isInGroup}
            groups={groups}
            isExpanded={expandedLines.has(line.id)}
            dragHandleProps={provided.dragHandleProps}
            teamMembers={teamMembers}
            document={document}
            toggleExpanded={toggleExpanded}
            updateLine={updateLine}
            duplicateLine={duplicateLine}
            deleteLine={deleteLine}
            assignToGroup={assignToGroup}
            formatCurrency={formatCurrency}
          />
        </div>
      )}
    </Draggable>
  );


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Pricing Mode Selector - Clear 3 options */}
      <div className="p-4 bg-muted/20 rounded-lg border space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Label className="text-sm font-medium">Mode de tarification</Label>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Fixed only mode */}
          <button
            type="button"
            onClick={() => setPercentageModeEnabled(false)}
            className={cn(
              "p-3 rounded-lg border-2 text-left transition-all",
              !percentageModeEnabled 
                ? "border-primary bg-primary/5" 
                : "border-transparent bg-muted/30 hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Euro className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
              <span className="font-medium text-sm">Forfaitaire</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Prix fixes (quantité × prix unitaire)
            </p>
          </button>

          {/* Percentage only mode */}
          <button
            type="button"
            onClick={() => setPercentageModeEnabled(true)}
            className={cn(
              "p-3 rounded-lg border-2 text-left transition-all",
              percentageModeEnabled 
                ? "border-primary bg-primary/5" 
                : "border-transparent bg-muted/30 hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-4 w-4 text-blue-600" strokeWidth={1.5} />
              <span className="font-medium text-sm">Honoraires %</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Phases calculées sur budget travaux
            </p>
          </button>

          {/* Mixed mode info */}
          <div className="p-3 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex -space-x-1">
                <Percent className="h-3.5 w-3.5 text-blue-600" strokeWidth={1.5} />
                <Euro className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.5} />
              </div>
              <span className="font-medium text-sm text-muted-foreground">Mixte</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Activez "%" puis ajoutez des lignes forfaitaires
            </p>
          </div>
        </div>

        {/* Budget & Fee Configuration - shown only when percentage mode is enabled */}
        {percentageModeEnabled && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t">
            {/* If we have percentage lines, show the estimated amount prominently */}
            {hasPercentageLines ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg">
                    <span className="text-xs text-muted-foreground">Honoraires estimés</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(percentageTotal)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    sur {formatCurrency(constructionBudget)} ({totalPercentage.toFixed(1)}%)
                  </span>
                </div>

                <div className="h-6 w-px bg-border" />

                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    Budget
                  </Label>
                  <Input
                    type="number"
                    value={constructionBudget || ''}
                    onChange={(e) => onDocumentChange({ 
                      ...document, 
                      construction_budget: parseFloat(e.target.value) || 0 
                    })}
                    placeholder="150000"
                    className="h-7 w-28 text-xs"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
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
                    className="h-7 w-16 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </>
            ) : (
              /* No percentage lines yet - prompt to enter budget */
              <>
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
                    placeholder="Ex: 150000"
                    className="h-8 w-36 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">€ HT</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                    <Percent className="h-3.5 w-3.5" strokeWidth={1.25} />
                    Taux honoraires
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

                {constructionBudget > 0 && feePercentage > 0 && (
                  <>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(totalFees)}
                      </span>
                      <span className="text-xs text-muted-foreground">honoraires à répartir</span>
                    </div>
                  </>
                )}
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
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2">
        {/* Add dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.25} />
              Ajouter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={addGroup}>
              <FolderPlus className="h-4 w-4 mr-2" strokeWidth={1.25} />
              Nouveau groupe
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => addLine('phase')}>
              <Target className="h-4 w-4 mr-2" strokeWidth={1.25} />
              Phase
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addLine('service')}>
              <Package className="h-4 w-4 mr-2" strokeWidth={1.25} />
              Ligne libre
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addLine('option')}>
              <Gift className="h-4 w-4 mr-2" strokeWidth={1.25} />
              Option
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addLine('expense')}>
              <Receipt className="h-4 w-4 mr-2" strokeWidth={1.25} />
              Frais
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addLine('discount')}>
              <MinusCircle className="h-4 w-4 mr-2" strokeWidth={1.25} />
              Remise
            </DropdownMenuItem>
            {(baseTemplates.length > 0 || complementaryTemplates.length > 0) && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                  Phases (Paramètres)
                </div>
              </>
            )}
            {baseTemplates.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FileText className="h-4 w-4 mr-2" strokeWidth={1.25} />
                  Phases de base
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
                  {baseTemplates.map(t => (
                    <DropdownMenuItem key={t.id} onClick={() => addLineFromTemplate(t)}>
                      <Badge variant="outline" className="mr-2 text-xs font-mono">{t.code}</Badge>
                      <span className="truncate">{t.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {complementaryTemplates.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FileText className="h-4 w-4 mr-2" strokeWidth={1.25} />
                  Phases complémentaires
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
                  {complementaryTemplates.map(t => (
                    <DropdownMenuItem key={t.id} onClick={() => addLineFromTemplate(t)}>
                      <Badge variant="outline" className="mr-2 text-xs font-mono">{t.code}</Badge>
                      <span className="truncate">{t.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {activePricingGrids.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {activePricingGrids.map(grid => (
                  <DropdownMenuSub key={grid.id}>
                    <DropdownMenuSubTrigger>
                      <Grid3X3 className="h-4 w-4 mr-2" strokeWidth={1.25} />
                      {grid.name}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
                      {grid.items.map((item: any, idx: number) => (
                        <DropdownMenuItem key={idx} onClick={() => addLineFromPricingGrid(item)}>
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            {item.unit_price && (
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(item.unit_price)}
                              </span>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
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

        {/* Spacer to push clear button to right */}
        <div className="flex-1" />

        {/* Clear all button - positioned at right */}
        {lines.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setClearAllDialogOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.25} />
            Tout effacer
          </Button>
        )}
      </div>

      {/* Clear all confirmation dialog */}
      <DeleteDialog
        open={clearAllDialogOpen}
        onOpenChange={setClearAllDialogOpen}
        title="Effacer toutes les lignes"
        description={`Êtes-vous sûr de vouloir supprimer les ${lines.length} ligne(s) du devis ? Cette action est irréversible.`}
        confirmLabel="Tout effacer"
        onConfirm={() => {
          onLinesChange([]);
          setClearAllDialogOpen(false);
        }}
      />

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Charger un template de devis
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {quoteTemplates && quoteTemplates.length > 0 ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template</label>
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {quoteTemplates.map(template => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer transition-colors",
                          selectedTemplate?.id === template.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{template.name}</span>
                          <Badge variant="secondary" className="text-xs ml-auto">
                            {template.phases.length} phases
                          </Badge>
                        </div>
                        {template.description && (
                          <p className="text-xs text-muted-foreground mt-1 ml-6">
                            {template.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget cible HT (optionnel)</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={templateBudget}
                      onChange={(e) => setTemplateBudget(e.target.value)}
                      className="text-right"
                      placeholder="Ex: 15000"
                    />
                    <span className="text-muted-foreground">€</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {templateBudget && parseFloat(templateBudget) > 0
                      ? "L'IA répartira intelligemment ce budget entre les lignes."
                      : "Laissez vide pour charger avec les prix par défaut."}
                  </p>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowTemplateDialog(false);
                      setSelectedTemplate(null);
                      setTemplateBudget('');
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleLoadTemplateWithBudget}
                    disabled={!selectedTemplate || isLoadingTemplate}
                  >
                    {isLoadingTemplate ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Chargement...
                      </>
                    ) : templateBudget && parseFloat(templateBudget) > 0 ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Charger avec IA
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Charger
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Aucun template de devis configuré</p>
                <a href="/settings/quotes" className="text-primary hover:underline text-sm">
                  Configurer les templates →
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Génération IA du devis
            </DialogTitle>
          </DialogHeader>
          <AIQuoteGenerator 
            document={document} 
            existingLines={lines} 
            onLinesGenerated={(newLines) => {
              onLinesChange(newLines);
              setShowAIDialog(false);
            }} 
            onDocumentChange={onDocumentChange} 
            pricingItems={allPricingItems} 
          />
        </DialogContent>
      </Dialog>

      {/* Budget target dialog */}
      <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Ajuster vers un budget cible
            </DialogTitle>
          </DialogHeader>
          <BudgetTargetForm 
            currentTotal={totalHT} 
            lines={lines}
            document={document}
            onApply={(targetBudget) => {
              adjustToTarget(targetBudget);
              setBudgetDialogOpen(false);
            }}
            onApplyWithAI={(updatedLines) => onLinesChange(updatedLines)}
            onClose={() => setBudgetDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {lines.length === 0 ? (
        <Card><CardContent className="py-8 sm:py-12 text-center"><FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" /><p className="text-sm sm:text-base text-muted-foreground">Aucune ligne dans ce devis</p></CardContent></Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-2">
            {/* Render groups */}
            {groups.map((group) => {
              const groupLines = getGroupLines(group.id);
              const isGroupExpanded = expandedGroups.has(group.id);
              return (
                <Collapsible key={group.id} open={isGroupExpanded}>
                  <div className={`border-2 rounded-lg ${LINE_TYPE_COLORS.group}`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/30 flex-wrap sm:flex-nowrap">
                      <GripVertical className="h-4 w-4 text-muted-foreground hidden sm:block" />
                      <Folder className="h-4 w-4 text-slate-600 shrink-0" />
                      <Input value={group.phase_name} onChange={(e) => updateLine(group.id, { phase_name: e.target.value })} className="flex-1 h-8 sm:h-9 font-medium text-sm min-w-[120px]" placeholder="Titre du groupe" autoFocus={!group.phase_name} />
                      <Badge variant="secondary" className="text-xs shrink-0">{groupLines.length}</Badge>
                      <span className="font-medium text-sm min-w-[80px] sm:min-w-[100px] text-right shrink-0">{formatCurrency(getGroupSubtotal(group.id))}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-destructive shrink-0" onClick={() => deleteLine(group.id)}><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
                      <CollapsibleTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" onClick={() => toggleGroupExpanded(group.id)}>{isGroupExpanded ? <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}</Button></CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <Droppable droppableId={group.id}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef} 
                            {...provided.droppableProps}
                            className={cn(
                              "p-2 space-y-2 min-h-[60px] transition-colors rounded-b-lg",
                              snapshot.isDraggingOver && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
                            )}
                          >
                            {groupLines.length === 0 && !snapshot.isDraggingOver ? (
                              <div className="text-center py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                                Glissez des lignes ici
                              </div>
                            ) : (
                              groupLines.map((line, index) => renderDraggableLine(line, index, true))
                            )}
                            {provided.placeholder}
                            <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs sm:text-sm h-8" onClick={() => addLine('service', group.id)}><Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Ajouter une ligne</Button>
                            {groupLines.length > 0 && <Card className="bg-slate-50 border-slate-200"><CardContent className="py-2 px-3 sm:px-4"><div className="flex justify-between text-xs sm:text-sm"><span className="text-muted-foreground font-medium truncate mr-2">Sous-total {group.phase_name}</span><span className="font-semibold shrink-0">{formatCurrency(getGroupSubtotal(group.id))}</span></div></CardContent></Card>}
                          </div>
                        )}
                      </Droppable>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
            
            {/* Percentage-based lines section */}
            {percentageLines.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <Percent className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span className="text-xs font-medium">Honoraires %</span>
                  </div>
                  <div className="flex-1 h-px bg-blue-200" />
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[10px]">
                    {totalPercentage.toFixed(1)}%
                  </Badge>
                  <span className="text-xs font-semibold text-blue-700 tabular-nums">
                    {formatCurrency(percentageTotal)}
                  </span>
                </div>
                <Droppable droppableId="percentage">
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      className={cn(
                        "space-y-2 min-h-[40px] transition-colors rounded-lg p-1 border-l-2 border-blue-200 ml-1",
                        snapshot.isDraggingOver && "bg-blue-50/50 ring-2 ring-blue-200 ring-inset"
                      )}
                    >
                      {percentageLines.map((line, index) => renderDraggableLine(line, index, false))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )}

            {/* Fixed-price lines section */}
            {fixedLines.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <Euro className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span className="text-xs font-medium">Prestations forfaitaires</span>
                  </div>
                  <div className="flex-1 h-px bg-emerald-200" />
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[10px]">
                    {fixedLines.filter(l => l.is_included).length} lignes
                  </Badge>
                  <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                    {formatCurrency(fixedLines.filter(l => l.is_included && l.line_type !== 'discount').reduce((sum, l) => sum + (l.amount || 0), 0))}
                  </span>
                </div>
                <Droppable droppableId="fixed">
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      className={cn(
                        "space-y-2 min-h-[40px] transition-colors rounded-lg p-1 border-l-2 border-emerald-200 ml-1",
                        snapshot.isDraggingOver && "bg-emerald-50/50 ring-2 ring-emerald-200 ring-inset"
                      )}
                    >
                      {fixedLines.map((line, index) => renderDraggableLine(line, index, false))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )}

            {/* Empty state when no lines outside groups */}
            {percentageLines.length === 0 && fixedLines.length === 0 && groups.length > 0 && (
              <div className="text-center py-3 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                Lignes non groupées
              </div>
            )}
          </div>
        </DragDropContext>
      )}

      {/* Quick add row */}
      <QuickQuoteLineRow
        onAdd={(name) => {
          const newLine: QuoteLine = {
            id: generateId(),
            phase_name: name,
            line_type: 'service',
            quantity: 1,
            unit: 'forfait',
            unit_price: 0,
            amount: 0,
            billing_type: 'one_time',
            is_optional: false,
            is_included: true,
            sort_order: lines.length
          };
          onLinesChange([...lines, newLine]);
        }}
        placeholder="Ajouter une prestation..."
      />

      {lines.length > 0 && (
        <div className="space-y-3 pt-4">
          {/* Résumé des marges - conditionnel */}
          {features.showMarginSummary && <QuoteMarginSummary lines={lines} />}
          
          {/* Totals - plain text without Card */}
          <div className="space-y-1.5 px-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sous-total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-xs text-red-600">
                <span>Remises</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between text-sm font-medium">
              <span>Total HT</span>
              <span>{formatCurrency(totalHT)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>TVA (20%)</span>
              <span>{formatCurrency(tva)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-1">
              <span>Total TTC</span>
              <span>{formatCurrency(totalTTC)}</span>
            </div>
          </div>
          
          {/* Budget adjustment buttons */}
          <div className="flex items-center justify-between pt-2 px-1">
            <span className="text-xs text-muted-foreground">Ajuster</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => adjustBudget(-0.1)}
              >
                -10%
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => adjustBudget(-0.05)}
              >
                -5%
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-green-500 hover:text-green-600 hover:bg-green-50"
                onClick={() => adjustBudget(0.05)}
              >
                +5%
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => adjustBudget(0.1)}
              >
                +10%
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <Circle className="h-3 w-3 mr-1" strokeWidth={1.25} />
                    Arrondir
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => roundPrices(10)}>
                    Arrondir à 10€
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => roundPrices(50)}>
                    Arrondir à 50€
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => roundPrices(100)}>
                    Arrondir à 100€
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Budget target form component
function BudgetTargetForm({ 
  currentTotal, 
  lines,
  document,
  onApply,
  onApplyWithAI,
  onClose
}: { 
  currentTotal: number; 
  lines: QuoteLine[];
  document: Partial<QuoteDocument>;
  onApply: (target: number) => void;
  onApplyWithAI: (lines: QuoteLine[]) => void;
  onClose?: () => void;
}) {
  const [targetBudget, setTargetBudget] = useState(currentTotal > 0 ? currentTotal.toString() : '');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  
  const target = parseFloat(targetBudget) || 0;
  const diff = target - currentTotal;
  const diffPercent = currentTotal > 0 ? (diff / currentTotal) * 100 : 0;
  
  const handleGenerateWithAI = async () => {
    if (target <= 0) return;
    
    setIsGenerating(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Prepare lines info for AI
      const linesInfo = lines
        .filter(l => l.line_type !== 'group' && l.line_type !== 'discount')
        .map(l => ({
          id: l.id,
          name: l.phase_name,
          description: l.phase_description,
          type: l.line_type,
          current_price: l.unit_price || 0
        }));
      
      const { data, error } = await supabase.functions.invoke('distribute-budget', {
        body: {
          targetBudget: target,
          lines: linesInfo,
          projectType: document.project_type,
          projectDescription: document.description || document.title
        }
      });
      
      if (error) throw error;
      
      // Apply the AI-generated prices
      const priceMap = new Map<string, number>(data.lines.map((l: { id: string; price: number }) => [l.id, l.price]));
      const updatedLines: QuoteLine[] = lines.map(line => {
        if (line.line_type === 'group' || line.line_type === 'discount') return line;
        const newPrice = priceMap.get(line.id);
        if (newPrice !== undefined) {
          return {
            ...line,
            unit_price: newPrice,
            amount: (line.quantity || 1) * newPrice
          };
        }
        return line;
      });
      
      onApplyWithAI(updatedLines);
      onClose?.();
    } catch (error) {
      console.error('Error generating prices with AI:', error);
      // Fallback to proportional distribution
      onApply(target);
      onClose?.();
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Budget cible HT</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={targetBudget}
            onChange={(e) => setTargetBudget(e.target.value)}
            className="text-right"
            placeholder="Ex: 15000"
          />
          <span className="text-muted-foreground">€</span>
        </div>
      </div>
      
      {currentTotal > 0 && (
        <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Budget actuel</span>
            <span>{formatCurrency(currentTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Budget cible</span>
            <span className="font-medium">{formatCurrency(target)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Différence</span>
            <span className={cn(
              "font-medium",
              diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""
            )}>
              {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        {currentTotal > 0 && (
          <Button 
            variant="outline"
            className="w-full" 
            onClick={() => onApply(target)}
            disabled={target <= 0}
          >
            <Target className="h-4 w-4 mr-2" />
            Ajuster proportionnellement
          </Button>
        )}
        <Button 
          className="w-full" 
          onClick={handleGenerateWithAI}
          disabled={target <= 0 || isGenerating || lines.filter(l => l.line_type !== 'group' && l.line_type !== 'discount').length === 0}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Génération IA...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Répartir avec IA
            </>
          )}
        </Button>
        {lines.filter(l => l.line_type !== 'group' && l.line_type !== 'discount').length === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Ajoutez d'abord des lignes au devis
          </p>
        )}
      </div>
    </div>
  );
}
