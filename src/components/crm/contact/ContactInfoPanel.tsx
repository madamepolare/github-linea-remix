import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Globe,
} from "lucide-react";
import { Contact } from "@/hooks/useContacts";
import { CRMCompany } from "@/hooks/useCRMCompanies";
import { CountryFlag } from "@/components/ui/country-flag";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ContactInfoPanelProps {
  contact: Contact;
  company: CRMCompany | null;
  isEditing: boolean;
  editData: Partial<Contact>;
  onEditDataChange: (data: Partial<Contact>) => void;
  allCompanies: CRMCompany[];
}

export function ContactInfoPanel({
  contact,
  company,
  isEditing,
  editData,
  onEditDataChange,
  allCompanies,
}: ContactInfoPanelProps) {
  const { contactTypes, getContactTypeLabel, getContactTypeColor } = useCRMSettings();

  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-background shadow-lg">
              <AvatarImage src={contact.avatar_url || undefined} alt={contact.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editData.name || ""}
                  onChange={(e) => onEditDataChange({ ...editData, name: e.target.value })}
                  className="text-xl font-semibold h-auto py-1 mb-2"
                />
              ) : (
                <h2 className="text-xl font-semibold truncate">{contact.name}</h2>
              )}
              {isEditing ? (
                <Input
                  value={editData.role || ""}
                  onChange={(e) => onEditDataChange({ ...editData, role: e.target.value })}
                  placeholder="Rôle / Fonction"
                  className="text-sm h-auto py-1"
                />
              ) : (
                contact.role && (
                  <p className="text-sm text-muted-foreground">{contact.role}</p>
                )
              )}
              <div className="flex items-center gap-2 mt-2">
                {isEditing ? (
                  <Select
                    value={editData.contact_type || "client"}
                    onValueChange={(v) => onEditDataChange({ ...editData, contact_type: v })}
                  >
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contactTypes.map((type) => (
                        <SelectItem key={type.key} value={type.key}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  contact.contact_type && (
                    <Badge
                      variant="outline"
                      className="font-medium border"
                      style={{
                        backgroundColor: `${getContactTypeColor(contact.contact_type)}20`,
                        borderColor: `${getContactTypeColor(contact.contact_type)}40`,
                        color: getContactTypeColor(contact.contact_type),
                      }}
                    >
                      {getContactTypeLabel(contact.contact_type)}
                    </Badge>
                  )
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <Input
                  type="email"
                  value={editData.email || ""}
                  onChange={(e) => onEditDataChange({ ...editData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Téléphone</label>
                <Input
                  value={editData.phone || ""}
                  onChange={(e) => onEditDataChange({ ...editData, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Localisation</label>
                <Input
                  value={editData.location || ""}
                  onChange={(e) => onEditDataChange({ ...editData, location: e.target.value })}
                  placeholder="Paris, France"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">URL Avatar</label>
                <Input
                  value={editData.avatar_url || ""}
                  onChange={(e) => onEditDataChange({ ...editData, avatar_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {contact.email}
                    </p>
                  </div>
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {contact.phone}
                    </p>
                  </div>
                </a>
              )}
              {contact.location && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg">
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Localisation</p>
                    <div className="flex items-center gap-2">
                      <CountryFlag location={contact.location} size="sm" />
                      <p className="text-sm font-medium">{contact.location}</p>
                    </div>
                  </div>
                </div>
              )}
              {!contact.email && !contact.phone && !contact.location && (
                <p className="text-sm text-muted-foreground italic p-2">Aucune coordonnée</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Link */}
      {(company || isEditing) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entreprise</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Select
                value={editData.crm_company_id || "_none"}
                onValueChange={(v) =>
                  onEditDataChange({
                    ...editData,
                    crm_company_id: v === "_none" ? null : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Aucune</SelectItem>
                  {allCompanies
                    .filter((c) => c.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : company ? (
              <Link
                to={`/crm/companies/${company.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{company.name}</p>
                  {company.city && (
                    <p className="text-xs text-muted-foreground">{company.city}</p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </Link>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editData.notes || ""}
              onChange={(e) => onEditDataChange({ ...editData, notes: e.target.value })}
              rows={4}
              placeholder="Notes sur ce contact..."
            />
          ) : (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {contact.notes || "Aucune note"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="text-xs text-muted-foreground px-1">
        Créé le {format(new Date(contact.created_at!), "d MMMM yyyy", { locale: fr })}
      </div>
    </div>
  );
}
