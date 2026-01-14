import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mail, Phone, User, Users } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  avatar_url: string | null;
}

interface CompanyPortalContactsProps {
  contacts: Contact[];
}

export function CompanyPortalContacts({ contacts }: CompanyPortalContactsProps) {
  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">Aucun contact disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {contacts.map((contact) => {
        const initials = contact.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <Card key={contact.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={contact.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials || <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{contact.name}</h3>
                  {contact.role && (
                    <p className="text-sm text-muted-foreground truncate">{contact.role}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {contact.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        asChild
                      >
                        <a href={`mailto:${contact.email}`}>
                          <Mail className="h-3.5 w-3.5 mr-1.5" />
                          Email
                        </a>
                      </Button>
                    )}
                    {contact.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        asChild
                      >
                        <a href={`tel:${contact.phone}`}>
                          <Phone className="h-3.5 w-3.5 mr-1.5" />
                          Appeler
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
