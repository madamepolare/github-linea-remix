import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useInvoiceSchedule } from "./useInvoiceSchedule";
import { useBillableTime } from "./useBillableTime";
import { useProjectBudgetHistory } from "./useProjectBudgetHistory";

export interface FinancialAlert {
  type: 'warning' | 'error' | 'info';
  code: 'ca_over_budget' | 'overdue_invoices' | 'low_margin' | 'budget_exceeded';
  message: string;
  value?: number;
}

export interface ProjectFinancialSummary {
  // Budget
  initialBudget: number;
  currentBudget: number;
  budgetIncrease: number;
  budgetDecrease: number;
  
  // CA (Chiffre d'affaires prévu)
  totalCAPrevu: number;
  caFacture: number;
  caEncaisse: number;
  caEnAttente: number;
  
  // Invoices
  invoicesCount: number;
  invoicesPaidCount: number;
  invoicesPendingCount: number;
  overdueAmount: number;
  
  // Consommation (time & purchases)
  tempsConsomme: number;
  achatsConsommes: number;
  totalConsomme: number;
  
  // Marges
  margePrevisionnelle: number;
  margeReelle: number;
  margePrevisionnellePercent: number;
  margeReellePercent: number;
  
  // Écarts
  ecartCABudget: number;
  ecartCABudgetPercent: number;
  
  // Alerts
  alerts: FinancialAlert[];
  
  // Loading state
  isLoading: boolean;
}

export function useProjectFinancialSummary(projectId: string): ProjectFinancialSummary {
  const { activeWorkspace } = useAuth();
  
  // Get project data (budget)
  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ["project-financial", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, budget")
        .eq("id", projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Get invoice schedule data
  const { scheduleItems, summary: scheduleSummary, overdueItems, isLoading: isScheduleLoading } = useInvoiceSchedule(projectId);
  
  // Get budget history
  const { history, totals: budgetTotals, isLoading: isBudgetHistoryLoading } = useProjectBudgetHistory(projectId);
  
  // Get billable time
  const { summary: timeSummary, isLoading: isTimeLoading } = useBillableTime(projectId);
  
  // Get purchases
  const { data: purchases = [], isLoading: isPurchasesLoading } = useQuery({
    queryKey: ["project-purchases-financial", projectId],
    queryFn: async () => {
      if (!activeWorkspace?.id || !projectId) return [];
      
      const { data, error } = await supabase
        .from("project_purchases")
        .select("amount_ttc, status")
        .eq("project_id", projectId)
        .eq("workspace_id", activeWorkspace.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkspace?.id && !!projectId,
  });

  const isLoading = isProjectLoading || isScheduleLoading || isBudgetHistoryLoading || isTimeLoading || isPurchasesLoading;

  // Calculate values
  const currentBudget = project?.budget || 0;
  const initialBudget = currentBudget - (budgetTotals?.totalIncrease || 0) + (budgetTotals?.totalDecrease || 0);
  
  const totalCAPrevu = scheduleSummary.totalAmountHt;
  const caFacture = scheduleSummary.invoicedAmountHt;
  const caEncaisse = scheduleSummary.paidAmountHt;
  const caEnAttente = scheduleSummary.pendingAmountHt;
  
  const tempsConsomme = timeSummary?.totalAmount || 0;
  const achatsConsommes = purchases.reduce((sum, p) => sum + (p.amount_ttc || 0), 0);
  const totalConsomme = tempsConsomme + achatsConsommes;
  
  const margePrevisionnelle = currentBudget - totalCAPrevu;
  const margeReelle = caEncaisse - totalConsomme;
  const margePrevisionnellePercent = currentBudget > 0 ? (margePrevisionnelle / currentBudget) * 100 : 0;
  const margeReellePercent = caEncaisse > 0 ? (margeReelle / caEncaisse) * 100 : 0;
  
  const ecartCABudget = totalCAPrevu - currentBudget;
  const ecartCABudgetPercent = currentBudget > 0 ? (ecartCABudget / currentBudget) * 100 : 0;
  
  const overdueAmount = overdueItems.reduce((sum, item) => sum + item.amount_ht, 0);

  // Generate alerts
  const alerts: FinancialAlert[] = [];
  
  if (totalCAPrevu > currentBudget) {
    alerts.push({
      type: 'warning',
      code: 'ca_over_budget',
      message: `Le CA prévu dépasse le budget de ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(ecartCABudget)}`,
      value: ecartCABudget,
    });
  }
  
  if (overdueItems.length > 0) {
    alerts.push({
      type: 'error',
      code: 'overdue_invoices',
      message: `${overdueItems.length} échéance(s) en retard pour un total de ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(overdueAmount)}`,
      value: overdueAmount,
    });
  }
  
  if (margePrevisionnellePercent < 10 && totalCAPrevu > 0) {
    alerts.push({
      type: 'warning',
      code: 'low_margin',
      message: `Marge prévisionnelle faible (${margePrevisionnellePercent.toFixed(1)}%)`,
      value: margePrevisionnellePercent,
    });
  }
  
  if (totalConsomme > currentBudget && currentBudget > 0) {
    alerts.push({
      type: 'error',
      code: 'budget_exceeded',
      message: `Les dépenses dépassent le budget de ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(totalConsomme - currentBudget)}`,
      value: totalConsomme - currentBudget,
    });
  }

  return {
    initialBudget,
    currentBudget,
    budgetIncrease: budgetTotals?.totalIncrease || 0,
    budgetDecrease: budgetTotals?.totalDecrease || 0,
    
    totalCAPrevu,
    caFacture,
    caEncaisse,
    caEnAttente,
    
    invoicesCount: scheduleSummary.count,
    invoicesPaidCount: scheduleSummary.paidCount,
    invoicesPendingCount: scheduleSummary.pendingCount,
    overdueAmount,
    
    tempsConsomme,
    achatsConsommes,
    totalConsomme,
    
    margePrevisionnelle,
    margeReelle,
    margePrevisionnellePercent,
    margeReellePercent,
    
    ecartCABudget,
    ecartCABudgetPercent,
    
    alerts,
    isLoading,
  };
}
