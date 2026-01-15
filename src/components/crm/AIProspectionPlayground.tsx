import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { AIProspectingPanel } from "./AIProspectingPanel";
import { useIsModuleEnabled } from "@/hooks/useModules";
import { EmptyState } from "@/components/ui/empty-state";

export function AIProspectionPlayground() {
  const isAISalesAgentEnabled = useIsModuleEnabled("ai-sales-agent");

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
                Recherchez des prospects et ajoutez-les directement à votre CRM avec le bon positionnement dans le pipeline
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <AIProspectingPanel />
    </div>
  );
}
