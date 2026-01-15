import { ComponentShowcase } from "../../ComponentShowcase";
import { ComponentStyleEditor } from "../../ComponentStyleEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Building2, UserPlus, Phone, Mail, MapPin, MoreHorizontal, Star, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function CRMSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">38+ composants</Badge>
        <Badge variant="secondary">src/components/crm/</Badge>
      </div>
      
      <ComponentStyleEditor
        componentName="CRM Status Badges"
        description="Badges de statut pour contacts et entreprises"
        filePath="src/components/crm/shared/CRMStatusBadge.tsx"
        usedIn={["CRMContactsTable", "CRMCompanyTable", "ContactDetailSheet"]}
        properties={[
          { id: "success", label: "Client Color", type: "color", cssVariable: "--success" },
          { id: "warning", label: "Prospect Color", type: "color", cssVariable: "--warning" },
          { id: "info", label: "Lead Color", type: "color", cssVariable: "--info" },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-success/10 text-success">Client</Badge>
          <Badge className="bg-warning/10 text-warning">Prospect</Badge>
          <Badge className="bg-info/10 text-info">Lead</Badge>
          <Badge className="bg-muted text-muted-foreground">Inactif</Badge>
          <Badge className="bg-accent/10 text-accent">VIP</Badge>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Contact Card"
        description="Carte contact pour les listes et grilles"
        filePath="src/components/crm/contact/ContactCard.tsx"
        usedIn={["CRMContactsTable", "ContactPipeline", "ProjectContacts"]}
        properties={[]}
      >
        <Card className="max-w-sm">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">Jean Dupont</p>
                  <Star className="h-3 w-3 text-warning fill-warning" />
                </div>
                <p className="text-sm text-muted-foreground">Directeur Commercial</p>
                <p className="text-xs text-muted-foreground">Acme Corp</p>
              </div>
              <Badge className="bg-success/10 text-success shrink-0">Client</Badge>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate">jean@acme.com</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>+33 6 12 34 56 78</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Company Card"
        description="Carte entreprise avec statistiques"
        filePath="src/components/crm/company/CompanyCard.tsx"
        usedIn={["CRMCompanyTable", "CompanyDetailSheet"]}
        properties={[]}
      >
        <Card className="max-w-sm">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-info/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="font-medium">Acme Corp</p>
                  <p className="text-sm text-muted-foreground">Technologie</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t text-center">
              <div>
                <p className="text-lg font-semibold">12</p>
                <p className="text-xs text-muted-foreground">Contacts</p>
              </div>
              <div>
                <p className="text-lg font-semibold">3</p>
                <p className="text-xs text-muted-foreground">Projets</p>
              </div>
              <div>
                <p className="text-lg font-semibold">45K€</p>
                <p className="text-xs text-muted-foreground">CA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Pipeline Stage"
        description="Colonne de pipeline CRM"
        filePath="src/components/crm/pipeline/PipelineColumn.tsx"
        usedIn={["ContactPipeline", "LeadPipeline"]}
        properties={[]}
      >
        <div className="w-72 bg-muted/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-info" />
              <span className="font-medium text-sm">Qualification</span>
            </div>
            <Badge variant="secondary" className="text-xs">5</Badge>
          </div>
          <div className="space-y-2">
            {["Marie L.", "Pierre M.", "Sophie B."].map((name) => (
              <div key={name} className="bg-card p-3 rounded-lg border text-sm">
                <p className="font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">Acme Corp</p>
              </div>
            ))}
          </div>
        </div>
      </ComponentStyleEditor>

      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-medium mb-2">Autres composants CRM:</p>
        <ul className="grid grid-cols-2 gap-1 text-xs">
          <li>• ContactDetailSheet</li>
          <li>• CompanyDetailSheet</li>
          <li>• ContactFormDialog</li>
          <li>• CompanyFormDialog</li>
          <li>• CRMCompanyTable</li>
          <li>• CRMContactsTable</li>
          <li>• ContactPipeline</li>
          <li>• AIProspectingPanel</li>
          <li>• SiretSearchDialog</li>
          <li>• ImportContactsDialog</li>
          <li>• BulkEmailDialog</li>
          <li>• CRMQuickActions</li>
        </ul>
      </div>
    </div>
  );
}
