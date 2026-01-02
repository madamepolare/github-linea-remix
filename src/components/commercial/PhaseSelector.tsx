import { useState } from 'react';
import { GripVertical, Check, ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CommercialDocumentPhase,
  ProjectType,
  PHASES_BY_PROJECT_TYPE
} from '@/lib/commercialTypes';

interface PhaseSelectorProps {
  phases: CommercialDocumentPhase[];
  projectType: ProjectType;
  onPhasesChange: (phases: CommercialDocumentPhase[]) => void;
  projectBudget?: number;
  feePercentage?: number;
}

export function PhaseSelector({
  phases,
  projectType,
  onPhasesChange,
  projectBudget,
  feePercentage
}: PhaseSelectorProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const baseFee = projectBudget && feePercentage 
    ? projectBudget * (feePercentage / 100) 
    : 0;

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
        <div className="flex items-center justify-between">
          <CardTitle>Phases de la mission</CardTitle>
          <div className="flex items-center gap-2">
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
