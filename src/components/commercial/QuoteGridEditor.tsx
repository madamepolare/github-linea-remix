import { useState, useCallback } from 'react';
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
  Sparkles,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  LINE_ITEM_TYPE_LABELS, 
  LINE_ITEM_UNITS,
  QUOTE_TEMPLATES,
  COMMON_ADDITIONAL_ITEMS,
  getTemplatesForProjectType
} from '@/lib/quoteTemplates';
import { ProjectType, CommercialDocument } from '@/lib/commercialTypes';
import { AIPhaseSuggestion } from './AIPhaseSuggestion';

interface QuoteGridEditorProps {
  items: QuoteLineItem[];
  projectType: ProjectType;
  onItemsChange: (items: QuoteLineItem[]) => void;
  baseFee?: number;
  document?: Partial<CommercialDocument>;
  onDocumentChange?: (doc: Partial<CommercialDocument>) => void;
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

export function QuoteGridEditor({
  items,
  projectType,
  onItemsChange,
  baseFee = 0,
  document,
  onDocumentChange,
  documentId
}: QuoteGridEditorProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
          // Recalculate amount if quantity or unitPrice changed
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
      percentageFee: type === 'phase' ? 15 : undefined // Default 15% for phases
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

  // Separate phases from other items
  const phaseItems = items.filter(i => i.type === 'phase');
  const otherItems = items.filter(i => i.type !== 'phase');

  // Calculate total percentage for phases
  const totalPercentage = phaseItems.filter(i => !i.isOptional).reduce((sum, i) => sum + (i.percentageFee || 0), 0);

  // Get the base for calculating phase amounts
  const feeMode = document?.fee_mode || 'fixed';
  const constructionBudget = document?.construction_budget || 0;
  const feePercentage = document?.fee_percentage || 0;
  const totalAmount = document?.total_amount || 0;

  // Calculate the base amount for distributing to phases
  const getPhaseBaseAmount = () => {
    if (feeMode === 'percentage' && constructionBudget > 0 && feePercentage > 0) {
      return constructionBudget * (feePercentage / 100);
    }
    return totalAmount;
  };

  const phaseBaseAmount = getPhaseBaseAmount();

  // Calculate totals
  const requiredItems = items.filter(i => !i.isOptional && i.type !== 'discount');
  const optionalItems = items.filter(i => i.isOptional);
  const discountItems = items.filter(i => i.type === 'discount');

  const subtotalPhases = phaseItems.filter(i => !i.isOptional).reduce((sum, i) => sum + i.amount, 0);
  const subtotalOther = otherItems.filter(i => !i.isOptional && i.type !== 'discount').reduce((sum, i) => sum + i.amount, 0);
  const subtotalRequired = requiredItems.reduce((sum, i) => sum + i.amount, 0);
  const subtotalOptional = optionalItems.reduce((sum, i) => sum + i.amount, 0);
  const totalDiscount = discountItems.reduce((sum, i) => sum + Math.abs(i.amount), 0);
  const totalHT = subtotalRequired - totalDiscount;
  const TVA = totalHT * 0.2;
  const totalTTC = totalHT + TVA;

  const templates = getTemplatesForProjectType(projectType);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  // Calculate phase amount from percentage
  const calculatePhaseAmount = (percentageFee: number) => {
    if (totalPercentage > 0 && phaseBaseAmount > 0) {
      return (percentageFee / totalPercentage) * phaseBaseAmount;
    }
    return 0;
  };

  const renderPhaseRow = (item: QuoteLineItem, index: number) => {
    const globalIndex = items.findIndex(i => i.id === item.id);
    const calculatedAmount = calculatePhaseAmount(item.percentageFee || 0);
    
    return (
      <Collapsible
        key={item.id}
        open={expandedItems.has(item.id)}
      >
        <div
          draggable
          onDragStart={() => handleDragStart(globalIndex)}
          onDragOver={(e) => handleDragOver(e, globalIndex)}
          onDragEnd={handleDragEnd}
          className={`border rounded-lg transition-all ${
            draggedIndex === globalIndex ? 'opacity-50' : ''
          } ${item.isOptional ? 'border-dashed border-muted-foreground/30' : 'border-border'} 
          ${TYPE_COLORS[item.type].replace('bg-', 'hover:bg-').replace('/10', '/5')}`}
        >
          {/* Main Row */}
          <div className="grid grid-cols-12 gap-2 p-3 items-center">
            {/* Drag handle + Type badge */}
            <div className="col-span-1 flex items-center gap-1">
              <div className="cursor-grab">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className={`p-1.5 rounded ${TYPE_COLORS[item.type]}`}>
                {TYPE_ICONS[item.type]}
              </div>
            </div>

            {/* Designation */}
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
              {item.description && (
                <p className="text-xs text-muted-foreground truncate pl-1">
                  {item.description}
                </p>
              )}
            </div>

            {/* Percentage */}
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

            {/* Calculated Amount */}
            <div className="col-span-2 hidden md:block text-right">
              <span className="text-sm text-muted-foreground">
                {formatCurrency(calculatedAmount)}
              </span>
            </div>

            {/* Actions */}
            <div className="col-span-2 flex items-center justify-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleExpanded(item.id)}>
                    {expandedItems.has(item.id) ? 'Réduire' : 'Détails'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => duplicateItem(item)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Dupliquer
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => updateItem(item.id, { isOptional: !item.isOptional })}
                  >
                    {item.isOptional ? 'Inclure' : 'Exclure'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => deleteItem(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => toggleExpanded(item.id)}
                >
                  {expandedItems.has(item.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-4">
              {/* Description */}
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

              {/* Mobile: Percentage */}
              <div className="md:hidden space-y-1">
                <label className="text-xs text-muted-foreground">Pourcentage</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={item.percentageFee || 0}
                    onChange={(e) => {
                      const newPercentage = parseFloat(e.target.value) || 0;
                      updateItem(item.id, { percentageFee: newPercentage });
                    }}
                    className="h-8 pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>

              {/* Deliverables */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Livrables</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addDeliverable(item.id)}
                  >
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => removeDeliverable(item.id, dIndex)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options */}
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

  const renderItemRow = (item: QuoteLineItem, index: number, itemList: QuoteLineItem[]) => {
    const globalIndex = items.findIndex(i => i.id === item.id);
    
    return (
      <Collapsible
        key={item.id}
        open={expandedItems.has(item.id)}
      >
        <div
          draggable
          onDragStart={() => handleDragStart(globalIndex)}
          onDragOver={(e) => handleDragOver(e, globalIndex)}
          onDragEnd={handleDragEnd}
          className={`border rounded-lg transition-all ${
            draggedIndex === globalIndex ? 'opacity-50' : ''
          } ${item.isOptional ? 'border-dashed border-muted-foreground/30' : 'border-border'} 
          ${TYPE_COLORS[item.type].replace('bg-', 'hover:bg-').replace('/10', '/5')}`}
        >
          {/* Main Row */}
          <div className="grid grid-cols-12 gap-2 p-3 items-center">
            {/* Drag handle + Type badge */}
            <div className="col-span-1 flex items-center gap-1">
              <div className="cursor-grab">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className={`p-1.5 rounded ${TYPE_COLORS[item.type]}`}>
                {TYPE_ICONS[item.type]}
              </div>
            </div>

            {/* Designation */}
            <div className="col-span-4 md:col-span-4 space-y-1">
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
                  placeholder="Désignation..."
                />
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground truncate pl-1">
                  {item.description}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="col-span-1 hidden md:block">
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                className="h-8 text-center"
                min={0}
                step={0.5}
              />
            </div>

            {/* Unit */}
            <div className="col-span-2 hidden md:block">
              <Select
                value={item.unit}
                onValueChange={(value) => updateItem(item.id, { unit: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINE_ITEM_UNITS.map(unit => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit Price */}
            <div className="col-span-2 hidden md:block">
              <div className="relative">
                <Input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-right pr-6"
                  min={0}
                  step={10}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
              </div>
            </div>

            {/* Amount */}
            <div className="col-span-2 flex items-center justify-end gap-2">
              <span className={`font-semibold ${item.type === 'discount' ? 'text-red-600' : ''}`}>
                {item.type === 'discount' ? '-' : ''}{formatCurrency(item.amount)}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleExpanded(item.id)}>
                    {expandedItems.has(item.id) ? 'Réduire' : 'Détails'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => duplicateItem(item)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Dupliquer
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => updateItem(item.id, { isOptional: !item.isOptional })}
                  >
                    {item.isOptional ? 'Marquer obligatoire' : 'Marquer optionnel'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => deleteItem(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => toggleExpanded(item.id)}
                >
                  {expandedItems.has(item.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={item.description || ''}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  placeholder="Description de la prestation..."
                  rows={2}
                  className="text-sm"
                />
              </div>

              {/* Mobile: Qty, Unit, Price */}
              <div className="grid grid-cols-3 gap-3 md:hidden">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Quantité</label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Unité</label>
                  <Select
                    value={item.unit}
                    onValueChange={(value) => updateItem(item.id, { unit: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINE_ITEM_UNITS.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Prix unit.</label>
                  <Input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                    className="h-8"
                  />
                </div>
              </div>

              {/* Deliverables (for phases) */}
              {item.type === 'phase' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Livrables</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addDeliverable(item.id)}
                    >
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => removeDeliverable(item.id, dIndex)}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={item.isOptional}
                    onCheckedChange={(checked) => updateItem(item.id, { isOptional: !!checked })}
                  />
                  Optionnel
                </label>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Grille tarifaire</CardTitle>
            <div className="flex items-center gap-2">
              {document && onDocumentChange && (
                <AIPhaseSuggestion
                  document={document}
                  onDocumentChange={onDocumentChange}
                  onQuoteItemsChange={onItemsChange}
                  documentId={documentId}
                />
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Templates
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {templates.map(template => (
                    <DropdownMenuItem 
                      key={template.id}
                      onClick={() => loadTemplate(template.id)}
                    >
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => addItem('phase')}>
                    {TYPE_ICONS.phase}
                    <span className="ml-2">Phase mission</span>
                  </DropdownMenuItem>
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
                  <DropdownMenuItem onClick={() => addItem('provision')}>
                    {TYPE_ICONS.provision}
                    <span className="ml-2">Provision</span>
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
      </Card>

      {/* Section 1: Phases de mission */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${TYPE_COLORS.phase}`}>
                {TYPE_ICONS.phase}
              </div>
              <div>
                <CardTitle className="text-base">Phases de mission</CardTitle>
                <p className="text-xs text-muted-foreground">Ces phases seront créées dans le projet associé</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={totalPercentage !== 100 ? 'border-amber-500 text-amber-600' : ''}>
                {totalPercentage}% total
              </Badge>
              {phaseBaseAmount > 0 && (
                <Badge variant="secondary">{formatCurrency(phaseBaseAmount)}</Badge>
              )}
              <Button size="sm" variant="outline" onClick={() => addItem('phase')}>
                <Plus className="h-4 w-4 mr-1" />
                Phase
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Info box about fee calculation */}
          {phaseItems.length > 0 && (
            <div className="mb-3 p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              {feeMode === 'percentage' ? (
                <span>Mode pourcentage : {feePercentage}% de {formatCurrency(constructionBudget)} = {formatCurrency(phaseBaseAmount)}</span>
              ) : (
                <span>Mode forfait : montant total {formatCurrency(totalAmount)}</span>
              )}
            </div>
          )}
          
          {/* Grid Header for phases */}
          {phaseItems.length > 0 && (
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b mb-2">
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

      {/* Section 2: Prestations complémentaires */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${TYPE_COLORS.prestation}`}>
                {TYPE_ICONS.prestation}
              </div>
              <div>
                <CardTitle className="text-base">Prestations complémentaires</CardTitle>
                <p className="text-xs text-muted-foreground">Services additionnels, frais, options, remises</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {otherItems.length > 0 && (
                <Badge variant="outline">{otherItems.length} ligne(s)</Badge>
              )}
              {subtotalOther > 0 && (
                <Badge variant="secondary">{formatCurrency(subtotalOther)}</Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                    <ChevronDown className="h-4 w-4 ml-1" />
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
                  <DropdownMenuItem onClick={() => addItem('provision')}>
                    {TYPE_ICONS.provision}
                    <span className="ml-2">Provision</span>
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
          {/* Grid Header for other items */}
          {otherItems.length > 0 && (
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b mb-2">
              <div className="col-span-1"></div>
              <div className="col-span-4">Désignation</div>
              <div className="col-span-1 text-center">Qté</div>
              <div className="col-span-2 text-center">Unité</div>
              <div className="col-span-2 text-right">Prix unit.</div>
              <div className="col-span-2 text-right">Montant</div>
            </div>
          )}
          
          <div className="space-y-2">
            {otherItems.map((item, index) => renderItemRow(item, index, otherItems))}
            
            {otherItems.length === 0 && (
              <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                <Package className="h-5 w-5 mx-auto mb-1 opacity-50" />
                <p className="text-xs">Aucune prestation complémentaire</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {subtotalPhases > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phases de mission</span>
                  <span className="font-medium">{formatCurrency(subtotalPhases)}</span>
                </div>
              )}
              
              {subtotalOther > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prestations complémentaires</span>
                  <span className="font-medium">{formatCurrency(subtotalOther)}</span>
                </div>
              )}
              
              {optionalItems.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Options (non incluses)</span>
                  <span className="text-muted-foreground">{formatCurrency(subtotalOptional)}</span>
                </div>
              )}
              
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Remises</span>
                  <span>-{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-medium">Total HT</span>
                  <span className="font-bold text-lg">{formatCurrency(totalHT)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>TVA (20%)</span>
                  <span>{formatCurrency(TVA)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-medium">Total TTC</span>
                  <span className="font-bold text-lg">{formatCurrency(totalTTC)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
