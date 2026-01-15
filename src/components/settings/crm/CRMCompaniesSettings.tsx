import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Layers, Ruler, Info } from "lucide-react";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { GenericSettingsManager } from "../GenericSettingsManager";
import {
  DEFAULT_COMPANY_CATEGORIES,
  DEFAULT_COMPANY_TYPES,
  DEFAULT_BET_SPECIALTIES,
} from "@/lib/crmDefaults";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CRMCompaniesSettings() {
  const { companyCategories, companyTypes, betSpecialties, isLoading } = useCRMSettings();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Explainer */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          L'organisation des sociétés suit une hiérarchie : <strong>Catégories</strong> → <strong>Types</strong> → <strong>Spécialités BET</strong> (pour les bureaux d'études).
        </AlertDescription>
      </Alert>

      {/* Visual Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Vue d'ensemble</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {companyCategories.map((category) => {
              const categoryTypes = companyTypes.filter(t => t.category === category.key);
              const isBET = category.key === "bet";
              
              return (
                <div 
                  key={category.key} 
                  className="p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="h-2.5 w-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-sm">{category.label}</span>
                    <Badge variant="secondary" className="text-[10px] ml-auto">
                      {categoryTypes.length}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {categoryTypes.slice(0, 4).map((type) => (
                      <Badge 
                        key={type.key} 
                        variant="outline" 
                        className="text-[10px] py-0 px-1.5"
                        style={{ 
                          borderColor: type.color,
                          color: type.color,
                        }}
                      >
                        {type.shortLabel}
                      </Badge>
                    ))}
                    {categoryTypes.length > 4 && (
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                        +{categoryTypes.length - 4}
                      </Badge>
                    )}
                  </div>

                  {isBET && betSpecialties.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-dashed">
                      <div className="flex items-center gap-1 mb-1">
                        <Ruler className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {betSpecialties.length} spécialités
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Configuration */}
      <Accordion type="single" collapsible className="space-y-2">
        <AccordionItem value="categories" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-medium">Catégories d'entreprises</span>
              <Badge variant="secondary" className="text-xs">
                {companyCategories.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <GenericSettingsManager
              settingType="company_categories"
              title="Catégories"
              description="Grandes familles de sociétés"
              icon={<Layers className="h-5 w-5 text-primary" />}
              showColor
              defaultItems={DEFAULT_COMPANY_CATEGORIES.map(c => ({
                key: c.key,
                label: c.label,
                color: c.color,
              }))}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="types" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-medium">Types de sociétés</span>
              <Badge variant="secondary" className="text-xs">
                {companyTypes.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <GenericSettingsManager
              settingType="company_types"
              title="Types"
              description="Types spécifiques dans chaque catégorie"
              icon={<Building2 className="h-5 w-5 text-primary" />}
              showColor
              defaultItems={DEFAULT_COMPANY_TYPES.map(t => ({
                key: t.key,
                label: `${t.label} (${t.shortLabel})`,
                color: t.color,
              }))}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="bet" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Spécialités BET</span>
              <Badge variant="secondary" className="text-xs">
                {betSpecialties.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <GenericSettingsManager
              settingType="bet_specialties"
              title="Spécialités BET"
              description="Structure, fluides, électricité, etc."
              icon={<Ruler className="h-5 w-5 text-orange-500" />}
              showColor
              defaultItems={DEFAULT_BET_SPECIALTIES}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
