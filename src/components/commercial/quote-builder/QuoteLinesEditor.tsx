import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogTrigger,
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
  Loader2
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
  const ungroupedLines = lines.filter(l => !l.group_id && l.line_type !== 'group');
  const getGroupSubtotal = (groupId: string) => {
    return getGroupLines(groupId).filter(l => l.is_included && l.line_type !== 'discount').reduce((sum, l) => sum + (l.amount || 0), 0);
  };

  // Calculate totals
  const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');
  const discountLines = lines.filter(l => l.line_type === 'discount');
  const subtotal = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalDiscount = discountLines.reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);
  const totalHT = subtotal - totalDiscount;
  const tva = totalHT * 0.2;
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

  const addLineFromTemplate = (template: any) => {
    const newLine: QuoteLine = {
      id: generateId(), phase_code: template.code, phase_name: template.name,
      phase_description: template.description, line_type: 'phase',
      quantity: 1, unit: 'forfait', unit_price: 0, amount: 0,
      percentage_fee: template.default_percentage || 10, billing_type: 'one_time',
      is_optional: false, is_included: true, deliverables: template.deliverables || [], sort_order: lines.length
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

    // Determine source and destination group IDs
    const sourceGroupId = source.droppableId === 'ungrouped' ? undefined : source.droppableId;
    const destGroupId = destination.droppableId === 'ungrouped' ? undefined : destination.droppableId;

    // Update the line's group assignment
    const updatedLines = lines.map(l => {
      if (l.id === draggableId) {
        return { ...l, group_id: destGroupId };
      }
      return l;
    });

    // Reorder within the destination group
    const destLines = destGroupId 
      ? updatedLines.filter(l => l.group_id === destGroupId && l.line_type !== 'group')
      : updatedLines.filter(l => !l.group_id && l.line_type !== 'group');
    
    // Remove the dragged line from its current position
    const withoutDragged = destLines.filter(l => l.id !== draggableId);
    const draggedLineUpdated = updatedLines.find(l => l.id === draggableId)!;
    
    // Insert at new position
    withoutDragged.splice(destination.index, 0, draggedLineUpdated);
    
    // Update sort orders
    const finalLines = updatedLines.map(line => {
      if (line.line_type === 'group') return line;
      
      const inDestGroup = destGroupId 
        ? line.group_id === destGroupId 
        : !line.group_id;
      
      if (inDestGroup) {
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
      {/* Action bar with Add dropdown and AI button */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Ajouter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 sm:w-64">
            <DropdownMenuItem onClick={addGroup}><FolderPlus className="h-4 w-4 mr-2" />Nouveau groupe</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => addLine('service')}><Package className="h-4 w-4 mr-2" />Ligne libre</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addLine('option')}><Gift className="h-4 w-4 mr-2" />Option</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addLine('expense')}><Receipt className="h-4 w-4 mr-2" />Frais</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addLine('discount')}><MinusCircle className="h-4 w-4 mr-2" />Remise</DropdownMenuItem>
            {(baseTemplates.length > 0 || complementaryTemplates.length > 0) && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium flex items-center justify-between">
                  <span>Phases (Paramètres)</span>
                  <a href="/settings/phases" target="_blank" className="text-primary hover:underline text-xs">Gérer →</a>
                </div>
              </>
            )}
            {baseTemplates.length > 0 && (<DropdownMenuSub><DropdownMenuSubTrigger><FileText className="h-4 w-4 mr-2" />Phases de base</DropdownMenuSubTrigger><DropdownMenuSubContent className="max-h-80 overflow-y-auto">{baseTemplates.map(t => (<DropdownMenuItem key={t.id} onClick={() => addLineFromTemplate(t)}><Badge variant="outline" className="mr-2 text-xs font-mono">{t.code}</Badge><span className="truncate">{t.name}</span></DropdownMenuItem>))}</DropdownMenuSubContent></DropdownMenuSub>)}
            {complementaryTemplates.length > 0 && (<DropdownMenuSub><DropdownMenuSubTrigger><FileText className="h-4 w-4 mr-2" />Phases complémentaires</DropdownMenuSubTrigger><DropdownMenuSubContent className="max-h-80 overflow-y-auto">{complementaryTemplates.map(t => (<DropdownMenuItem key={t.id} onClick={() => addLineFromTemplate(t)}><Badge variant="outline" className="mr-2 text-xs font-mono">{t.code}</Badge><span className="truncate">{t.name}</span></DropdownMenuItem>))}</DropdownMenuSubContent></DropdownMenuSub>)}
            {(baseTemplates.length === 0 && complementaryTemplates.length === 0) && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-2 text-xs text-muted-foreground text-center">
                  <p>Aucune phase définie</p>
                  <a href="/settings/phases" target="_blank" className="text-primary hover:underline">Configurer les phases →</a>
                </div>
              </>
            )}
            {activePricingGrids.length > 0 && (<><DropdownMenuSeparator />{activePricingGrids.map(grid => (<DropdownMenuSub key={grid.id}><DropdownMenuSubTrigger><Grid3X3 className="h-4 w-4 mr-2" />{grid.name}</DropdownMenuSubTrigger><DropdownMenuSubContent className="max-h-80 overflow-y-auto">{grid.items.map((item: any, idx: number) => (<DropdownMenuItem key={idx} onClick={() => addLineFromPricingGrid(item)}><div className="flex flex-col"><span>{item.name}</span>{item.unit_price && <span className="text-xs text-muted-foreground">{formatCurrency(item.unit_price)}</span>}</div></DropdownMenuItem>))}</DropdownMenuSubContent></DropdownMenuSub>))}</>)}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Load Quote Template Button - opens dialog */}
        {quoteTemplates && quoteTemplates.length > 0 && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 sm:h-9 text-xs sm:text-sm gap-1.5"
              onClick={() => setShowTemplateDialog(true)}
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Charger template</span>
              <span className="sm:hidden">Template</span>
            </Button>
            
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Charger un template de devis
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  {/* Template selection */}
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
                  
                  {/* Budget target input */}
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
                        ? "L'IA répartira intelligemment ce budget entre les phases du template."
                        : "Laissez vide pour charger le template avec les prix par défaut."}
                    </p>
                  </div>
                  
                  {/* Actions */}
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
                          Génération...
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
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}

        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm gap-1.5">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Génération IA</span>
              <span className="sm:hidden">IA</span>
            </Button>
          </DialogTrigger>
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

        {/* Budget cible - moved to top action bar */}
        <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm gap-1.5">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Budget cible</span>
              <span className="sm:hidden">Budget</span>
            </Button>
          </DialogTrigger>
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
      </div>

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
            
            {/* Ungrouped lines droppable area */}
            <Droppable droppableId="ungrouped">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className={cn(
                    "space-y-2 min-h-[40px] transition-colors rounded-lg p-1",
                    snapshot.isDraggingOver && "bg-muted/50 ring-2 ring-muted ring-inset"
                  )}
                >
                  {ungroupedLines.map((line, index) => renderDraggableLine(line, index, false))}
                  {provided.placeholder}
                  {ungroupedLines.length === 0 && groups.length > 0 && (
                    <div className="text-center py-3 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                      Lignes non groupées
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      )}

      {lines.length > 0 && (
        <>
          {/* Résumé des marges - conditionnel */}
          {features.showMarginSummary && <QuoteMarginSummary lines={lines} />}
          
          <Card><CardContent className="py-3 sm:py-4 px-3 sm:px-6">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-xs sm:text-sm"><span className="text-muted-foreground">Sous-total</span><span>{formatCurrency(subtotal)}</span></div>
              {totalDiscount > 0 && <div className="flex justify-between text-xs sm:text-sm text-red-600"><span>Remises</span><span>-{formatCurrency(totalDiscount)}</span></div>}
              <Separator />
              <div className="flex justify-between font-medium text-sm sm:text-base"><span>Total HT</span><span>{formatCurrency(totalHT)}</span></div>
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground"><span>TVA (20%)</span><span>{formatCurrency(tva)}</span></div>
              <Separator />
              <div className="flex justify-between text-base sm:text-lg font-semibold"><span>Total TTC</span><span>{formatCurrency(totalTTC)}</span></div>
              
              {/* Budget adjustment buttons */}
              <Separator />
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">Ajuster le budget</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => adjustBudget(-0.1)}
                    title="Réduire de 10%"
                  >
                    <TrendingDown className="h-3.5 w-3.5 mr-1" />
                    -10%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => adjustBudget(-0.05)}
                    title="Réduire de 5%"
                  >
                    -5%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-green-500 hover:text-green-600 hover:bg-green-50"
                    onClick={() => adjustBudget(0.05)}
                    title="Augmenter de 5%"
                  >
                    +5%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => adjustBudget(0.1)}
                    title="Augmenter de 10%"
                  >
                    <TrendingUp className="h-3.5 w-3.5 mr-1" />
                    +10%
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 px-2">
                        <Circle className="h-3.5 w-3.5 mr-1" />
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
          </CardContent></Card>
        </>
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
