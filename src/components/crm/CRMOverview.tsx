import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Target, TrendingUp, DollarSign, ArrowRight, PieChart } from "lucide-react";
import { motion } from "framer-motion";

interface CRMOverviewProps {
  onNavigate: (view: string) => void;
  companiesCount: number;
  contactsCount: number;
  leadStats: {
    total: number;
    totalValue: number;
    weightedValue: number;
    wonValue: number;
    lostCount: number;
  };
}

export function CRMOverview({ onNavigate, companiesCount, contactsCount, leadStats }: CRMOverviewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stats = [
    {
      title: "Entreprises",
      value: companiesCount,
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      action: () => onNavigate("companies"),
    },
    {
      title: "Contacts",
      value: contactsCount,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      action: () => onNavigate("contacts"),
    },
    {
      title: "Opportunités",
      value: leadStats.total,
      icon: Target,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      action: () => onNavigate("leads"),
    },
    {
      title: "Pipeline pondéré",
      value: formatCurrency(leadStats.weightedValue),
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      action: () => onNavigate("leads"),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card
              className="cursor-pointer hover:border-primary/30 transition-colors"
              onClick={stat.action}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Pipeline summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Pipeline Commercial</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("leads")}>
              Voir tout
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Valeur totale</p>
                <p className="text-xl font-semibold">{formatCurrency(leadStats.totalValue)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pondéré</p>
                <p className="text-xl font-semibold text-primary">{formatCurrency(leadStats.weightedValue)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Gagné</p>
                <p className="text-xl font-semibold text-emerald-500">{formatCurrency(leadStats.wonValue)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Perdu</p>
                <p className="text-xl font-semibold text-destructive">{leadStats.lostCount} opportunités</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card
          className="cursor-pointer hover:border-primary/30 transition-colors group"
          onClick={() => onNavigate("companies")}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <Building2 className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Entreprises</p>
              <p className="text-sm text-muted-foreground">Gérer les clients, BET, partenaires...</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/30 transition-colors group"
          onClick={() => onNavigate("contacts")}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
              <Users className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="font-medium">Contacts</p>
              <p className="text-sm text-muted-foreground">Annuaire de vos interlocuteurs</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/30 transition-colors group"
          onClick={() => onNavigate("leads")}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
              <Target className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="font-medium">Opportunités</p>
              <p className="text-sm text-muted-foreground">Pipeline de prospection</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
