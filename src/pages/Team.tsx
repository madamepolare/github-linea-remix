import { useParams } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Users } from "lucide-react";
import { TeamUsersTab } from "@/components/team/TeamUsersTab";
import { TimeTrackingTab } from "@/components/team/TimeTrackingTab";
import { TimeValidationTab } from "@/components/team/TimeValidationTab";
import { RecruitmentTab } from "@/components/team/RecruitmentTab";
import { AbsencesTab } from "@/components/team/AbsencesTab";
import { LeaveBalancesTab } from "@/components/team/LeaveBalancesTab";
import { PayrollExportTab } from "@/components/team/PayrollExportTab";
import { TeamRequestsTab } from "@/components/team/TeamRequestsTab";
import { EvaluationsTab } from "@/components/team/EvaluationsTab";
import { DirectoryTab } from "@/components/team/DirectoryTab";
import { SEOHead } from "@/components/seo/SEOHead";

type TeamSection = "users" | "time-tracking" | "time-validation" | "recruitment" | "absences" | "leave-balances" | "payroll" | "requests" | "evaluations" | "directory";

const sectionDescriptions: Record<TeamSection, string> = {
  users: "Gérez les membres de votre équipe",
  "time-tracking": "Suivi du temps de travail",
  "time-validation": "Validation des heures",
  recruitment: "Gestion des candidatures",
  absences: "Congés et absences",
  "leave-balances": "Soldes de congés",
  payroll: "Variables de paie",
  requests: "Demandes de l'équipe",
  evaluations: "Évaluations et objectifs",
  directory: "Annuaire de l'équipe",
};

export default function Team() {
  const { section } = useParams();
  const activeSection = (section as TeamSection) || "users";

  const renderContent = () => {
    switch (activeSection) {
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
      case "leave-balances":
        return <LeaveBalancesTab />;
      case "payroll":
        return <PayrollExportTab />;
      case "requests":
        return <TeamRequestsTab />;
      case "evaluations":
        return <EvaluationsTab />;
      case "directory":
        return <DirectoryTab />;
      default:
        return <TeamUsersTab />;
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
