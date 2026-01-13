import { useState, useMemo, useEffect } from "react";
import { Euro, Percent, Calculator, Layers, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { ARCHITECTURE_BASE_PHASES } from "@/lib/commercialTypes";
import { cn } from "@/lib/utils";
import type { TenderTeamMember } from "@/lib/tenderTypes";

interface TenderFeeManagementProps {
  tender: {
    id: string;
    estimated_budget?: number | null;
    moe_fee_percentage?: number | null;
    moe_phases?: string[] | null;
    moe_fee_amount?: number | null;
  };
  teamMembers: TenderTeamMember[];
  onUpdate: (updates: { moe_fee_percentage?: number; moe_phases?: string[]; moe_fee_amount?: number }) => void;
  isUpdating?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export function TenderFeeManagement({ tender, teamMembers, onUpdate, isUpdating }: TenderFeeManagementProps) {
  // Local state for inputs
  const [feePercentage, setFeePercentage] = useState<string>(
    tender.moe_fee_percentage?.toString() || ""
  );
  const [selectedPhases, setSelectedPhases] = useState<Set<string>>(
    new Set(Array.isArray(tender.moe_phases) ? tender.moe_phases : [])
  );

  // Sync with props when tender changes
  useEffect(() => {
    setFeePercentage(tender.moe_fee_percentage?.toString() || "");
    setSelectedPhases(new Set(Array.isArray(tender.moe_phases) ? tender.moe_phases : []));
  }, [tender.moe_fee_percentage, tender.moe_phases]);

  // Calculate fee amount
  const feeAmount = useMemo(() => {
    const percentage = parseFloat(feePercentage) || 0;
    const budget = tender.estimated_budget || 0;
    return (budget * percentage) / 100;
  }, [feePercentage, tender.estimated_budget]);

  // Calculate recommended percentage based on selected phases
  const recommendedPercentage = useMemo(() => {
    return ARCHITECTURE_BASE_PHASES
      .filter(p => selectedPhases.has(p.code))
      .reduce((sum, p) => sum + (p.defaultPercentage || 0), 0);
  }, [selectedPhases]);

  // Team fee distribution
  const teamFeeDistribution = useMemo(() => {
    const cotraitants = teamMembers.filter(m => m.role === 'cotraitant' && m.fee_percentage);
    const totalPartnerPercentage = cotraitants.reduce((sum, m) => sum + (m.fee_percentage || 0), 0);
    const remainingForMandataire = 100 - totalPartnerPercentage;

    return {
      cotraitants,
      totalPartnerPercentage,
      remainingForMandataire,
      mandataireAmount: feeAmount * (remainingForMandataire / 100),
      partnerAmounts: cotraitants.map(m => ({
        member: m,
        percentage: m.fee_percentage || 0,
        amount: feeAmount * ((m.fee_percentage || 0) / 100),
      })),
    };
  }, [teamMembers, feeAmount]);

  const handlePhaseToggle = (phaseCode: string, checked: boolean) => {
    const newPhases = new Set(selectedPhases);
    if (checked) {
      newPhases.add(phaseCode);
    } else {
      newPhases.delete(phaseCode);
    }
    setSelectedPhases(newPhases);
    onUpdate({ moe_phases: Array.from(newPhases) });
  };

  const handleFeeChange = (value: string) => {
    setFeePercentage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      const amount = (tender.estimated_budget || 0) * numValue / 100;
      onUpdate({ moe_fee_percentage: numValue, moe_fee_amount: amount });
    }
  };

  const applyRecommendedPercentage = () => {
    setFeePercentage(recommendedPercentage.toString());
    const amount = (tender.estimated_budget || 0) * recommendedPercentage / 100;
    onUpdate({ moe_fee_percentage: recommendedPercentage, moe_fee_amount: amount });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Euro className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Honoraires MOE</CardTitle>
              <CardDescription>
                Définissez les honoraires globaux et les phases de la mission
              </CardDescription>
            </div>
          </div>
          {tender.estimated_budget ? (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Budget travaux</p>
              <p className="font-semibold">{formatCurrency(tender.estimated_budget)}</p>
            </div>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              <Info className="h-3 w-3 mr-1" />
              Budget non défini
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Fee Percentage Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                Taux d'honoraires global
              </Label>
              {recommendedPercentage > 0 && selectedPhases.size > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={applyRecommendedPercentage}
                      className="text-xs text-primary hover:underline"
                    >
                      Appliquer {recommendedPercentage}%
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Taux recommandé basé sur les phases sélectionnées</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="relative">
              <Input
                type="number"
                value={feePercentage}
                onChange={(e) => handleFeeChange(e.target.value)}
                placeholder="Ex: 12"
                step="0.5"
                min="0"
                max="100"
                className="pr-8"
                disabled={isUpdating}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              Montant des honoraires
            </Label>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className={cn(
                "text-xl font-bold",
                feeAmount > 0 ? "text-primary" : "text-muted-foreground"
              )}>
                {feeAmount > 0 ? formatCurrency(feeAmount) : "—"}
              </p>
              {feeAmount > 0 && tender.estimated_budget && (
                <p className="text-xs text-muted-foreground mt-1">
                  {feePercentage}% de {formatCurrency(tender.estimated_budget)}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Phase Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Phases de la mission
            </Label>
            <Badge variant="secondary">
              {selectedPhases.size} phase{selectedPhases.size !== 1 ? 's' : ''} • {recommendedPercentage}%
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ARCHITECTURE_BASE_PHASES.map((phase) => (
              <label
                key={phase.code}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                  selectedPhases.has(phase.code)
                    ? "bg-primary/5 border-primary/30"
                    : "bg-card hover:bg-muted/50"
                )}
              >
                <Checkbox
                  checked={selectedPhases.has(phase.code)}
                  onCheckedChange={(checked) => handlePhaseToggle(phase.code, !!checked)}
                  disabled={isUpdating}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{phase.code}</p>
                  <p className="text-xs text-muted-foreground truncate">{phase.name}</p>
                </div>
                <span className="text-xs text-muted-foreground">{phase.defaultPercentage}%</span>
              </label>
            ))}
          </div>
        </div>

        {/* Team Distribution */}
        {teamMembers.length > 0 && feeAmount > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium">Répartition équipe</Label>
              
              <div className="space-y-2">
                {/* Mandataire */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">Mandataire</Badge>
                    <span className="text-sm font-medium">
                      {teamMembers.find(m => m.role === 'mandataire')?.company?.name || 'Notre agence'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(teamFeeDistribution.mandataireAmount)}</p>
                    <p className="text-xs text-muted-foreground">{teamFeeDistribution.remainingForMandataire.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Cotraitants */}
                {teamFeeDistribution.partnerAmounts.map(({ member, percentage, amount }) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Cotraitant</Badge>
                      <span className="text-sm">{member.company?.name || member.contact?.name || 'Partenaire'}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(amount)}</p>
                      <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Distribution totale</span>
                  <span>{(100 - teamFeeDistribution.totalPartnerPercentage).toFixed(1)}% mandataire + {teamFeeDistribution.totalPartnerPercentage.toFixed(1)}% partenaires</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </div>
          </>
        )}

        {/* Info message */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 dark:text-blue-300">
            Le pourcentage d'honoraires des cotraitants est défini dans leur fiche équipe et calculé sur la base des honoraires globaux MOE.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
