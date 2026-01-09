import { FolderKanban, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { StatsWidget } from "./StatsWidget";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export function ProjectsStatsWidget() {
  const { data: stats, isLoading } = useDashboardStats();

  const statsData = [
    {
      label: "Actifs",
      value: stats?.activeProjects ?? 0,
      change: stats?.activeProjectsChange,
      icon: FolderKanban,
      color: "bg-info/10 text-info",
    },
    {
      label: "En cours",
      value: Math.max(0, (stats?.activeProjects ?? 0) - 2),
      icon: Clock,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "Terminés",
      value: 12,
      icon: CheckCircle,
      color: "bg-success/10 text-success",
    },
    {
      label: "En retard",
      value: 2,
      icon: AlertTriangle,
      color: "bg-destructive/10 text-destructive",
    },
  ];

  return <StatsWidget stats={statsData} isLoading={isLoading} columns={4} />;
}
