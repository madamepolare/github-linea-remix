import { useParams, Navigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { TeamUsersTab } from "@/components/team/TeamUsersTab";
import { TimeTrackingTab } from "@/components/team/TimeTrackingTab";
import { AbsencesTab } from "@/components/team/AbsencesTab";
import { PayrollExportTab } from "@/components/team/PayrollExportTab";
import { EvaluationsTab } from "@/components/team/EvaluationsTab";
import { SalariesTab } from "@/components/team/SalariesTab";
import { HRDashboard } from "@/components/team/HRDashboard";
import { SEOHead } from "@/components/seo/SEOHead";

type TeamSection = "dashboard" | "users" | "time-tracking" | "absences" | "salaries" | "payroll" | "evaluations";

const sectionDescriptions: Record<TeamSection, string> = {
  dashboard: "Vue d'ensemble RH",
  users: "Équipe et annuaire",
  "time-tracking": "Suivi et validation du temps",
  absences: "Congés, absences et soldes",
  salaries: "Rémunérations et contrats",
  payroll: "Variables de paie",
  evaluations: "Entretiens et objectifs",
};

// Redirect old routes to new ones
const routeRedirects: Record<string, string> = {
  "directory": "users",
  "leave-balances": "absences",
  "time-validation": "time-tracking",
  "recruitment": "evaluations",
  "requests": "dashboard",
};

export default function Team() {
  const { section } = useParams();
  
  // Handle old routes
  if (section && routeRedirects[section]) {
    return <Navigate to={`/team/${routeRedirects[section]}`} replace />;
  }
  
  const activeSection = (section as TeamSection) || "dashboard";

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <HRDashboard />;
      case "users":
        return <TeamUsersTab />;
      case "time-tracking":
        return <TimeTrackingTab />;
      case "absences":
        return <AbsencesTab />;
      case "salaries":
        return <SalariesTab />;
      case "payroll":
        return <PayrollExportTab />;
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