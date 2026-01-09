import { Trophy, Clock, CheckCircle, XCircle } from "lucide-react";
import { StatsWidget } from "./StatsWidget";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export function TendersStatsWidget() {
  const { data: stats, isLoading } = useDashboardStats();

  const statsData = [
    {
      label: "Actifs",
      value: stats?.activeTenders ?? 0,
      change: stats?.activeTendersChange,
      icon: Trophy,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "En préparation",
      value: 3,
      icon: Clock,
      color: "bg-info/10 text-info",
    },
    {
      label: "Gagnés",
      value: 8,
      icon: CheckCircle,
      color: "bg-success/10 text-success",
    },
    {
      label: "Perdus",
      value: 4,
      icon: XCircle,
      color: "bg-destructive/10 text-destructive",
    },
  ];

  return <StatsWidget stats={statsData} isLoading={isLoading} columns={4} />;
}
