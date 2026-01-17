import { useState } from 'react';
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
  Layers
} from 'lucide-react';
import { QuoteDocument, QuoteLine, LINE_TYPE_COLORS } from '@/types/quoteTypes';
import { usePhaseTemplates } from '@/hooks/usePhaseTemplates';
import { useQuoteTemplates } from '@/hooks/useQuoteTemplates';
import { AIQuoteGenerator } from './AIQuoteGenerator';
import { QuoteLineItem } from './QuoteLineItem';
import { QuoteLineItemCompact } from './QuoteLineItemCompact';
import { QuoteMarginSummary } from './QuoteMarginSummary';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useLineFeatures } from '@/contexts/LineFeatureContext';

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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
      id: generateId(), phase_name: item.name, phase_description: item.description,
      line_type: 'service', quantity: 1, unit: item.unit || 'forfait',
      unit_price: item.unit_price || 0, amount: item.unit_price || 0,
      billing_type: 'one_time', is_optional: false, is_included: true, sort_order: lines.length
    };
    onLinesChange([...lines, newLine]);
  };

  // Load a complete quote template (all phases)
  const loadQuoteTemplate = (template: any) => {
    const newLines: QuoteLine[] = template.phases.map((phase: any, index: number) => ({
      id: generateId(),
      phase_code: phase.code,
      phase_name: phase.name,
      phase_description: phase.description || '',
      line_type: 'phase' as const,
      quantity: 1,
      unit: 'forfait',
      unit_price: 0,
      amount: 0,
      percentage_fee: phase.defaultPercentage || 0,
      billing_type: 'one_time' as const,
      is_optional: phase.category === 'complementary',
      is_included: phase.category !== 'complementary',
      deliverables: phase.deliverables || [],
      sort_order: lines.length + index
    }));
    onLinesChange([...lines, ...newLines]);
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

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragEnd = () => setDraggedIndex(null);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newLines = [...lines];
    const [draggedLine] = newLines.splice(draggedIndex, 1);
    newLines.splice(index, 0, draggedLine);
    onLinesChange(newLines.map((l, i) => ({ ...l, sort_order: i })));
    setDraggedIndex(index);
  };

  const baseTemplates = phaseTemplates.filter(t => t.category === 'base' && t.is_active);
  const complementaryTemplates = phaseTemplates.filter(t => t.category === 'complementary' && t.is_active);
  const activePricingGrids = pricingGrids.filter(g => g.is_active && g.items?.length > 0);
  const allPricingItems = activePricingGrids.flatMap(grid => (grid.items || []).map((item: any) => ({ name: item.name, unit_price: item.unit_price, unit: item.unit })));

  const [showAIDialog, setShowAIDialog] = useState(false);

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

        {/* Load Quote Template Button */}
        {quoteTemplates && quoteTemplates.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm gap-1.5">
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Charger template</span>
                <span className="sm:hidden">Template</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium flex items-center justify-between">
                <span>Templates de devis</span>
                <a href="/settings?section=quote-templates" target="_blank" className="text-primary hover:underline text-xs">Gérer →</a>
              </div>
              <DropdownMenuSeparator />
              {quoteTemplates.map(template => (
                <DropdownMenuItem key={template.id} onClick={() => loadQuoteTemplate(template)}>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{template.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-6">
                      {template.phases.length} phases
                      {template.description && ` • ${template.description}`}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
      </div>

      {lines.length === 0 ? (
        <Card><CardContent className="py-8 sm:py-12 text-center"><FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" /><p className="text-sm sm:text-base text-muted-foreground">Aucune ligne dans ce devis</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
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
                    <div className="p-2 space-y-2">
                      {groupLines.length === 0 ? <div className="text-center py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">Aucune ligne</div> : groupLines.map((line, index) => (
                        <QuoteLineItemCompact key={line.id} line={line} index={index} isInGroup={true} groups={groups} isExpanded={expandedLines.has(line.id)} draggedIndex={draggedIndex} teamMembers={teamMembers} document={document} toggleExpanded={toggleExpanded} updateLine={updateLine} duplicateLine={duplicateLine} deleteLine={deleteLine} assignToGroup={assignToGroup} handleDragStart={handleDragStart} handleDragOver={handleDragOver} handleDragEnd={handleDragEnd} formatCurrency={formatCurrency} />
                      ))}
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs sm:text-sm h-8" onClick={() => addLine('service', group.id)}><Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Ajouter une ligne</Button>
                      {groupLines.length > 0 && <Card className="bg-slate-50 border-slate-200"><CardContent className="py-2 px-3 sm:px-4"><div className="flex justify-between text-xs sm:text-sm"><span className="text-muted-foreground font-medium truncate mr-2">Sous-total {group.phase_name}</span><span className="font-semibold shrink-0">{formatCurrency(getGroupSubtotal(group.id))}</span></div></CardContent></Card>}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
          {ungroupedLines.map((line, index) => (
            <QuoteLineItemCompact key={line.id} line={line} index={index} isInGroup={false} groups={groups} isExpanded={expandedLines.has(line.id)} draggedIndex={draggedIndex} teamMembers={teamMembers} document={document} toggleExpanded={toggleExpanded} updateLine={updateLine} duplicateLine={duplicateLine} deleteLine={deleteLine} assignToGroup={assignToGroup} handleDragStart={handleDragStart} handleDragOver={handleDragOver} handleDragEnd={handleDragEnd} formatCurrency={formatCurrency} />
          ))}
        </div>
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
            </div>
          </CardContent></Card>
        </>
      )}
    </div>
  );
}
