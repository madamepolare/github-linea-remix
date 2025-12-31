import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building2, MapPin } from "lucide-react";
import { Contact } from "@/hooks/useContacts";

interface ContactDetailSheetProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetailSheet({ contact, open, onOpenChange }: ContactDetailSheetProps) {
  if (!contact) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={contact.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {contact.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle>{contact.name}</SheetTitle>
              {contact.role && <p className="text-muted-foreground">{contact.role}</p>}
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {contact.company && (
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <span>{contact.company.name}</span>
            </div>
          )}
          {contact.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <a href={`tel:${contact.phone}`}>{contact.phone}</a>
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span>{contact.location}</span>
            </div>
          )}
          {contact.notes && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">{contact.notes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
