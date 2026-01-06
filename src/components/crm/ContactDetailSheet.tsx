import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Building2, MapPin, User, FileText, Edit, ExternalLink } from "lucide-react";
import { Contact } from "@/hooks/useContacts";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { cn } from "@/lib/utils";

interface ContactDetailSheetProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetailSheet({ contact, open, onOpenChange }: ContactDetailSheetProps) {
  const { getContactTypeLabel, getContactTypeColor } = useCRMSettings();
  
  if (!contact) return null;

  const initials = contact.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-0">
          <SheetTitle className="sr-only">Détails du contact</SheetTitle>
        </SheetHeader>

        {/* Header avec avatar et infos principales */}
        <div className="flex flex-col items-center text-center pt-4 pb-6">
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
          
          <div className="flex items-center gap-2 mt-3">
            {contact.contact_type && (
              <Badge 
                variant="outline" 
                className="font-medium border"
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
        </div>

        <Separator className="my-2" />

        {/* Actions rapides */}
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

        <Separator className="my-2" />

        {/* Informations */}
        <div className="py-4 space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Informations
          </h3>
          
          <div className="space-y-3">
            {/* Email */}
            {contact.email && (
              <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
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

            {/* Téléphone */}
            {contact.phone && (
              <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
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

            {/* Entreprise */}
            {contact.company && (
              <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Entreprise</p>
                  <p className="text-sm font-medium text-foreground">{contact.company.name}</p>
                </div>
              </div>
            )}

            {/* Adresse */}
            {contact.location && (
              <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Adresse</p>
                  <p className="text-sm font-medium text-foreground">{contact.location}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {contact.notes && (
          <>
            <Separator className="my-2" />
            <div className="py-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Notes
              </h3>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
