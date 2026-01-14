import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Clock,
  ShoppingCart,
  Receipt,
  FileText,
  AlertCircle,
  CheckCircle2,
  Hourglass,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useProject, useProjectMembers } from "@/hooks/useProjects";
import { useTeamTimeEntries } from "@/hooks/useTeamTimeEntries";
import { useTaskSchedules } from "@/hooks/useTaskSchedules";
import { useAllMemberEmploymentInfo } from "@/hooks/useMemberEmploymentInfo";
import { useProjectPurchases } from "@/hooks/useProjectPurchases";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const MONTHLY_HOURS = 35 * 52 / 12;

interface BudgetOverviewTabProps {
  projectId: string;
}

export function BudgetOverviewTab({ projectId }: BudgetOverviewTabProps) {
  const { activeWorkspace, user } = useAuth();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { members: projectMembers } = useProjectMembers(projectId);
  const { data: timeEntries, isLoading: entriesLoading } = useTeamTimeEntries({ projectId });
  const { schedules, isLoading: schedulesLoading } = useTaskSchedules({ taskId: undefined });
  const { data: employmentInfo, isLoading: employmentLoading } = useAllMemberEmploymentInfo();
  const { purchases, isLoading: purchasesLoading, totals: purchaseTotals, byStatus } = useProjectPurchases(projectId);

  // Check if current user is admin/owner
  const { data: currentUserRole } = useQuery({
    queryKey: ["workspace-member-role", activeWorkspace?.id, user?.id],
    queryFn: async () => {
      if (!activeWorkspace || !user) return null;
      const { data, error } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", activeWorkspace.id)
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data.role;
    },
    enabled: !!activeWorkspace && !!user,
  });

  // Get workspace daily rate
  const { data: workspaceData } = useQuery({
    queryKey: ["workspace-daily-rate", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return null;
      const { data, error } = await supabase
        .from("workspaces")
        .select("daily_rate")
        .eq("id", activeWorkspace.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!activeWorkspace,
  });

  const isAdmin = currentUserRole === "admin" || currentUserRole === "owner";
  const dailyRate = workspaceData?.daily_rate || 0;

  // Employment cost map
  const employmentCostMap = useMemo(() => {
    const map = new Map<string, number>();
    employmentInfo?.forEach((info) => {
      if (info.salary_monthly) {
        const hourlyFromSalary = info.salary_monthly / MONTHLY_HOURS;
        map.set(info.user_id, hourlyFromSalary);
      }
    });
    return map;
  }, [employmentInfo]);

  // Member rates maps
  const memberDefaultRatesMap = useMemo(() => {
    const map = new Map<string, number | null>();
    employmentInfo?.forEach((info) => {
      map.set(info.user_id, info.client_daily_rate);
    });
    return map;
  }, [employmentInfo]);

  const memberClientRatesMap = useMemo(() => {
    const map = new Map<string, number | null>();
    projectMembers.forEach((m) => {
      map.set(m.user_id, m.client_daily_rate);
    });
    return map;
  }, [projectMembers]);

  const getMemberHourlyRate = (userId: string) => {
    const projectRate = memberClientRatesMap.get(userId);
    if (projectRate !== null && projectRate !== undefined) return projectRate / 8;
    const memberDefaultRate = memberDefaultRatesMap.get(userId);
    if (memberDefaultRate !== null && memberDefaultRate !== undefined) return memberDefaultRate / 8;
    return dailyRate / 8;
  };

  // Filter schedules for this project
  const projectSchedules = useMemo(() => {
    return schedules?.filter((s) => 
      s.task?.project_id === projectId || s.task?.project?.id === projectId
    ) || [];
  }, [schedules, projectId]);

  // Calculate time totals
  const timeTotals = useMemo(() => {
    let totalMinutes = 0;
    const userMinutes = new Map<string, number>();

    timeEntries?.forEach((entry) => {
      totalMinutes += entry.duration_minutes;
      userMinutes.set(entry.user_id, (userMinutes.get(entry.user_id) || 0) + entry.duration_minutes);
    });

    projectSchedules.forEach((schedule) => {
      const durationMs = new Date(schedule.end_datetime).getTime() - new Date(schedule.start_datetime).getTime();
      const durationMinutes = durationMs / (1000 * 60);
      totalMinutes += durationMinutes;
      userMinutes.set(schedule.user_id, (userMinutes.get(schedule.user_id) || 0) + durationMinutes);
    });

    let clientCost = 0;
    let realCost = 0;
    userMinutes.forEach((minutes, userId) => {
      const hours = minutes / 60;
      clientCost += hours * getMemberHourlyRate(userId);
      const realHourlyRate = employmentCostMap.get(userId);
      if (realHourlyRate) realCost += hours * realHourlyRate;
    });

    return {
      totalHours: totalMinutes / 60,
      clientCost,
      realCost,
    };
  }, [timeEntries, projectSchedules, getMemberHourlyRate, employmentCostMap]);

  // Margin summary calculation
  const marginSummary = useMemo(() => {
    const withSellingPrice = purchases?.filter(p => p.selling_price && p.selling_price > 0) || [];
    const totalPurchase = withSellingPrice.reduce((sum, p) => sum + (p.amount_ht || 0), 0);
    const totalSelling = withSellingPrice.reduce((sum, p) => sum + (p.selling_price || 0), 0);
    return {
      withSellingPrice: withSellingPrice.length,
      totalPurchase,
      totalSelling,
      totalMargin: totalSelling - totalPurchase,
      averageMarginPercent: totalPurchase > 0 ? ((totalSelling - totalPurchase) / totalPurchase) * 100 : 0,
    };
  }, [purchases]);

  // Global calculations
  const projectBudget = project?.budget || 0;
  const totalCosts = timeTotals.clientCost + (purchaseTotals?.totalHT || 0);
  const totalRealCosts = timeTotals.realCost + (purchaseTotals?.totalHT || 0);
  const globalMargin = timeTotals.clientCost - timeTotals.realCost + marginSummary.totalMargin;
  const budgetUsedPercent = projectBudget > 0 ? Math.min(100, Math.round((totalCosts / projectBudget) * 100)) : 0;

  const isLoading = projectLoading || entriesLoading || schedulesLoading || employmentLoading || purchasesLoading;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Budget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget projet</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projectBudget)}</div>
            {projectBudget > 0 && (
              <>
                <Progress
                  value={budgetUsedPercent}
                  className={cn(
                    "h-2 mt-2",
                    budgetUsedPercent > 90
                      ? "[&>div]:bg-destructive"
                      : budgetUsedPercent > 70
                      ? "[&>div]:bg-amber-500"
                      : "[&>div]:bg-emerald-500"
                  )}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {budgetUsedPercent}% consommé • Reste {formatCurrency(Math.max(0, projectBudget - totalCosts))}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Temps passé */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps passé</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(timeTotals.totalHours * 10) / 10}h</div>
            <p className="text-xs text-muted-foreground">
              Valorisation : {formatCurrency(timeTotals.clientCost)}
            </p>
            {isAdmin && timeTotals.realCost > 0 && (
              <p className="text-xs text-emerald-600 mt-1">
                Coût réel : {formatCurrency(timeTotals.realCost)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Achats & Provisions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achats & Provisions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(purchaseTotals.totalHT)}</div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {purchaseTotals.provisionsHT > 0 && (
                <Badge variant="outline" className="text-xs">
                  Provisions: {formatCurrency(purchaseTotals.provisionsHT)}
                </Badge>
              )}
              {purchaseTotals.invoicesHT > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Factures: {formatCurrency(purchaseTotals.invoicesHT)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Marge globale (Admin) */}
        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marge globale</CardTitle>
              {globalMargin >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                globalMargin >= 0 ? "text-emerald-600" : "text-destructive"
              )}>
                {formatCurrency(globalMargin)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalCosts > 0 
                  ? `${Math.round((globalMargin / totalCosts) * 100)}% de rentabilité`
                  : "—"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Détail par catégorie */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Factures par statut */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Factures fournisseurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hourglass className="h-4 w-4 text-amber-500" />
                <span className="text-sm">En attente</span>
              </div>
              <span className="font-medium">{formatCurrency(
                (byStatus.pending_validation || []).reduce((s, p) => s + (p.amount_ht || 0), 0) +
                (byStatus.draft || []).reduce((s, p) => s + (p.amount_ht || 0), 0)
              )}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Validées</span>
              </div>
              <span className="font-medium">{formatCurrency(
                (byStatus.validated || []).reduce((s, p) => s + (p.amount_ht || 0), 0) +
                (byStatus.invoice_received || []).reduce((s, p) => s + (p.amount_ht || 0), 0)
              )}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">À payer</span>
              </div>
              <span className="font-medium">{formatCurrency(
                (byStatus.payment_pending || []).reduce((s, p) => s + (p.amount_ht || 0), 0)
              )}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm">Payées</span>
              </div>
              <span className="font-medium text-emerald-600">{formatCurrency(
                (byStatus.paid || []).reduce((s, p) => s + (p.amount_ht || 0), 0)
              )}</span>
            </div>
          </CardContent>
        </Card>

        {/* Synthèse des coûts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Euro className="h-4 w-4 text-primary" />
              Synthèse des coûts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Temps valorisé</span>
              <span className="font-medium">{formatCurrency(timeTotals.clientCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Achats HT</span>
              <span className="font-medium">{formatCurrency(purchaseTotals.totalHT)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm font-medium">Total</span>
              <span className="font-bold">{formatCurrency(totalCosts)}</span>
            </div>
            {isAdmin && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">Coût réel</span>
                <span className="font-medium text-emerald-600">{formatCurrency(totalRealCosts)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Marge sur achats */}
        {isAdmin && marginSummary.withSellingPrice > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Marge sur achats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Achats avec revente</span>
                <span className="font-medium">{marginSummary.withSellingPrice}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Prix d'achat</span>
                <span className="font-medium">{formatCurrency(marginSummary.totalPurchase)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Prix de vente</span>
                <span className="font-medium">{formatCurrency(marginSummary.totalSelling)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-medium">Marge</span>
                <div className="text-right">
                  <span className={cn(
                    "font-bold",
                    marginSummary.totalMargin >= 0 ? "text-emerald-600" : "text-destructive"
                  )}>
                    {formatCurrency(marginSummary.totalMargin)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({marginSummary.averageMarginPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
