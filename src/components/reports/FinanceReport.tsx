import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalFinancials } from "@/hooks/useGlobalFinancials";
import { TrendingUp, TrendingDown, Euro, Receipt, Users, ShoppingCart, AlertTriangle, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(142.1 76.2% 36.3%)', 'hsl(47.9 95.8% 53.1%)'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendValue,
  className 
}: { 
  title: string; 
  value: string; 
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>; 
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && trendValue && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                trend === 'up' && "text-green-600",
                trend === 'down' && "text-red-600",
                trend === 'neutral' && "text-muted-foreground"
              )}>
                {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceReport() {
  const { data, isLoading } = useGlobalFinancials();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Prepare pie chart data for revenue distribution
  const revenueDistribution = [
    { name: 'Encaissé', value: data.totalCAEncaisse },
    { name: 'En attente', value: data.totalCAEnAttente },
    { name: 'En retard', value: data.montantEnRetard },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="CA Facturé"
          value={formatCurrency(data.totalCAFacture)}
          icon={Euro}
          trend={data.margePercent > 20 ? 'up' : 'neutral'}
          trendValue={`Marge ${data.margePercent.toFixed(0)}%`}
        />
        <MetricCard
          title="CA Encaissé"
          value={formatCurrency(data.totalCAEncaisse)}
          subtitle={`Taux: ${data.tauxEncaissement.toFixed(0)}%`}
          icon={Receipt}
        />
        <MetricCard
          title="Masse Salariale"
          value={formatCurrency(data.totalMasseSalariale)}
          subtitle={`${formatCurrency(data.totalMasseSalarialeAnnuelle)}/an`}
          icon={Users}
        />
        <MetricCard
          title="Achats"
          value={formatCurrency(data.totalAchats)}
          icon={ShoppingCart}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CA mensuel (12 mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="monthLabel" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="ca" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="CA" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition du CA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {revenueDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Projects by Margin */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top projets par rentabilité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProjetsByMargin.map((project, idx) => (
                <div key={project.id} className="flex items-center gap-4">
                  <div className="w-6 text-center font-medium text-muted-foreground">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{project.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={project.marginPercent} className="h-2 flex-1" />
                      <span className={cn(
                        "text-xs font-medium whitespace-nowrap",
                        project.marginPercent > 30 ? "text-green-600" : 
                        project.marginPercent > 15 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {project.marginPercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(project.margin)}</p>
                    <p className="text-xs text-muted-foreground">sur {formatCurrency(project.budget)}</p>
                  </div>
                </div>
              ))}
              {data.topProjetsByMargin.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Aucun projet avec budget</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & KPIs */}
        <div className="space-y-6">
          {/* Payment KPIs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Encaissements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Délai moyen de paiement</span>
                <span className="font-medium">{data.delaiMoyenPaiement} jours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Factures en retard</span>
                <span className="font-medium text-red-600">{data.facturesEnRetard}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Montant en retard</span>
                <span className="font-medium text-red-600">{formatCurrency(data.montantEnRetard)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {data.projectsInDanger.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-4 w-4" />
                  Alertes ({data.projectsInDanger.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.projectsInDanger.slice(0, 3).map(project => (
                    <div key={project.id} className="text-sm">
                      <p className="font-medium truncate">{project.name}</p>
                      <p className="text-orange-600 text-xs">{project.alert}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
