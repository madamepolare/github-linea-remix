import { useState } from "react";
import { Check, Minus, Trash2, Calendar, Building2, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import type { TenderDeliverable, TenderTeamMember } from "@/lib/tenderTypes";

interface DeliverableMemberGridProps {
  deliverables: TenderDeliverable[];
  teamMembers: TenderTeamMember[];
  onToggleMemberComplete: (deliverableId: string, companyId: string, currentValue: boolean) => void;
  onDelete: (deliverableId: string) => void;
}

export function DeliverableMemberGrid({
  deliverables,
  teamMembers,
  onToggleMemberComplete,
  onDelete,
}: DeliverableMemberGridProps) {
  const [celebratedDeliverables, setCelebratedDeliverables] = useState<string[]>([]);

  // Get unique companies from team (mandataire first, then cotraitants)
  const companies = teamMembers
    .filter(m => m.company?.id)
    .reduce((acc, m) => {
      if (!acc.find(c => c.id === m.company?.id)) {
        acc.push({
          id: m.company!.id,
          name: m.company!.name,
          role: m.role,
          isMandataire: m.role === "mandataire",
        });
      }
      return acc;
    }, [] as { id: string; name: string; role: string; isMandataire: boolean }[])
    .sort((a, b) => (a.isMandataire ? -1 : b.isMandataire ? 1 : 0));

  // Calculate if a company should have a checkbox for this deliverable
  const shouldHaveCheckbox = (deliverable: TenderDeliverable, companyId: string, isMandataire: boolean) => {
    switch (deliverable.responsible_type) {
      case "mandataire":
        return isMandataire;
      case "tous":
        return true;
      case "cotraitant":
        return !isMandataire;
      default:
        return true;
    }
  };

  // Check if deliverable is complete (all concerned members checked)
  const isDeliverableComplete = (deliverable: TenderDeliverable) => {
    const memberCompletion = (deliverable.member_completion || {}) as Record<string, boolean>;
    
    for (const company of companies) {
      if (shouldHaveCheckbox(deliverable, company.id, company.isMandataire)) {
        if (!memberCompletion[company.id]) {
          return false;
        }
      }
    }
    return companies.length > 0;
  };

  // Calculate progress per company
  const getCompanyProgress = (companyId: string, isMandataire: boolean) => {
    let total = 0;
    let completed = 0;

    for (const d of deliverables) {
      if (shouldHaveCheckbox(d, companyId, isMandataire)) {
        total++;
        const memberCompletion = (d.member_completion || {}) as Record<string, boolean>;
        if (memberCompletion[companyId]) {
          completed++;
        }
      }
    }

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleToggle = (deliverable: TenderDeliverable, companyId: string) => {
    const memberCompletion = (deliverable.member_completion || {}) as Record<string, boolean>;
    const currentValue = memberCompletion[companyId] || false;
    
    onToggleMemberComplete(deliverable.id, companyId, currentValue);

    // Check if this will complete the deliverable
    if (!currentValue) {
      const newCompletion = { ...memberCompletion, [companyId]: true };
      const willBeComplete = companies.every(company => {
        if (shouldHaveCheckbox(deliverable, company.id, company.isMandataire)) {
          return newCompletion[company.id];
        }
        return true;
      });

      if (willBeComplete && !celebratedDeliverables.includes(deliverable.id)) {
        setCelebratedDeliverables(prev => [...prev, deliverable.id]);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#22c55e", "#16a34a", "#15803d"],
        });
      }
    }
  };

  const getTypeBadge = (type: string) => {
    const candidatureTypes = ["dc1", "dc2", "dc4", "urssaf", "kbis", "attestation_fiscale", "attestation_assurance", "references", "cv", "habilitations"];
    const isCandidature = candidatureTypes.includes(type);
    
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "text-[10px] h-5",
          isCandidature 
            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"
            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
        )}
      >
        {isCandidature ? "Cand." : "Offre"}
      </Badge>
    );
  };

  if (companies.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Ajoutez des membres à l'équipe pour activer le suivi multi-colonnes</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress per member */}
      <Card className="p-4">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(companies.length, 4)}, 1fr)` }}>
          {companies.map(company => {
            const progress = getCompanyProgress(company.id, company.isMandataire);
            return (
              <div key={company.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate flex items-center gap-1.5">
                    {company.isMandataire && (
                      <Badge variant="default" className="h-4 text-[9px] px-1">M</Badge>
                    )}
                    {company.name}
                  </span>
                  <span className={cn(
                    "text-xs font-bold",
                    progress === 100 ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {progress}%
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className={cn(
                    "h-2",
                    progress === 100 && "[&>div]:bg-green-500"
                  )} 
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Main grid table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">✓</TableHead>
              <TableHead className="min-w-[200px]">Livrable</TableHead>
              <TableHead className="w-16">Type</TableHead>
              {companies.map(company => (
                <TableHead key={company.id} className="w-24 text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs font-medium truncate max-w-[80px]">
                            {company.name.length > 10 ? company.name.slice(0, 10) + "…" : company.name}
                          </span>
                          {company.isMandataire && (
                            <Badge variant="secondary" className="h-4 text-[9px] px-1">
                              Mandataire
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{company.name}</p>
                        <p className="text-xs text-muted-foreground">{company.role}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              ))}
              <TableHead className="w-16">Échéance</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {deliverables.map((deliverable) => {
                const isComplete = isDeliverableComplete(deliverable);
                const memberCompletion = (deliverable.member_completion || {}) as Record<string, boolean>;

                return (
                  <motion.tr
                    key={deliverable.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={cn(
                      "border-b transition-colors",
                      isComplete && "bg-green-50/50 dark:bg-green-950/10"
                    )}
                  >
                    <TableCell>
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-medium",
                        isComplete && "text-green-700 dark:text-green-400"
                      )}>
                        {deliverable.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(deliverable.deliverable_type)}
                    </TableCell>
                    {companies.map(company => {
                      const hasCheckbox = shouldHaveCheckbox(deliverable, company.id, company.isMandataire);
                      const isChecked = memberCompletion[company.id] || false;

                      return (
                        <TableCell key={company.id} className="text-center">
                          {hasCheckbox ? (
                            <div className="flex justify-center">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleToggle(deliverable, company.id)}
                                className={cn(
                                  "h-5 w-5 transition-all",
                                  isChecked && "bg-green-600 border-green-600 data-[state=checked]:bg-green-600"
                                )}
                              />
                            </div>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Non concerné</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      {deliverable.due_date ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(deliverable.due_date), "d MMM", { locale: fr })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(deliverable.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>Complet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Circle className="h-4 w-4" />
          <span>En cours</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Minus className="h-4 w-4 text-muted-foreground/40" />
          <span>Non concerné</span>
        </div>
      </div>
    </div>
  );
}
