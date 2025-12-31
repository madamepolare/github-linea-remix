import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ProjectPipeline } from "@/components/dashboard/ProjectPipeline";
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
    <MainLayout>
      <div className="flex flex-col h-full">
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          description="Aperçu de votre activité"
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Welcome */}
          <WelcomeHeader />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Active Projects"
              value={24}
              change={{ value: 12, type: "increase" }}
              icon={FolderKanban}
              iconColor="primary"
              delay={0}
            />
            <StatsCard
              title="Pending Invoices"
              value="€142,580"
              change={{ value: 8, type: "increase" }}
              icon={Receipt}
              iconColor="accent"
              delay={1}
            />
            <StatsCard
              title="Active Tenders"
              value={7}
              change={{ value: 3, type: "decrease" }}
              icon={Trophy}
              iconColor="warning"
              delay={2}
            />
            <StatsCard
              title="Team Members"
              value={18}
              change={{ value: 2, type: "increase" }}
              icon={Users}
              iconColor="success"
              delay={3}
            />
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Pipeline */}
          <ProjectPipeline />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingTasks />
            <ActivityFeed />
          </div>

          {/* Active Projects */}
          <ActiveProjects />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
