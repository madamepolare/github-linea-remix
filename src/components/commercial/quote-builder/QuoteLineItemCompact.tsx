import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  GripVertical, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Copy,
  MoreHorizontal,
  FileText,
  Package,
  Gift,
  Receipt,
  MinusCircle,
  User,
  Calendar,
  Euro,
  Percent,
  Folder,
  FolderPlus,
  Briefcase,
  PenTool,
  Calculator,
  Clock,
  TrendingUp,
  ExternalLink,
  Hash
} from 'lucide-react';
import { QuoteLine, QuoteDocument, LINE_TYPE_COLORS } from '@/types/quoteTypes';
import { UNIT_OPTIONS, BILLING_TYPE_LABELS, BillingType } from '@/hooks/useQuoteLineTemplates';
import { AIDescriptionButton } from './AIDescriptionButton';
import { SkillsMultiSelect } from './SkillsMultiSelect';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLineCostCalculation } from '@/hooks/useLineCostCalculation';
import { useLineFeatures } from '@/contexts/LineFeatureContext';
import { usePhaseTemplates } from '@/hooks/usePhaseTemplates';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<QuoteLine['line_type'], React.ReactNode> = {
  phase: <FileText className="h-4 w-4" />,
  service: <Package className="h-4 w-4" />,
  option: <Gift className="h-4 w-4" />,
  expense: <Receipt className="h-4 w-4" />,
  discount: <MinusCircle className="h-4 w-4" />,
  group: <Folder className="h-4 w-4" />
};

const TYPE_LABELS: Record<QuoteLine['line_type'], string> = {
  phase: 'Phase',
  service: 'Service',
  option: 'Option',
  expense: 'Frais',
  discount: 'Remise',
  group: 'Groupe'
};

const COST_SOURCE_CONFIG = {
  manual: { label: 'Prix manuel', icon: PenTool, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  skill: { label: 'Compétence', icon: Briefcase, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  member: { label: 'Membre', icon: User, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  average: { label: 'Estimé', icon: Calculator, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  external: { label: 'Externe', icon: ExternalLink, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  none: { label: 'Non calculé', icon: null, color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

interface QuoteLineItemCompactProps {
  line: QuoteLine;
  index: number;
  isInGroup: boolean;
  groups: QuoteLine[];
  isExpanded: boolean;
  draggedIndex: number | null;
  teamMembers: any[] | undefined;
  document: Partial<QuoteDocument>;
  toggleExpanded: (id: string) => void;
  updateLine: (id: string, updates: Partial<QuoteLine>) => void;
  duplicateLine: (line: QuoteLine) => void;
  deleteLine: (id: string) => void;
  assignToGroup: (lineId: string, groupId: string | undefined) => void;
  handleDragStart: (index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  formatCurrency: (value: number) => string;
}

export function QuoteLineItemCompact({
  line,
  index,
  isInGroup,
  groups,
  isExpanded,
  draggedIndex,
  teamMembers,
  document,
  toggleExpanded,
  updateLine,
  duplicateLine,
  deleteLine,
  assignToGroup,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  formatCurrency
}: QuoteLineItemCompactProps) {
  const features = useLineFeatures();
  const [activeSection, setActiveSection] = useState<string>('pricing');
  
  // Get phase templates for phase code dropdown
  const projectType = document.project_type as 'interior' | 'architecture' | 'scenography' | undefined;
  const { templates: phaseTemplates } = usePhaseTemplates(projectType);
  const activeTemplates = phaseTemplates.filter(t => t.is_active);
  
  // Determine if line is external/production type
  const isExternalLine = line.line_type === 'expense' || line.pricing_ref?.startsWith('PROD-');
  
  const {
    effectivePurchasePrice,
    costSource: baseCostSource,
    margin,
    marginPercentage,
    estimatedDays,
  } = useLineCostCalculation(line);

  // Override cost source for external lines
  const costSource = isExternalLine ? 'external' : baseCostSource;
  const costSourceConfig = COST_SOURCE_CONFIG[costSource] || COST_SOURCE_CONFIG.none;
  const CostSourceIcon = costSourceConfig.icon;

  const parseAssignedSkillIds = (value?: string): string[] => {
    if (!value) return [];
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
      } catch {
        return [];
      }
    }
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  };

  const selectedSkillIds = parseAssignedSkillIds(line.assigned_skill);
  
  // Calculate effective margin - for external lines, use purchase_price directly
  const effectiveMargin = isExternalLine 
    ? (line.amount || 0) - (line.purchase_price || 0)
    : margin;
  const effectiveMarginPercentage = line.amount && line.amount > 0 
    ? (effectiveMargin / line.amount) * 100 
    : 0;

  // Handle phase code change from dropdown
  const handlePhaseCodeChange = (code: string) => {
    if (code === '__none__') {
      updateLine(line.id, { phase_code: undefined });
      return;
    }
    const template = activeTemplates.find(t => t.code === code);
    if (template) {
      updateLine(line.id, { 
        phase_code: template.code,
        phase_name: line.phase_name || template.name,
        phase_description: line.phase_description || template.description,
        percentage_fee: line.percentage_fee || template.default_percentage || 0
      });
    } else {
      updateLine(line.id, { phase_code: code });
    }
  };

  return (
    <Collapsible open={isExpanded}>
      <div
        draggable
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
        className={cn(
          "border rounded-xl transition-all",
          draggedIndex === index && 'opacity-50',
          !line.is_included && 'border-dashed border-muted-foreground/30 bg-muted/20',
          isInGroup && 'ml-2',
          isExpanded && 'shadow-md ring-1 ring-primary/10'
        )}
      >
        {/* Compact header - improved list view matching design */}
        <div className="flex items-center gap-2 p-3">
          {/* Drag handle */}
          <div className="cursor-grab shrink-0 p-1 hover:bg-muted rounded">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Type icon with color */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("p-1.5 rounded-lg shrink-0 cursor-default", LINE_TYPE_COLORS[line.line_type])}>
                {TYPE_ICONS[line.line_type]}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{TYPE_LABELS[line.line_type]}</p>
            </TooltipContent>
          </Tooltip>

          {/* Phase code dropdown */}
          {activeTemplates.length > 0 && (line.line_type === 'phase' || line.line_type === 'service') && (
            <Select
              value={line.phase_code || '__none__'}
              onValueChange={handlePhaseCodeChange}
            >
              <SelectTrigger className="h-8 w-[90px] text-xs font-mono shrink-0 px-2">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  <span className="text-muted-foreground">—</span>
                </SelectItem>
                {activeTemplates.map((t) => (
                  <SelectItem key={t.code} value={t.code}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono px-1.5 py-0">
                        {t.code}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {t.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Phase code badge for non-editable display */}
          {(activeTemplates.length === 0 || (line.line_type !== 'phase' && line.line_type !== 'service')) && line.phase_code && (
            <Badge variant="outline" className="shrink-0 text-xs font-mono">
              {line.phase_code}
            </Badge>
          )}

          {/* Title */}
          <div className="flex-1 min-w-0">
            <Input
              value={line.phase_name}
              onChange={(e) => updateLine(line.id, { phase_name: e.target.value })}
              className="h-8 font-medium border-transparent hover:border-input focus:border-input bg-transparent text-sm"
              placeholder="Désignation..."
            />
          </div>

          {/* Quantity */}
          <Input
            type="number"
            value={line.quantity || 1}
            onChange={(e) => updateLine(line.id, { quantity: parseFloat(e.target.value) || 1 })}
            className="h-8 w-14 text-center text-sm border-0 bg-muted/50 rounded tabular-nums shrink-0"
            min={0}
          />

          {/* Unit type dropdown */}
          <Select
            value={line.unit || 'forfait'}
            onValueChange={(value) => updateLine(line.id, { unit: value })}
          >
            <SelectTrigger className="h-8 w-20 text-xs shrink-0 border-0 bg-transparent hover:bg-muted/50 px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {UNIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Amount with € */}
          <div className="flex items-center gap-1 shrink-0">
            <Input
              type="number"
              value={line.amount || 0}
              onChange={(e) => updateLine(line.id, { amount: parseFloat(e.target.value) || 0, unit_price: parseFloat(e.target.value) || 0 })}
              className="h-8 w-20 text-right tabular-nums font-semibold text-sm border rounded-lg bg-background px-2"
              placeholder="0"
            />
            <span className="text-sm text-muted-foreground">€</span>
          </div>

          {/* Margin indicator */}
          {features.showCostAndMargin && effectivePurchasePrice > 0 && line.amount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium shrink-0",
                  effectiveMarginPercentage < 15 ? 'text-red-600' :
                  effectiveMarginPercentage < 30 ? 'text-amber-600' :
                  'text-green-600'
                )}>
                  <TrendingUp className="h-3 w-3" />
                  {effectiveMarginPercentage.toFixed(0)}%
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Marge: {formatCurrency(effectiveMargin)}</p>
                <p className="text-xs text-muted-foreground">
                  Coût: {formatCurrency(isExternalLine ? (line.purchase_price || 0) : effectivePurchasePrice)}
                </p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Status badges */}
          {!line.is_included && (
            <Badge variant="secondary" className="shrink-0 text-xs">Exclu</Badge>
          )}

          {isExternalLine && (
            <Badge variant="outline" className="shrink-0 text-xs bg-rose-50 text-rose-600 border-rose-200">
              <ExternalLink className="h-3 w-3 mr-1" />
              Externe
            </Badge>
          )}

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => duplicateLine(line)}>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateLine(line.id, { is_included: !line.is_included })}>
                {line.is_included ? 'Exclure du total' : 'Inclure au total'}
              </DropdownMenuItem>
              {groups.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Assigner à un groupe
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => assignToGroup(line.id, undefined)}>
                        Aucun groupe
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {groups.map(group => (
                        <DropdownMenuItem 
                          key={group.id}
                          onClick={() => assignToGroup(line.id, group.id)}
                        >
                          <Folder className="h-4 w-4 mr-2" />
                          {group.phase_name || 'Groupe'}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => deleteLine(line.id)} className="text-destructive">
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
              onClick={() => toggleExpanded(line.id)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>

        {/* Expanded content with tabs */}
        <CollapsibleContent>
          <div className="border-t bg-gradient-to-b from-muted/30 to-transparent">
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
              <div className="px-4 pt-3 border-b bg-muted/20">
                <TabsList className="h-8 bg-transparent p-0 gap-1">
                  <TabsTrigger 
                    value="pricing" 
                    className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
                  >
                    <Euro className="h-3 w-3 mr-1.5" />
                    Tarification
                  </TabsTrigger>
                  {(features.showMemberAssignment || features.showSkillAssignment) && (
                    <TabsTrigger 
                      value="resources" 
                      className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
                    >
                      <User className="h-3 w-3 mr-1.5" />
                      Ressources
                    </TabsTrigger>
                  )}
                  {features.showDates && (
                    <TabsTrigger 
                      value="planning" 
                      className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
                    >
                      <Clock className="h-3 w-3 mr-1.5" />
                      Planning
                    </TabsTrigger>
                  )}
                  {(features.showPurchasePrice || features.showCostAndMargin) && (
                    <TabsTrigger 
                      value="costs" 
                      className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
                    >
                      <TrendingUp className="h-3 w-3 mr-1.5" />
                      Coûts
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="p-4">
                {/* Description always visible */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground font-medium">Description</Label>
                    <AIDescriptionButton
                      line={line}
                      projectType={document.project_type}
                      projectDescription={document.description}
                      onDescriptionGenerated={(desc) => updateLine(line.id, { phase_description: desc })}
                    />
                  </div>
                  <Textarea
                    value={line.phase_description || ''}
                    onChange={(e) => updateLine(line.id, { phase_description: e.target.value })}
                    placeholder="Description détaillée de la prestation..."
                    rows={2}
                    className="resize-none"
                  />
                </div>

                {/* Tab: Tarification */}
                <TabsContent value="pricing" className="m-0 space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Quantité</Label>
                      <Input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.id, { quantity: parseFloat(e.target.value) || 1 })}
                        min={0}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Unité</Label>
                      <Select value={line.unit} onValueChange={(v) => updateLine(line.id, { unit: v })}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Prix unitaire</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={line.unit_price || 0}
                          onChange={(e) => updateLine(line.id, { unit_price: parseFloat(e.target.value) || 0 })}
                          min={0}
                          className="h-9 pr-8"
                        />
                        <Euro className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                    {features.showBillingType && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Facturation</Label>
                        <Select value={line.billing_type} onValueChange={(v) => updateLine(line.id, { billing_type: v as BillingType })}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(BILLING_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  {/* Calculated total */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      {line.quantity} × {formatCurrency(line.unit_price || 0)} =
                    </span>
                    <span className="text-lg font-semibold">
                      {formatCurrency((line.quantity || 1) * (line.unit_price || 0))}
                    </span>
                  </div>
                </TabsContent>

                {/* Tab: Resources */}
                <TabsContent value="resources" className="m-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {features.showMemberAssignment && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Membre assigné</Label>
                        <Select
                          value={line.assigned_member_id || 'none'}
                          onValueChange={(v) => updateLine(line.id, { assigned_member_id: v === 'none' ? undefined : v })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Non assigné</SelectItem>
                            {teamMembers?.map(member => (
                              <SelectItem key={member.user_id} value={member.user_id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={member.profile?.avatar_url || ''} />
                                    <AvatarFallback className="text-[10px]">
                                      {(member.profile?.full_name || '?').charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{member.profile?.full_name || 'Membre'}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {features.showSkillAssignment && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Compétences</Label>
                        <SkillsMultiSelect
                          selectedSkillIds={selectedSkillIds}
                          onSelectionChange={(skillIds) => {
                            updateLine(line.id, { assigned_skill: JSON.stringify(skillIds) });
                          }}
                          placeholder="Sélectionner..."
                        />
                      </div>
                    )}
                  </div>
                  
                  {estimatedDays && estimatedDays > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Temps estimé:</span>
                      <span className="text-sm font-medium">{estimatedDays.toFixed(1)} jour{estimatedDays > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Planning */}
                <TabsContent value="planning" className="m-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Date début</Label>
                      <Input
                        type="date"
                        value={line.start_date || ''}
                        onChange={(e) => updateLine(line.id, { start_date: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Date fin</Label>
                      <Input
                        type="date"
                        value={line.end_date || ''}
                        onChange={(e) => updateLine(line.id, { end_date: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  </div>
                  
                  {features.showRecurrence && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Récurrence (mois)</Label>
                      <Input
                        type="number"
                        value={line.recurrence_months || ''}
                        onChange={(e) => updateLine(line.id, { recurrence_months: parseInt(e.target.value) || undefined })}
                        placeholder="Non récurrent"
                        className="h-9 w-32"
                        min={1}
                      />
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Costs */}
                <TabsContent value="costs" className="m-0 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {features.showPricingRef && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Réf. BPU</Label>
                        <Input
                          value={line.pricing_ref || ''}
                          onChange={(e) => updateLine(line.id, { pricing_ref: e.target.value })}
                          placeholder="Ex: ARCHI-001"
                          className="h-9 font-mono text-sm"
                        />
                      </div>
                    )}
                    
                    {features.showPurchasePrice && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          Coût {isExternalLine ? '(externe)' : '(interne)'}
                          {CostSourceIcon && costSource !== 'manual' && costSource !== 'none' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Hash className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Source: {costSourceConfig.label}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={line.purchase_price || ''}
                            onChange={(e) => updateLine(line.id, { purchase_price: parseFloat(e.target.value) || undefined })}
                            placeholder={!isExternalLine && effectivePurchasePrice > 0 ? `Auto: ${effectivePurchasePrice.toFixed(0)}` : '0'}
                            className="h-9 pr-16"
                          />
                          {CostSourceIcon && (
                            <div className={cn(
                              "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
                              costSourceConfig.bgColor,
                              costSourceConfig.color
                            )}>
                              <CostSourceIcon className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {features.showCostAndMargin && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Marge</Label>
                        <div className={cn(
                          "h-9 flex items-center justify-between px-3 rounded-md border",
                          effectiveMarginPercentage < 15 ? 'bg-red-50 border-red-200' :
                          effectiveMarginPercentage < 30 ? 'bg-amber-50 border-amber-200' :
                          'bg-green-50 border-green-200'
                        )}>
                          <span className={cn(
                            "font-semibold",
                            effectiveMarginPercentage < 15 ? 'text-red-700' :
                            effectiveMarginPercentage < 30 ? 'text-amber-700' :
                            'text-green-700'
                          )}>
                            {effectiveMarginPercentage.toFixed(1)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(effectiveMargin)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Cost breakdown for transparency */}
                  {features.showCostAndMargin && (effectivePurchasePrice > 0 || (line.purchase_price && line.purchase_price > 0)) && (
                    <div className="p-3 rounded-lg bg-muted/30 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prix de vente</span>
                        <span className="font-medium">{formatCurrency(line.amount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          Coût de revient
                          {isExternalLine && <Badge variant="outline" className="text-[10px] h-4">Externe</Badge>}
                        </span>
                        <span className="font-medium text-destructive">
                          -{formatCurrency(isExternalLine ? (line.purchase_price || 0) : effectivePurchasePrice)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">Marge nette</span>
                        <span className={cn(
                          "font-semibold",
                          effectiveMargin < 0 ? 'text-red-600' : 'text-green-600'
                        )}>
                          {formatCurrency(effectiveMargin)}
                        </span>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
