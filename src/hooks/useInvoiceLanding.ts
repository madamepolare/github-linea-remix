import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth, addMonths, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export interface InvoiceLandingMonth {
  month: string;
  fullMonth: string;
  date: Date;
  drafts: number;
  draftsCount: number;
  pending: number;
  pendingCount: number;
  sent: number;
  sentCount: number;
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

      // Fetch unpaid invoices (drafts, pending, sent)
      const { data, error } = await supabase
        .from("invoices")
        .select("id, status, total_ttc, due_date, invoice_date, invoice_type")
        .eq("workspace_id", activeWorkspace.id)
        .in("status", ["draft", "pending", "sent"])
        .neq("invoice_type", "credit_note")
        .gte("due_date", startDate.toISOString())
        .lte("due_date", endDate.toISOString())
        .order("due_date", { ascending: true });

      if (error) throw error;

      // Group by month
      const months: InvoiceLandingMonth[] = [];
      
      for (let i = 0; i < monthsAhead; i++) {
        const monthDate = addMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthInvoices = (data || []).filter(inv => {
          if (!inv.due_date) return false;
          const dueDate = parseISO(inv.due_date);
          return dueDate >= monthStart && dueDate <= monthEnd;
        });

        const drafts = monthInvoices.filter(i => i.status === "draft");
        const pending = monthInvoices.filter(i => i.status === "pending");
        const sent = monthInvoices.filter(i => i.status === "sent");

        const draftsAmount = drafts.reduce((sum, i) => sum + (i.total_ttc || 0), 0);
        const pendingAmount = pending.reduce((sum, i) => sum + (i.total_ttc || 0), 0);
        const sentAmount = sent.reduce((sum, i) => sum + (i.total_ttc || 0), 0);

        months.push({
          month: format(monthDate, "MMM", { locale: fr }),
          fullMonth: format(monthDate, "MMMM yyyy", { locale: fr }),
          date: monthDate,
          drafts: Math.round(draftsAmount),
          draftsCount: drafts.length,
          pending: Math.round(pendingAmount),
          pendingCount: pending.length,
          sent: Math.round(sentAmount),
          sentCount: sent.length,
          total: Math.round(draftsAmount + pendingAmount + sentAmount),
          totalCount: monthInvoices.length,
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

      const { data, error } = await supabase
        .from("invoices")
        .select("id, status, total_ttc, due_date")
        .eq("workspace_id", activeWorkspace.id)
        .in("status", ["draft", "pending", "sent"])
        .neq("invoice_type", "credit_note");

      if (error) throw error;

      const invoices = data || [];
      const drafts = invoices.filter(i => i.status === "draft");
      const pending = invoices.filter(i => i.status === "pending");
      const sent = invoices.filter(i => i.status === "sent");

      const totalProjected = invoices.reduce((sum, i) => sum + (i.total_ttc || 0), 0);
      const draftsTotal = drafts.reduce((sum, i) => sum + (i.total_ttc || 0), 0);
      const confirmedTotal = [...pending, ...sent].reduce((sum, i) => sum + (i.total_ttc || 0), 0);

      // Find peak month
      const now = new Date();
      const monthTotals: Record<string, number> = {};
      invoices.forEach(inv => {
        if (inv.due_date) {
          const monthKey = format(parseISO(inv.due_date), "yyyy-MM");
          monthTotals[monthKey] = (monthTotals[monthKey] || 0) + (inv.total_ttc || 0);
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
        draftsTotal,
        draftsCount: drafts.length,
        confirmedTotal,
        confirmedCount: pending.length + sent.length,
        totalCount: invoices.length,
        peakMonth: peakMonth ? format(parseISO(peakMonth + "-01"), "MMMM yyyy", { locale: fr }) : null,
        peakAmount,
      };
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 5 * 60 * 1000,
  });
}
