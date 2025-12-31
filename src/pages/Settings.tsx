import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Settings as SettingsIcon, User } from "lucide-react";
import { WorkspaceSettings } from "@/components/settings/WorkspaceSettings";
import { MembersSettings } from "@/components/settings/MembersSettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("workspace");

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <PageHeader
          icon={SettingsIcon}
          title="Paramètres"
          description="Gérez votre workspace et votre compte"
          tabs={
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-9 p-1 bg-transparent border-0">
                <TabsTrigger value="workspace" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
                  <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Workspace
                </TabsTrigger>
                <TabsTrigger value="members" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
                  <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Membres
                </TabsTrigger>
                <TabsTrigger value="profile" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
                  <User className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Profil
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
        />

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "workspace" && <WorkspaceSettings />}
          {activeTab === "members" && <MembersSettings />}
          {activeTab === "profile" && <ProfileSettings />}
        </div>
      </div>
    </MainLayout>
  );
}
