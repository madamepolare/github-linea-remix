import { useProjectContacts, CLIENT_TEAM_ROLES } from "@/hooks/useProjectContacts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail, Building2, User, Star } from "lucide-react";

interface ProjectContactsSummaryProps {
  projectId: string;
  companyName?: string | null;
}

export function ProjectContactsSummary({ projectId, companyName }: ProjectContactsSummaryProps) {
  const { contacts, isLoading, primaryContact } = useProjectContacts(projectId);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    return CLIENT_TEAM_ROLES.find((r) => r.value === role)?.label || role;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-4">
        <User className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">Aucun contact assigné</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Company info if available */}
      {companyName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b">
          <Building2 className="h-4 w-4" />
          <span>{companyName}</span>
        </div>
      )}

      {/* Contacts list */}
      <div className="space-y-2">
      {contacts.map((projectContact) => {
          const contact = projectContact.contact;
          if (!contact) return null;

          const isPrimary = projectContact.is_primary;
          const displayName = contact.name || `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || "Contact";

          return (
            <div
              key={projectContact.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={contact.avatar_url || ""} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {displayName}
                  </span>
                  {isPrimary && (
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-medium">{getRoleLabel(projectContact.role)}</span>
                  {contact.role && <span>• {contact.role}</span>}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title={contact.phone}
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title={contact.email}
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
