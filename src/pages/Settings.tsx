import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { WorkspaceSettings } from "@/components/settings/WorkspaceSettings";
import { MembersSettings } from "@/components/settings/MembersSettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { LotsTemplatesSettings } from "@/components/settings/LotsTemplatesSettings";
import { ProjectsSettings } from "@/components/settings/ProjectsSettings";
import { PhasesSettings } from "@/components/settings/PhasesSettings";
import { CRMSettings } from "@/components/settings/CRMSettings";
import { TasksSettings } from "@/components/settings/TasksSettings";
import { DocumentsSettings } from "@/components/settings/DocumentsSettings";
import { PermissionsSettings } from "@/components/settings/PermissionsSettings";
import { PlanSettings } from "@/components/settings/PlanSettings";
import { ModulesSettings } from "@/components/settings/ModulesSettings";
import { EmailTemplatesSettings } from "@/components/settings/EmailTemplatesSettings";
import { FeedbackSettings } from "@/components/settings/FeedbackSettings";
import { StyleSettings } from "@/components/settings/StyleSettings";
import { DisciplineSettings } from "@/components/settings/DisciplineSettings";
import { ContractTypesSection } from "@/components/settings/sections/ContractTypesSection";
import { SkillsSection } from "@/components/settings/sections/SkillsSection";
import { QuoteTemplatesSection } from "@/components/settings/sections/QuoteTemplatesSection";
import { PricingGridsSection } from "@/components/settings/sections/PricingGridsSection";

export default function Settings() {
  const [activeSection, setActiveSection] = useState("workspace");

  const renderContent = () => {
    switch (activeSection) {
      case "workspace":
        return <WorkspaceSettings />;
      case "discipline":
        return <DisciplineSettings />;
      case "style":
        return <StyleSettings />;
      case "modules":
        return <ModulesSettings />;
      case "plan":
        return <PlanSettings />;
      case "members":
        return <MembersSettings />;
      case "permissions":
        return <PermissionsSettings />;
      case "profile":
        return <ProfileSettings />;
      case "projects":
        return <ProjectsSettings />;
      case "phases":
        return <PhasesSettings />;
      case "lots":
        return <LotsTemplatesSettings />;
      case "tasks":
        return <TasksSettings />;
      case "contracts":
        return <ContractTypesSection />;
      case "skills":
        return <SkillsSection />;
      case "templates":
        return <QuoteTemplatesSection />;
      case "pricing":
        return <PricingGridsSection />;
      case "documents":
        return <DocumentsSettings />;
      case "emails":
        return <EmailTemplatesSettings />;
      case "crm":
        return <CRMSettings />;
      case "feedback":
        return <FeedbackSettings />;
      default:
        return <WorkspaceSettings />;
    }
  };

  return (
    <PageLayout
      title="Paramètres"
      description="Configuration du workspace"
    >
      <SettingsLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      >
        {renderContent()}
      </SettingsLayout>
    </PageLayout>
  );
}
