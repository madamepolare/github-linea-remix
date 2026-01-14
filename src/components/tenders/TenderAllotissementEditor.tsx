import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  Euro,
  Target,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface LotCriterion {
  id: string;
  name: string;
  weight: number;
  type: "technical" | "financial";
}

export interface AllotissementLot {
  id: string;
  numero: number;
  intitule: string;
  domaine?: string;
  attribution_type: "mono" | "multi";
  nb_attributaires?: number;
  budget_min?: number;
  budget_max?: number;
  description?: string;
  criteria: LotCriterion[];
}

interface TenderAllotissementEditorProps {
  hasAllotissement: boolean;
  onHasAllotissementChange: (value: boolean) => void;
  lots: AllotissementLot[];
  onLotsChange: (lots: AllotissementLot[]) => void;
  globalAttributionType?: "mono" | "multi";
  onGlobalAttributionTypeChange?: (type: "mono" | "multi") => void;
  globalBudgetMin?: number;
  globalBudgetMax?: number;
  onGlobalBudgetChange?: (min?: number, max?: number) => void;
  globalCriteria?: LotCriterion[];
  onGlobalCriteriaChange?: (criteria: LotCriterion[]) => void;
}

const DOMAINE_OPTIONS = [
  { value: "graphisme", label: "Graphisme" },
  { value: "impression", label: "Impression" },
  { value: "web", label: "Web / Digital" },
  { value: "video", label: "Vidéo / Motion" },
  { value: "photo", label: "Photographie" },
  { value: "evenementiel", label: "Événementiel" },
  { value: "conseil", label: "Conseil / Stratégie" },
  { value: "rp", label: "Relations Presse" },
  { value: "social_media", label: "Social Media" },
  { value: "autre", label: "Autre" },
];

const generateId = () => Math.random().toString(36).substring(2, 11);

export function TenderAllotissementEditor({
  hasAllotissement,
  onHasAllotissementChange,
  lots,
  onLotsChange,
  globalAttributionType = "mono",
  onGlobalAttributionTypeChange,
  globalBudgetMin,
  globalBudgetMax,
  onGlobalBudgetChange,
  globalCriteria = [],
  onGlobalCriteriaChange,
}: TenderAllotissementEditorProps) {
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());

  const toggleLotExpanded = (lotId: string) => {
    const newExpanded = new Set(expandedLots);
    if (newExpanded.has(lotId)) {
      newExpanded.delete(lotId);
    } else {
      newExpanded.add(lotId);
    }
    setExpandedLots(newExpanded);
  };

  const addLot = () => {
    const newLot: AllotissementLot = {
      id: generateId(),
      numero: lots.length + 1,
      intitule: "",
      attribution_type: "mono",
      criteria: [
        { id: generateId(), name: "Valeur technique", weight: 60, type: "technical" },
        { id: generateId(), name: "Prix", weight: 40, type: "financial" },
      ],
    };
    onLotsChange([...lots, newLot]);
    setExpandedLots(new Set([...expandedLots, newLot.id]));
  };

  const removeLot = (lotId: string) => {
    const newLots = lots
      .filter((l) => l.id !== lotId)
      .map((l, idx) => ({ ...l, numero: idx + 1 }));
    onLotsChange(newLots);
    expandedLots.delete(lotId);
    setExpandedLots(new Set(expandedLots));
  };

  const updateLot = (lotId: string, updates: Partial<AllotissementLot>) => {
    onLotsChange(lots.map((l) => (l.id === lotId ? { ...l, ...updates } : l)));
  };

  const addCriterion = (lotId: string) => {
    const lot = lots.find((l) => l.id === lotId);
    if (!lot) return;

    const newCriterion: LotCriterion = {
      id: generateId(),
      name: "",
      weight: 0,
      type: "technical",
    };
    updateLot(lotId, { criteria: [...lot.criteria, newCriterion] });
  };

  const updateCriterion = (
    lotId: string,
    criterionId: string,
    updates: Partial<LotCriterion>
  ) => {
    const lot = lots.find((l) => l.id === lotId);
    if (!lot) return;

    const newCriteria = lot.criteria.map((c) =>
      c.id === criterionId ? { ...c, ...updates } : c
    );
    updateLot(lotId, { criteria: newCriteria });
  };

  const removeCriterion = (lotId: string, criterionId: string) => {
    const lot = lots.find((l) => l.id === lotId);
    if (!lot) return;

    updateLot(lotId, { criteria: lot.criteria.filter((c) => c.id !== criterionId) });
  };

  // Global criteria management (for non-allotissement)
  const addGlobalCriterion = () => {
    if (!onGlobalCriteriaChange) return;
    const newCriterion: LotCriterion = {
      id: generateId(),
      name: "",
      weight: 0,
      type: "technical",
    };
    onGlobalCriteriaChange([...globalCriteria, newCriterion]);
  };

  const updateGlobalCriterion = (criterionId: string, updates: Partial<LotCriterion>) => {
    if (!onGlobalCriteriaChange) return;
    onGlobalCriteriaChange(
      globalCriteria.map((c) => (c.id === criterionId ? { ...c, ...updates } : c))
    );
  };

  const removeGlobalCriterion = (criterionId: string) => {
    if (!onGlobalCriteriaChange) return;
    onGlobalCriteriaChange(globalCriteria.filter((c) => c.id !== criterionId));
  };

  const getTotalWeight = (criteria: LotCriterion[]) => {
    return criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Toggle allotissement */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <Label className="text-base font-medium">Marché avec allotissement</Label>
          <p className="text-sm text-muted-foreground">
            Diviser l'appel d'offres en plusieurs lots distincts
          </p>
        </div>
        <Switch
          checked={hasAllotissement}
          onCheckedChange={(checked) => {
            onHasAllotissementChange(checked);
            if (checked && lots.length < 2) {
              // Create minimum 2 lots
              const newLots: AllotissementLot[] = [
                {
                  id: generateId(),
                  numero: 1,
                  intitule: "Lot 1",
                  attribution_type: "mono",
                  criteria: [
                    { id: generateId(), name: "Valeur technique", weight: 60, type: "technical" },
                    { id: generateId(), name: "Prix", weight: 40, type: "financial" },
                  ],
                },
                {
                  id: generateId(),
                  numero: 2,
                  intitule: "Lot 2",
                  attribution_type: "mono",
                  criteria: [
                    { id: generateId(), name: "Valeur technique", weight: 60, type: "technical" },
                    { id: generateId(), name: "Prix", weight: 40, type: "financial" },
                  ],
                },
              ];
              onLotsChange(newLots);
              setExpandedLots(new Set(newLots.map((l) => l.id)));
            }
          }}
        />
      </div>

      {/* Sans allotissement - Global settings */}
      {!hasAllotissement && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Configuration globale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Attribution type */}
            <div className="space-y-2">
              <Label>Type d'attribution</Label>
              <Select
                value={globalAttributionType}
                onValueChange={(v) => onGlobalAttributionTypeChange?.(v as "mono" | "multi")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mono">Mono-attributaire</SelectItem>
                  <SelectItem value="multi">Multi-attributaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget minimum (€)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={globalBudgetMin || ""}
                  onChange={(e) =>
                    onGlobalBudgetChange?.(
                      e.target.value ? Number(e.target.value) : undefined,
                      globalBudgetMax
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Budget maximum (€)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={globalBudgetMax || ""}
                  onChange={(e) =>
                    onGlobalBudgetChange?.(
                      globalBudgetMin,
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>

            {/* Global criteria */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Critères d'évaluation</Label>
                <Badge
                  variant={getTotalWeight(globalCriteria) === 100 ? "default" : "destructive"}
                >
                  {getTotalWeight(globalCriteria)}%
                </Badge>
              </div>

              <div className="space-y-2">
                {globalCriteria.map((criterion) => (
                  <div key={criterion.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Nom du critère"
                      value={criterion.name}
                      onChange={(e) =>
                        updateGlobalCriterion(criterion.id, { name: e.target.value })
                      }
                      className="flex-1"
                    />
                    <Select
                      value={criterion.type}
                      onValueChange={(v) =>
                        updateGlobalCriterion(criterion.id, {
                          type: v as "technical" | "financial",
                        })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technique</SelectItem>
                        <SelectItem value="financial">Prix</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={criterion.weight}
                        onChange={(e) =>
                          updateGlobalCriterion(criterion.id, {
                            weight: Number(e.target.value),
                          })
                        }
                        className="w-20 text-center"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeGlobalCriterion(criterion.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={addGlobalCriterion} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un critère
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avec allotissement - Lots list */}
      {hasAllotissement && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Lots ({lots.length})</h3>
              <p className="text-sm text-muted-foreground">
                Minimum 2 lots requis
              </p>
            </div>
            <Button onClick={addLot} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un lot
            </Button>
          </div>

          <div className="space-y-3">
            {lots.map((lot) => {
              const isExpanded = expandedLots.has(lot.id);
              const totalWeight = getTotalWeight(lot.criteria);
              const budgetValid =
                !lot.budget_min ||
                !lot.budget_max ||
                lot.budget_max >= lot.budget_min;

              return (
                <Card
                  key={lot.id}
                  className={cn(
                    "transition-all",
                    !budgetValid && "border-destructive"
                  )}
                >
                  <Collapsible open={isExpanded} onOpenChange={() => toggleLotExpanded(lot.id)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline">Lot {lot.numero}</Badge>
                            <span className="font-medium">
                              {lot.intitule || "Sans titre"}
                            </span>
                            {lot.domaine && (
                              <Badge variant="secondary" className="text-xs">
                                {DOMAINE_OPTIONS.find((d) => d.value === lot.domaine)?.label ||
                                  lot.domaine}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={totalWeight === 100 ? "default" : "destructive"}>
                              {totalWeight}%
                            </Badge>
                            {(lot.budget_min || lot.budget_max) && (
                              <Badge variant="outline" className="gap-1">
                                <Euro className="h-3 w-3" />
                                {formatCurrency(lot.budget_min)} - {formatCurrency(lot.budget_max)}
                              </Badge>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        {/* Lot basic info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Intitulé du lot *</Label>
                            <Input
                              placeholder="Ex: Graphisme et identité visuelle"
                              value={lot.intitule}
                              onChange={(e) => updateLot(lot.id, { intitule: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Domaine</Label>
                            <Select
                              value={lot.domaine || "__none__"}
                              onValueChange={(v) =>
                                updateLot(lot.id, { domaine: v === "__none__" ? undefined : v })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Non spécifié</SelectItem>
                                {DOMAINE_OPTIONS.map((d) => (
                                  <SelectItem key={d.value} value={d.value}>
                                    {d.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Attribution type */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Type d'attribution</Label>
                            <Select
                              value={lot.attribution_type}
                              onValueChange={(v) =>
                                updateLot(lot.id, {
                                  attribution_type: v as "mono" | "multi",
                                  nb_attributaires: v === "mono" ? undefined : lot.nb_attributaires,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mono">Mono-attributaire</SelectItem>
                                <SelectItem value="multi">Multi-attributaire</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {lot.attribution_type === "multi" && (
                            <div className="space-y-2">
                              <Label>Nombre d'attributaires</Label>
                              <Input
                                type="number"
                                min={2}
                                placeholder="2"
                                value={lot.nb_attributaires || ""}
                                onChange={(e) =>
                                  updateLot(lot.id, {
                                    nb_attributaires: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>

                        {/* Budget */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Budget minimum (€)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={lot.budget_min || ""}
                              onChange={(e) =>
                                updateLot(lot.id, {
                                  budget_min: e.target.value ? Number(e.target.value) : undefined,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Budget maximum (€)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={lot.budget_max || ""}
                              onChange={(e) =>
                                updateLot(lot.id, {
                                  budget_max: e.target.value ? Number(e.target.value) : undefined,
                                })
                              }
                              className={cn(!budgetValid && "border-destructive")}
                            />
                            {!budgetValid && (
                              <p className="text-xs text-destructive">
                                Le budget max doit être ≥ au budget min
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Criteria */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Critères d'évaluation
                            </Label>
                            <Badge
                              variant={totalWeight === 100 ? "default" : "destructive"}
                            >
                              {totalWeight}%
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {lot.criteria.map((criterion) => (
                              <div key={criterion.id} className="flex items-center gap-2">
                                <Input
                                  placeholder="Nom du critère"
                                  value={criterion.name}
                                  onChange={(e) =>
                                    updateCriterion(lot.id, criterion.id, {
                                      name: e.target.value,
                                    })
                                  }
                                  className="flex-1"
                                />
                                <Select
                                  value={criterion.type}
                                  onValueChange={(v) =>
                                    updateCriterion(lot.id, criterion.id, {
                                      type: v as "technical" | "financial",
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="technical">Technique</SelectItem>
                                    <SelectItem value="financial">Prix</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={criterion.weight}
                                    onChange={(e) =>
                                      updateCriterion(lot.id, criterion.id, {
                                        weight: Number(e.target.value),
                                      })
                                    }
                                    className="w-16 text-center"
                                  />
                                  <span className="text-sm text-muted-foreground">%</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => removeCriterion(lot.id, criterion.id)}
                                  disabled={lot.criteria.length <= 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addCriterion(lot.id)}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter un critère
                          </Button>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <Label>Description (optionnel)</Label>
                          <Textarea
                            placeholder="Description du lot..."
                            value={lot.description || ""}
                            onChange={(e) => updateLot(lot.id, { description: e.target.value })}
                            rows={2}
                          />
                        </div>

                        {/* Delete button */}
                        <div className="flex justify-end pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeLot(lot.id)}
                            disabled={lots.length <= 2}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer ce lot
                          </Button>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>

          {lots.length < 2 && (
            <p className="text-sm text-destructive text-center">
              Un marché avec allotissement doit comporter au moins 2 lots
            </p>
          )}
        </div>
      )}
    </div>
  );
}
