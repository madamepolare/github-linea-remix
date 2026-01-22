import { DetailSheet, DetailSection, DetailDivider } from "@/components/ui/patterns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building2, MapPin, Edit } from "lucide-react";
import { Contact } from "@/hooks/useContacts";
import { useCRMSettings } from "@/hooks/useCRMSettings";

interface ContactDetailSheetProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export function ContactDetailSheet({ contact, open, onOpenChange, onEdit }: ContactDetailSheetProps) {
  const { getContactTypeLabel, getContactTypeColor } = useCRMSettings();
  
  if (!contact) return null;

  const initials = contact.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const headerContent = (
    <div className="flex flex-col items-center text-center py-4">
      <Avatar className="h-20 w-20 mb-4 ring-4 ring-background shadow-lg">
        <AvatarImage src={contact.avatar_url || undefined} alt={contact.name} />
        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xl font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <h2 className="text-xl font-semibold text-foreground">{contact.name}</h2>
      
      {contact.role && (
        <p className="text-sm text-muted-foreground mt-1">{contact.role}</p>
      )}
      
      {contact.contact_type && (
        <Badge 
          variant="outline" 
          className="font-medium border mt-3"
          style={{ 
            backgroundColor: `${getContactTypeColor(contact.contact_type)}20`,
            borderColor: `${getContactTypeColor(contact.contact_type)}40`,
            color: getContactTypeColor(contact.contact_type)
          }}
        >
          {getContactTypeLabel(contact.contact_type)}
        </Badge>
      )}
    </div>
  );

  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title="Détails du contact"
      headerActions={
        onEdit && (
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        )
      }
    >
      {headerContent}

      <DetailDivider />

      {/* Quick Actions */}
      <div className="flex gap-2 py-4">
        {contact.email && (
          <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
            <a href={`mailto:${contact.email}`}>
              <Mail className="h-4 w-4" />
              Email
            </a>
          </Button>
        )}
        {contact.phone && (
          <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
            <a href={`tel:${contact.phone}`}>
              <Phone className="h-4 w-4" />
              Appeler
            </a>
          </Button>
        )}
      </div>

      <DetailDivider />

      {/* Contact Information */}
      <DetailSection title="Informations">
        {/* Email */}
        {contact.email && (
          <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 text-primary shrink-0">
              <Mail className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <a 
                href={`mailto:${contact.email}`} 
                className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block"
              >
                {contact.email}
              </a>
            </div>
          </div>
        )}

        {/* Phone */}
        {contact.phone && (
          <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-success/10 text-success shrink-0">
              <Phone className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Téléphone</p>
              <a 
                href={`tel:${contact.phone}`} 
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {contact.phone}
              </a>
            </div>
          </div>
        )}

        {/* Company */}
        {contact.company && (
          <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-warning/10 text-warning shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Entreprise</p>
              <p className="text-sm font-medium text-foreground">{contact.company.name}</p>
            </div>
          </div>
        )}

        {/* Location */}
        {contact.location && (
          <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-info/10 text-info shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Adresse</p>
              <p className="text-sm font-medium text-foreground">{contact.location}</p>
            </div>
          </div>
        )}
      </DetailSection>

      {/* Notes */}
      {contact.notes && (
        <>
          <DetailDivider />
          <DetailSection title="Notes">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
            </div>
          </DetailSection>
        </>
      )}
    </DetailSheet>
  );
}
