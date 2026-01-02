import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhaseTemplatesSettings } from "./PhaseTemplatesSettings";
import { Layers } from "lucide-react";

export function ProjectsSettings() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="phases">
        <TabsList>
          <TabsTrigger value="phases" className="gap-2">
            <Layers className="h-4 w-4" />
            Phases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="mt-6">
          <PhaseTemplatesSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
