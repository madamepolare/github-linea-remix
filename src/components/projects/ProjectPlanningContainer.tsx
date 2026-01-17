import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Layers } from "lucide-react";
import { ProjectPlanningTab } from "./ProjectPlanningTab";
import { ProjectPhasesTab } from "./ProjectPhasesTab";

interface ProjectPlanningContainerProps {
  projectId: string;
}

export function ProjectPlanningContainer({ projectId }: ProjectPlanningContainerProps) {
  const [activeSubTab, setActiveSubTab] = useState("calendar");

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="h-9 bg-muted/50 p-1 rounded-lg gap-0.5 w-auto inline-flex">
          <TabsTrigger 
            value="calendar" 
            className="gap-1.5 px-4 text-sm font-medium rounded-md h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Calendar className="h-4 w-4" />
            Calendrier
          </TabsTrigger>
          <TabsTrigger 
            value="phases" 
            className="gap-1.5 px-4 text-sm font-medium rounded-md h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Layers className="h-4 w-4" />
            Phases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <ProjectPlanningTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="phases" className="mt-4">
          <ProjectPhasesTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
