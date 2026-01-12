import { Trophy, Clock, CheckCircle, XCircle, TrendingUp, FileText } from "lucide-react";
import { StatsWidget } from "./StatsWidget";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export function TendersStatsWidget() {
  const { data: stats, isLoading } = useDashboardStats();

  const statsData = [
    {
      label: "Actifs",
      value: stats?.activeTenders ?? 0,
      change: stats?.activeTendersChange,
      icon: FileText,
      color: "bg-blue-100/80 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      label: "En préparation",
      value: 3,
      icon: Clock,
      color: "bg-amber-100/80 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      label: "Gagnés",
      value: stats?.wonTenders ?? 0,
      icon: Trophy,
      color: "bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      label: "Perdus",
      value: stats?.lostTenders ?? 0,
      icon: XCircle,
      color: "bg-red-100/80 text-red-500 dark:bg-red-900/30 dark:text-red-400",
    },
  ];

  return <StatsWidget stats={statsData} isLoading={isLoading} columns={4} />;
}
