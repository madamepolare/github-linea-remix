import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useInvoiceLanding, useInvoiceLandingStats } from "@/hooks/useInvoiceLanding";
import { InvoiceLandingChart } from "./InvoiceLandingChart";
import { FileText, Clock, TrendingUp, Target, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function InvoiceLandingTab() {
  const { data: landingData, isLoading } = useInvoiceLanding(12);
  const { data: stats, isLoading: statsLoading } = useInvoiceLandingStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total prévisionnel</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{formatCurrency(stats?.totalProjected || 0)}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.totalCount || 0} éléments
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Échéances projets</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-amber-600">
                    {formatCurrency(stats?.scheduledTotal || 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.scheduledCount || 0} à facturer
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Brouillons</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground">
                    {formatCurrency(stats?.draftsTotal || 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.draftsCount || 0} factures
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(stats?.confirmedTotal || 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.confirmedCount || 0} factures
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mois pic</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <>
                    <p className="text-lg font-bold capitalize">
                      {stats?.peakMonth || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats?.peakAmount ? formatCurrency(stats.peakAmount) : "—"}
                    </p>
                  </>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atterrissage mensuel des factures</CardTitle>
          <CardDescription>
            Projection des encaissements basée sur les échéances des projets et les factures en cours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceLandingChart data={landingData || []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
