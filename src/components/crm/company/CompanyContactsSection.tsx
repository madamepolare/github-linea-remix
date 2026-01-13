import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Mail, Phone, ArrowUpRight } from "lucide-react";
import { Contact } from "@/hooks/useContacts";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { CountryFlag } from "@/components/ui/country-flag";

interface CompanyContactsSectionProps {
  contacts: Contact[];
  onAddContact: () => void;
}

export function CompanyContactsSection({ contacts, onAddContact }: CompanyContactsSectionProps) {
  const { getContactTypeLabel, getContactTypeColor } = useCRMSettings();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Contacts
          {contacts.length > 0 && (
            <Badge variant="secondary" className="ml-1">{contacts.length}</Badge>
          )}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={onAddContact}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun contact</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <Link
                key={contact.id}
                to={`/crm/contacts/${contact.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {contact.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate group-hover:text-primary transition-colors">
                      {contact.name}
                    </p>
                    {contact.contact_type && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                        style={{
                          backgroundColor: `${getContactTypeColor(contact.contact_type)}15`,
                          borderColor: `${getContactTypeColor(contact.contact_type)}30`,
                          color: getContactTypeColor(contact.contact_type),
                        }}
                      >
                        {getContactTypeLabel(contact.contact_type)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {contact.role && <span>{contact.role}</span>}
                    {contact.location && (
                      <span className="flex items-center gap-1">
                        <CountryFlag location={contact.location} size="xs" />
                        {contact.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {contact.email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `mailto:${contact.email}`;
                      }}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                  {contact.phone && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `tel:${contact.phone}`;
                      }}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
