import { PageLayout } from "@/components/layout/PageLayout";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ProjectPipelineManager } from "@/components/dashboard/ProjectPipelineManager";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { ActiveProjects } from "@/components/dashboard/ActiveProjects";
import {
  FolderKanban,
  Receipt,
  Users,
  Trophy,
  LayoutDashboard,
} from "lucide-react";

const Dashboard = () => {
  return (
    <PageLayout
      icon={LayoutDashboard}
      title="Dashboard"
      description="Aperçu de votre activité"
    >
      <div className="space-y-6">
        {/* Welcome */}
        <WelcomeHeader />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Projets actifs"
            value={24}
            change={{ value: 12, type: "increase" }}
            icon={FolderKanban}
            iconColor="primary"
            delay={0}
          />
          <StatsCard
            title="Factures en attente"
            value="€142,580"
            change={{ value: 8, type: "increase" }}
            icon={Receipt}
            iconColor="accent"
            delay={1}
          />
          <StatsCard
            title="Appels d'offres"
            value={7}
            change={{ value: 3, type: "decrease" }}
            icon={Trophy}
            iconColor="warning"
            delay={2}
          />
          <StatsCard
            title="Membres"
            value={18}
            change={{ value: 2, type: "increase" }}
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
