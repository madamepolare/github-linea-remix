import { PageLayout } from "@/components/layout/PageLayout";
import { WidgetGrid } from "@/components/dashboard/widgets";

const Dashboard = () => {
  return (
    <PageLayout title="Tableau de bord">
      <WidgetGrid />
    </PageLayout>
  );
};

export default Dashboard;
