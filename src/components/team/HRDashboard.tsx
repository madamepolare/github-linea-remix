import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useHRStats } from "@/hooks/useHRStats";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  Users, 
  Clock, 
  CalendarOff, 
  AlertTriangle, 
  TrendingDown,
  FileText,
  ChevronRight,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function HRDashboard() {
  const { data: stats, isLoading } = useHRStats();
  const { data: members } = useTeamMembers();
  const { user } = useAuth();

  const currentUserRole = members?.find((m) => m.user_id === user?.id)?.role;
  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

  if (!isAdmin) {
    return (
      <EmptyState
        icon={Users}
        title="Accès restreint"
        description="Le tableau de bord RH est réservé aux administrateurs."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Effectif total",
      value: stats?.totalMembers || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Absents aujourd'hui",
      value: stats?.absentToday || 0,
      icon: CalendarOff,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Validations en attente",
      value: stats?.pendingValidations || 0,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      link: "/rh/time-validation",
    },
    {
      title: "Heures cette semaine",
      value: `${stats?.hoursThisWeek || 0}h`,
      icon: Clock,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  const hasAlerts = (stats?.upcomingProbationEnds.length || 0) > 0 
    || (stats?.negativeBalances.length || 0) > 0 
    || (stats?.expiringContracts.length || 0) > 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={cn("p-2 sm:p-3 rounded-full", kpi.bgColor)}>
                  <kpi.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", kpi.color)} />
                </div>
              </div>
              {kpi.link && (
                <Button variant="ghost" size="sm" asChild className="absolute bottom-2 right-2 h-7 text-xs">
                  <Link to={kpi.link}>
                    Voir <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Section */}
      {hasAlerts && (
        <Card className="border-warning/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" />
              <CardTitle className="text-lg">Alertes RH</CardTitle>
            </div>
            <CardDescription>Points nécessitant votre attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upcoming Probation Ends */}
            {stats?.upcomingProbationEnds && stats.upcomingProbationEnds.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Fins de période d'essai à venir
                </h4>
                <div className="space-y-2">
                  {stats.upcomingProbationEnds.map((item) => (
                    <div key={item.userId} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <span className="text-sm font-medium">{item.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {format(parseISO(item.date), "d MMM yyyy", { locale: fr })}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Negative Balances */}
            {stats?.negativeBalances && stats.negativeBalances.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Soldes de congés négatifs
                </h4>
                <div className="space-y-2">
                  {stats.negativeBalances.slice(0, 5).map((item, idx) => (
                    <div key={`${item.userId}-${item.type}-${idx}`} className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.name}</span>
                        <Badge variant="outline" className="text-xs">{item.type.toUpperCase()}</Badge>
                      </div>
                      <span className="text-sm font-medium text-destructive">{item.balance.toFixed(1)}j</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expiring Contracts */}
            {stats?.expiringContracts && stats.expiringContracts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Contrats arrivant à terme
                </h4>
                <div className="space-y-2">
                  {stats.expiringContracts.map((item) => (
                    <div key={item.userId} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-sm font-medium">{item.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {format(parseISO(item.date), "d MMM yyyy", { locale: fr })}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <QuickActionButton 
          icon={Users} 
          label="Équipe" 
          to="/rh/users" 
        />
        <QuickActionButton 
          icon={Clock} 
          label="Temps" 
          to="/rh/time-tracking" 
          badge={stats?.pendingTimeEntries}
        />
        <QuickActionButton 
          icon={CalendarOff} 
          label="Absences" 
          to="/rh/absences" 
          badge={stats?.pendingAbsences}
        />
        <QuickActionButton 
          icon={FileText} 
          label="Paie" 
          to="/rh/payroll" 
        />
        <QuickActionButton 
          icon={Users} 
          label="Recrutement" 
          to="/rh/recruitment" 
        />
        <QuickActionButton 
          icon={Bell} 
          label="Demandes" 
          to="/rh/requests" 
        />
      </div>
    </div>
  );
}

function QuickActionButton({ 
  icon: Icon, 
  label, 
  to, 
  badge 
}: { 
  icon: React.ElementType; 
  label: string; 
  to: string;
  badge?: number;
}) {
  return (
    <Button 
      variant="outline" 
      className="h-auto py-4 flex-col gap-2 relative" 
      asChild
    >
      <Link to={to}>
        <Icon className="h-5 w-5" />
        <span className="text-xs">{label}</span>
        {badge && badge > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 min-w-5 p-0 justify-center text-[10px]"
          >
            {badge}
          </Badge>
        )}
      </Link>
    </Button>
  );
}
