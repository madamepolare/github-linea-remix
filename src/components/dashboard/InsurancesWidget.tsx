import { motion } from "framer-motion";
import { format, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Shield, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Insurance {
  id: string;
  project_id: string;
  insurance_type: string;
  insurer_name: string;
  end_date?: string;
  status: string;
  project?: {
    name: string;
  };
}

interface InsurancesWidgetProps {
  insurances: Insurance[];
  isLoading?: boolean;
}

const insuranceTypeLabels: Record<string, string> = {
  decennale: "Décennale",
  do: "Dommages-ouvrage",
  rc_pro: "RC Pro",
  trc: "TRC",
  cns: "CNS",
  puc: "PUC",
  other: "Autre",
};

export function InsurancesWidget({ insurances, isLoading }: InsurancesWidgetProps) {
  const navigate = useNavigate();

  // Filter insurances expiring soon (within 90 days)
  const expiringInsurances = insurances
    .filter((ins) => {
      if (!ins.end_date || ins.status !== "active") return false;
      const endDate = new Date(ins.end_date);
      const daysUntil = differenceInDays(endDate, new Date());
      return daysUntil <= 90;
    })
    .sort((a, b) => {
      const dateA = a.end_date ? new Date(a.end_date).getTime() : Infinity;
      const dateB = b.end_date ? new Date(b.end_date).getTime() : Infinity;
      return dateA - dateB;
    })
    .slice(0, 4);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="rounded-xl border border-border bg-card"
      >
        <div className="p-6">
          <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-500" strokeWidth={1.5} />
          <h3 className="font-display text-lg font-semibold text-foreground">
            Assurances à renouveler
          </h3>
        </div>
        <Button variant="ghost" size="sm" className="text-primary">
          Voir tout
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="p-4">
        {expiringInsurances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Shield className="h-10 w-10 text-muted-foreground mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              Aucune assurance à renouveler prochainement
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {expiringInsurances.map((insurance, index) => {
              const endDate = insurance.end_date ? new Date(insurance.end_date) : null;
              const daysUntil = endDate ? differenceInDays(endDate, new Date()) : null;
              const isOverdue = endDate && isPast(endDate);
              const isUrgent = daysUntil !== null && daysUntil <= 30;

              return (
                <motion.div
                  key={insurance.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50",
                    isOverdue
                      ? "border-destructive/30 bg-destructive/5"
                      : isUrgent
                      ? "border-warning/30 bg-warning/5"
                      : "border-border"
                  )}
                  onClick={() => navigate(`/projects/${insurance.project_id}?tab=insurances`)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center",
                        isOverdue
                          ? "bg-destructive/10"
                          : isUrgent
                          ? "bg-warning/10"
                          : "bg-emerald-500/10"
                      )}
                    >
                      {isOverdue ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" strokeWidth={1.5} />
                      ) : (
                        <Shield className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {insuranceTypeLabels[insurance.insurance_type] || insurance.insurance_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {insurance.insurer_name} • {insurance.project?.name || "Projet"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {endDate && (
                      <>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isOverdue
                              ? "text-destructive"
                              : isUrgent
                              ? "text-warning"
                              : "text-foreground"
                          )}
                        >
                          {isOverdue
                            ? "Expiré"
                            : daysUntil === 0
                            ? "Aujourd'hui"
                            : `${daysUntil}j`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(endDate, "d MMM yyyy", { locale: fr })}
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
