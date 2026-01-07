import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { CRITERION_TYPE_LABELS, type CriterionType } from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";

export interface CriterionItem {
  id: string;
  name: string;
  type: CriterionType;
  weight: number;
}

interface CriteriaWeightEditorProps {
  criteria: CriterionItem[];
  onChange: (criteria: CriterionItem[]) => void;
}

export function CriteriaWeightEditor({ criteria, onChange }: CriteriaWeightEditorProps) {
  const [newCriterionType, setNewCriterionType] = useState<CriterionType>('technical');

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const isValid = totalWeight === 100;

  const addCriterion = () => {
    const newCriterion: CriterionItem = {
      id: crypto.randomUUID(),
      name: CRITERION_TYPE_LABELS[newCriterionType],
      type: newCriterionType,
      weight: Math.max(0, 100 - totalWeight),
    };
    onChange([...criteria, newCriterion]);
  };

  const updateCriterion = (id: string, updates: Partial<CriterionItem>) => {
    onChange(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCriterion = (id: string) => {
    onChange(criteria.filter(c => c.id !== id));
  };

  const getTypeColor = (type: CriterionType) => {
    switch (type) {
      case 'price': return 'bg-emerald-500';
      case 'technical': return 'bg-blue-500';
      case 'delay': return 'bg-amber-500';
      case 'environmental': return 'bg-green-500';
      case 'social': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress bar showing total */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total des pondérations</span>
          <span className={cn(
            "font-semibold",
            isValid ? "text-emerald-600" : totalWeight > 100 ? "text-destructive" : "text-amber-600"
          )}>
            {totalWeight}%
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden flex">
          {criteria.map((criterion) => (
            <div
              key={criterion.id}
              className={cn("h-full transition-all", getTypeColor(criterion.type))}
              style={{ width: `${criterion.weight}%` }}
            />
          ))}
        </div>
        {!isValid && (
          <p className="text-xs text-amber-600">
            {totalWeight < 100 
              ? `Il reste ${100 - totalWeight}% à attribuer` 
              : `Excès de ${totalWeight - 100}%`}
          </p>
        )}
      </div>

      {/* Criteria list */}
      <div className="space-y-3">
        {criteria.map((criterion) => (
          <div
            key={criterion.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            
            <div className={cn("h-8 w-1 rounded-full", getTypeColor(criterion.type))} />
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={criterion.name}
                  onChange={(e) => updateCriterion(criterion.id, { name: e.target.value })}
                  className="h-8 text-sm font-medium"
                  placeholder="Nom du critère"
                />
                <Select
                  value={criterion.type}
                  onValueChange={(value) => updateCriterion(criterion.id, { type: value as CriterionType })}
                >
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CRITERION_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-3">
                <Slider
                  value={[criterion.weight]}
                  onValueChange={([value]) => updateCriterion(criterion.id, { weight: value })}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <div className="flex items-center gap-1 min-w-[60px]">
                  <Input
                    type="number"
                    value={criterion.weight}
                    onChange={(e) => updateCriterion(criterion.id, { weight: Number(e.target.value) })}
                    className="h-7 w-14 text-center text-sm"
                    min={0}
                    max={100}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeCriterion(criterion.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add criterion */}
      <div className="flex items-center gap-2">
        <Select value={newCriterionType} onValueChange={(v) => setNewCriterionType(v as CriterionType)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CRITERION_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={addCriterion}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter un critère
        </Button>
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground">Préréglages :</span>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-muted"
          onClick={() => onChange([
            { id: crypto.randomUUID(), name: 'Prix', type: 'price', weight: 40 },
            { id: crypto.randomUUID(), name: 'Valeur technique', type: 'technical', weight: 60 },
          ])}
        >
          60% Technique / 40% Prix
        </Badge>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-muted"
          onClick={() => onChange([
            { id: crypto.randomUUID(), name: 'Prix', type: 'price', weight: 30 },
            { id: crypto.randomUUID(), name: 'Valeur technique', type: 'technical', weight: 50 },
            { id: crypto.randomUUID(), name: 'Délais', type: 'delay', weight: 20 },
          ])}
        >
          50/30/20
        </Badge>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-muted"
          onClick={() => onChange([
            { id: crypto.randomUUID(), name: 'Prix', type: 'price', weight: 30 },
            { id: crypto.randomUUID(), name: 'Valeur technique', type: 'technical', weight: 40 },
            { id: crypto.randomUUID(), name: 'Environnement', type: 'environmental', weight: 20 },
            { id: crypto.randomUUID(), name: 'Social', type: 'social', weight: 10 },
          ])}
        >
          Avec clauses RSE
        </Badge>
      </div>
    </div>
  );
}
