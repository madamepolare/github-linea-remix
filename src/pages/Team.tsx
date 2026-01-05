import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamUsersTab } from "@/components/team/TeamUsersTab";
import { TimeTrackingTab } from "@/components/team/TimeTrackingTab";
import { TimeValidationTab } from "@/components/team/TimeValidationTab";
import { RecruitmentTab } from "@/components/team/RecruitmentTab";
import { AbsencesTab } from "@/components/team/AbsencesTab";
import { TeamRequestsTab } from "@/components/team/TeamRequestsTab";
import { EvaluationsTab } from "@/components/team/EvaluationsTab";
import { DirectoryTab } from "@/components/team/DirectoryTab";
import { SEOHead } from "@/components/seo/SEOHead";

const sections = [
  { id: "users", label: "Utilisateurs" },
  { id: "time-tracking", label: "Suivi temps" },
  { id: "time-validation", label: "Validation" },
  { id: "recruitment", label: "Recrutement" },
  { id: "absences", label: "Absences" },
  { id: "requests", label: "Demandes" },
  { id: "evaluations", label: "Évaluations" },
  { id: "directory", label: "Annuaire" },
];

export default function Team() {
  const { section } = useParams();
  const navigate = useNavigate();
  const activeSection = section || "users";

  const handleSectionChange = (value: string) => {
    navigate(`/team/${value}`);
  };

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
    <MainLayout>
      <SEOHead
        title="Équipe | Gestion des ressources humaines"
        description="Gérez votre équipe, suivez les temps, validez les absences et recrutez de nouveaux talents."
      />
      <div className="space-y-6">
        <PageHeader
          title="Équipe"
          description="Gestion des ressources humaines et suivi de l'équipe"
        />

        <Tabs value={activeSection} onValueChange={handleSectionChange}>
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1">
            {sections.map((s) => (
              <TabsTrigger key={s.id} value={s.id} className="shrink-0">
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-6">{renderContent()}</div>
      </div>
    </MainLayout>
  );
}
