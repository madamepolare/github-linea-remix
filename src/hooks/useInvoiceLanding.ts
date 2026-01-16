import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth, addMonths, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export interface InvoiceLandingMonth {
  month: string;
  fullMonth: string;
  date: Date;
  // Échéances projets (pas encore facturées)
  scheduled: number;
  scheduledCount: number;
  // Factures brouillons
  drafts: number;
  draftsCount: number;
  // Factures en attente/envoyées
  pending: number;
  pendingCount: number;
  total: number;
  totalCount: number;
}

export function useInvoiceLanding(monthsAhead: number = 12) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["invoice-landing", activeWorkspace?.id, monthsAhead],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const now = new Date();
      const startDate = startOfMonth(now);
      const endDate = endOfMonth(addMonths(now, monthsAhead - 1));

      // Fetch in parallel: invoices and scheduled items
      const [invoicesResult, scheduleResult] = await Promise.all([
        // Fetch unpaid invoices (drafts, pending, sent)
        supabase
          .from("invoices")
          .select("id, status, total_ttc, due_date, invoice_type")
          .eq("workspace_id", activeWorkspace.id)
          .in("status", ["draft", "pending", "sent"])
          .neq("invoice_type", "credit_note")
          .gte("due_date", startDate.toISOString())
          .lte("due_date", endDate.toISOString()),
        
        // Fetch scheduled items not yet invoiced
        supabase
          .from("invoice_schedule")
          .select("id, amount_ttc, planned_date, status, invoice_id")
          .eq("workspace_id", activeWorkspace.id)
          .is("invoice_id", null) // Not yet converted to invoice
          .in("status", ["pending", "upcoming"])
          .gte("planned_date", startDate.toISOString().split("T")[0])
          .lte("planned_date", endDate.toISOString().split("T")[0]),
      ]);

      if (invoicesResult.error) throw invoicesResult.error;
      if (scheduleResult.error) throw scheduleResult.error;

      const invoices = invoicesResult.data || [];
      const scheduleItems = scheduleResult.data || [];

      // Group by month
      const months: InvoiceLandingMonth[] = [];
      
      for (let i = 0; i < monthsAhead; i++) {
        const monthDate = addMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        // Filter invoices for this month
        const monthInvoices = invoices.filter(inv => {
          if (!inv.due_date) return false;
          const dueDate = parseISO(inv.due_date);
          return dueDate >= monthStart && dueDate <= monthEnd;
        });

        // Filter schedule items for this month
        const monthSchedule = scheduleItems.filter(item => {
          if (!item.planned_date) return false;
          const plannedDate = parseISO(item.planned_date);
          return plannedDate >= monthStart && plannedDate <= monthEnd;
        });

        const drafts = monthInvoices.filter(i => i.status === "draft");
        const pendingInvoices = monthInvoices.filter(i => i.status === "pending" || i.status === "sent");

        const scheduledAmount = monthSchedule.reduce((sum, i) => sum + (i.amount_ttc || 0), 0);
        const draftsAmount = drafts.reduce((sum, i) => sum + (i.total_ttc || 0), 0);
        const pendingAmount = pendingInvoices.reduce((sum, i) => sum + (i.total_ttc || 0), 0);

        months.push({
          month: format(monthDate, "MMM", { locale: fr }),
          fullMonth: format(monthDate, "MMMM yyyy", { locale: fr }),
          date: monthDate,
          scheduled: Math.round(scheduledAmount),
          scheduledCount: monthSchedule.length,
          drafts: Math.round(draftsAmount),
          draftsCount: drafts.length,
          pending: Math.round(pendingAmount),
          pendingCount: pendingInvoices.length,
          total: Math.round(scheduledAmount + draftsAmount + pendingAmount),
          totalCount: monthSchedule.length + monthInvoices.length,
        });
      }

      return months;
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInvoiceLandingStats() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["invoice-landing-stats", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return null;

      // Fetch both invoices and schedule items in parallel
      const [invoicesResult, scheduleResult] = await Promise.all([
        supabase
          .from("invoices")
          .select("id, status, total_ttc, due_date")
          .eq("workspace_id", activeWorkspace.id)
          .in("status", ["draft", "pending", "sent"])
          .neq("invoice_type", "credit_note"),
        
        supabase
          .from("invoice_schedule")
          .select("id, amount_ttc, planned_date, status, invoice_id")
          .eq("workspace_id", activeWorkspace.id)
          .is("invoice_id", null)
          .in("status", ["pending", "upcoming"]),
      ]);

      if (invoicesResult.error) throw invoicesResult.error;
      if (scheduleResult.error) throw scheduleResult.error;

      const invoices = invoicesResult.data || [];
      const scheduleItems = scheduleResult.data || [];

      const drafts = invoices.filter(i => i.status === "draft");
      const pendingInvoices = invoices.filter(i => i.status === "pending" || i.status === "sent");

      const scheduledTotal = scheduleItems.reduce((sum, i) => sum + (i.amount_ttc || 0), 0);
      const draftsTotal = drafts.reduce((sum, i) => sum + (i.total_ttc || 0), 0);
      const confirmedTotal = pendingInvoices.reduce((sum, i) => sum + (i.total_ttc || 0), 0);
      const totalProjected = scheduledTotal + draftsTotal + confirmedTotal;

      // Find peak month from all sources
      const monthTotals: Record<string, number> = {};
      
      invoices.forEach(inv => {
        if (inv.due_date) {
          const monthKey = format(parseISO(inv.due_date), "yyyy-MM");
          monthTotals[monthKey] = (monthTotals[monthKey] || 0) + (inv.total_ttc || 0);
        }
      });
      
      scheduleItems.forEach(item => {
        if (item.planned_date) {
          const monthKey = format(parseISO(item.planned_date), "yyyy-MM");
          monthTotals[monthKey] = (monthTotals[monthKey] || 0) + (item.amount_ttc || 0);
        }
      });

      let peakMonth = "";
      let peakAmount = 0;
      Object.entries(monthTotals).forEach(([month, amount]) => {
        if (amount > peakAmount) {
          peakMonth = month;
          peakAmount = amount;
        }
      });

      return {
        totalProjected,
        scheduledTotal,
        scheduledCount: scheduleItems.length,
        draftsTotal,
        draftsCount: drafts.length,
        confirmedTotal,
        confirmedCount: pendingInvoices.length,
        totalCount: invoices.length + scheduleItems.length,
        peakMonth: peakMonth ? format(parseISO(peakMonth + "-01"), "MMMM yyyy", { locale: fr }) : null,
        peakAmount,
      };
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 5 * 60 * 1000,
  });
}
