import { Users, Building2, UserPlus, TrendingUp } from "lucide-react";
import { StatsWidget } from "./StatsWidget";

export function CRMStatsWidget() {
  const statsData = [
    {
      label: "Contacts",
      value: 156,
      change: 12,
      icon: Users,
      color: "bg-accent/10 text-accent",
    },
    {
      label: "Entreprises",
      value: 42,
      change: 5,
      icon: Building2,
      color: "bg-info/10 text-info",
    },
    {
      label: "Nouveaux leads",
      value: 8,
      icon: UserPlus,
      color: "bg-success/10 text-success",
    },
    {
      label: "Taux conversion",
      value: "32%",
      icon: TrendingUp,
      color: "bg-warning/10 text-warning",
    },
  ];

  return <StatsWidget stats={statsData} columns={4} />;
}
