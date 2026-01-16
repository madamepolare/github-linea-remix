import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceLandingMonth } from "@/hooks/useInvoiceLanding";

interface InvoiceLandingChartProps {
  data: InvoiceLandingMonth[];
  isLoading: boolean;
}

export function InvoiceLandingChart({ data, isLoading }: InvoiceLandingChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M €`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k €`;
    return `${value} €`;
  };

  const chartData = useMemo(() => {
    return data.map(month => ({
      ...month,
      // Combine pending invoices for chart display
      confirmed: month.pending,
      confirmedCount: month.pendingCount,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-[300px] flex flex-col gap-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="flex-1" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Aucune facture prévisionnelle
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={formatCurrency}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 500, marginBottom: 4 }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                scheduled: "Échéances projets",
                drafts: "Brouillons",
                confirmed: "En attente / Envoyées",
              };
              return [formatCurrency(value), labels[name] || name];
            }}
            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullMonth || label}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                scheduled: "Échéances projets",
                drafts: "Brouillons",
                confirmed: "Factures en attente",
              };
              return labels[value] || value;
            }}
          />
          <Bar
            dataKey="scheduled"
            stackId="a"
            fill="hsl(var(--warning))"
            radius={[0, 0, 0, 0]}
            opacity={0.8}
          />
          <Bar
            dataKey="drafts"
            stackId="a"
            fill="hsl(var(--muted-foreground))"
            radius={[0, 0, 0, 0]}
            opacity={0.6}
          />
          <Bar
            dataKey="confirmed"
            stackId="a"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
