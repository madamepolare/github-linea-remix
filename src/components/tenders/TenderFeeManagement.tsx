import { useState, useMemo, useEffect } from "react";
import { Euro, Percent, Calculator, Layers, CheckCircle2, Info, Users } from "lucide-react";
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

        {/* Team Distribution - PRIORITY SECTION */}
        {feeAmount > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Répartition du groupement
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Distribution des honoraires entre les membres de l'équipe
                  </p>
                </div>
                <Badge variant="outline" className="font-mono">
                  Total : {formatCurrency(feeAmount)}
                </Badge>
              </div>

              {teamMembers.length > 0 ? (
                <>
                  {/* Visual distribution bar */}
                  <div className="space-y-3">
                    <div className="h-10 rounded-lg overflow-hidden flex shadow-sm">
                      {/* Mandataire portion */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium transition-all cursor-pointer hover:brightness-110"
                            style={{ width: `${Math.max(teamFeeDistribution.remainingForMandataire, 5)}%` }}
                          >
                            {teamFeeDistribution.remainingForMandataire > 12 && (
                              <span>{teamFeeDistribution.remainingForMandataire.toFixed(0)}%</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">Mandataire: {teamFeeDistribution.remainingForMandataire.toFixed(1)}%</p>
                          <p className="text-xs opacity-80">{formatCurrency(teamFeeDistribution.mandataireAmount)}</p>
                        </TooltipContent>
                      </Tooltip>
                      {/* Partners portions */}
                      {teamFeeDistribution.partnerAmounts.map(({ member, percentage, amount }, idx) => {
                        const colors = [
                          'bg-blue-500 hover:bg-blue-600',
                          'bg-emerald-500 hover:bg-emerald-600',
                          'bg-amber-500 hover:bg-amber-600',
                          'bg-purple-500 hover:bg-purple-600',
                          'bg-pink-500 hover:bg-pink-600',
                          'bg-cyan-500 hover:bg-cyan-600',
                        ];
                        return (
                          <Tooltip key={member.id}>
                            <TooltipTrigger asChild>
                              <div 
                                className={cn(
                                  colors[idx % colors.length],
                                  "flex items-center justify-center text-white text-sm font-medium transition-all cursor-pointer"
                                )}
                                style={{ width: `${Math.max(percentage, 3)}%` }}
                              >
                                {percentage > 8 && (
                                  <span>{percentage.toFixed(0)}%</span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{member.company?.name || member.contact?.name || 'Partenaire'}: {percentage.toFixed(1)}%</p>
                              <p className="text-xs opacity-80">{formatCurrency(amount)}</p>
                              {member.specialty && <p className="text-xs opacity-60">{member.specialty}</p>}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-primary" />
                        <span className="text-muted-foreground">Mandataire</span>
                        <span className="font-semibold">{formatCurrency(teamFeeDistribution.mandataireAmount)}</span>
                        <span className="text-muted-foreground">({teamFeeDistribution.remainingForMandataire.toFixed(1)}%)</span>
                      </div>
                      {teamFeeDistribution.partnerAmounts.map(({ member, amount, percentage }, idx) => {
                        const colors = [
                          'bg-blue-500',
                          'bg-emerald-500',
                          'bg-amber-500',
                          'bg-purple-500',
                          'bg-pink-500',
                          'bg-cyan-500',
                        ];
                        return (
                          <div key={member.id} className="flex items-center gap-2">
                            <div className={cn("w-4 h-4 rounded", colors[idx % colors.length])} />
                            <span className="text-muted-foreground truncate max-w-[120px]">
                              {member.company?.name || member.contact?.name || 'Partenaire'}
                            </span>
                            <span className="font-semibold">{formatCurrency(amount)}</span>
                            <span className="text-muted-foreground">({percentage.toFixed(1)}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Detailed member cards */}
                  <div className="grid gap-3 mt-4">
                    {/* Mandataire card */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border-2 border-primary/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <Badge variant="default" className="mb-1">Mandataire</Badge>
                          <p className="font-medium">
                            {teamMembers.find(m => m.role === 'mandataire')?.company?.name || 'Notre agence'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(teamFeeDistribution.mandataireAmount)}</p>
                        <p className="text-sm text-muted-foreground">{teamFeeDistribution.remainingForMandataire.toFixed(1)}% des honoraires</p>
                      </div>
                    </div>

                    {/* Cotraitants cards */}
                    {teamFeeDistribution.partnerAmounts.map(({ member, percentage, amount }, idx) => {
                      const bgColors = [
                        'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
                        'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
                        'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
                        'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
                        'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800',
                        'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800',
                      ];
                      const textColors = [
                        'text-blue-600 dark:text-blue-400',
                        'text-emerald-600 dark:text-emerald-400',
                        'text-amber-600 dark:text-amber-400',
                        'text-purple-600 dark:text-purple-400',
                        'text-pink-600 dark:text-pink-400',
                        'text-cyan-600 dark:text-cyan-400',
                      ];
                      return (
                        <div 
                          key={member.id} 
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border",
                            bgColors[idx % bgColors.length]
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">Cotraitant</Badge>
                                {member.specialty && (
                                  <Badge variant="secondary" className="text-xs">{member.specialty}</Badge>
                                )}
                              </div>
                              <p className="font-medium">{member.company?.name || member.contact?.name || 'Partenaire'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-2xl font-bold", textColors[idx % textColors.length])}>
                              {formatCurrency(amount)}
                            </p>
                            <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}% des honoraires</p>
                          </div>
                        </div>
                      );
                    })}

                    {/* No cotraitants message */}
                    {teamFeeDistribution.partnerAmounts.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucun cotraitant avec pourcentage défini</p>
                        <p className="text-xs">Ajoutez des membres dans l'onglet "Équipe confirmée"</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-xl">
                  <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Aucun membre dans l'équipe</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ajoutez des membres dans l'onglet "Équipe confirmée" pour voir la répartition
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Phase Selection - Collapsible/Secondary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Phases de la mission (référence)
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
