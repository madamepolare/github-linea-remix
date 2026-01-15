import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Target, Building2, Users } from "lucide-react";
import { AIProspectingPanel } from "./AIProspectingPanel";
import { AIProspectsManager } from "./AIProspectsManager";
import { useAIProspects } from "@/hooks/useAIProspects";
import { useIsModuleEnabled } from "@/hooks/useModules";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

type PlaygroundTab = "search" | "prospects";

export function AIProspectionPlayground() {
  const isAISalesAgentEnabled = useIsModuleEnabled("ai-sales-agent");
  const { prospects } = useAIProspects();
  const [activeTab, setActiveTab] = useState<PlaygroundTab>("search");

  const pendingProspectsCount = prospects.filter(
    (p) => p.status === "new" || p.status === "reviewed"
  ).length;

  if (!isAISalesAgentEnabled) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={Sparkles}
            title="Module Prospection IA non activé"
            description="Activez le module Agent Commercial IA dans les paramètres pour accéder à la prospection intelligente."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Prospection IA</CardTitle>
              <CardDescription>
                Recherchez et qualifiez des prospects avec l'intelligence artificielle
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PlaygroundTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="search" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Recherche IA
          </TabsTrigger>
          <TabsTrigger value="prospects" className="gap-2">
            <Target className="h-4 w-4" />
            Prospects
            {pendingProspectsCount > 0 && (
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs ml-1">
                {pendingProspectsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-4">
          <AIProspectingPanel />
        </TabsContent>

        <TabsContent value="prospects" className="mt-4">
          <AIProspectsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
