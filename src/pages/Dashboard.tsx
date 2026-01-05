import { PageLayout } from "@/components/layout/PageLayout";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ProjectPipelineManager } from "@/components/dashboard/ProjectPipelineManager";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { ActiveProjects } from "@/components/dashboard/ActiveProjects";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import {
  FolderKanban,
  Receipt,
  Users,
  Trophy,
  LayoutDashboard,
} from "lucide-react";

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <PageLayout
      title="Tableau de bord"
    >
      <div className="space-y-8">
        {/* Welcome */}
        <WelcomeHeader />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Projets actifs"
            value={statsLoading ? "..." : (stats?.activeProjects ?? 0)}
            change={{
              value: Math.abs(stats?.activeProjectsChange ?? 0),
              type: (stats?.activeProjectsChange ?? 0) >= 0 ? "increase" : "decrease",
            }}
            icon={FolderKanban}
            iconColor="primary"
            delay={0}
          />
          <StatsCard
            title="Factures en attente"
            value={statsLoading ? "..." : formatCurrency(stats?.pendingInvoicesAmount ?? 0)}
            change={{
              value: Math.abs(stats?.pendingInvoicesChange ?? 0),
              type: (stats?.pendingInvoicesChange ?? 0) >= 0 ? "increase" : "decrease",
            }}
            icon={Receipt}
            iconColor="accent"
            delay={1}
          />
          <StatsCard
            title="Appels d'offres"
            value={statsLoading ? "..." : (stats?.activeTenders ?? 0)}
            change={{
              value: Math.abs(stats?.activeTendersChange ?? 0),
              type: (stats?.activeTendersChange ?? 0) >= 0 ? "increase" : "decrease",
            }}
            icon={Trophy}
            iconColor="warning"
            delay={2}
          />
          <StatsCard
            title="Membres"
            value={statsLoading ? "..." : (stats?.teamMembers ?? 0)}
            change={{
              value: Math.abs(stats?.teamMembersChange ?? 0),
              type: (stats?.teamMembersChange ?? 0) >= 0 ? "increase" : "decrease",
            }}
            icon={Users}
            iconColor="success"
            delay={3}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Phase Manager - Replaces simple pipeline */}
        <ProjectPipelineManager />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingTasks />
          <ActivityFeed />
        </div>

        {/* Active Projects */}
        <ActiveProjects />
      </div>
    </PageLayout>
  );
};

export default Dashboard;
