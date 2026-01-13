import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityEmailsTab } from "@/components/shared/EntityEmailsTab";
import {
  Users,
  Mail,
  Phone,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { useContacts, Contact } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useLeads } from "@/hooks/useLeads";
import { useTopBar } from "@/contexts/TopBarContext";
import { CONTACT_TABS } from "@/lib/entityTabsConfig";
import { THIN_STROKE } from "@/components/ui/icon";
import { EntityTasksList } from "@/components/tasks/EntityTasksList";
import { useCRMSettings } from "@/hooks/useCRMSettings";

// New modular components
import { ContactInfoPanel } from "@/components/crm/contact/ContactInfoPanel";
import { ContactStatsCards } from "@/components/crm/contact/ContactStatsCards";
import { ContactLeadsSection } from "@/components/crm/contact/ContactLeadsSection";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { useAuth } from "@/contexts/AuthContext";

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allContacts, isLoading, updateContact } = useContacts();
  const { allCompanies } = useCRMCompanies();
  const { leads } = useLeads();
  const { setEntityConfig } = useTopBar();
  const { activeWorkspace } = useAuth();
  const { getContactTypeLabel, getContactTypeColor } = useCRMSettings();

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

      const typeColor = getContactTypeColor(contact.contact_type || "client");

      setEntityConfig({
        backTo: "/crm/contacts",
        color: typeColor,
        title: contact.name,
        badges: contact.contact_type ? [
          {
            label: getContactTypeLabel(contact.contact_type),
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
  }, [contact, activeTab, isEditing, contactLeads.length, setEntityConfig, getContactTypeLabel, getContactTypeColor]);

  const handleSave = () => {
    if (contact && editData) {
      updateContact.mutate({ id: contact.id, ...editData });
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex-1 overflow-auto p-6">
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
          <div className="space-y-6">
            {/* Stats Cards */}
            <ContactStatsCards leads={contactLeads} />

            {/* Main Content - 2 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Info Panel */}
              <div className="lg:col-span-1">
                <ContactInfoPanel
                  contact={contact}
                  company={company || null}
                  isEditing={isEditing}
                  editData={editData}
                  onEditDataChange={setEditData}
                  allCompanies={allCompanies}
                />
              </div>

              {/* Right Column - Leads & Activity */}
              <div className="lg:col-span-2 space-y-6">
                <ContactLeadsSection 
                  leads={contactLeads} 
                  contactId={contact.id} 
                />
                <ActivityTimeline
                  entityType="contact"
                  entityId={id}
                  workspaceId={activeWorkspace?.id}
                  maxItems={10}
                />
              </div>
            </div>
          </div>
        );
      case "emails":
        return (
          <EntityEmailsTab 
            entityType="contact" 
            entityId={contact.id} 
            defaultRecipientEmail={contact.email || undefined}
            defaultRecipientName={contact.name}
          />
        );
      case "tasks":
        return <EntityTasksList entityType="contact" entityId={contact.id} entityName={contact.name} />;
      case "leads":
        return <ContactLeadsSection leads={contactLeads} contactId={contact.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      {renderTabContent()}
    </div>
  );
}
