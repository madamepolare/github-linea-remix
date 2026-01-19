import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimeAnalytics } from "@/hooks/useTimeAnalytics";
import { Clock, TrendingUp, Users, Briefcase } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))', 'hsl(var(--accent))', 'hsl(142.1 76.2% 36.3%)', 'hsl(47.9 95.8% 53.1%)'];

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function MetricCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
}: { 
  title: string; 
  value: string; 
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>; 
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TimeReport() {
  const { data, isLoading } = useTimeAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Prepare billable pie data
  const billableData = [
    { name: 'Facturable', value: data.billableHours },
    { name: 'Non-facturable', value: data.nonBillableHours },
  ].filter(d => d.value > 0);

  // Prepare project pie data (top 5)
  const projectPieData = data.byProject.slice(0, 5).map(p => ({
    name: p.projectName.length > 15 ? p.projectName.substring(0, 15) + '...' : p.projectName,
    value: p.totalHours,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cette semaine"
          value={formatHours(data.totalHoursWeek)}
          subtitle={`Moy: ${formatHours(data.avgHoursPerDay)}/jour`}
          icon={Clock}
        />
        <MetricCard
          title="Ce mois"
          value={formatHours(data.totalHoursMonth)}
          icon={Clock}
        />
        <MetricCard
          title="Taux facturable"
          value={`${data.billablePercent.toFixed(0)}%`}
          subtitle={`${formatHours(data.billableHours)} facturables`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Moy. par collaborateur"
          value={formatHours(data.avgHoursPerUser)}
          subtitle={`${data.byUser.length} collaborateurs`}
          icon={Users}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendance hebdomadaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="weekLabel" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => formatHours(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="billable" stackId="a" fill="hsl(var(--primary))" name="Facturable" />
                  <Bar dataKey="nonBillable" stackId="a" fill="hsl(var(--muted))" name="Non-facturable" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Billable vs Non-billable Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition facturable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={billableData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {billableData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatHours(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top contributeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topContributors.map((user, idx) => (
                <div key={user.userId} className="flex items-center gap-4">
                  <div className="w-6 text-center font-medium text-muted-foreground">{idx + 1}</div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{user.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.userName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={user.billablePercent} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{user.billablePercent.toFixed(0)}% fact.</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatHours(user.totalHours)}</p>
                  </div>
                </div>
              ))}
              {data.topContributors.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Répartition par projet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.byProject.slice(0, 8).map((project, idx) => {
                const maxHours = data.byProject[0]?.totalHours || 1;
                const widthPercent = (project.totalHours / maxHours) * 100;
                
                return (
                  <div key={project.projectId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate font-medium">{project.projectName}</span>
                      <span className="text-muted-foreground ml-2">{formatHours(project.totalHours)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {data.byProject.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Aucun projet avec temps enregistré</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activité des 30 derniers jours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {data.dailyActivity.map((day) => {
              const intensity = Math.min(1, day.hours / 8);
              return (
                <div
                  key={day.date}
                  className={cn(
                    "w-4 h-4 rounded-sm",
                    day.dayOfWeek === 0 || day.dayOfWeek === 6 
                      ? "bg-muted/30" 
                      : intensity === 0 
                        ? "bg-muted" 
                        : ""
                  )}
                  style={
                    day.dayOfWeek !== 0 && day.dayOfWeek !== 6 && intensity > 0
                      ? { backgroundColor: `hsl(var(--primary) / ${0.2 + intensity * 0.8})` }
                      : undefined
                  }
                  title={`${day.date}: ${formatHours(day.hours)}`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Moins</span>
            <div className="flex gap-1">
              {[0.2, 0.4, 0.6, 0.8, 1].map((opacity) => (
                <div
                  key={opacity}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: `hsl(var(--primary) / ${opacity})` }}
                />
              ))}
            </div>
            <span>Plus</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
