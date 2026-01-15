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
// useLeads kept for potential future use but contactLeads filtering removed
import { useTopBar } from "@/contexts/TopBarContext";
import { CONTACT_TABS } from "@/lib/entityTabsConfig";
import { THIN_STROKE } from "@/components/ui/icon";
import { EntityTasksList } from "@/components/tasks/EntityTasksList";
import { useCRMSettings } from "@/hooks/useCRMSettings";

// New modular components
import { ContactInfoPanel } from "@/components/crm/contact/ContactInfoPanel";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { ContactPortalSettings } from "@/components/crm/contact/ContactPortalSettings";
import { useAuth } from "@/contexts/AuthContext";

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allContacts, isLoading, updateContact } = useContacts();
  const { allCompanies } = useCRMCompanies();
  // Leads hook removed - leads now displayed in company overview only
  const { setEntityConfig } = useTopBar();
  const { activeWorkspace } = useAuth();
  const { getContactTypeLabel, getContactTypeColor } = useCRMSettings();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Contact>>({});
  const [activeTab, setActiveTab] = useState("info");

  const contact = allContacts.find((c) => c.id === id);
  // contactLeads removed - leads now displayed in company overview only
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
      // Filter out leads tab - leads should be on company overview, not contact
      const updatedTabs = CONTACT_TABS
        .filter(tab => tab.key !== "leads")
        .map(tab => ({
          ...tab,
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
  }, [contact, activeTab, isEditing, setEntityConfig, getContactTypeLabel, getContactTypeColor]);

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
            {/* Main Content - 2 columns: larger left, smaller right */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column - Info Panel (larger) */}
              <div className="lg:col-span-3 space-y-6">
                <ContactInfoPanel
                  contact={contact}
                  company={company || null}
                  isEditing={isEditing}
                  editData={editData}
                  onEditDataChange={setEditData}
                  allCompanies={allCompanies}
                />
                <ContactPortalSettings 
                  contactId={contact.id}
                  contactName={contact.name}
                />
              </div>

              {/* Right Column - Activity & Actions (smaller) */}
              <div className="lg:col-span-2 space-y-6">
                <ActivityTimeline
                  entityType="contact"
                  entityId={id}
                  workspaceId={activeWorkspace?.id}
                  maxItems={15}
                  showHeader={true}
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
