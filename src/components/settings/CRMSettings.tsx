import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericSettingsManager } from "./GenericSettingsManager";
import { PipelineSettings } from "./PipelineSettings";
import { 
  Building2, 
  Users, 
  Target, 
  Briefcase, 
  Phone,
  Ruler
} from "lucide-react";
import {
  DEFAULT_BET_SPECIALTIES,
  DEFAULT_CONTACT_TYPES,
  DEFAULT_LEAD_SOURCES,
  DEFAULT_ACTIVITY_TYPES,
  DEFAULT_COMPANY_TYPES,
} from "@/lib/crmDefaults";

// Transform company types for GenericSettingsManager format
const companyTypesForSettings = DEFAULT_COMPANY_TYPES.map((t) => ({
  key: t.key,
  label: `${t.label} (${t.shortLabel})`,
  color: t.color,
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
          <TabsTrigger value="companies" className="gap-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5" />
            Entreprises
          </TabsTrigger>
          <TabsTrigger value="bet" className="gap-1.5 text-xs">
            <Ruler className="h-3.5 w-3.5" />
            BET
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
            description="Catégorisez vos contacts selon leur rôle"
            icon={<Users className="h-5 w-5 text-primary" />}
            showColor
            defaultItems={DEFAULT_CONTACT_TYPES}
          />
        </TabsContent>

        <TabsContent value="companies" className="mt-6">
          <GenericSettingsManager
            settingType="company_types"
            title="Types d'entreprises"
            description="Définissez les différents types d'entreprises de votre CRM"
            icon={<Building2 className="h-5 w-5 text-primary" />}
            showColor
            defaultItems={companyTypesForSettings}
          />
        </TabsContent>

        <TabsContent value="bet" className="mt-6">
          <GenericSettingsManager
            settingType="bet_specialties"
            title="Spécialités BET"
            description="Gérez les spécialités des Bureaux d'Études Techniques"
            icon={<Ruler className="h-5 w-5 text-primary" />}
            showColor
            defaultItems={DEFAULT_BET_SPECIALTIES}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
