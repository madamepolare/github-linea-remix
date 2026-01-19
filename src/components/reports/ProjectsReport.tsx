import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FolderKanban, TrendingUp, AlertTriangle, CheckCircle2, Clock, Euro } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  onHold: number;
  overdue: number;
  totalBudget: number;
  consumedBudget: number;
  avgMargin: number;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    budget: number;
    consumed: number;
    marginPercent: number;
    endDate?: string;
    isOverdue: boolean;
  }>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function useProjectStats() {
  const { activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id;

  return useQuery({
    queryKey: ['project-stats', workspaceId],
    queryFn: async (): Promise<ProjectStats> => {
      if (!workspaceId) throw new Error("No workspace");

      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, budget, end_date')
        .eq('workspace_id', workspaceId)
        .neq('status', 'archived');

      const { data: timeEntries } = await supabase
        .from('team_time_entries')
        .select('project_id, duration_minutes, hourly_rate')
        .eq('workspace_id', workspaceId);

      const { data: purchases } = await supabase
        .from('project_purchases')
        .select('project_id, amount_ttc, status')
        .eq('workspace_id', workspaceId)
        .neq('status', 'cancelled');

      const now = new Date();

      // Calculate consumed per project
      const consumedMap = new Map<string, number>();
      
      (timeEntries || []).forEach(te => {
        if (te.project_id) {
          const cost = (te.duration_minutes / 60) * (te.hourly_rate || 0);
          consumedMap.set(te.project_id, (consumedMap.get(te.project_id) || 0) + cost);
        }
      });

      (purchases || []).forEach(p => {
        if (p.project_id) {
          consumedMap.set(p.project_id, (consumedMap.get(p.project_id) || 0) + (p.amount_ttc || 0));
        }
      });

      const projectList = (projects || []).map(p => {
        const consumed = consumedMap.get(p.id) || 0;
        const marginPercent = p.budget ? ((p.budget - consumed) / p.budget) * 100 : 100;
        const isOverdue = p.end_date && new Date(p.end_date) < now && p.status === 'active';
        
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          budget: p.budget || 0,
          consumed,
          marginPercent,
          endDate: p.end_date || undefined,
          isOverdue: !!isOverdue,
        };
      });

      const active = projectList.filter(p => p.status === 'active').length;
      const completed = projectList.filter(p => p.status === 'completed').length;
      const onHold = projectList.filter(p => p.status === 'on_hold').length;
      const overdue = projectList.filter(p => p.isOverdue).length;

      const totalBudget = projectList.reduce((sum, p) => sum + p.budget, 0);
      const consumedBudget = projectList.reduce((sum, p) => sum + p.consumed, 0);
      
      const projectsWithBudget = projectList.filter(p => p.budget > 0);
      const avgMargin = projectsWithBudget.length > 0
        ? projectsWithBudget.reduce((sum, p) => sum + p.marginPercent, 0) / projectsWithBudget.length
        : 0;

      return {
        total: projectList.length,
        active,
        completed,
        onHold,
        overdue,
        totalBudget,
        consumedBudget,
        avgMargin,
        projects: projectList.sort((a, b) => b.budget - a.budget),
      };
    },
    enabled: !!workspaceId,
  });
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color = "primary",
}: { 
  title: string; 
  value: string | number; 
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
          </div>
          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectsReport() {
  const { data, isLoading } = useProjectStats();

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

  if (!data) return null;

  const budgetConsumptionPercent = data.totalBudget > 0 
    ? (data.consumedBudget / data.totalBudget) * 100 
    : 0;

  // Prepare budget chart data (top 10 projects by budget)
  const budgetChartData = data.projects
    .filter(p => p.budget > 0)
    .slice(0, 10)
    .map(p => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      budget: p.budget,
      consumed: p.consumed,
      remaining: Math.max(0, p.budget - p.consumed),
    }));

  // Scatter data for budget vs consumed
  const scatterData = data.projects
    .filter(p => p.budget > 0)
    .map(p => ({
      name: p.name,
      budget: p.budget,
      consumed: p.consumed,
      z: 100,
    }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Projets actifs" value={data.active} icon={FolderKanban} color="primary" />
        <MetricCard title="Terminés" value={data.completed} icon={CheckCircle2} color="green" />
        <MetricCard title="En attente" value={data.onHold} icon={Clock} color="yellow" />
        <MetricCard title="En retard" value={data.overdue} icon={AlertTriangle} color="red" />
        <MetricCard title="Marge moyenne" value={`${data.avgMargin.toFixed(0)}%`} icon={TrendingUp} color={data.avgMargin > 20 ? "green" : "yellow"} />
      </div>

      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Consommation budgétaire globale</span>
            <span className="text-sm font-normal text-muted-foreground">
              {formatCurrency(data.consumedBudget)} / {formatCurrency(data.totalBudget)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={budgetConsumptionPercent} className="h-4" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Consommé: {budgetConsumptionPercent.toFixed(1)}%</span>
              <span>Restant: {formatCurrency(Math.max(0, data.totalBudget - data.consumedBudget))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Consumption Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consommation par projet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="consumed" stackId="a" fill="hsl(var(--primary))" name="Consommé" />
                  <Bar dataKey="remaining" stackId="a" fill="hsl(var(--muted))" name="Restant" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project List with Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détail des projets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {data.projects.slice(0, 10).map(project => (
                <div key={project.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{project.name}</p>
                      {project.isOverdue && (
                        <Badge variant="destructive" className="text-xs">En retard</Badge>
                      )}
                    </div>
                    {project.budget > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <Progress 
                          value={Math.min(100, (project.consumed / project.budget) * 100)} 
                          className="h-1.5 flex-1" 
                        />
                        <span className={cn(
                          "text-xs font-medium",
                          project.marginPercent > 20 ? "text-green-600" : 
                          project.marginPercent > 0 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {project.marginPercent.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{formatCurrency(project.budget)}</p>
                    {project.endDate && (
                      <p className="text-xs text-muted-foreground">
                        {project.isOverdue ? 'Échéance dépassée' : formatDistanceToNow(new Date(project.endDate), { addSuffix: true, locale: fr })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {data.projects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Aucun projet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {data.overdue > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Projets en retard ({data.overdue})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.projects.filter(p => p.isOverdue).map(project => (
                <div key={project.id} className="p-3 bg-background rounded-lg border">
                  <p className="font-medium truncate">{project.name}</p>
                  <p className="text-sm text-red-600">
                    Échéance: {project.endDate && new Date(project.endDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
