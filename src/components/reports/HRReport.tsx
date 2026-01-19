import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHRStats } from "@/hooks/useHRStats";
import { useAllMemberEmploymentInfo } from "@/hooks/useMemberEmploymentInfo";
import { useAllTeamBalances } from "@/hooks/useLeaveManagement";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Users, Euro, Calendar, AlertTriangle, TrendingDown, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const COLORS = ['hsl(var(--primary))', 'hsl(142.1 76.2% 36.3%)', 'hsl(47.9 95.8% 53.1%)', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const CONTRACT_LABELS: Record<string, string> = {
  cdi: 'CDI',
  cdd: 'CDD',
  freelance: 'Freelance',
  internship: 'Stage',
  apprenticeship: 'Alternance',
  other: 'Autre',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function MetricCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  color = "primary",
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: "primary" | "green" | "yellow" | "red";
}) {
  const colorClasses = {
    primary: "text-primary bg-primary/10",
    green: "text-green-600 bg-green-100",
    yellow: "text-yellow-600 bg-yellow-100",
    red: "text-red-600 bg-red-100",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function HRReport() {
  const { data: hrStats, isLoading: loadingStats } = useHRStats();
  const { data: employmentData, isLoading: loadingEmployment } = useAllMemberEmploymentInfo();
  const { data: balances, isLoading: loadingBalances } = useAllTeamBalances();
  const { data: members, isLoading: loadingMembers } = useTeamMembers();

  const isLoading = loadingStats || loadingEmployment || loadingBalances || loadingMembers;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalSalary = (employmentData || []).reduce((sum, e) => sum + (e.salary_monthly || 0), 0);
  const avgSalary = employmentData?.length ? totalSalary / employmentData.length : 0;
  const annualSalary = totalSalary * 12;

  // Contract type distribution
  const contractCounts = new Map<string, number>();
  (employmentData || []).forEach(e => {
    const type = e.contract_type || 'other';
    contractCounts.set(type, (contractCounts.get(type) || 0) + 1);
  });

  const contractPieData = Array.from(contractCounts.entries()).map(([type, count]) => ({
    name: CONTRACT_LABELS[type] || type,
    value: count,
  }));

  // Member map for display
  const memberMap = new Map(members?.map(m => [m.user_id, m]) || []);

  // Leave balances with member info
  const balancesWithMembers = (balances || [])
    .map(b => ({
      ...b,
      member: memberMap.get(b.user_id),
    }))
    .filter(b => b.member);

  // CP balances (type = 'cp')
  const cpBalances = balancesWithMembers
    .filter(b => b.leave_type === 'cp')
    .sort((a, b) => (a.remaining || 0) - (b.remaining || 0));

  // Negative balances
  const negativeBalances = cpBalances.filter(b => (b.remaining || 0) < 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Effectif total"
          value={hrStats?.totalMembers || 0}
          icon={Users}
        />
        <MetricCard
          title="Masse salariale"
          value={formatCurrency(totalSalary)}
          subtitle={`${formatCurrency(annualSalary)}/an`}
          icon={Euro}
        />
        <MetricCard
          title="Salaire moyen"
          value={formatCurrency(avgSalary)}
          icon={Euro}
        />
        <MetricCard
          title="Absents aujourd'hui"
          value={hrStats?.absentToday || 0}
          icon={Calendar}
          color={hrStats?.absentToday ? "yellow" : "green"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par type de contrat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contractPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {contractPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pending Validations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Validations en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Absences</p>
                  <p className="text-sm text-muted-foreground">Demandes à valider</p>
                </div>
                <Badge variant={hrStats?.pendingAbsences ? "destructive" : "secondary"} className="text-lg px-4 py-1">
                  {hrStats?.pendingAbsences || 0}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Temps</p>
                  <p className="text-sm text-muted-foreground">Entrées à valider</p>
                </div>
                <Badge variant={hrStats?.pendingTimeEntries ? "destructive" : "secondary"} className="text-lg px-4 py-1">
                  {hrStats?.pendingTimeEntries || 0}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Total</p>
                  <p className="text-sm text-muted-foreground">Actions requises</p>
                </div>
                <Badge variant={hrStats?.pendingValidations ? "destructive" : "secondary"} className="text-lg px-4 py-1">
                  {hrStats?.pendingValidations || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Balances */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Soldes de congés (CP)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {cpBalances.map(balance => (
                <div key={balance.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={balance.member?.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {balance.member?.profile?.full_name?.slice(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{balance.member?.profile?.full_name}</p>
                  </div>
                  <div className={cn(
                    "font-medium",
                    (balance.remaining || 0) < 0 ? "text-red-600" : 
                    (balance.remaining || 0) < 5 ? "text-yellow-600" : "text-green-600"
                  )}>
                    {balance.remaining?.toFixed(1)} j
                  </div>
                </div>
              ))}
              {cpBalances.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Aucun solde configuré</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertes RH
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Probation endings */}
              {hrStats?.upcomingProbationEnds && hrStats.upcomingProbationEnds.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="font-medium text-yellow-800 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Fins de période d'essai ({hrStats.upcomingProbationEnds.length})
                  </p>
                  <div className="mt-2 space-y-1">
                    {hrStats.upcomingProbationEnds.slice(0, 3).map((item, idx) => (
                      <p key={idx} className="text-sm text-yellow-700">
                        • {item.name} - {new Date(item.date).toLocaleDateString('fr-FR')}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Expiring contracts */}
              {hrStats?.expiringContracts && hrStats.expiringContracts.length > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="font-medium text-orange-800 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Contrats expirant bientôt ({hrStats.expiringContracts.length})
                  </p>
                  <div className="mt-2 space-y-1">
                    {hrStats.expiringContracts.slice(0, 3).map((item, idx) => (
                      <p key={idx} className="text-sm text-orange-700">
                        • {item.name} - {new Date(item.date).toLocaleDateString('fr-FR')}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Negative balances */}
              {negativeBalances.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-800 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Soldes négatifs ({negativeBalances.length})
                  </p>
                  <div className="mt-2 space-y-1">
                    {negativeBalances.slice(0, 3).map(balance => (
                      <p key={balance.id} className="text-sm text-red-700">
                        • {balance.member?.profile?.full_name}: {balance.remaining?.toFixed(1)} jours
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* No alerts */}
              {(!hrStats?.upcomingProbationEnds?.length && 
                !hrStats?.expiringContracts?.length && 
                negativeBalances.length === 0) && (
                <div className="p-6 text-center text-muted-foreground">
                  <p>Aucune alerte RH</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
