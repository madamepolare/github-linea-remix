import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useFrameworkAggregation } from "@/hooks/useSubProjects";
import { ShareRequestFormDialog } from "./ShareRequestFormDialog";
import { format, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  FolderCheck, 
  FolderOpen, 
  Calendar, 
  TrendingUp,
  RefreshCw,
  Wallet,
  Share2
} from "lucide-react";

interface FrameworkDashboardProps {
  projectId: string;
  projectName?: string;
}

export function FrameworkDashboard({ projectId, projectName }: FrameworkDashboardProps) {
  const { data: aggregation, isLoading } = useFrameworkAggregation(projectId);
  const [shareOpen, setShareOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!aggregation) return null;

  // Calculate contract progress
  const contractStartDate = aggregation.frameworkStartDate ? parseISO(aggregation.frameworkStartDate) : null;
  const contractEndDate = aggregation.frameworkEndDate ? parseISO(aggregation.frameworkEndDate) : null;
  const now = new Date();
  
  let contractProgress = 0;
  let daysRemaining = 0;
  if (contractStartDate && contractEndDate) {
    const totalDays = differenceInDays(contractEndDate, contractStartDate);
    const elapsedDays = differenceInDays(now, contractStartDate);
    contractProgress = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
    daysRemaining = Math.max(0, differenceInDays(contractEndDate, now));
  }

  const stats = [
    {
      label: "Ce mois",
      value: `${aggregation.timeThisMonthHours}h`,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Demandes actives",
      value: aggregation.subProjectsActive.toString(),
      icon: FolderOpen,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Demandes terminées",
      value: aggregation.subProjectsCompleted.toString(),
      icon: FolderCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Temps total",
      value: `${aggregation.timeAllTimeHours}h`,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header with share button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Accord-cadre</h3>
        <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
          <Share2 className="h-4 w-4 mr-2" />
          Partager formulaire
        </Button>
      </div>

      {/* Monthly budget card if available */}
      {aggregation.monthlyBudget && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget mensuel</p>
                  <p className="text-xl font-semibold">
                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(aggregation.monthlyBudget)}
                  </p>
                </div>
              </div>
              {aggregation.autoRenew && (
                <Badge variant="secondary" className="gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Renouvellement auto
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", stat.bgColor)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contract period */}
      {contractStartDate && contractEndDate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Période du contrat</span>
              </div>
              <Badge variant={daysRemaining < 30 ? "destructive" : "secondary"}>
                {daysRemaining} jours restants
              </Badge>
            </div>
            
            <Progress value={contractProgress} className="h-2 mb-2" />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{format(contractStartDate, "d MMM yyyy", { locale: fr })}</span>
              <span>{format(contractEndDate, "d MMM yyyy", { locale: fr })}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <ShareRequestFormDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        projectId={projectId}
        projectName={projectName || "Projet"}
      />
    </div>
  );
}
