import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, User, Hammer, FolderKanban, Target, CheckSquare, FileText, FileStack, Shield, CreditCard, Puzzle, Mail, Layers, MessageSquarePlus, Palette } from "lucide-react";
import { WorkspaceSettings } from "@/components/settings/WorkspaceSettings";
import { MembersSettings } from "@/components/settings/MembersSettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { LotsTemplatesSettings } from "@/components/settings/LotsTemplatesSettings";
import { ProjectsSettings } from "@/components/settings/ProjectsSettings";
import { PhasesSettings } from "@/components/settings/PhasesSettings";
import { CRMSettings } from "@/components/settings/CRMSettings";
import { TasksSettings } from "@/components/settings/TasksSettings";
import { CommercialSettings } from "@/components/settings/CommercialSettings";
import { DocumentsSettings } from "@/components/settings/DocumentsSettings";
import { PermissionsSettings } from "@/components/settings/PermissionsSettings";
import { PlanSettings } from "@/components/settings/PlanSettings";
import { ModulesSettings } from "@/components/settings/ModulesSettings";
import { EmailTemplatesSettings } from "@/components/settings/EmailTemplatesSettings";
import { FeedbackSettings } from "@/components/settings/FeedbackSettings";
import { StyleSettings } from "@/components/settings/StyleSettings";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("workspace");

  const settingsTabs = (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="h-auto p-1 bg-transparent border-0 flex-wrap gap-1">
        <TabsTrigger value="workspace" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Workspace</span>
        </TabsTrigger>
        <TabsTrigger value="style" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <Palette className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Style</span>
        </TabsTrigger>
        <TabsTrigger value="plan" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <CreditCard className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Plan</span>
        </TabsTrigger>
        <TabsTrigger value="modules" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <Puzzle className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Modules</span>
        </TabsTrigger>
        <TabsTrigger value="permissions" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <Shield className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Permissions</span>
        </TabsTrigger>
        <TabsTrigger value="members" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Membres</span>
        </TabsTrigger>
        <TabsTrigger value="profile" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <User className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Profil</span>
        </TabsTrigger>
        <TabsTrigger value="projects" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <FolderKanban className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Projets</span>
        </TabsTrigger>
        <TabsTrigger value="phases" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <Layers className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Phases</span>
        </TabsTrigger>
        <TabsTrigger value="lots" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <Hammer className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Lots</span>
        </TabsTrigger>
        <TabsTrigger value="documents" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <FileStack className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Documents</span>
        </TabsTrigger>
        <TabsTrigger value="commercial" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Finance</span>
        </TabsTrigger>
        <TabsTrigger value="crm" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <Target className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">CRM</span>
        </TabsTrigger>
        <TabsTrigger value="tasks" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <CheckSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Tâches</span>
        </TabsTrigger>
        <TabsTrigger value="emails" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Emails</span>
        </TabsTrigger>
        <TabsTrigger value="feedback" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
          <MessageSquarePlus className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Feedback</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  return (
    <PageLayout
      title="Paramètres"
      description="Gérez votre workspace et votre compte"
      actions={settingsTabs}
    >
      {activeTab === "workspace" && <WorkspaceSettings />}
      {activeTab === "style" && <StyleSettings />}
      {activeTab === "plan" && <PlanSettings />}
      {activeTab === "modules" && <ModulesSettings />}
      {activeTab === "permissions" && <PermissionsSettings />}
      {activeTab === "members" && <MembersSettings />}
      {activeTab === "profile" && <ProfileSettings />}
      {activeTab === "projects" && <ProjectsSettings />}
      {activeTab === "phases" && <PhasesSettings />}
      {activeTab === "lots" && <LotsTemplatesSettings />}
      {activeTab === "documents" && <DocumentsSettings />}
      {activeTab === "commercial" && <CommercialSettings />}
      {activeTab === "crm" && <CRMSettings />}
      {activeTab === "tasks" && <TasksSettings />}
      {activeTab === "emails" && <EmailTemplatesSettings />}
      {activeTab === "feedback" && <FeedbackSettings />}
    </PageLayout>
  );
}
