import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericSettingsManager } from "./GenericSettingsManager";
import { PipelineSettings } from "./PipelineSettings";
import { CRMResetSection } from "./CRMResetSection";
import { CRMContactsSettings } from "./crm/CRMContactsSettings";
import { CRMCompaniesSettings } from "./crm/CRMCompaniesSettings";
import { 
  Target, 
  Briefcase, 
  Phone,
  Users,
  Building2,
  Settings2,
} from "lucide-react";
import {
  DEFAULT_LEAD_SOURCES,
  DEFAULT_ACTIVITY_TYPES,
} from "@/lib/crmDefaults";

export function CRMSettings() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="pipelines">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="pipelines" className="gap-1.5 text-xs">
            <Target className="h-3.5 w-3.5" />
            Pipelines
          </TabsTrigger>
          <TabsTrigger value="companies" className="gap-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5" />
            Entreprises
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

        <TabsContent value="companies" className="mt-6">
          <CRMCompaniesSettings />
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <CRMContactsSettings />
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
