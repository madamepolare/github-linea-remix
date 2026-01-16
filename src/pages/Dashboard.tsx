import { PageLayout } from "@/components/layout/PageLayout";
import { WidgetGridNew } from "@/components/dashboard/widgets";

const Dashboard = () => {
  return (
    <PageLayout title="Tableau de bord" contentPadding={false}>
      <WidgetGridNew />
    </PageLayout>
  );
};

export default Dashboard;
