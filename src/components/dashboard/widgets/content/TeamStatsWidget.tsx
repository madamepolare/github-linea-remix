import { Users, CheckSquare, Clock, TrendingUp } from "lucide-react";
import { StatsWidget } from "./StatsWidget";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export function TeamStatsWidget() {
  const { data: stats, isLoading } = useDashboardStats();

  const statsData = [
    {
      label: "Membres",
      value: stats?.teamMembers ?? 0,
      change: stats?.teamMembersChange,
      icon: Users,
      color: "bg-accent/10 text-accent",
    },
    {
      label: "Tâches actives",
      value: 24,
      icon: CheckSquare,
      color: "bg-info/10 text-info",
    },
    {
      label: "Heures cette semaine",
      value: 148,
      icon: Clock,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "Productivité",
      value: "92%",
      icon: TrendingUp,
      color: "bg-success/10 text-success",
    },
  ];

  return <StatsWidget stats={statsData} isLoading={isLoading} columns={4} />;
}
