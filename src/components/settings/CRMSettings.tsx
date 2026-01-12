import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericSettingsManager } from "./GenericSettingsManager";
import { PipelineSettings } from "./PipelineSettings";
import { CRMResetSection } from "./CRMResetSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Briefcase, 
  Phone,
  Users,
  Layers,
  Settings2,
} from "lucide-react";
import {
  DEFAULT_LEAD_SOURCES,
  DEFAULT_ACTIVITY_TYPES,
  DEFAULT_CONTACT_TYPES,
  DEFAULT_COMPANY_CATEGORIES,
  DEFAULT_COMPANY_TYPES,
  DEFAULT_BET_SPECIALTIES,
} from "@/lib/crmDefaults";
import { useCRMSettings } from "@/hooks/useCRMSettings";

// Catégories avec leurs types pour affichage unifié
function CategoriesWithTypesManager() {
  const { companyCategories, companyTypes, betSpecialties } = useCRMSettings();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Organisation des sociétés</h3>
          <p className="text-sm text-muted-foreground">
            Structure hiérarchique : Catégories → Types → (Spécialités BET)
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {companyCategories.map((category) => {
          const categoryTypes = companyTypes.filter(t => t.category === category.key);
          const isBET = category.key === "bet";
          
          return (
            <Card key={category.key} className="overflow-hidden">
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <CardTitle className="text-base">{category.label}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {categoryTypes.length} type{categoryTypes.length > 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {categoryTypes.map((type) => (
                    <Badge 
                      key={type.key} 
                      variant="outline" 
                      className="text-xs py-1 px-2"
                      style={{ 
                        borderColor: type.color,
                        color: type.color,
                      }}
                    >
                      {type.shortLabel || type.label}
                    </Badge>
                  ))}
                </div>

                {isBET && betSpecialties.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Spécialités disponibles pour les BET :
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {betSpecialties.map((specialty) => (
                        <Badge 
                          key={specialty.key} 
                          variant="secondary" 
                          className="text-xs"
                          style={{ 
                            backgroundColor: `${specialty.color}20`,
                            color: specialty.color,
                          }}
                        >
                          {specialty.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            Pour modifier les catégories, types ou spécialités BET, utilisez les paramètres avancés ci-dessous.
          </p>
        </CardContent>
      </Card>

      {/* Advanced settings accordions */}
      <div className="space-y-4">
        <GenericSettingsManager
          settingType="company_categories"
          title="Catégories (avancé)"
          description="Modifier les grandes catégories de sociétés"
          icon={<Layers className="h-5 w-5 text-primary" />}
          showColor
          defaultItems={DEFAULT_COMPANY_CATEGORIES.map(c => ({
            key: c.key,
            label: c.label,
            color: c.color,
          }))}
        />

        <GenericSettingsManager
          settingType="company_types"
          title="Types de sociétés (avancé)"
          description="Modifier les types spécifiques dans chaque catégorie"
          icon={<Layers className="h-5 w-5 text-primary" />}
          showColor
          defaultItems={DEFAULT_COMPANY_TYPES.map(t => ({
            key: t.key,
            label: `${t.label} (${t.shortLabel})`,
            color: t.color,
          }))}
        />

        <GenericSettingsManager
          settingType="bet_specialties"
          title="Spécialités BET (avancé)"
          description="Modifier les spécialités des Bureaux d'Études Techniques"
          icon={<Layers className="h-5 w-5 text-primary" />}
          showColor
          defaultItems={DEFAULT_BET_SPECIALTIES}
        />
      </div>
    </div>
  );
}

export function CRMSettings() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="pipelines">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="pipelines" className="gap-1.5 text-xs">
            <Target className="h-3.5 w-3.5" />
            Pipelines
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5 text-xs">
            <Layers className="h-3.5 w-3.5" />
            Sociétés
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="sources" className="gap-1.5 text-xs">
            <Briefcase className="h-3.5 w-3.5" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="activities" className="gap-1.5 text-xs">
            <Phone className="h-3.5 w-3.5" />
            Activités
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-1.5 text-xs">
            <Settings2 className="h-3.5 w-3.5" />
            Avancé
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="mt-6">
          <PipelineSettings />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoriesWithTypesManager />
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <GenericSettingsManager
            settingType="contact_types"
            title="Types de contacts"
            description="Catégorisez vos contacts selon leur rôle"
            icon={<Users className="h-5 w-5 text-primary" />}
            showColor
            defaultItems={DEFAULT_CONTACT_TYPES}
          />
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          <GenericSettingsManager
            settingType="lead_sources"
            title="Sources de leads"
            description="Définissez les sources de vos opportunités commerciales"
            icon={<Briefcase className="h-5 w-5 text-primary" />}
            showColor
            defaultItems={DEFAULT_LEAD_SOURCES}
          />
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <GenericSettingsManager
            settingType="activity_types"
            title="Types d'activités"
            description="Personnalisez les types d'interactions avec vos contacts"
            icon={<Phone className="h-5 w-5 text-primary" />}
            showColor
            defaultItems={DEFAULT_ACTIVITY_TYPES}
          />
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          <div className="space-y-6">
            <CRMResetSection />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
