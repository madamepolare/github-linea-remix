import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  List,
  FolderPlus,
  Folder
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

  const projectType = document.project_type as 'interior' | 'architecture' | 'scenography' | undefined;
  const { templates: phaseTemplates } = usePhaseTemplates(projectType);
  const { pricingGrids } = useQuoteTemplates(projectType);
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
      id: generateId(), phase_name: 'Nouveau groupe', line_type: 'group',
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="gap-2"><List className="h-4 w-4" />Manuel</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2"><Sparkles className="h-4 w-4" />Génération IA</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-4">
          <AIQuoteGenerator document={document} existingLines={lines} onLinesGenerated={onLinesChange} onDocumentChange={onDocumentChange} pricingItems={allPricingItems} />
        </TabsContent>

        <TabsContent value="manual" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Ajouter</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem onClick={addGroup}><FolderPlus className="h-4 w-4 mr-2" />Nouveau groupe</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => addLine('service')}><Package className="h-4 w-4 mr-2" />Ligne libre</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addLine('phase')}><FileText className="h-4 w-4 mr-2" />Phase</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addLine('option')}><Gift className="h-4 w-4 mr-2" />Option</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addLine('expense')}><Receipt className="h-4 w-4 mr-2" />Frais</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addLine('discount')}><MinusCircle className="h-4 w-4 mr-2" />Remise</DropdownMenuItem>
                {baseTemplates.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuSub><DropdownMenuSubTrigger><FileText className="h-4 w-4 mr-2" />Phases de base</DropdownMenuSubTrigger><DropdownMenuSubContent className="max-h-80 overflow-y-auto">{baseTemplates.map(t => (<DropdownMenuItem key={t.id} onClick={() => addLineFromTemplate(t)}><Badge variant="outline" className="mr-2 text-xs">{t.code}</Badge>{t.name}</DropdownMenuItem>))}</DropdownMenuSubContent></DropdownMenuSub></>)}
                {complementaryTemplates.length > 0 && (<DropdownMenuSub><DropdownMenuSubTrigger><FileText className="h-4 w-4 mr-2" />Phases complémentaires</DropdownMenuSubTrigger><DropdownMenuSubContent className="max-h-80 overflow-y-auto">{complementaryTemplates.map(t => (<DropdownMenuItem key={t.id} onClick={() => addLineFromTemplate(t)}><Badge variant="outline" className="mr-2 text-xs">{t.code}</Badge>{t.name}</DropdownMenuItem>))}</DropdownMenuSubContent></DropdownMenuSub>)}
                {activePricingGrids.length > 0 && (<><DropdownMenuSeparator />{activePricingGrids.map(grid => (<DropdownMenuSub key={grid.id}><DropdownMenuSubTrigger><Grid3X3 className="h-4 w-4 mr-2" />{grid.name}</DropdownMenuSubTrigger><DropdownMenuSubContent className="max-h-80 overflow-y-auto">{grid.items.map((item: any, idx: number) => (<DropdownMenuItem key={idx} onClick={() => addLineFromPricingGrid(item)}><div className="flex flex-col"><span>{item.name}</span>{item.unit_price && <span className="text-xs text-muted-foreground">{formatCurrency(item.unit_price)}</span>}</div></DropdownMenuItem>))}</DropdownMenuSubContent></DropdownMenuSub>))}</>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TabsContent>
      </Tabs>

      {lines.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Aucune ligne dans ce devis</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => {
            const groupLines = getGroupLines(group.id);
            const isGroupExpanded = expandedGroups.has(group.id);
            return (
              <Collapsible key={group.id} open={isGroupExpanded}>
                <div className={`border-2 rounded-lg ${LINE_TYPE_COLORS.group}`}>
                  <div className="flex items-center gap-2 p-3 bg-muted/30">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Folder className="h-4 w-4 text-slate-600" />
                    <Input value={group.phase_name} onChange={(e) => updateLine(group.id, { phase_name: e.target.value })} className="flex-1 h-9 font-medium" placeholder="Nom du groupe..." />
                    <Badge variant="secondary">{groupLines.length} ligne{groupLines.length > 1 ? 's' : ''}</Badge>
                    <span className="font-medium min-w-[100px] text-right">{formatCurrency(getGroupSubtotal(group.id))}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteLine(group.id)}><Trash2 className="h-4 w-4" /></Button>
                    <CollapsibleTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleGroupExpanded(group.id)}>{isGroupExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button></CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="p-2 space-y-2">
                      {groupLines.length === 0 ? <div className="text-center py-4 text-sm text-muted-foreground">Aucune ligne</div> : groupLines.map((line, index) => (
                        <QuoteLineItemCompact key={line.id} line={line} index={index} isInGroup={true} groups={groups} isExpanded={expandedLines.has(line.id)} draggedIndex={draggedIndex} teamMembers={teamMembers} document={document} toggleExpanded={toggleExpanded} updateLine={updateLine} duplicateLine={duplicateLine} deleteLine={deleteLine} assignToGroup={assignToGroup} handleDragStart={handleDragStart} handleDragOver={handleDragOver} handleDragEnd={handleDragEnd} formatCurrency={formatCurrency} />
                      ))}
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => addLine('service', group.id)}><Plus className="h-4 w-4 mr-2" />Ajouter une ligne</Button>
                      {groupLines.length > 0 && <Card className="bg-slate-50 border-slate-200"><CardContent className="py-2 px-4"><div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">Sous-total {group.phase_name}</span><span className="font-semibold">{formatCurrency(getGroupSubtotal(group.id))}</span></div></CardContent></Card>}
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
          
          <Card><CardContent className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sous-total</span><span>{formatCurrency(subtotal)}</span></div>
              {totalDiscount > 0 && <div className="flex justify-between text-sm text-red-600"><span>Remises</span><span>-{formatCurrency(totalDiscount)}</span></div>}
              <Separator />
              <div className="flex justify-between font-medium"><span>Total HT</span><span>{formatCurrency(totalHT)}</span></div>
              <div className="flex justify-between text-sm text-muted-foreground"><span>TVA (20%)</span><span>{formatCurrency(tva)}</span></div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold"><span>Total TTC</span><span>{formatCurrency(totalTTC)}</span></div>
            </div>
          </CardContent></Card>
        </>
      )}
    </div>
  );
}
