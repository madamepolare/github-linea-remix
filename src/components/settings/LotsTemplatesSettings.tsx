import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericSettingsManager } from "./GenericSettingsManager";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getDefaultLotsForProjectType } from "@/lib/defaultLots";
import { ProjectType } from "@/lib/projectTypes";
import { useProjectTypeSettings } from "@/hooks/useProjectTypeSettings";
import { Package, Hammer, Info, Layers } from "lucide-react";
import { useState } from "react";

// Default lot categories
const DEFAULT_LOT_CATEGORIES = [
  { key: "gros_oeuvre", label: "Gros œuvre", color: "#D97706", description: "Structure, maçonnerie, fondations" },
  { key: "second_oeuvre", label: "Second œuvre", color: "#3B82F6", description: "Cloisons, plâtrerie, finitions" },
  { key: "menuiseries", label: "Menuiseries", color: "#8B5CF6", description: "Portes, fenêtres, volets" },
  { key: "electricite", label: "Électricité", color: "#EAB308", description: "Courants forts et faibles" },
  { key: "plomberie", label: "Plomberie", color: "#06B6D4", description: "Sanitaires, eau" },
  { key: "chauffage", label: "Chauffage / Climatisation", color: "#EF4444", description: "CVC, ventilation" },
  { key: "peinture", label: "Peinture", color: "#EC4899", description: "Peinture, revêtements muraux" },
  { key: "sols", label: "Sols", color: "#10B981", description: "Carrelage, parquet, moquette" },
  { key: "espaces_verts", label: "Espaces verts", color: "#22C55E", description: "Paysage, plantations" },
  { key: "vrd", label: "VRD", color: "#78716C", description: "Voiries, réseaux divers" },
];

export function LotsTemplatesSettings() {
  const [activeType, setActiveType] = useState<ProjectType>("interior");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories" className="gap-1.5">
            <Layers className="h-4 w-4" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <Package className="h-4 w-4" />
            Modèles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <GenericSettingsManager
            settingType="lot_categories"
            title="Catégories de lots"
            description="Types de lots pour organiser le suivi de chantier"
            icon={<Hammer className="h-5 w-5 text-primary" />}
            showColor
            showDescription
            defaultItems={DEFAULT_LOT_CATEGORIES}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-6 space-y-4">
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
                          <span className="text-base font-medium">{template.name}</span>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
