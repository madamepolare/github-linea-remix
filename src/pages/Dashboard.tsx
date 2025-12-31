import { MainLayout } from "@/components/layout/MainLayout";
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
  TrendingUp,
} from "lucide-react";

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Dashboard
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <TrendingUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6 space-y-6">
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
