import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
  Info,
  Calculator
} from 'lucide-react';
import { QuoteLine, QuoteDocument, LINE_TYPE_COLORS } from '@/types/quoteTypes';
import { UNIT_OPTIONS, BILLING_TYPE_LABELS, BillingType } from '@/hooks/useQuoteLineTemplates';
import { AIDescriptionButton } from './AIDescriptionButton';
import { SkillsMultiSelect } from './SkillsMultiSelect';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLineCostCalculation } from '@/hooks/useLineCostCalculation';
import { useLineFeatures } from '@/contexts/LineFeatureContext';

const TYPE_ICONS: Record<QuoteLine['line_type'], React.ReactNode> = {
  phase: <FileText className="h-4 w-4" />,
  service: <Package className="h-4 w-4" />,
  option: <Gift className="h-4 w-4" />,
  expense: <Receipt className="h-4 w-4" />,
  discount: <MinusCircle className="h-4 w-4" />,
  group: <Folder className="h-4 w-4" />
};

const COST_SOURCE_CONFIG = {
  manual: { label: 'Prix manuel', icon: PenTool, color: 'text-slate-600' },
  skill: { label: 'Compétence assignée', icon: Briefcase, color: 'text-blue-600' },
  member: { label: 'Membre assigné', icon: User, color: 'text-purple-600' },
  average: { label: 'Estimé (TJM moyen)', icon: Calculator, color: 'text-amber-600' },
  none: { label: 'Non calculé', icon: null, color: 'text-muted-foreground' },
};

interface QuoteLineItemProps {
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

export function QuoteLineItem({
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
}: QuoteLineItemProps) {
  // Get feature flags from context
  const features = useLineFeatures();
  
  // Use the cost calculation hook
  const {
    effectivePurchasePrice,
    costSource,
    margin,
    marginPercentage,
  } = useLineCostCalculation(line);

  const costSourceConfig = COST_SOURCE_CONFIG[costSource] || COST_SOURCE_CONFIG.none;
  const CostSourceIcon = costSourceConfig.icon;

  const parseAssignedSkillIds = (value?: string): string[] => {
    if (!value) return [];
    const trimmed = value.trim();
    if (!trimmed) return [];

    // New format: JSON array of skill ids
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
      } catch {
        return [];
      }
    }

    // Legacy format: comma-separated string
    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const selectedSkillIds = parseAssignedSkillIds(line.assigned_skill);

  return (
    <Collapsible open={isExpanded}>
      <div
        draggable
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
         className={`border rounded-lg transition-all ${
           draggedIndex === index ? 'opacity-50' : ''
         } ${!line.is_included ? 'border-dashed border-muted-foreground/30 bg-muted/20' : 'border-border'} ${
           isInGroup ? 'ml-2' : ''
         }`}
      >
        {/* Line header */}
        <div className="flex items-center gap-2 p-3">
          <div className="cursor-grab shrink-0 p-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className={`p-1.5 rounded shrink-0 ${LINE_TYPE_COLORS[line.line_type]}`}>
            {TYPE_ICONS[line.line_type]}
          </div>

          {line.phase_code && (
            <Badge variant="outline" className="shrink-0 text-xs">
              {line.phase_code}
            </Badge>
          )}

          {line.group_id && !isInGroup && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              <Folder className="h-3 w-3 mr-1" />
              Groupé
            </Badge>
          )}

          <Input
            value={line.phase_name}
            onChange={(e) => updateLine(line.id, { phase_name: e.target.value })}
            className="flex-1 h-9"
            placeholder="Désignation..."
          />

           <div className="flex items-center gap-2 shrink-0">
             <div className={`grid items-center gap-2 ${features.showPercentageFee && line.line_type === 'phase' ? 'grid-cols-[92px_140px]' : 'grid-cols-1'}`}>
               {/* Pourcentage - seulement si activé ET type phase */}
               {features.showPercentageFee && line.line_type === 'phase' && line.percentage_fee !== undefined && (
                 <div className="flex items-center gap-1 justify-end">
                   <Input
                     type="number"
                     value={line.percentage_fee}
                     onChange={(e) => updateLine(line.id, { percentage_fee: parseFloat(e.target.value) || 0 })}
                     className="h-9 w-[72px] text-right tabular-nums"
                     min={0}
                   />
                   <span className="text-sm text-muted-foreground">%</span>
                 </div>
               )}

               <div className="flex items-center justify-end gap-1">
                 <Input
                   type="number"
                   value={line.amount || 0}
                   onChange={(e) => updateLine(line.id, { amount: parseFloat(e.target.value) || 0, unit_price: parseFloat(e.target.value) || 0 })}
                   className="h-9 w-[120px] text-right tabular-nums"
                   placeholder="0"
                 />
                 <span className="text-sm text-muted-foreground">€</span>
               </div>
             </div>
           </div>

          {!line.is_included && (
            <Badge variant="secondary" className="shrink-0">Exclu</Badge>
          )}

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
                {line.is_included ? 'Exclure' : 'Inclure'}
              </DropdownMenuItem>
              
              {/* Group assignment */}
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
                        <span className="text-muted-foreground">Aucun groupe</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {groups.map(group => (
                        <DropdownMenuItem 
                          key={group.id}
                          onClick={() => assignToGroup(line.id, group.id)}
                        >
                          <Folder className="h-4 w-4 mr-2" />
                          {group.phase_name || 'Groupe sans nom'}
                          {line.group_id === group.id && (
                            <Badge variant="secondary" className="ml-2 text-xs">Actuel</Badge>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => deleteLine(line.id)}
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
              className="h-8 w-8 shrink-0"
              onClick={() => toggleExpanded(line.id)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        {/* Expanded content */}
        <CollapsibleContent>
          <Separator />
          <div className="p-4 space-y-4 bg-muted/30">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Description</Label>
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
                placeholder="Description détaillée..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Quantité
                </Label>
                <Input
                  type="number"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.id, { quantity: parseFloat(e.target.value) || 1 })}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Unité</Label>
                <Select
                  value={line.unit}
                  onValueChange={(v) => updateLine(line.id, { unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Euro className="h-3 w-3" />
                  Prix unitaire
                </Label>
                <Input
                  type="number"
                  value={line.unit_price || 0}
                  onChange={(e) => updateLine(line.id, { unit_price: parseFloat(e.target.value) || 0 })}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Facturation</Label>
                <Select
                  value={line.billing_type}
                  onValueChange={(v) => updateLine(line.id, { billing_type: v as BillingType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BILLING_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ligne 2: Assignations et dates - conditionnellement affichées */}
            {(features.showMemberAssignment || features.showSkillAssignment || features.showDates) && (
              <div className="grid grid-cols-4 gap-4">
                {features.showMemberAssignment && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Membre assigné
                    </Label>
                    <Select
                      value={line.assigned_member_id || 'none'}
                      onValueChange={(v) => updateLine(line.id, { assigned_member_id: v === 'none' ? undefined : v })}
                    >
                      <SelectTrigger>
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
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Compétences / Rôles
                    </Label>
                    <SkillsMultiSelect
                      selectedSkillIds={selectedSkillIds}
                      onSelectionChange={(skillIds) => {
                        updateLine(line.id, {
                          assigned_skill: JSON.stringify(skillIds),
                        });
                      }}
                      placeholder="Sélectionner des compétences…"
                    />
                  </div>
                )}

                {features.showDates && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Date début
                      </Label>
                      <Input
                        type="date"
                        value={line.start_date || ''}
                        onChange={(e) => updateLine(line.id, { start_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Date fin
                      </Label>
                      <Input
                        type="date"
                        value={line.end_date || ''}
                        onChange={(e) => updateLine(line.id, { end_date: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Ligne 3: Coûts et marges - conditionnellement affichés */}
            {(features.showPricingRef || features.showPurchasePrice || features.showCostAndMargin) && (
              <div className="grid grid-cols-3 gap-4">
                {features.showPricingRef && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Réf. tarif (BPU)
                    </Label>
                    <Input
                      value={line.pricing_ref || ''}
                      onChange={(e) => updateLine(line.id, { pricing_ref: e.target.value })}
                      placeholder="Ex: ARCHI-001"
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                {features.showPurchasePrice && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Euro className="h-3 w-3" />
                      Prix d'achat (coût interne)
                      {costSource !== 'manual' && effectivePurchasePrice > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-blue-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Calculé automatiquement via: {costSourceConfig.label}</p>
                            <p className="text-xs text-muted-foreground">Saisissez un prix manuel pour l'écraser</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={line.purchase_price || ''}
                        onChange={(e) => updateLine(line.id, { purchase_price: parseFloat(e.target.value) || undefined })}
                        placeholder={effectivePurchasePrice > 0 && costSource !== 'manual' ? `Auto: ${effectivePurchasePrice.toFixed(0)} €` : '0'}
                        className="pr-20"
                      />
                      {costSource !== 'none' && effectivePurchasePrice > 0 && CostSourceIcon && (
                        <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs ${costSourceConfig.color}`}>
                          <CostSourceIcon className="h-3 w-3" />
                          <span>{effectivePurchasePrice.toFixed(0)} €</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {features.showCostAndMargin && (effectivePurchasePrice > 0 || (line.purchase_price && line.purchase_price > 0)) && line.amount > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Marge
                    </Label>
                    <div className="h-10 flex items-center px-3 border rounded-md bg-muted/50">
                      <span className={`font-medium ${marginPercentage < 20 ? 'text-amber-600' : 'text-green-600'}`}>
                        {marginPercentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({formatCurrency(margin)})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
