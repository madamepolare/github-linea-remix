import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { MyInfoTab } from "@/components/profile/MyInfoTab";
import { MyProjectsTab } from "@/components/profile/MyProjectsTab";
import { MyTasksTab } from "@/components/profile/MyTasksTab";
import { MyTimeTab } from "@/components/profile/MyTimeTab";
import { MyAbsencesTab } from "@/components/profile/MyAbsencesTab";
import { MyRequestsTab } from "@/components/profile/MyRequestsTab";
import { MyDocumentsTab } from "@/components/profile/MyDocumentsTab";
import { MyInterviewsTab } from "@/components/profile/MyInterviewsTab";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutGrid, 
  User, 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  CalendarOff, 
  FileText, 
  MessagesSquare,
  ClipboardCheck
} from "lucide-react";

export default function Profile() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  const tabs = [
    { value: "overview", label: "Aperçu", icon: LayoutGrid },
    { value: "info", label: "Informations", icon: User },
    { value: "projects", label: "Projets", icon: FolderKanban },
    { value: "tasks", label: "Tâches", icon: CheckSquare },
    { value: "time", label: "Temps", icon: Clock },
    { value: "absences", label: "Absences", icon: CalendarOff },
    { value: "requests", label: "Demandes", icon: MessagesSquare },
    { value: "documents", label: "Documents", icon: FileText },
    { value: "interviews", label: "Entretiens", icon: ClipboardCheck },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen"
    >
      {/* Profile Header */}
      <div className="border-b bg-muted/30">
        <div className="container max-w-6xl py-8">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{profile?.full_name || "Mon Profil"}</h1>
              <p className="text-muted-foreground">{profile?.job_title || user?.email}</p>
              {profile?.job_title && (
                <Badge variant="secondary" className="mt-2">
                  {profile.job_title}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container max-w-6xl py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview">
              <ProfileOverview />
            </TabsContent>
            <TabsContent value="info">
              <MyInfoTab />
            </TabsContent>
            <TabsContent value="projects">
              <MyProjectsTab />
            </TabsContent>
            <TabsContent value="tasks">
              <MyTasksTab />
            </TabsContent>
            <TabsContent value="time">
              <MyTimeTab />
            </TabsContent>
            <TabsContent value="absences">
              <MyAbsencesTab />
            </TabsContent>
            <TabsContent value="requests">
              <MyRequestsTab />
            </TabsContent>
            <TabsContent value="documents">
              <MyDocumentsTab />
            </TabsContent>
            <TabsContent value="interviews">
              <MyInterviewsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </motion.div>
  );
}
