import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

export function RevenueChartWidget() {
  const { activeWorkspace } = useAuth();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["revenue-chart", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const sixMonthsAgo = subMonths(new Date(), 5);

      const { data, error } = await supabase
        .from("invoices")
        .select("id, total_ttc, invoice_date, status, paid_at")
        .eq("workspace_id", activeWorkspace.id)
        .gte("invoice_date", startOfMonth(sixMonthsAgo).toISOString())
        .order("invoice_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 5 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    const months: { month: string; fullMonth: string; revenue: number; paid: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthInvoices = invoices?.filter(inv => {
        const invDate = new Date(inv.invoice_date);
        return invDate >= monthStart && invDate <= monthEnd;
      }) || [];

      const revenue = monthInvoices.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0);
      const paid = monthInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total_ttc || 0), 0);

      months.push({
        month: format(date, "MMM", { locale: fr }),
        fullMonth: format(date, "MMMM yyyy", { locale: fr }),
        revenue: Math.round(revenue),
        paid: Math.round(paid),
      });
    }
    
    return months;
  }, [invoices]);

  const totalRevenue = chartData.reduce((sum, m) => sum + m.revenue, 0);
  const totalPaid = chartData.reduce((sum, m) => sum + m.paid, 0);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M €`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k €`;
    return `${value} €`;
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col gap-3">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="flex-1" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="text-2xl font-semibold tabular-nums">{formatCurrency(totalRevenue)}</span>
          <span className="text-xs text-muted-foreground ml-2">facturé (6 mois)</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-success tabular-nums">{formatCurrency(totalPaid)}</span>
          <span className="text-xs text-muted-foreground ml-1">encaissé</span>
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              dy={8}
            />
            <YAxis 
              hide 
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'revenue' ? 'Facturé' : 'Encaissé'
              ]}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullMonth || label}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
            <Area
              type="monotone"
              dataKey="paid"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              fill="url(#paidGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
