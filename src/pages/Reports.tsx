import { useParams, Navigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { FinanceReport } from "@/components/reports/FinanceReport";
import { ProjectsReport } from "@/components/reports/ProjectsReport";
import { TimeReport } from "@/components/reports/TimeReport";
import { HRReport } from "@/components/reports/HRReport";

type ReportSection = "finance" | "projects" | "time" | "hr";

const sectionDescriptions: Record<ReportSection, string> = {
  finance: "Atterrissage financier, CA, masse salariale et achats",
  projects: "Performance et rentabilité des projets",
  time: "Analyse du temps passé et productivité",
  hr: "Effectifs, absences et coûts salariaux",
};

export default function Reports() {
  const { section } = useParams();
  
  // Default to finance
  if (!section) {
    return <Navigate to="/reports/finance" replace />;
  }
  
  const activeSection = section as ReportSection;

  const renderContent = () => {
    switch (activeSection) {
      case "finance":
        return <FinanceReport />;
      case "projects":
        return <ProjectsReport />;
      case "time":
        return <TimeReport />;
      case "hr":
        return <HRReport />;
      default:
        return <FinanceReport />;
    }
  };

  return (
    <>
      <SEOHead
        title="Rapports | Tableaux de bord analytiques"
        description="Analysez vos données financières, projets, temps et RH en un coup d'œil."
      />
      <PageLayout
        title="Rapports"
        description={sectionDescriptions[activeSection] || "Tableaux de bord analytiques"}
      >
        {renderContent()}
      </PageLayout>
    </>
  );
}
