import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, TrendingUp, Building } from "lucide-react";

interface CompanyStatsCardsProps {
  contactsCount: number;
  leadsCount: number;
  totalValue: number;
  departmentsCount?: number;
}

export function CompanyStatsCards({
  contactsCount,
  leadsCount,
  totalValue,
  departmentsCount = 0,
}: CompanyStatsCardsProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M €`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k €`;
    }
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stats = [
    {
      label: "Contacts",
      value: contactsCount,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Leads",
      value: leadsCount,
      icon: Target,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      label: "Pipeline",
      value: totalValue > 0 ? formatCurrency(totalValue) : "—",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Groupes",
      value: departmentsCount,
      icon: Building,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} strokeWidth={1.25} />
            </div>
            <div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
