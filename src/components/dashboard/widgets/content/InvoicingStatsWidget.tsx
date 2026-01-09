import { Receipt, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { StatsWidget } from "./StatsWidget";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export function InvoicingStatsWidget() {
  const { data: stats, isLoading } = useDashboardStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statsData = [
    {
      label: "En attente",
      value: formatCurrency(stats?.pendingInvoicesAmount ?? 0),
      change: stats?.pendingInvoicesChange,
      icon: Clock,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "Payées ce mois",
      value: formatCurrency(45000),
      icon: CheckCircle,
      color: "bg-success/10 text-success",
    },
    {
      label: "En retard",
      value: formatCurrency(8500),
      icon: AlertTriangle,
      color: "bg-destructive/10 text-destructive",
    },
    {
      label: "Total émis",
      value: formatCurrency(125000),
      icon: Receipt,
      color: "bg-info/10 text-info",
    },
  ];

  return <StatsWidget stats={statsData} isLoading={isLoading} columns={4} />;
}
