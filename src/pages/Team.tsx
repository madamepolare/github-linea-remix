import { useParams } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { TeamUsersTab } from "@/components/team/TeamUsersTab";
import { TimeTrackingTab } from "@/components/team/TimeTrackingTab";
import { TimeValidationTab } from "@/components/team/TimeValidationTab";
import { RecruitmentTab } from "@/components/team/RecruitmentTab";
import { AbsencesTab } from "@/components/team/AbsencesTab";
import { PayrollExportTab } from "@/components/team/PayrollExportTab";
import { TeamRequestsTab } from "@/components/team/TeamRequestsTab";
import { EvaluationsTab } from "@/components/team/EvaluationsTab";
import { HRDashboard } from "@/components/team/HRDashboard";
import { SEOHead } from "@/components/seo/SEOHead";

type TeamSection = "dashboard" | "users" | "time-tracking" | "time-validation" | "recruitment" | "absences" | "payroll" | "requests" | "evaluations";

const sectionDescriptions: Record<TeamSection, string> = {
  dashboard: "Vue d'ensemble RH",
  users: "Équipe et annuaire",
  "time-tracking": "Suivi du temps",
  "time-validation": "Validation des heures",
  recruitment: "Recrutement",
  absences: "Congés et absences",
  payroll: "Variables de paie",
  requests: "Demandes",
  evaluations: "Entretiens et objectifs",
};

export default function Team() {
  const { section } = useParams();
  const activeSection = (section as TeamSection) || "dashboard";

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <HRDashboard />;
      case "users":
        return <TeamUsersTab />;
      case "time-tracking":
        return <TimeTrackingTab />;
      case "time-validation":
        return <TimeValidationTab />;
      case "recruitment":
        return <RecruitmentTab />;
      case "absences":
        return <AbsencesTab />;
      case "payroll":
        return <PayrollExportTab />;
      case "requests":
        return <TeamRequestsTab />;
      case "evaluations":
        return <EvaluationsTab />;
      default:
        return <HRDashboard />;
    }
  };

  return (
    <>
      <SEOHead
        title="RH | Gestion des ressources humaines"
        description="Gérez votre équipe, suivez les temps, validez les absences et recrutez de nouveaux talents."
      />
      <PageLayout
        title="RH"
        description={sectionDescriptions[activeSection] || "Gestion des ressources humaines"}
      >
        {renderContent()}
      </PageLayout>
    </>
  );
}
