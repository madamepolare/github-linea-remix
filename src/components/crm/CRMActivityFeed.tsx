import { useMemo } from "react";
import { useWorkspaceNavigation } from "@/hooks/useWorkspaceNavigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  User,
  Target,
  Mail,
  Phone,
  Calendar,
  FileText,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CRMCompanyEnriched, Contact } from "@/lib/crmTypes";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Activity {
  id: string;
  type: "company_created" | "contact_created" | "lead_created" | "email" | "call" | "meeting";
  title: string;
  description?: string;
  entityId: string;
  entityType: "company" | "contact" | "lead";
  timestamp: Date;
}

interface CRMActivityFeedProps {
  companies: CRMCompanyEnriched[];
  contacts: Contact[];
  leads?: any[];
  maxItems?: number;
}

const activityIcons = {
  company_created: Building2,
  contact_created: User,
  lead_created: Target,
  email: Mail,
  call: Phone,
  meeting: Calendar,
};

const activityColors = {
  company_created: "bg-info/10 text-info",
  contact_created: "bg-accent/10 text-accent",
  lead_created: "bg-success/10 text-success",
  email: "bg-warning/10 text-warning",
  call: "bg-primary/10 text-primary",
  meeting: "bg-destructive/10 text-destructive",
};

export function CRMActivityFeed({
  companies,
  contacts,
  leads = [],
  maxItems = 10,
}: CRMActivityFeedProps) {
  const { navigate } = useWorkspaceNavigation();

  const activities = useMemo(() => {
    const items: Activity[] = [];

    // Add company creations
    companies.forEach((company) => {
      if (company.created_at) {
        items.push({
          id: `company-${company.id}`,
          type: "company_created",
          title: `${company.name}`,
          description: "Nouvelle entreprise ajoutée",
          entityId: company.id,
          entityType: "company",
          timestamp: new Date(company.created_at),
        });
      }
    });

    // Add contact creations
    contacts.forEach((contact) => {
      if (contact.created_at) {
        items.push({
          id: `contact-${contact.id}`,
          type: "contact_created",
          title: contact.name,
          description: contact.company?.name
            ? `Nouveau contact chez ${contact.company.name}`
            : "Nouveau contact ajouté",
          entityId: contact.id,
          entityType: "contact",
          timestamp: new Date(contact.created_at),
        });
      }
    });

    // Add lead creations
    leads.forEach((lead) => {
      if (lead.created_at) {
        items.push({
          id: `lead-${lead.id}`,
          type: "lead_created",
          title: lead.title || lead.name || "Opportunité",
          description: lead.estimated_value
            ? `${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(lead.estimated_value)}`
            : "Nouvelle opportunité",
          entityId: lead.id,
          entityType: "lead",
          timestamp: new Date(lead.created_at),
        });
      }
    });

    // Sort by timestamp, most recent first
    return items
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxItems);
  }, [companies, contacts, leads, maxItems]);

  const handleActivityClick = (activity: Activity) => {
    switch (activity.entityType) {
      case "company":
        navigate(`/crm/companies/${activity.entityId}`);
        break;
      case "contact":
        navigate(`/crm/contacts/${activity.entityId}`);
        break;
      case "lead":
        navigate(`/crm/leads`);
        break;
    }
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Aucune activité récente</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[320px] pr-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-1">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];

            return (
              <div
                key={activity.id}
                className="group relative flex items-start gap-3 py-2 px-1 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleActivityClick(activity)}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-background",
                    colorClass
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {activity.title}
                    </p>
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  )}
                </div>

                {/* Time */}
                <span className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                  {formatDistanceToNow(activity.timestamp, {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
