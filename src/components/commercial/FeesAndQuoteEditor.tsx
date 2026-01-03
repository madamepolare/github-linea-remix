import { useState } from 'react';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal,
  FileText,
  Percent,
  Package,
  Gift,
  Receipt,
  MinusCircle,
  Copy,
  Calculator,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { 
  QuoteLineItem, 
  LineItemType, 
  LINE_ITEM_UNITS,
  QUOTE_TEMPLATES,
  COMMON_ADDITIONAL_ITEMS,
  getTemplatesForProjectType
} from '@/lib/quoteTemplates';
import { 
  ProjectType, 
  CommercialDocument,
  CommercialDocumentPhase,
  FeeMode,
  FEE_MODE_LABELS
} from '@/lib/commercialTypes';
import { AIPhaseSuggestion } from './AIPhaseSuggestion';

interface FeesAndQuoteEditorProps {
  items: QuoteLineItem[];
  projectType: ProjectType;
  onItemsChange: (items: QuoteLineItem[]) => void;
  document: Partial<CommercialDocument>;
  onDocumentChange: (doc: Partial<CommercialDocument>) => void;
  documentId?: string;
}

const TYPE_ICONS: Record<LineItemType, React.ReactNode> = {
  phase: <FileText className="h-4 w-4" />,
  prestation: <Package className="h-4 w-4" />,
  option: <Gift className="h-4 w-4" />,
  expense: <Receipt className="h-4 w-4" />,
  discount: <MinusCircle className="h-4 w-4" />,
  provision: <Percent className="h-4 w-4" />
};

const TYPE_COLORS: Record<LineItemType, string> = {
  phase: 'bg-primary/10 text-primary border-primary/20',
  prestation: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  option: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  expense: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  discount: 'bg-red-500/10 text-red-600 border-red-500/20',
  provision: 'bg-teal-500/10 text-teal-600 border-teal-500/20'
};

function generateId() {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function FeesAndQuoteEditor({
  items,
  projectType,
  onItemsChange,
  document,
  onDocumentChange,
  documentId
}: FeesAndQuoteEditorProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  // === FEE CALCULATION LOGIC ===
  const constructionBudget = document.construction_budget || 0;
  const feeMode = document.fee_mode || 'fixed';
  const feePercentage = document.fee_percentage || 0;
  const totalAmount = document.total_amount || 0;

  // Calculate base fee for percentage mode
  const baseFee = constructionBudget && feePercentage
    ? constructionBudget * (feePercentage / 100)
    : totalAmount;

  // Get the base amount for distributing to phases
  const getPhaseBaseAmount = () => {
    if (feeMode === 'percentage' && constructionBudget > 0 && feePercentage > 0) {
      return constructionBudget * (feePercentage / 100);
    }
    return totalAmount;
  };

  const phaseBaseAmount = getPhaseBaseAmount();

  // === ITEMS LOGIC ===
  const phaseItems = items.filter(i => i.type === 'phase');
  const otherItems = items.filter(i => i.type !== 'phase');
  const includedPhases = phaseItems.filter(p => !p.isOptional);
  const totalPercentage = includedPhases.reduce((sum, i) => sum + (i.percentageFee || 0), 0);

  // Calculate phase amount from percentage
  const calculatePhaseAmount = (percentageFee: number) => {
    if (totalPercentage > 0 && phaseBaseAmount > 0) {
      return (percentageFee / totalPercentage) * phaseBaseAmount;
    }
    return 0;
  };

  // Calculate totals
  const calculateTotal = () => {
    switch (feeMode) {
      case 'percentage':
        return baseFee;
      case 'hourly':
        if (document.hourly_rate) {
          return includedPhases.length * 40 * document.hourly_rate;
        }
        return 0;
      default:
        return totalAmount;
    }
  };

  const total = calculateTotal();
  
  // Fee percentage of construction budget
  const feePercentageOfBudget = constructionBudget > 0 && total > 0
    ? (total / constructionBudget) * 100
    : null;

  // Other items totals
  const subtotalOther = otherItems.filter(i => !i.isOptional && i.type !== 'discount').reduce((sum, i) => sum + i.amount, 0);
  const optionalItems = otherItems.filter(i => i.isOptional);
  const discountItems = items.filter(i => i.type === 'discount');
  const totalDiscount = discountItems.reduce((sum, i) => sum + Math.abs(i.amount), 0);
  const grandTotalHT = total + subtotalOther - totalDiscount;
  const TVA = grandTotalHT * 0.2;
  const grandTotalTTC = grandTotalHT + TVA;

  // === ITEM MANAGEMENT ===
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const updateItem = (id: string, updates: Partial<QuoteLineItem>) => {
    onItemsChange(
      items.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          if ('quantity' in updates || 'unitPrice' in updates) {
            updated.amount = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const addItem = (type: LineItemType = 'prestation') => {
    const newItem: QuoteLineItem = {
      id: generateId(),
      type,
      designation: '',
      quantity: 1,
      unit: 'forfait',
      unitPrice: 0,
      amount: 0,
      isOptional: type === 'option',
      deliverables: [],
      sortOrder: items.length,
      percentageFee: type === 'phase' ? 15 : undefined
    };
    onItemsChange([...items, newItem]);
    setExpandedItems(new Set([...expandedItems, newItem.id]));
  };

  const addCommonItem = (itemTemplate: typeof COMMON_ADDITIONAL_ITEMS[0]) => {
    const newItem: QuoteLineItem = {
      ...itemTemplate,
      id: generateId(),
      sortOrder: items.length
    };
    onItemsChange([...items, newItem]);
  };

  const duplicateItem = (item: QuoteLineItem) => {
    const newItem: QuoteLineItem = {
      ...item,
      id: generateId(),
      designation: `${item.designation} (copie)`,
      sortOrder: items.length
    };
    onItemsChange([...items, newItem]);
  };

  const deleteItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
    expandedItems.delete(id);
    setExpandedItems(new Set(expandedItems));
  };

  const loadTemplate = (templateId: string) => {
    const template = QUOTE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      const newItems: QuoteLineItem[] = template.lineItems.map((item, index) => ({
        ...item,
        id: generateId(),
        sortOrder: index
      }));
      onItemsChange(newItems);
    }
  };

  // === DRAG & DROP ===
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    const updatedItems = newItems.map((item, i) => ({ ...item, sortOrder: i }));
    onItemsChange(updatedItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // === DELIVERABLES ===
  const addDeliverable = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      updateItem(itemId, { deliverables: [...item.deliverables, ''] });
    }
  };

  const updateDeliverable = (itemId: string, index: number, value: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const newDeliverables = [...item.deliverables];
      newDeliverables[index] = value;
      updateItem(itemId, { deliverables: newDeliverables });
    }
  };

  const removeDeliverable = (itemId: string, index: number) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      updateItem(itemId, { deliverables: item.deliverables.filter((_, i) => i !== index) });
    }
  };

  const templates = getTemplatesForProjectType(projectType);

  // === RENDER PHASE ROW ===
  const renderPhaseRow = (item: QuoteLineItem, index: number) => {
    const globalIndex = items.findIndex(i => i.id === item.id);
    const calculatedAmount = calculatePhaseAmount(item.percentageFee || 0);
    
    return (
      <Collapsible key={item.id} open={expandedItems.has(item.id)}>
        <div
          draggable
          onDragStart={() => handleDragStart(globalIndex)}
          onDragOver={(e) => handleDragOver(e, globalIndex)}
          onDragEnd={handleDragEnd}
          className={`border rounded-lg transition-all ${
            draggedIndex === globalIndex ? 'opacity-50' : ''
          } ${item.isOptional ? 'border-dashed border-muted-foreground/30 bg-muted/20' : 'border-border'}`}
        >
          {/* Mobile Layout - Card Style */}
          <div className="flex flex-col sm:hidden">
            {/* Header with drag, type icon and actions */}
            <div className="flex items-center justify-between p-3 pb-2">
              <div className="flex items-center gap-2">
                <div className="cursor-grab touch-none shrink-0 p-1">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className={`p-1.5 rounded shrink-0 ${TYPE_COLORS[item.type]}`}>
                  {TYPE_ICONS[item.type]}
                </div>
                {item.code && (
                  <Badge variant="outline" className="shrink-0 text-xs font-medium">
                    {item.code}
                  </Badge>
                )}
                {item.isOptional && (
                  <Badge variant="secondary" className="text-xs">Exclu</Badge>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => duplicateItem(item)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Dupliquer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateItem(item.id, { isOptional: !item.isOptional })}>
                      {item.isOptional ? 'Inclure' : 'Exclure'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => deleteItem(item.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleExpanded(item.id)}>
                    {expandedItems.has(item.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
            
            {/* Name input - full width */}
            <div className="px-3 pb-2">
              <Input
                value={item.designation}
                onChange={(e) => updateItem(item.id, { designation: e.target.value })}
                className="h-10 font-medium"
                placeholder="Nom de la phase..."
              />
            </div>
            
            {/* Percentage and Amount - bottom row */}
            <div className="flex items-center justify-between px-3 pb-3 gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground shrink-0">Part</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={item.percentageFee || 0}
                    onChange={(e) => {
                      const newPercentage = parseFloat(e.target.value) || 0;
                      const newAmount = calculatePhaseAmount(newPercentage);
                      updateItem(item.id, { 
                        percentageFee: newPercentage,
                        unitPrice: newAmount,
                        amount: newAmount
                      });
                    }}
                    className="h-9 w-20 text-right pr-6"
                    min={0}
                    step={1}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Montant</div>
                <div className="font-semibold text-base">
                  {formatCurrency(calculatedAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:grid grid-cols-12 gap-2 p-3 items-center">
            <div className="col-span-1 flex items-center gap-1">
              <div className="cursor-grab">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className={`p-1.5 rounded ${TYPE_COLORS[item.type]}`}>
                {TYPE_ICONS[item.type]}
              </div>
            </div>

            <div className="col-span-5 space-y-1">
              <div className="flex items-center gap-2">
                {item.code && (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {item.code}
                  </Badge>
                )}
                <Input
                  value={item.designation}
                  onChange={(e) => updateItem(item.id, { designation: e.target.value })}
                  className="h-8 font-medium"
                  placeholder="Nom de la phase..."
                />
              </div>
            </div>

            <div className="col-span-2 hidden md:block">
              <div className="relative">
                <Input
                  type="number"
                  value={item.percentageFee || 0}
                  onChange={(e) => {
                    const newPercentage = parseFloat(e.target.value) || 0;
                    const newAmount = calculatePhaseAmount(newPercentage);
                    updateItem(item.id, { 
                      percentageFee: newPercentage,
                      unitPrice: newAmount,
                      amount: newAmount
                    });
                  }}
                  className="h-8 text-right pr-6"
                  min={0}
                  step={1}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
            </div>

            <div className="col-span-2 hidden md:block text-right">
              <span className="text-sm font-medium">
                {formatCurrency(calculatedAmount)}
              </span>
            </div>

            <div className="col-span-2 flex items-center justify-end gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => duplicateItem(item)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Dupliquer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateItem(item.id, { isOptional: !item.isOptional })}>
                    {item.isOptional ? 'Inclure' : 'Exclure'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => deleteItem(item.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleExpanded(item.id)}>
                  {expandedItems.has(item.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent>
            <div className="px-3 sm:px-4 pb-4 pt-2 border-t border-border/50 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={item.description || ''}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  placeholder="Description de la phase..."
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Livrables</label>
                  <Button variant="ghost" size="sm" onClick={() => addDeliverable(item.id)}>
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
                <div className="space-y-1">
                  {item.deliverables.map((deliverable, dIndex) => (
                    <div key={dIndex} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">•</span>
                      <Input
                        value={deliverable}
                        onChange={(e) => updateDeliverable(item.id, dIndex, e.target.value)}
                        className="h-7 text-sm"
                        placeholder="Nom du livrable"
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeDeliverable(item.id, dIndex)}>
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={item.isOptional}
                    onCheckedChange={(checked) => updateItem(item.id, { isOptional: !!checked })}
                  />
                  Exclure de la mission
                </label>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  // === RENDER OTHER ITEM ROW ===
  const renderItemRow = (item: QuoteLineItem, index: number) => {
    const globalIndex = items.findIndex(i => i.id === item.id);
    
    return (
      <Collapsible key={item.id} open={expandedItems.has(item.id)}>
        <div
          draggable
          onDragStart={() => handleDragStart(globalIndex)}
          onDragOver={(e) => handleDragOver(e, globalIndex)}
          onDragEnd={handleDragEnd}
          className={`border rounded-lg transition-all ${
            draggedIndex === globalIndex ? 'opacity-50' : ''
          } ${item.isOptional ? 'border-dashed border-muted-foreground/30 bg-muted/20' : 'border-border'}`}
        >
          {/* Mobile Layout - Card Style */}
          <div className="flex flex-col sm:hidden">
            {/* Header with drag, type icon and actions */}
            <div className="flex items-center justify-between p-3 pb-2">
              <div className="flex items-center gap-2">
                <div className="cursor-grab touch-none shrink-0 p-1">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className={`p-1.5 rounded shrink-0 ${TYPE_COLORS[item.type]}`}>
                  {TYPE_ICONS[item.type]}
                </div>
                {item.isOptional && (
                  <Badge variant="secondary" className="text-xs">Option</Badge>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => duplicateItem(item)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Dupliquer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateItem(item.id, { isOptional: !item.isOptional })}>
                    {item.isOptional ? 'Inclure' : 'Rendre optionnel'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => deleteItem(item.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Designation input - full width */}
            <div className="px-3 pb-2">
              <Input
                value={item.designation}
                onChange={(e) => updateItem(item.id, { designation: e.target.value })}
                className="h-10"
                placeholder="Désignation..."
              />
            </div>
            
            {/* Quantity, Unit Price and Amount */}
            <div className="grid grid-cols-3 gap-2 px-3 pb-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Qté</Label>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                  className="h-9 text-center"
                  min={0}
                  step={1}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">P.U. €</Label>
                <Input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                  className="h-9 text-right"
                  min={0}
                />
              </div>
              <div className="text-right">
                <Label className="text-xs text-muted-foreground mb-1 block">Total</Label>
                <div className={`h-9 flex items-center justify-end font-semibold ${item.type === 'discount' ? 'text-red-600' : ''}`}>
                  {item.type === 'discount' ? '-' : ''}{formatCurrency(Math.abs(item.amount))}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:grid grid-cols-12 gap-2 p-3 items-center">
            <div className="col-span-1 flex items-center gap-1">
              <div className="cursor-grab">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className={`p-1.5 rounded ${TYPE_COLORS[item.type]}`}>
                {TYPE_ICONS[item.type]}
              </div>
            </div>

            <div className="col-span-4">
              <Input
                value={item.designation}
                onChange={(e) => updateItem(item.id, { designation: e.target.value })}
                className="h-8"
                placeholder="Désignation..."
              />
            </div>

            <div className="col-span-1 hidden md:block">
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                className="h-8 text-center"
                min={0}
                step={1}
              />
            </div>

            <div className="col-span-2 hidden md:block">
              <Select value={item.unit} onValueChange={(v) => updateItem(item.id, { unit: v })}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINE_ITEM_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 hidden md:block">
              <Input
                type="number"
                value={item.unitPrice}
                onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                className="h-8 text-right"
                min={0}
              />
            </div>

            <div className="col-span-2 flex items-center justify-end gap-1">
              <span className={`text-sm font-medium ${item.type === 'discount' ? 'text-red-600' : ''}`}>
                {item.type === 'discount' ? '-' : ''}{formatCurrency(Math.abs(item.amount))}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => duplicateItem(item)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Dupliquer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateItem(item.id, { isOptional: !item.isOptional })}>
                    {item.isOptional ? 'Inclure' : 'Rendre optionnel'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => deleteItem(item.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Collapsible>
    );
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* === SECTION 1: CALCUL DES HONORAIRES === */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Calcul des honoraires</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Mode de rémunération */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Mode de rémunération</Label>
            <RadioGroup
              value={feeMode}
              onValueChange={(v) => onDocumentChange({ ...document, fee_mode: v as FeeMode })}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {(['fixed', 'percentage', 'hourly', 'mixed'] as FeeMode[]).map((mode) => (
                <div key={mode} className="flex items-center space-x-2">
                  <RadioGroupItem value={mode} id={mode} />
                  <Label htmlFor={mode} className="cursor-pointer text-sm">
                    {FEE_MODE_LABELS[mode]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Configuration selon le mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Budget travaux - toujours visible */}
            <div className="space-y-2">
              <Label>Budget travaux (€)</Label>
              <Input
                type="number"
                value={constructionBudget || ''}
                onChange={(e) => onDocumentChange({ 
                  ...document, 
                  construction_budget: parseFloat(e.target.value) || undefined,
                  construction_budget_disclosed: true
                })}
                placeholder="Ex: 150000"
              />
              <p className="text-xs text-muted-foreground">
                Base de calcul pour le ratio honoraires/travaux
              </p>
            </div>

            {/* Montant forfait OU Taux % selon le mode */}
            {feeMode === 'percentage' ? (
              <div className="space-y-2">
                <Label>Taux d'honoraires (%)</Label>
                <Input
                  type="number"
                  value={feePercentage || ''}
                  onChange={(e) => onDocumentChange({ 
                    ...document, 
                    fee_percentage: parseFloat(e.target.value) || undefined 
                  })}
                  placeholder="Ex: 10"
                  step="0.5"
                />
                {baseFee > 0 && (
                  <p className="text-xs text-muted-foreground">
                    = {formatCurrency(baseFee)} d'honoraires
                  </p>
                )}
              </div>
            ) : feeMode === 'hourly' ? (
              <div className="space-y-2">
                <Label>Taux horaire (€/h)</Label>
                <Input
                  type="number"
                  value={document.hourly_rate || ''}
                  onChange={(e) => onDocumentChange({ 
                    ...document, 
                    hourly_rate: parseFloat(e.target.value) || undefined 
                  })}
                  placeholder="Ex: 85"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Montant forfaitaire HT (€)</Label>
                <Input
                  type="number"
                  value={totalAmount || ''}
                  onChange={(e) => onDocumentChange({ 
                    ...document, 
                    total_amount: parseFloat(e.target.value) || undefined 
                  })}
                  placeholder="Ex: 12500"
                />
              </div>
            )}
          </div>

          {/* Récapitulatif */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4 text-muted-foreground" />
              Récapitulatif
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total honoraires HT</span>
                <p className="text-lg font-bold">{formatCurrency(total)}</p>
              </div>
              
              {feePercentageOfBudget !== null && (
                <div>
                  <span className="text-muted-foreground">Ratio honoraires / travaux</span>
                  <p className="text-lg font-bold text-primary">{feePercentageOfBudget.toFixed(2)}%</p>
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Répartition: {includedPhases.length} phase(s) • Total {totalPercentage}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === SECTION 2: PHASES DE MISSION === */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${TYPE_COLORS.phase}`}>
                {TYPE_ICONS.phase}
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base">Phases de mission</CardTitle>
                <p className="text-xs text-muted-foreground hidden sm:block">Répartition des honoraires par phase</p>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Badge variant="outline" className={`text-xs ${totalPercentage !== 100 ? 'border-amber-500 text-amber-600' : ''}`}>
                {totalPercentage}%
              </Badge>
              <AIPhaseSuggestion
                document={document}
                onDocumentChange={onDocumentChange}
                onQuoteItemsChange={onItemsChange}
                documentId={documentId}
              />
              <Button size="sm" variant="outline" onClick={() => addItem('phase')}>
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Phase</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {phaseItems.length > 0 && (
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b mb-2">
              <div className="col-span-1"></div>
              <div className="col-span-5">Phase</div>
              <div className="col-span-2 text-right">%</div>
              <div className="col-span-2 text-right">Montant</div>
              <div className="col-span-2"></div>
            </div>
          )}
          
          <div className="space-y-2">
            {phaseItems.map((item, index) => renderPhaseRow(item, index))}
            
            {phaseItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune phase ajoutée</p>
                <p className="text-xs mt-1">Utilisez "Suggérer avec l'IA" ou ajoutez manuellement</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* === SECTION 3: PRESTATIONS COMPLÉMENTAIRES === */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${TYPE_COLORS.prestation}`}>
                {TYPE_ICONS.prestation}
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base">Prestations complémentaires</CardTitle>
                <p className="text-xs text-muted-foreground hidden sm:block">Services additionnels, frais, remises</p>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              {subtotalOther > 0 && (
                <Badge variant="secondary" className="text-xs">{formatCurrency(subtotalOther)}</Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Ajouter</span>
                    <ChevronDown className="h-4 w-4 sm:ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => addItem('prestation')}>
                    {TYPE_ICONS.prestation}
                    <span className="ml-2">Prestation</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addItem('option')}>
                    {TYPE_ICONS.option}
                    <span className="ml-2">Option</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => addItem('expense')}>
                    {TYPE_ICONS.expense}
                    <span className="ml-2">Frais</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addItem('discount')}>
                    {TYPE_ICONS.discount}
                    <span className="ml-2">Remise</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Prestations courantes
                  </div>
                  {COMMON_ADDITIONAL_ITEMS.slice(0, 4).map((item, idx) => (
                    <DropdownMenuItem key={idx} onClick={() => addCommonItem(item)}>
                      <span className="ml-2">{item.designation}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {otherItems.length > 0 && (
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b mb-2">
              <div className="col-span-1"></div>
              <div className="col-span-4">Désignation</div>
              <div className="col-span-1 text-center">Qté</div>
              <div className="col-span-2 text-center">Unité</div>
              <div className="col-span-2 text-right">Prix unit.</div>
              <div className="col-span-2 text-right">Montant</div>
            </div>
          )}
          
          <div className="space-y-2">
            {otherItems.map((item, index) => renderItemRow(item, index))}
            
            {otherItems.length === 0 && (
              <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                <Package className="h-5 w-5 mx-auto mb-1 opacity-50" />
                <p className="text-xs">Aucune prestation complémentaire</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* === SECTION 4: TOTAUX === */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Honoraires (phases)</span>
              <span className="font-medium">{formatCurrency(total)}</span>
            </div>
            
            {subtotalOther > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Prestations complémentaires</span>
                <span className="font-medium">{formatCurrency(subtotalOther)}</span>
              </div>
            )}
            
            {optionalItems.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Options (non incluses)</span>
                <span className="text-muted-foreground">{formatCurrency(optionalItems.reduce((s, i) => s + i.amount, 0))}</span>
              </div>
            )}
            
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Remises</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
            )}
            
            <Separator />

            <div className="flex justify-between">
              <span className="font-medium">Total HT</span>
              <span className="font-bold text-lg">{formatCurrency(grandTotalHT)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>TVA (20%)</span>
              <span>{formatCurrency(TVA)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Total TTC</span>
              <span className="font-bold text-xl text-primary">{formatCurrency(grandTotalTTC)}</span>
            </div>

            {/* Ratio */}
            {feePercentageOfBudget !== null && (
              <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ratio honoraires / travaux</span>
                  <span className="font-semibold text-primary">{feePercentageOfBudget.toFixed(2)}%</span>
                </div>
              </div>
            )}

            {/* Validité */}
            <Separator />
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Label className="text-sm shrink-0">Validité</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={document.validity_days || 30}
                  onChange={(e) => onDocumentChange({ 
                    ...document, 
                    validity_days: parseInt(e.target.value) || 30 
                  })}
                  className="w-20 h-8"
                />
                <span className="text-xs text-muted-foreground">
                  jours ({new Date(Date.now() + (document.validity_days || 30) * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')})
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
