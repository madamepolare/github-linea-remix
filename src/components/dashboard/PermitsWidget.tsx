import { motion } from "framer-motion";
import { format, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { FileCheck, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Permit {
  id: string;
  project_id: string;
  permit_type: string;
  reference_number?: string;
  status: string;
  expected_response_date?: string;
  validity_end_date?: string;
  project?: {
    name: string;
  };
}

interface PermitsWidgetProps {
  permits: Permit[];
  isLoading?: boolean;
}

const permitTypeLabels: Record<string, string> = {
  pc: "Permis de construire",
  dp: "Déclaration préalable",
  pa: "Permis d'aménager",
  pd: "Permis de démolir",
  at: "Autorisation ERP",
  erp: "Commission ERP",
  abf: "ABF",
  icpe: "ICPE",
  other: "Autre",
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  preparing: "En préparation",
  submitted: "Déposé",
  pending: "En instruction",
  additional_info_requested: "Pièces demandées",
  granted: "Accordé",
  rejected: "Refusé",
  expired: "Expiré",
  withdrawn: "Retiré",
};

export function PermitsWidget({ permits, isLoading }: PermitsWidgetProps) {
  const navigate = useNavigate();

  // Filter permits with upcoming deadlines
  const upcomingPermits = permits
    .filter((p) => {
      const responseDate = p.expected_response_date ? new Date(p.expected_response_date) : null;
      const validityDate = p.validity_end_date ? new Date(p.validity_end_date) : null;
      const hasUpcoming = 
        (responseDate && differenceInDays(responseDate, new Date()) <= 30) ||
        (validityDate && differenceInDays(validityDate, new Date()) <= 60);
      return hasUpcoming && p.status !== "granted" && p.status !== "rejected";
    })
    .slice(0, 4);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-xl border border-border bg-card"
      >
        <div className="p-6">
          <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
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
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <h3 className="font-display text-lg font-semibold text-foreground">
            Échéances Permis
          </h3>
        </div>
        <Button variant="ghost" size="sm" className="text-primary">
          Voir tout
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="p-4">
        {upcomingPermits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileCheck className="h-10 w-10 text-muted-foreground mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              Aucune échéance à venir
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingPermits.map((permit, index) => {
              const responseDate = permit.expected_response_date
                ? new Date(permit.expected_response_date)
                : null;
              const validityDate = permit.validity_end_date
                ? new Date(permit.validity_end_date)
                : null;
              const relevantDate = responseDate || validityDate;
              const daysUntil = relevantDate
                ? differenceInDays(relevantDate, new Date())
                : null;
              const isOverdue = relevantDate && isPast(relevantDate);
              const isUrgent = daysUntil !== null && daysUntil <= 7;

              return (
                <motion.div
                  key={permit.id}
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
                  onClick={() => navigate(`/projects/${permit.project_id}?tab=permits`)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center",
                        isOverdue
                          ? "bg-destructive/10"
                          : isUrgent
                          ? "bg-warning/10"
                          : "bg-primary/10"
                      )}
                    >
                      {isOverdue ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" strokeWidth={1.5} />
                      ) : (
                        <Clock className="h-4 w-4 text-primary" strokeWidth={1.5} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {permitTypeLabels[permit.permit_type] || permit.permit_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {permit.project?.name || "Projet"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {relevantDate && (
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
                            ? "En retard"
                            : daysUntil === 0
                            ? "Aujourd'hui"
                            : `${daysUntil}j`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(relevantDate, "d MMM", { locale: fr })}
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
