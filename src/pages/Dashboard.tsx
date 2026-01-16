import { PageLayout } from "@/components/layout/PageLayout";
import { WidgetGrid } from "@/components/dashboard/widgets";

const Dashboard = () => {
  return (
    <PageLayout title="Tableau de bord" contentPadding={false}>
      <WidgetGrid />
    </PageLayout>
  );
};

export default Dashboard;
