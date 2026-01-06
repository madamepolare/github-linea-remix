import { useState } from 'react';
import { GripVertical, Check, ChevronDown, ChevronUp, Trash2, Plus, FolderOpen, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AIPhaseSuggestion } from './AIPhaseSuggestion';
import { usePhaseTemplates } from '@/hooks/usePhaseTemplates';
import { toast } from 'sonner';
import {
  CommercialDocument,
  CommercialDocumentPhase,
  ProjectType
} from '@/lib/commercialTypes';

interface PhaseSelectorProps {
  phases: CommercialDocumentPhase[];
  projectType: ProjectType;
  onPhasesChange: (phases: CommercialDocumentPhase[]) => void;
  projectBudget?: number;
  feePercentage?: number;
  totalAmount?: number;
  document?: Partial<CommercialDocument>;
  onDocumentChange?: (doc: Partial<CommercialDocument>) => void;
  documentId?: string;
}

export function PhaseSelector({
  phases,
  projectType,
  onPhasesChange,
  projectBudget,
  feePercentage,
  totalAmount,
  document,
  onDocumentChange,
  documentId
}: PhaseSelectorProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { templates: phaseTemplates } = usePhaseTemplates(projectType);

  // Use totalAmount if available (forfait mode), otherwise calculate from percentage
  const baseFee = totalAmount || (projectBudget && feePercentage 
    ? projectBudget * (feePercentage / 100) 
    : 0);

  // Phase templates from settings
  const basePhaseTemplates = phaseTemplates.filter(t => t.is_active && t.category === 'base');
  const complementaryPhaseTemplates = phaseTemplates.filter(t => t.is_active && t.category === 'complementary');


  const loadBasePhasesBundle = () => {
    const newPhases: CommercialDocumentPhase[] = basePhaseTemplates.map((phase, index) => ({
      id: crypto.randomUUID(),
      document_id: documentId || '',
      phase_code: phase.code,
      phase_name: phase.name,
      phase_description: phase.description || '',
      percentage_fee: phase.default_percentage,
      amount: baseFee * phase.default_percentage / 100,
      is_included: true,
      deliverables: phase.deliverables || [],
      sort_order: index,
      created_at: null,
      updated_at: null,
    }));
    onPhasesChange(newPhases);
    toast.success('Mission de base chargée');
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPhases(newExpanded);
  };

  const togglePhaseIncluded = (phaseId: string) => {
    onPhasesChange(
      phases.map(p => 
        p.id === phaseId ? { ...p, is_included: !p.is_included } : p
      )
    );
  };

  const updatePhasePercentage = (phaseId: string, percentage: number) => {
    onPhasesChange(
      phases.map(p => 
        p.id === phaseId 
          ? { ...p, percentage_fee: percentage, amount: baseFee * percentage / 100 } 
          : p
      )
    );
  };

  const updateDeliverable = (phaseId: string, index: number, value: string) => {
    onPhasesChange(
      phases.map(p => {
        if (p.id === phaseId) {
          const newDeliverables = [...p.deliverables];
          newDeliverables[index] = value;
          return { ...p, deliverables: newDeliverables };
        }
        return p;
      })
    );
  };

  const addDeliverable = (phaseId: string) => {
    onPhasesChange(
      phases.map(p => {
        if (p.id === phaseId) {
          return { ...p, deliverables: [...p.deliverables, ''] };
        }
        return p;
      })
    );
  };

  const removeDeliverable = (phaseId: string, index: number) => {
    onPhasesChange(
      phases.map(p => {
        if (p.id === phaseId) {
          const newDeliverables = p.deliverables.filter((_, i) => i !== index);
          return { ...p, deliverables: newDeliverables };
        }
        return p;
      })
    );
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPhases = [...phases];
    const [draggedPhase] = newPhases.splice(draggedIndex, 1);
    newPhases.splice(index, 0, draggedPhase);

    // Update sort_order
    const updatedPhases = newPhases.map((p, i) => ({ ...p, sort_order: i }));
    onPhasesChange(updatedPhases);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const includedPhases = phases.filter(p => p.is_included);
  const totalPercentage = includedPhases.reduce((sum, p) => sum + p.percentage_fee, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Phases de la mission</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPhase: CommercialDocumentPhase = {
                  id: crypto.randomUUID(),
                  document_id: documentId || '',
                  phase_code: `P${phases.length + 1}`,
                  phase_name: 'Nouvelle phase',
                  phase_description: '',
                  percentage_fee: 0,
                  amount: 0,
                  is_included: true,
                  deliverables: [],
                  sort_order: phases.length,
                  created_at: null,
                  updated_at: null,
                };
                onPhasesChange([...phases, newPhase]);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter phase
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Ajouter template
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
                {/* Mission de base (bundle) */}
                {basePhaseTemplates.length > 0 && (
                  <>
                    <DropdownMenuItem onClick={() => loadBasePhasesBundle()} className="flex flex-col items-start py-2">
                      <div className="flex items-center gap-2 w-full">
                        <Layers className="h-4 w-4" />
                        <span className="font-medium">Mission de base complète</span>
                        <Badge variant="secondary" className="ml-auto text-xs">{basePhaseTemplates.length} phases</Badge>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                {/* Phases from settings */}
                {basePhaseTemplates.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phases de base</div>
                    {basePhaseTemplates.map((t) => (
                      <DropdownMenuItem key={t.code} className="text-sm">
                        <Badge variant="outline" className="mr-2 text-xs">{t.code}</Badge>
                        {t.name} ({t.default_percentage}%)
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                
                {complementaryPhaseTemplates.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Complémentaires</div>
                    {complementaryPhaseTemplates.map((t) => (
                      <DropdownMenuItem key={t.code} className="text-sm">
                        <Badge variant="outline" className="mr-2 text-xs">{t.code}</Badge>
                        {t.name} ({t.default_percentage}%)
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {document && onDocumentChange && (
              <AIPhaseSuggestion
                document={document}
                onPhasesChange={onPhasesChange}
                onDocumentChange={onDocumentChange}
                documentId={documentId}
              />
            )}
            <Badge variant={totalPercentage === 100 ? 'default' : 'secondary'}>
              Total: {totalPercentage.toFixed(0)}%
            </Badge>
            {baseFee > 0 && (
              <Badge variant="outline">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                  baseFee * totalPercentage / 100
                )}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {phases.map((phase, index) => (
          <Collapsible
            key={phase.id}
            open={expandedPhases.has(phase.id)}
            onOpenChange={() => toggleExpanded(phase.id)}
          >
            <div
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`border rounded-lg transition-all ${
                phase.is_included 
                  ? 'border-primary/30 bg-primary/5' 
                  : 'border-border bg-muted/30 opacity-60'
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3 p-3">
                <div className="cursor-grab">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <Checkbox
                  checked={phase.is_included}
                  onCheckedChange={() => togglePhaseIncluded(phase.id)}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="shrink-0">{phase.phase_code}</Badge>
                    <span className="font-medium truncate">{phase.phase_name}</span>
                  </div>
                  {phase.phase_description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {phase.phase_description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={phase.percentage_fee}
                    onChange={(e) => updatePhasePercentage(phase.id, parseFloat(e.target.value) || 0)}
                    className="w-20 h-8 text-center"
                    disabled={!phase.is_included}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  
                  {baseFee > 0 && phase.is_included && (
                    <span className="text-sm font-medium w-24 text-right">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                        baseFee * phase.percentage_fee / 100
                      )}
                    </span>
                  )}

                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {expandedPhases.has(phase.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>

              <CollapsibleContent>
                <div className="px-4 pb-4 pt-2 border-t border-border/50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Livrables</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addDeliverable(phase.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                    {phase.deliverables.map((deliverable, dIndex) => (
                      <div key={dIndex} className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary shrink-0" />
                        <Input
                          value={deliverable}
                          onChange={(e) => updateDeliverable(phase.id, dIndex, e.target.value)}
                          className="h-8 text-sm"
                          placeholder="Nom du livrable"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => removeDeliverable(phase.id, dIndex)}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}

        {totalPercentage !== 100 && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-600">
            Le total des phases sélectionnées est de {totalPercentage}%. 
            Ajustez les pourcentages pour atteindre 100%.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
