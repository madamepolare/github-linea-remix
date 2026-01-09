import { useState, useMemo } from "react";
import {
  Scale,
  Euro,
  Lightbulb,
  Clock,
  Leaf,
  Heart,
  Star,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
  X,
  Sparkles,
  GripVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useTenderCriteria } from "@/hooks/useTenderCriteria";

interface TenderCriteriaSectionProps {
  tenderId: string;
  extractedCriteria?: any[];
  onImportFromExtracted?: () => void;
}

const CRITERION_TYPES = [
  { value: 'price', label: 'Prix', icon: Euro, color: 'text-green-600' },
  { value: 'technical', label: 'Technique', icon: Lightbulb, color: 'text-blue-600' },
  { value: 'delay', label: 'Délais', icon: Clock, color: 'text-amber-600' },
  { value: 'environmental', label: 'Environnement', icon: Leaf, color: 'text-emerald-600' },
  { value: 'social', label: 'Social', icon: Heart, color: 'text-pink-600' },
  { value: 'innovation', label: 'Innovation', icon: Star, color: 'text-purple-600' },
  { value: 'references', label: 'Références', icon: FileText, color: 'text-indigo-600' },
];

export function TenderCriteriaSection({ 
  tenderId, 
  extractedCriteria,
  onImportFromExtracted 
}: TenderCriteriaSectionProps) {
  const { 
    criteria, 
    isLoading, 
    addCriterion, 
    updateCriterion, 
    deleteCriterion,
    loadFromExtractedData,
    totalWeight,
    priceWeight,
    technicalWeight,
  } = useTenderCriteria(tenderId);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCriterion, setNewCriterion] = useState({
    name: '',
    weight: 0,
    type: 'technical' as string,
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCriterion = async () => {
    if (!newCriterion.name.trim()) return;
    
    await addCriterion.mutateAsync({
      name: newCriterion.name,
      weight: newCriterion.weight,
      criterion_type: newCriterion.type as any,
    });
    
    setNewCriterion({ name: '', weight: 0, type: 'technical' });
    setShowAddForm(false);
  };

  const handleImportExtracted = async () => {
    if (extractedCriteria && extractedCriteria.length > 0) {
      await loadFromExtractedData.mutateAsync(extractedCriteria);
    }
  };

  const getCriterionIcon = (type: string) => {
    const found = CRITERION_TYPES.find(t => t.value === type);
    return found ? found.icon : Scale;
  };

  const getCriterionColor = (type: string) => {
    const found = CRITERION_TYPES.find(t => t.value === type);
    return found ? found.color : 'text-gray-600';
  };

  // Check if weight total is valid
  const isWeightValid = totalWeight >= 99 && totalWeight <= 101;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          Critères de jugement
        </CardTitle>
        <div className="flex items-center gap-2">
          {extractedCriteria && extractedCriteria.length > 0 && criteria.length === 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleImportExtracted}
              disabled={loadFromExtractedData.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Importer ({extractedCriteria.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weight Summary */}
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Total pondérations</span>
              <span className={cn(
                "font-medium",
                isWeightValid ? "text-green-600" : "text-amber-600"
              )}>
                {totalWeight}%
              </span>
            </div>
            <Progress 
              value={Math.min(totalWeight, 100)} 
              className={cn(
                "h-2",
                isWeightValid ? "[&>div]:bg-green-600" : "[&>div]:bg-amber-500"
              )}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            <div>Prix: <span className="font-medium text-green-600">{priceWeight}%</span></div>
            <div>Technique: <span className="font-medium text-blue-600">{technicalWeight}%</span></div>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="flex items-end gap-2 p-3 border rounded-lg bg-background">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">Nom du critère</label>
              <Input
                value={newCriterion.name}
                onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
                placeholder="Ex: Valeur technique"
                className="h-9"
              />
            </div>
            <div className="w-24 space-y-1">
              <label className="text-xs text-muted-foreground">Poids (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={newCriterion.weight || ''}
                onChange={(e) => setNewCriterion({ ...newCriterion, weight: parseInt(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
            <div className="w-32 space-y-1">
              <label className="text-xs text-muted-foreground">Type</label>
              <Select
                value={newCriterion.type}
                onValueChange={(v) => setNewCriterion({ ...newCriterion, type: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRITERION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <t.icon className={cn("h-4 w-4", t.color)} />
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={handleAddCriterion} disabled={!newCriterion.name.trim()}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Criteria List */}
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Chargement...</div>
        ) : criteria.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucun critère défini</p>
            <p className="text-xs mt-1">Ajoutez les critères de jugement ou importez depuis le DCE</p>
          </div>
        ) : (
          <div className="space-y-2">
            {criteria.map((criterion) => {
              const Icon = getCriterionIcon(criterion.criterion_type || 'technical');
              const color = getCriterionColor(criterion.criterion_type || 'technical');
              const hasSubCriteria = criterion.sub_criteria && Array.isArray(criterion.sub_criteria) && criterion.sub_criteria.length > 0;
              const isExpanded = expandedIds.has(criterion.id);

              return (
                <div
                  key={criterion.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3 bg-muted/30">
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
                    
                    <div className={cn("p-1.5 rounded", `${color.replace('text-', 'bg-')}/10`)}>
                      <Icon className={cn("h-4 w-4", color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{(criterion as any).criterion_name || criterion.name}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono">
                        {criterion.weight || 0}%
                      </Badge>
                      
                      <Progress 
                        value={criterion.weight || 0} 
                        className="w-16 h-2"
                      />

                      {hasSubCriteria && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => toggleExpand(criterion.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteCriterion.mutate(criterion.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Sub-criteria */}
                  {hasSubCriteria && isExpanded && (
                    <div className="border-t bg-background">
                      {(criterion.sub_criteria as any[]).map((sub, i) => (
                        <div 
                          key={i}
                          className="flex items-center gap-3 px-3 py-2 pl-12 border-b last:border-b-0"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                          <span className="flex-1 text-sm text-muted-foreground">{sub.name}</span>
                          {sub.weight && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {sub.weight}%
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Warning if weights don't sum to 100 */}
        {criteria.length > 0 && !isWeightValid && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
            Le total des pondérations doit être égal à 100%
          </p>
        )}
      </CardContent>
    </Card>
  );
}
