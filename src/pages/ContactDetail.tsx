import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Users,
  Target,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Save,
  X,
  ExternalLink,
} from "lucide-react";
import { useContacts, Contact } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useLeads, Lead } from "@/hooks/useLeads";
import { useTopBar } from "@/contexts/TopBarContext";
import { CONTACT_TABS } from "@/lib/entityTabsConfig";
import { THIN_STROKE } from "@/components/ui/icon";
import { EntityTasksList } from "@/components/tasks/EntityTasksList";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const contactTypeLabels: Record<string, string> = {
  client: "Client",
  amo: "AMO",
  bet: "BET",
  entreprise: "Entreprise",
  fournisseur: "Fournisseur",
  partenaire: "Partenaire",
};

const contactTypeColors: Record<string, string> = {
  client: "bg-emerald-500",
  amo: "bg-cyan-500",
  bet: "bg-orange-500",
  entreprise: "bg-amber-500",
  fournisseur: "bg-purple-500",
  partenaire: "bg-pink-500",
};

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allContacts, isLoading, updateContact } = useContacts();
  const { allCompanies } = useCRMCompanies();
  const { leads } = useLeads();
  const { setEntityConfig } = useTopBar();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Contact>>({});
  const [activeTab, setActiveTab] = useState("info");

  const contact = allContacts.find((c) => c.id === id);
  const contactLeads = leads.filter((l) => l.contact_id === id);
  const company = contact?.crm_company_id
    ? allCompanies.find((c) => c.id === contact.crm_company_id)
    : null;

  useEffect(() => {
    if (contact) {
      setEditData(contact);
    }
  }, [contact]);

  // Configure TopBar for entity view
  useEffect(() => {
    if (contact) {
      const updatedTabs = CONTACT_TABS.map(tab => ({
        ...tab,
        badge: tab.key === "leads" ? contactLeads.length : undefined,
      }));

      setEntityConfig({
        backTo: "/crm/contacts",
        color: contactTypeColors[contact.contact_type || "client"]?.replace("bg-", "#") || "#10b981",
        title: contact.name,
        badges: contact.contact_type ? [
          {
            label: contactTypeLabels[contact.contact_type] || contact.contact_type,
            variant: "outline" as const,
          },
        ] : [],
        metadata: [
          ...(contact.role ? [{ label: contact.role }] : []),
          ...(contact.email ? [{ icon: Mail, label: contact.email }] : []),
          ...(contact.phone ? [{ icon: Phone, label: contact.phone }] : []),
        ],
        tabs: updatedTabs,
        activeTab,
        onTabChange: setActiveTab,
        actions: (
          <div className="flex items-center gap-2">
            {contact.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${contact.email}`}>
                  <Mail className="h-4 w-4 mr-1.5" strokeWidth={THIN_STROKE} />
                  Email
                </a>
              </Button>
            )}
            {contact.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${contact.phone}`}>
                  <Phone className="h-4 w-4 mr-1.5" strokeWidth={THIN_STROKE} />
                  Appeler
                </a>
              </Button>
            )}
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-1.5" strokeWidth={THIN_STROKE} />
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateContact.isPending}>
                  <Save className="h-4 w-4 mr-1.5" strokeWidth={THIN_STROKE} />
                  Enregistrer
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-1.5" strokeWidth={THIN_STROKE} />
                Modifier
              </Button>
            )}
          </div>
        ),
      });
    }
    
    return () => setEntityConfig(null);
  }, [contact, activeTab, isEditing, contactLeads.length, setEntityConfig]);

  const handleSave = () => {
    if (contact && editData) {
      updateContact.mutate({ id: contact.id, ...editData });
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Contact non trouvé</h2>
          <Button variant="link" onClick={() => navigate("/crm/contacts")}>
            Retour aux contacts
          </Button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "info":
        return (
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Company Link */}
              {company && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground">Entreprise</h3>
                  <Link
                    to={`/crm/companies/${company.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" strokeWidth={THIN_STROKE} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{company.name}</p>
                      {company.city && (
                        <p className="text-xs text-muted-foreground">{company.city}</p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
                  </Link>
                </div>
              )}

              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Coordonnées</h3>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Nom</label>
                        <Input
                          value={editData.name || ""}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Email</label>
                        <Input
                          type="email"
                          value={editData.email || ""}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Téléphone</label>
                        <Input
                          value={editData.phone || ""}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Rôle</label>
                        <Input
                          value={editData.role || ""}
                          onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Type</label>
                        <Select
                          value={editData.contact_type || "client"}
                          onValueChange={(v) => setEditData({ ...editData, contact_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(contactTypeLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Localisation</label>
                        <Input
                          value={editData.location || ""}
                          onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                          placeholder="Paris, France"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">URL de l'avatar</label>
                        <Input
                          value={editData.avatar_url || ""}
                          onChange={(e) => setEditData({ ...editData, avatar_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      {allCompanies.length > 0 && (
                        <div>
                          <label className="text-xs text-muted-foreground">Entreprise</label>
                          <Select
                            value={editData.crm_company_id || undefined}
                            onValueChange={(v) =>
                              setEditData({
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
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contact.email && (
                        <div className="flex items-center gap-3 p-2">
                          <Mail className="h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
                          <span className="text-sm">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-3 p-2">
                          <Phone className="h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
                          <span className="text-sm">{contact.phone}</span>
                        </div>
                      )}
                      {contact.location && (
                        <div className="flex items-center gap-3 p-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
                          <span className="text-sm">{contact.location}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Notes</h3>
                  {isEditing ? (
                    <Textarea
                      value={editData.notes || ""}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      rows={5}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {contact.notes || "Aucune note"}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t text-xs text-muted-foreground">
                Créé le {format(new Date(contact.created_at!), "d MMMM yyyy", { locale: fr })}
              </div>
            </CardContent>
          </Card>
        );
      case "tasks":
        return <EntityTasksList entityType="contact" entityId={contact.id} entityName={contact.name} />;
      case "leads":
        return (
          <Card>
            <CardContent className="p-6">
              {contactLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2" strokeWidth={THIN_STROKE} />
                  <p className="text-sm">Aucune opportunité associée</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contactLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      to={`/crm/leads/${lead.id}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lead.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {lead.estimated_value && (
                            <span>
                              {new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                                maximumFractionDigits: 0,
                              }).format(lead.estimated_value)}
                            </span>
                          )}
                        </div>
                      </div>
                      {lead.stage && (
                        <Badge
                          style={{ backgroundColor: lead.stage.color || "#6366f1" }}
                          className="text-white text-xs"
                        >
                          {lead.stage.name}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {renderTabContent()}
      </div>
    </div>
  );
}
