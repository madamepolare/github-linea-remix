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

// Default values for BET specialties
const DEFAULT_BET_SPECIALTIES = [
  { key: "structure", label: "Structure", color: "#F97316" },
  { key: "fluides", label: "Fluides (CVC)", color: "#06B6D4" },
  { key: "electricite", label: "Électricité", color: "#EAB308" },
  { key: "acoustique", label: "Acoustique", color: "#8B5CF6" },
  { key: "thermique", label: "Thermique / RE2020", color: "#EF4444" },
  { key: "vrd", label: "VRD", color: "#D97706" },
  { key: "facade", label: "Façades", color: "#64748B" },
  { key: "environnement", label: "Environnement / HQE", color: "#16A34A" },
  { key: "economie", label: "Économie", color: "#3B82F6" },
  { key: "securite", label: "Sécurité incendie", color: "#F43F5E" },
  { key: "geotechnique", label: "Géotechnique", color: "#78716C" },
];

// Default contact types
const DEFAULT_CONTACT_TYPES = [
  { key: "client", label: "Client", color: "#10B981" },
  { key: "partner", label: "Partenaire", color: "#8B5CF6" },
  { key: "supplier", label: "Fournisseur", color: "#3B82F6" },
  { key: "amo", label: "AMO", color: "#F59E0B" },
  { key: "bet", label: "BET", color: "#06B6D4" },
  { key: "entreprise", label: "Entreprise", color: "#EF4444" },
];

// Default lead sources
const DEFAULT_LEAD_SOURCES = [
  { key: "referral", label: "Recommandation", color: "#10B981" },
  { key: "website", label: "Site web", color: "#3B82F6" },
  { key: "linkedin", label: "LinkedIn", color: "#0077B5" },
  { key: "cold_call", label: "Prospection téléphonique", color: "#F59E0B" },
  { key: "event", label: "Événement / Salon", color: "#8B5CF6" },
  { key: "tender", label: "Appel d'offres", color: "#EC4899" },
  { key: "partner", label: "Partenaire", color: "#06B6D4" },
  { key: "press", label: "Presse / Publication", color: "#84CC16" },
  { key: "other", label: "Autre", color: "#6B7280" },
];

// Default activity types
const DEFAULT_ACTIVITY_TYPES = [
  { key: "call", label: "Appel", color: "#10B981" },
  { key: "email", label: "Email", color: "#3B82F6" },
  { key: "meeting", label: "Réunion", color: "#8B5CF6" },
  { key: "note", label: "Note", color: "#EAB308" },
  { key: "task", label: "Tâche", color: "#F97316" },
  { key: "proposal", label: "Proposition", color: "#EC4899" },
  { key: "site_visit", label: "Visite site", color: "#14B8A6" },
  { key: "document", label: "Document", color: "#64748B" },
];

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
