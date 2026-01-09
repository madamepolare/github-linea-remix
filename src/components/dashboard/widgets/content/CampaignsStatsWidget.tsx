import { Megaphone, Calendar, Target, TrendingUp } from "lucide-react";
import { StatsWidget } from "./StatsWidget";

export function CampaignsStatsWidget() {
  const statsData = [
    {
      label: "Campagnes actives",
      value: 4,
      change: 25,
      icon: Megaphone,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "Publications planifiées",
      value: 28,
      icon: Calendar,
      color: "bg-info/10 text-info",
    },
    {
      label: "Taux d'engagement",
      value: "4.2%",
      icon: Target,
      color: "bg-success/10 text-success",
    },
    {
      label: "Portée totale",
      value: "12.5K",
      icon: TrendingUp,
      color: "bg-accent/10 text-accent",
    },
  ];

  return <StatsWidget stats={statsData} columns={4} />;
}
