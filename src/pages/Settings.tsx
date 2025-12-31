import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="workspace" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Workspace
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-2">
                  <Users className="h-4 w-4" />
                  Membres
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
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
