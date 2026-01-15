import { ComponentShowcase } from "../../ComponentShowcase";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, UserPlus } from "lucide-react";

export function CRMSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">38+ composants</Badge>
        <Badge variant="secondary">src/components/crm/</Badge>
      </div>
      
      <ComponentShowcase
        name="CRM Status Badges"
        description="Badges de statut pour contacts et entreprises"
        filePath="src/components/crm/shared/CRMStatusBadge.tsx"
      >
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-success/10 text-success">Client</Badge>
          <Badge className="bg-warning/10 text-warning">Prospect</Badge>
          <Badge className="bg-info/10 text-info">Lead</Badge>
          <Badge className="bg-muted text-muted-foreground">Inactif</Badge>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Contact Card Preview"
        description="Aperçu d'un contact dans les listes"
        filePath="src/components/crm/contact/ContactCard.tsx"
      >
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Jean Dupont</p>
            <p className="text-xs text-muted-foreground">Directeur Commercial</p>
          </div>
          <Badge variant="secondary">Client</Badge>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Company Card Preview"
        description="Aperçu d'une entreprise"
        filePath="src/components/crm/company/CompanyCard.tsx"
      >
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
          <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-info" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Acme Corp</p>
            <p className="text-xs text-muted-foreground">12 contacts • 3 projets</p>
          </div>
        </div>
      </ComponentShowcase>

      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-medium mb-2">Composants CRM disponibles:</p>
        <ul className="grid grid-cols-2 gap-1 text-xs">
          <li>• ContactDetailSheet</li>
          <li>• CompanyDetailSheet</li>
          <li>• ContactFormDialog</li>
          <li>• CompanyFormDialog</li>
          <li>• CRMCompanyTable</li>
          <li>• CRMContactsTable</li>
          <li>• ContactPipeline</li>
          <li>• AIProspectingPanel</li>
        </ul>
      </div>
    </div>
  );
}
