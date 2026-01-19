import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useInvoiceStats } from "@/hooks/useInvoices";
import { useAllMemberEmploymentInfo } from "@/hooks/useMemberEmploymentInfo";

export interface MonthlyData {
  month: string;
  monthLabel: string;
  ca: number;
  depenses: number;
  marge: number;
}

export interface ProjectFinancial {
  id: string;
  name: string;
  budget: number;
  consumed: number;
  margin: number;
  marginPercent: number;
}

export interface GlobalFinancials {
  // CA (Revenue)
  totalBudget: number;
  totalCAPrevu: number;
  totalCAFacture: number;
  totalCAEncaisse: number;
  totalCAEnAttente: number;
  
  // Expenses
  totalMasseSalariale: number;
  totalMasseSalarialeAnnuelle: number;
  totalAchats: number;
  totalDepenses: number;
  
  // Margins
  margeGlobale: number;
  margePercent: number;
  
  // By month (last 12)
  byMonth: MonthlyData[];
  
  // Top projects
  topProjetsByMargin: ProjectFinancial[];
  projectsInDanger: { id: string; name: string; alert: string }[];
  
  // Invoice stats
  tauxEncaissement: number;
  delaiMoyenPaiement: number;
  facturesEnRetard: number;
  montantEnRetard: number;
}

export function useGlobalFinancials() {
  const { activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id;
  
  const { data: invoiceStats } = useInvoiceStats();
  const { data: employmentData } = useAllMemberEmploymentInfo();

  return useQuery({
    queryKey: ['global-financials', workspaceId],
    queryFn: async (): Promise<GlobalFinancials> => {
      if (!workspaceId) throw new Error("No workspace");

      // Fetch projects with budgets
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, budget, status')
        .eq('workspace_id', workspaceId)
        .in('status', ['active', 'on_hold', 'completed']);

      // Fetch all purchases
      const { data: purchases } = await supabase
        .from('project_purchases')
        .select('project_id, amount_ttc, status')
        .eq('workspace_id', workspaceId);

      // Fetch time entries for cost calculation
      const { data: timeEntries } = await supabase
        .from('team_time_entries')
        .select('project_id, duration_minutes, hourly_rate')
        .eq('workspace_id', workspaceId);

      // Fetch invoices for monthly breakdown
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, total_ttc, amount_paid, invoice_date, paid_at, status')
        .eq('workspace_id', workspaceId)
        .neq('document_type', 'credit_note');

      // Calculate totals
      const totalBudget = (projects || []).reduce((sum, p) => sum + (p.budget || 0), 0);
      
      // Calculate masse salariale mensuelle from employment data
      const totalMasseSalariale = (employmentData || []).reduce((sum, e) => sum + (e.salary_monthly || 0), 0);
      const totalMasseSalarialeAnnuelle = totalMasseSalariale * 12;

      // Calculate purchases total
      const totalAchats = (purchases || [])
        .filter(p => p.status !== 'cancelled')
        .reduce((sum, p) => sum + (p.amount_ttc || 0), 0);

      // Calculate time costs per project
      const timeByProject = new Map<string, number>();
      (timeEntries || []).forEach(te => {
        if (te.project_id) {
          const cost = (te.duration_minutes / 60) * (te.hourly_rate || 0);
          timeByProject.set(te.project_id, (timeByProject.get(te.project_id) || 0) + cost);
        }
      });

      // Purchases by project
      const purchasesByProject = new Map<string, number>();
      (purchases || []).forEach(p => {
        if (p.project_id && p.status !== 'cancelled') {
          purchasesByProject.set(p.project_id, (purchasesByProject.get(p.project_id) || 0) + (p.amount_ttc || 0));
        }
      });

      // Calculate project financials
      const projectFinancials: ProjectFinancial[] = (projects || []).map(p => {
        const timeCost = timeByProject.get(p.id) || 0;
        const purchaseCost = purchasesByProject.get(p.id) || 0;
        const consumed = timeCost + purchaseCost;
        const margin = (p.budget || 0) - consumed;
        const marginPercent = p.budget ? (margin / p.budget) * 100 : 0;
        
        return {
          id: p.id,
          name: p.name,
          budget: p.budget || 0,
          consumed,
          margin,
          marginPercent,
        };
      });

      // Top projects by margin
      const topProjetsByMargin = [...projectFinancials]
        .filter(p => p.budget > 0)
        .sort((a, b) => b.marginPercent - a.marginPercent)
        .slice(0, 5);

      // Projects in danger (negative margin or > 90% consumed)
      const projectsInDanger = projectFinancials
        .filter(p => p.budget > 0 && (p.marginPercent < 10 || p.consumed > p.budget))
        .map(p => ({
          id: p.id,
          name: p.name,
          alert: p.consumed > p.budget 
            ? `Dépassement de ${((p.consumed / p.budget - 1) * 100).toFixed(0)}%`
            : `Marge faible: ${p.marginPercent.toFixed(0)}%`,
        }));

      // Monthly breakdown (last 12 months)
      const now = new Date();
      const byMonth: MonthlyData[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        
        const monthInvoices = (invoices || []).filter(inv => {
          const invDate = new Date(inv.invoice_date);
          return invDate.getFullYear() === date.getFullYear() && invDate.getMonth() === date.getMonth();
        });
        
        const ca = monthInvoices.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0);
        // Simplified: depenses = masse salariale / 12 (proportional)
        const depenses = totalMasseSalariale;
        
        byMonth.push({
          month: monthKey,
          monthLabel,
          ca,
          depenses,
          marge: ca - depenses,
        });
      }

      // Invoice-based metrics
      const totalCAFacture = invoiceStats?.totalAmount || 0;
      const totalCAEncaisse = invoiceStats?.paidAmount || 0;
      const totalCAEnAttente = invoiceStats?.pendingAmount || 0;
      const facturesEnRetard = invoiceStats?.overdue || 0;
      const montantEnRetard = invoiceStats?.overdueAmount || 0;
      const delaiMoyenPaiement = invoiceStats?.averagePaymentDays || 0;
      
      const tauxEncaissement = totalCAFacture > 0 
        ? (totalCAEncaisse / totalCAFacture) * 100 
        : 0;

      const totalDepenses = totalMasseSalariale + totalAchats;
      const margeGlobale = totalCAEncaisse - totalDepenses;
      const margePercent = totalCAEncaisse > 0 ? (margeGlobale / totalCAEncaisse) * 100 : 0;

      return {
        totalBudget,
        totalCAPrevu: totalBudget,
        totalCAFacture,
        totalCAEncaisse,
        totalCAEnAttente,
        totalMasseSalariale,
        totalMasseSalarialeAnnuelle,
        totalAchats,
        totalDepenses,
        margeGlobale,
        margePercent,
        byMonth,
        topProjetsByMargin,
        projectsInDanger,
        tauxEncaissement,
        delaiMoyenPaiement,
        facturesEnRetard,
        montantEnRetard,
      };
    },
    enabled: !!workspaceId,
  });
}
