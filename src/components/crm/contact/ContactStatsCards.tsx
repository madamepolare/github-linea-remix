import { Card, CardContent } from "@/components/ui/card";
import { Target, Mail, CheckSquare, TrendingUp } from "lucide-react";
import { Lead } from "@/hooks/useLeads";

interface ContactStatsCardsProps {
  leads: Lead[];
  emailsCount?: number;
  tasksCount?: number;
}

export function ContactStatsCards({ leads, emailsCount = 0, tasksCount = 0 }: ContactStatsCardsProps) {
  const totalValue = leads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
  
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
      label: "Opportunités",
      value: leads.length,
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
      label: "Emails",
      value: emailsCount,
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Tâches",
      value: tasksCount,
      icon: CheckSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} strokeWidth={1.5} />
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
