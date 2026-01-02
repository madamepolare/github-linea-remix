import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getDefaultLotsForProjectType, LotTemplate } from "@/lib/defaultLots";
import { PROJECT_TYPES, ProjectType } from "@/lib/projectTypes";
import { Package, Hammer, Info } from "lucide-react";

export function LotsTemplatesSettings() {
  const [activeType, setActiveType] = useState<ProjectType>("interior");

  const templates = getDefaultLotsForProjectType(activeType);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Modèles de lots</h3>
        <p className="text-sm text-muted-foreground">
          Consultez les modèles de lots prédéfinis par type de projet
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <CardDescription>
              Ces modèles sont disponibles lors de la création de lots dans vos projets. 
              Ils vous permettent de démarrer rapidement avec une structure adaptée.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as ProjectType)}>
        <TabsList>
          {PROJECT_TYPES.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {PROJECT_TYPES.map((type) => (
          <TabsContent key={type.value} value={type.value} className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {getDefaultLotsForProjectType(type.value).map((template) => (
                <Card key={template.name}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge variant="secondary" className="ml-auto">
                        {template.lots.length} lots
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[180px]">
                      <div className="space-y-1.5">
                        {template.lots.map((lot, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-2 rounded-md bg-muted/30"
                          >
                            <Hammer className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{lot.name}</p>
                              {lot.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {lot.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
