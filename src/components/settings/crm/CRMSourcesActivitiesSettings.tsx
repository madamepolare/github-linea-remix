import { Briefcase, Phone } from "lucide-react";
import { GenericSettingsManager } from "../GenericSettingsManager";
import { DEFAULT_LEAD_SOURCES, DEFAULT_ACTIVITY_TYPES } from "@/lib/crmDefaults";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CRMSourcesActivitiesSettings() {
  const { leadSources, activityTypes, isLoading } = useCRMSettings();

  return (
    <div className="space-y-6">
      {/* Quick overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">Sources</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-6 bg-muted animate-pulse rounded" />
            ) : (
              <div className="flex flex-wrap gap-1">
                {leadSources.slice(0, 5).map((source) => (
                  <Badge 
                    key={source.key}
                    variant="secondary"
                    className="text-[10px]"
                    style={{ 
                      backgroundColor: `${source.color}20`,
                      color: source.color,
                    }}
                  >
                    {source.label}
                  </Badge>
                ))}
                {leadSources.length > 5 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{leadSources.length - 5}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">Activités</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-6 bg-muted animate-pulse rounded" />
            ) : (
              <div className="flex flex-wrap gap-1">
                {activityTypes.slice(0, 5).map((activity) => (
                  <Badge 
                    key={activity.key}
                    variant="secondary"
                    className="text-[10px]"
                    style={{ 
                      backgroundColor: `${activity.color}20`,
                      color: activity.color,
                    }}
                  >
                    {activity.label}
                  </Badge>
                ))}
                {activityTypes.length > 5 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{activityTypes.length - 5}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabbed configuration */}
      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources" className="gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            Sources de leads
          </TabsTrigger>
          <TabsTrigger value="activities" className="gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            Types d'activités
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <GenericSettingsManager
            settingType="lead_sources"
            title="Sources de leads"
            description="D'où proviennent vos opportunités commerciales"
            icon={<Briefcase className="h-5 w-5 text-primary" />}
            showColor
            defaultItems={DEFAULT_LEAD_SOURCES}
          />
        </TabsContent>

        <TabsContent value="activities">
          <GenericSettingsManager
            settingType="activity_types"
            title="Types d'activités"
            description="Catégories d'interactions avec vos contacts"
            icon={<Phone className="h-5 w-5 text-primary" />}
            showColor
            defaultItems={DEFAULT_ACTIVITY_TYPES}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
