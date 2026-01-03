import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Settings as SettingsIcon, User, Hammer, FolderKanban, Target, CheckSquare, FileText } from "lucide-react";
import { WorkspaceSettings } from "@/components/settings/WorkspaceSettings";
import { MembersSettings } from "@/components/settings/MembersSettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { LotsTemplatesSettings } from "@/components/settings/LotsTemplatesSettings";
import { ProjectsSettings } from "@/components/settings/ProjectsSettings";
import { CRMSettings } from "@/components/settings/CRMSettings";
import { TasksSettings } from "@/components/settings/TasksSettings";
import { CommercialSettings } from "@/components/settings/CommercialSettings";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("workspace");

  return (
    <PageLayout
      icon={SettingsIcon}
      title="Paramètres"
      description="Gérez votre workspace et votre compte"
      tabs={
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto p-1 bg-transparent border-0 flex-wrap gap-1">
            <TabsTrigger value="workspace" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
              <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Workspace</span>
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
            <TabsTrigger value="lots" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
              <Hammer className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Lots</span>
            </TabsTrigger>
            <TabsTrigger value="commercial" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
              <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Commercial</span>
            </TabsTrigger>
            <TabsTrigger value="crm" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
              <Target className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">CRM</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
              <CheckSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Tâches</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {activeTab === "workspace" && <WorkspaceSettings />}
      {activeTab === "members" && <MembersSettings />}
      {activeTab === "profile" && <ProfileSettings />}
      {activeTab === "projects" && <ProjectsSettings />}
      {activeTab === "lots" && <LotsTemplatesSettings />}
      {activeTab === "commercial" && <CommercialSettings />}
      {activeTab === "crm" && <CRMSettings />}
      {activeTab === "tasks" && <TasksSettings />}
    </PageLayout>
  );
}
