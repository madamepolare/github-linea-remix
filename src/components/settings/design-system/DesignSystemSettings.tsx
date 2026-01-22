import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComponentCatalog } from "./ComponentCatalog";
import { TokenEditor } from "./TokenEditor";
import { UsageAudit } from "./UsageAudit";
import { Layers, Palette, BarChart3 } from "lucide-react";

export function DesignSystemSettings() {
  const [activeTab, setActiveTab] = useState("catalog");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Système de Design</h2>
        <p className="text-muted-foreground">
          Catalogue des composants, tokens visuels et adoption des patterns.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Composants</span>
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Tokens</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          <ComponentCatalog />
        </TabsContent>

        <TabsContent value="tokens" className="space-y-6">
          <TokenEditor />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <UsageAudit />
        </TabsContent>
      </Tabs>
    </div>
  );
}
