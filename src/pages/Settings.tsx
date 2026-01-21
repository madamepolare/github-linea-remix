import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageLayout } from "@/components/layout/PageLayout";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { WorkspaceSettings } from "@/components/settings/WorkspaceSettings";
import { MembersSettings } from "@/components/settings/MembersSettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { LotsTemplatesSettings } from "@/components/settings/LotsTemplatesSettings";
import { ProjectsSettings } from "@/components/settings/ProjectsSettings";
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
import { QuoteThemesSettings } from "@/components/settings/QuoteThemesSettings";
import { TenderSettings } from "@/components/settings/TenderSettings";
import { CalendarIntegrationsSettings } from "@/components/settings/CalendarIntegrationsSettings";
import { IntegrationsSettings } from "@/components/settings/IntegrationsSettings";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";

import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  CRMPipelinesSettings,
  CRMCompaniesSettings,
  CRMContactsSettings,
  CRMSourcesActivitiesSettings,
  CRMAdvancedSettings,
} from "@/components/settings/crm";

export default function Settings() {
  const { t } = useTranslation();
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
      case "language":
        return <LanguageSettings />;
      case "notifications":
        return <NotificationSettings />;
      case "projects":
        return <ProjectsSettings />;
      // Phases are now managed within project types
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
      case "quote-themes":
        return <QuoteThemesSettings />;
      case "documents":
        return <DocumentsSettings />;
      case "emails":
        return <EmailTemplatesSettings />;
      case "crm-pipelines":
        return <CRMPipelinesSettings />;
      case "crm-companies":
        return <CRMCompaniesSettings />;
      case "crm-contacts":
        return <CRMContactsSettings />;
      case "crm-sources":
        return <CRMSourcesActivitiesSettings />;
      case "crm-advanced":
        return <CRMAdvancedSettings />;
      case "tenders":
        return <TenderSettings />;
      case "integrations":
        return <IntegrationsSettings />;
      case "calendars":
        return <CalendarIntegrationsSettings />;
      case "feedback":
        return <FeedbackSettings />;
      default:
        return <WorkspaceSettings />;
    }
  };

  return (
    <PageLayout
      title={t('settings.title')}
      description={t('settings.description')}
      contentPadding={false}
      contentOverflow="hidden"
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
