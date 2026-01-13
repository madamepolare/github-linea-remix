import { useState, useMemo, useEffect } from "react";
import { Euro, Percent, Calculator, Info, Users, AlertCircle, RotateCcw, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { TenderTeamMember } from "@/lib/tenderTypes";

interface TenderFeeManagementProps {
  tender: {
    id: string;
    estimated_budget?: number | null;
    moe_fee_percentage?: number | null;
    moe_fee_amount?: number | null;
  };
  teamMembers: TenderTeamMember[];
  onUpdate: (updates: { moe_fee_percentage?: number; moe_fee_amount?: number }) => void;
  onUpdateMemberFee?: (memberId: string, feePercentage: number) => void;
  isUpdating?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export function TenderFeeManagement({ tender, teamMembers, onUpdate, onUpdateMemberFee, isUpdating }: TenderFeeManagementProps) {
  // Local state for inputs
  const [feePercentage, setFeePercentage] = useState<string>(
    tender.moe_fee_percentage?.toString() || ""
  );

  // Local state for editable member fees
  const [memberFees, setMemberFees] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize member fees from teamMembers
  useEffect(() => {
    const initialFees: Record<string, string> = {};
    teamMembers
      .filter(m => m.role === 'cotraitant')
      .forEach(m => {
        initialFees[m.id] = (m.fee_percentage || 0).toString();
      });
    setMemberFees(initialFees);
    setHasUnsavedChanges(false);
  }, [teamMembers]);

  // Sync with props when tender changes
  useEffect(() => {
    setFeePercentage(tender.moe_fee_percentage?.toString() || "");
  }, [tender.moe_fee_percentage]);

  // Calculate fee amount
  const feeAmount = useMemo(() => {
    const percentage = parseFloat(feePercentage) || 0;
    const budget = tender.estimated_budget || 0;
    return (budget * percentage) / 100;
  }, [feePercentage, tender.estimated_budget]);

  // Team fee distribution - using local editable values
  const teamFeeDistribution = useMemo(() => {
    const cotraitants = teamMembers.filter(m => m.role === 'cotraitant');
    const totalPartnerPercentage = cotraitants.reduce((sum, m) => {
      const localFee = parseFloat(memberFees[m.id] || '0') || 0;
      return sum + localFee;
    }, 0);
    const remainingForMandataire = Math.max(0, 100 - totalPartnerPercentage);
    const isOverBudget = totalPartnerPercentage > 100;

    return {
      cotraitants,
      totalPartnerPercentage,
      remainingForMandataire,
      isOverBudget,
      mandataireAmount: feeAmount * (remainingForMandataire / 100),
      partnerAmounts: cotraitants.map(m => {
        const localFee = parseFloat(memberFees[m.id] || '0') || 0;
        return {
          member: m,
          percentage: localFee,
          amount: feeAmount * (localFee / 100),
          originalPercentage: m.fee_percentage || 0,
          hasChanged: localFee !== (m.fee_percentage || 0),
        };
      }),
    };
  }, [teamMembers, feeAmount, memberFees]);

  // Handle member fee change
  const handleMemberFeeChange = (memberId: string, value: string) => {
    // Allow empty input for easier editing
    setMemberFees(prev => ({ ...prev, [memberId]: value }));
    setHasUnsavedChanges(true);
  };

  // Save all member fees
  const handleSaveAllFees = () => {
    if (!onUpdateMemberFee) return;
    
    teamFeeDistribution.partnerAmounts.forEach(({ member, percentage, hasChanged }) => {
      if (hasChanged) {
        onUpdateMemberFee(member.id, percentage);
      }
    });
    setHasUnsavedChanges(false);
  };

  // Reset all fees to original values
  const handleResetFees = () => {
    const resetFees: Record<string, string> = {};
    teamMembers
      .filter(m => m.role === 'cotraitant')
      .forEach(m => {
        resetFees[m.id] = (m.fee_percentage || 0).toString();
      });
    setMemberFees(resetFees);
    setHasUnsavedChanges(false);
  };

  const handleFeeChange = (value: string) => {
    setFeePercentage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      const amount = (tender.estimated_budget || 0) * numValue / 100;
      onUpdate({ moe_fee_percentage: numValue, moe_fee_amount: amount });
    }
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
                Définissez les honoraires globaux et leur répartition dans le groupement
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
            <Label className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              Taux d'honoraires global
            </Label>
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
                    Modifiez les pourcentages des cotraitants pour répartir les honoraires
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {teamFeeDistribution.isOverBudget && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Dépassement
                    </Badge>
                  )}
                  <Badge variant="outline" className="font-mono">
                    Total : {formatCurrency(feeAmount)}
                  </Badge>
                </div>
              </div>

              {/* Progress bar showing used percentage */}
              {teamFeeDistribution.cotraitants.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Budget utilisé par les cotraitants</span>
                    <span className={cn(
                      "font-medium",
                      teamFeeDistribution.isOverBudget ? "text-destructive" : "text-foreground"
                    )}>
                      {teamFeeDistribution.totalPartnerPercentage.toFixed(1)}% / 100%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(teamFeeDistribution.totalPartnerPercentage, 100)} 
                    className={cn(
                      "h-2",
                      teamFeeDistribution.isOverBudget && "[&>div]:bg-destructive"
                    )}
                  />
                  <p className={cn(
                    "text-xs",
                    teamFeeDistribution.isOverBudget ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {teamFeeDistribution.isOverBudget 
                      ? `Dépassement de ${(teamFeeDistribution.totalPartnerPercentage - 100).toFixed(1)}% - Réduisez les pourcentages des cotraitants`
                      : `Restant pour le mandataire : ${teamFeeDistribution.remainingForMandataire.toFixed(1)}%`
                    }
                  </p>
                </div>
              )}

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
                          <Users className="h-5 w-5 text-primary" />
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

                    {/* Cotraitants cards - EDITABLE */}
                    {teamFeeDistribution.partnerAmounts.map(({ member, percentage, amount, hasChanged }, idx) => {
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
                            "flex items-center justify-between p-4 rounded-xl border transition-all",
                            bgColors[idx % bgColors.length],
                            hasChanged && "ring-2 ring-primary/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">Cotraitant</Badge>
                                {member.specialty && (
                                  <Badge variant="secondary" className="text-xs">{member.specialty}</Badge>
                                )}
                                {hasChanged && (
                                  <Badge variant="default" className="text-xs bg-primary/80">Modifié</Badge>
                                )}
                              </div>
                              <p className="font-medium">{member.company?.name || member.contact?.name || 'Partenaire'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {/* Editable percentage input */}
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground sr-only">Pourcentage</Label>
                              <div className="relative w-24">
                                <Input
                                  type="number"
                                  value={memberFees[member.id] || '0'}
                                  onChange={(e) => handleMemberFeeChange(member.id, e.target.value)}
                                  step="0.5"
                                  min="0"
                                  max="100"
                                  className={cn(
                                    "pr-7 text-right font-medium h-9",
                                    hasChanged && "border-primary"
                                  )}
                                  disabled={isUpdating}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                              </div>
                            </div>
                            <div className="text-right min-w-[120px]">
                              <p className={cn("text-xl font-bold", textColors[idx % textColors.length])}>
                                {formatCurrency(amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* No cotraitants message */}
                    {teamFeeDistribution.partnerAmounts.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucun cotraitant dans l'équipe</p>
                        <p className="text-xs">Ajoutez des cotraitants dans l'onglet "Équipe confirmée" pour répartir les honoraires</p>
                      </div>
                    )}

                    {/* Save/Reset buttons */}
                    {teamFeeDistribution.partnerAmounts.length > 0 && onUpdateMemberFee && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleResetFees}
                          disabled={!hasUnsavedChanges || isUpdating}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Annuler
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveAllFees}
                          disabled={!hasUnsavedChanges || teamFeeDistribution.isOverBudget || isUpdating}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Enregistrer la répartition
                        </Button>
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

        {/* Info message */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 dark:text-blue-300">
            Modifiez les pourcentages de chaque cotraitant ci-dessus. Le mandataire reçoit automatiquement le pourcentage restant après déduction des cotraitants.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
