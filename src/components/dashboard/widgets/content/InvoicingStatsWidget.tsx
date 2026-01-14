import { Receipt, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { StatsWidget } from "./StatsWidget";
import { useInvoiceStats } from "@/hooks/useInvoices";

export function InvoicingStatsWidget() {
  const { data: stats, isLoading } = useInvoiceStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate change percentage for paid this month vs last month
  const paidChangePercent = stats?.lastMonthPaidAmount && stats.lastMonthPaidAmount > 0
    ? Math.round(((stats.thisMonthPaidAmount - stats.lastMonthPaidAmount) / stats.lastMonthPaidAmount) * 100)
    : undefined;

  const statsData = [
    {
      label: "En attente",
      value: formatCurrency(stats?.pendingAmount ?? 0),
      change: stats?.pending,
      icon: Clock,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "Payées ce mois",
      value: formatCurrency(stats?.thisMonthPaidAmount ?? 0),
      change: paidChangePercent,
      icon: CheckCircle,
      color: "bg-success/10 text-success",
    },
    {
      label: "En retard",
      value: formatCurrency(stats?.overdueAmount ?? 0),
      change: stats?.overdue,
      icon: AlertTriangle,
      color: "bg-destructive/10 text-destructive",
    },
    {
      label: "Total émis",
      value: formatCurrency(stats?.totalAmount ?? 0),
      change: stats?.total,
      icon: Receipt,
      color: "bg-info/10 text-info",
    },
  ];

  return <StatsWidget stats={statsData} isLoading={isLoading} columns={4} />;
}
