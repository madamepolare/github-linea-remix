import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericSettingsManager } from "./GenericSettingsManager";
import { PipelineSettings } from "./PipelineSettings";
import { 
  Building2, 
  Users, 
  Target, 
  Briefcase, 
  Phone,
  Ruler,
  HardHat,
  Layers
} from "lucide-react";
import {
  DEFAULT_BET_SPECIALTIES,
  DEFAULT_CONTACT_TYPES,
  DEFAULT_LEAD_SOURCES,
  DEFAULT_ACTIVITY_TYPES,
  DEFAULT_COMPANY_TYPES,
  DEFAULT_COMPANY_CATEGORIES,
} from "@/lib/crmDefaults";

// Transform company types for GenericSettingsManager format
const companyTypesForSettings = DEFAULT_COMPANY_TYPES.map((t) => ({
  key: t.key,
  label: `${t.label} (${t.shortLabel})`,
  color: t.color,
}));

// Transform company categories for GenericSettingsManager format
const companyCategoriesForSettings = DEFAULT_COMPANY_CATEGORIES.map((c) => ({
  key: c.key,
  label: c.label,
  color: c.color,
}));

export function CRMSettings() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="pipelines">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="pipelines" className="gap-1.5 text-xs">
            <Target className="h-3.5 w-3.5" />
            Pipelines
          </TabsTrigger>
          <TabsTrigger value="sources" className="gap-1.5 text-xs">
            <Briefcase className="h-3.5 w-3.5" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="activities" className="gap-1.5 text-xs">
            <Phone className="h-3.5 w-3.5" />
            Activités
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5 text-xs">
            <Layers className="h-3.5 w-3.5" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="companies" className="gap-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5" />
            Types sociétés
          </TabsTrigger>
          <TabsTrigger value="bet" className="gap-1.5 text-xs">
            <Ruler className="h-3.5 w-3.5" />
            Spécialités BET
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="mt-6">
          <PipelineSettings />
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

        <TabsContent value="contacts" className="mt-6">
          <GenericSettingsManager
            settingType="contact_types"
            title="Types de contacts"
            description="Catégorisez vos contacts selon leur rôle (Client, Partenaire, BET, Société...)"
            icon={<Users className="h-5 w-5 text-primary" />}
            showColor
            defaultItems={DEFAULT_CONTACT_TYPES}
          />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <GenericSettingsManager
            settingType="company_categories"
            title="Catégories de sociétés"
            description="Les grandes catégories pour organiser vos sociétés (Clients, BET, Partenaires MOE, Sociétés, Fournisseurs...)"
            icon={<Layers className="h-5 w-5 text-primary" />}
            showColor
            defaultItems={companyCategoriesForSettings}
          />
        </TabsContent>

        <TabsContent value="companies" className="mt-6">
          <GenericSettingsManager
            settingType="company_types"
            title="Types de sociétés"
            description="Les types spécifiques de sociétés dans chaque catégorie"
            icon={<Building2 className="h-5 w-5 text-primary" />}
            showColor
            defaultItems={companyTypesForSettings}
          />
        </TabsContent>

        <TabsContent value="bet" className="mt-6">
          <GenericSettingsManager
            settingType="bet_specialties"
            title="Spécialités BET"
            description="Les spécialités des Bureaux d'Études Techniques (Structure, Fluides, Électricité, Acoustique...)"
            icon={<Ruler className="h-5 w-5 text-primary" />}
            showColor
            defaultItems={DEFAULT_BET_SPECIALTIES}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
