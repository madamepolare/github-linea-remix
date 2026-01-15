import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  MapPin,
  Phone,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { useCRMCompanies, CRMCompanyEnriched } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
// useLeads removed - leads/opportunities no longer shown on company detail
import { useCompanyDepartments } from "@/hooks/useCompanyDepartments";
import { useTopBar } from "@/contexts/TopBarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { COMPANY_TABS } from "@/lib/entityTabsConfig";
import { CompanyCategory } from "@/lib/crmTypes";
import { EntityTasksList } from "@/components/tasks/EntityTasksList";
import { EntityDocumentsList } from "@/components/crm/EntityDocumentsList";
import { EntityInvoicesList } from "@/components/crm/EntityInvoicesList";
import { EntityCommercialList } from "@/components/crm/EntityCommercialList";
import { EntityEmailsTab } from "@/components/shared/EntityEmailsTab";
import { ContactFormDialog } from "@/components/crm/ContactFormDialog";
import { CompanyDepartmentsSection } from "@/components/crm/CompanyDepartmentsSection";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { LinkedEntitiesPanel } from "@/components/shared/LinkedEntitiesPanel";

// New modular components
import { CompanyInfoPanel } from "@/components/crm/company/CompanyInfoPanel";
import { CompanyContactsSection } from "@/components/crm/company/CompanyContactsSection";
import { CompanyBillingPanel } from "@/components/crm/company/CompanyBillingPanel";
import { CompanyPortalSettings } from "@/components/crm/company/CompanyPortalSettings";

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setEntityConfig } = useTopBar();
  const { activeWorkspace } = useAuth();
  const { allCompanies, isLoading, updateCompany } = useCRMCompanies();
  const { contacts } = useContacts();
  // leads hook removed - opportunities not shown
  const { departments } = useCompanyDepartments(id || "");
  const {
    companyTypes,
    betSpecialties,
    getCategoryFromType,
    getBetSpecialtyLabel,
    getBetSpecialtyColor,
  } = useCRMSettings();

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<CRMCompanyEnriched>>({});
  const [selectedCategory, setSelectedCategory] = useState<CompanyCategory | "">("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [createContactOpen, setCreateContactOpen] = useState(false);

  const company = allCompanies.find((c) => c.id === id);
  const companyId = company?.id;
  const companyContacts = contacts.filter((c) => c.crm_company_id === id);
  // Leads removed - no longer showing opportunities on company detail

  // Helpers
  const getCategoryFromIndustry = (industry: string | null | undefined): CompanyCategory | "" => {
    if (!industry) return "";
    if (industry.startsWith("bet_")) return "bet";
    return (getCategoryFromType(industry) as CompanyCategory) || "";
  };

  const getNormalizedBetSpecialties = (
    industry: string | null | undefined,
    specs: string[] | null | undefined
  ) => {
    if (industry?.startsWith("bet_")) {
      const legacy = industry.slice("bet_".length);
      if (specs && specs.length > 0) return specs;
      return legacy ? [legacy] : [];
    }
    return specs || [];
  };

  const companyTypesRef = useRef(companyTypes);
  useEffect(() => {
    companyTypesRef.current = companyTypes;
  }, [companyTypes]);

  const getCompanyTypeLabelLocal = (key: string) =>
    companyTypesRef.current.find((t) => t.key === key)?.label || key;

  const getCompanyTypeColorLocal = (key: string) =>
    companyTypesRef.current.find((t) => t.key === key)?.color || "#3B82F6";

  const handleSave = useCallback(() => {
    if (!company) return;

    const finalBetSpecialties =
      selectedCategory === "bet" && selectedSpecialties.length > 0 ? selectedSpecialties : null;

    updateCompany.mutate({
      id: company.id,
      ...editData,
      industry: selectedCategory === "bet" ? "bet" : (editData.industry as string | null | undefined) || null,
      bet_specialties: finalBetSpecialties,
    });

    setIsEditing(false);
  }, [company, editData, selectedCategory, selectedSpecialties, updateCompany]);

  // Set up TopBar entity config
  useEffect(() => {
    if (company) {
      const metadata = [] as { icon: any; label: string }[];
      if (company.city) metadata.push({ icon: MapPin, label: company.city });
      if (company.phone) metadata.push({ icon: Phone, label: company.phone });

      const industry = company.industry || "";
      const specs = getNormalizedBetSpecialties(company.industry, company.bet_specialties);
      const isBet = industry === "bet" || industry.startsWith("bet_");

      const badgeLabel = isBet
        ? `BET${specs.length ? ` · ${specs.map(getBetSpecialtyLabel).join(", ")}` : ""}`
        : getCompanyTypeLabelLocal(industry) || "Autre";

      const color = isBet
        ? specs.length ? getBetSpecialtyColor(specs[0]) : getCompanyTypeColorLocal("bet")
        : getCompanyTypeColorLocal(industry) || "#3B82F6";

      setEntityConfig({
        backTo: "/crm/companies",
        color,
        title: company.name,
        badges: [{ label: badgeLabel, variant: "outline" as const }],
        metadata,
        tabs: COMPANY_TABS,
        activeTab,
        onTabChange: setActiveTab,
        actions: (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      ...company,
                      industry: company.industry?.startsWith("bet_") ? "bet" : company.industry,
                    });
                    setSelectedCategory(getCategoryFromIndustry(company.industry));
                    setSelectedSpecialties(getNormalizedBetSpecialties(company.industry, company.bet_specialties));
                  }}
                >
                  <X className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateCompany.isPending}>
                  <Save className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Enregistrer
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Modifier
              </Button>
            )}
          </div>
        ),
      });
    }

    return () => {
      setEntityConfig(null);
    };
  }, [company, activeTab, isEditing, updateCompany.isPending, setEntityConfig, handleSave]);

  // Initialize form state when company changes
  useEffect(() => {
    if (company && !isEditing) {
      const normalizedIndustry = company.industry?.startsWith("bet_") ? "bet" : company.industry;
      const normalizedSpecs = getNormalizedBetSpecialties(company.industry, company.bet_specialties);

      setEditData({ ...company, industry: normalizedIndustry, bet_specialties: normalizedSpecs });
      setSelectedCategory(getCategoryFromIndustry(company.industry));
      setSelectedSpecialties(normalizedSpecs);
    }
  }, [companyId, isEditing]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Skeleton className="h-20 md:h-24" />
            <Skeleton className="h-20 md:h-24" />
            <Skeleton className="h-20 md:h-24 hidden md:block" />
            <Skeleton className="h-20 md:h-24 hidden md:block" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Skeleton className="h-64 md:h-96" />
            <Skeleton className="h-64 md:h-96 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Entreprise non trouvée</h2>
          <Button variant="link" onClick={() => navigate("/crm/companies")}>
            Retour aux entreprises
          </Button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4 md:space-y-6">
            {/* Main Content - responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Left Column - Info Panel & Billing */}
              <div className="md:col-span-1 lg:col-span-1 space-y-4 md:space-y-6 order-2 md:order-1">
                <CompanyInfoPanel
                  company={company}
                  isEditing={isEditing}
                  editData={editData}
                  onEditDataChange={setEditData}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  selectedSpecialties={selectedSpecialties}
                  onSpecialtiesChange={setSelectedSpecialties}
                />
                <CompanyBillingPanel company={company} />
              </div>

              {/* Right Column - Contacts first, then Departments, Activity */}
              <div className="md:col-span-1 lg:col-span-2 space-y-4 md:space-y-6 order-1 md:order-2">
                {/* Contacts - moved to top */}
                <CompanyContactsSection
                  contacts={companyContacts.slice(0, 5)}
                  onAddContact={() => setCreateContactOpen(true)}
                />

                {/* Departments / Organigramme */}
                <CompanyDepartmentsSection
                  companyId={company.id}
                  companyContacts={companyContacts}
                />

                {/* Activity & Related - stack on mobile/tablet, side by side on xl */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <LinkedEntitiesPanel
                    entityType="company"
                    entityId={id}
                    workspaceId={activeWorkspace?.id}
                  />
                  <ActivityTimeline
                    entityType="company"
                    entityId={id}
                    workspaceId={activeWorkspace?.id}
                    maxItems={8}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case "emails":
        return (
          <EntityEmailsTab
            entityType="company"
            entityId={company.id}
            defaultRecipientEmail={company.email || undefined}
          />
        );
      case "contacts":
        return (
          <div className="space-y-6">
            <CompanyDepartmentsSection
              companyId={company.id}
              companyContacts={companyContacts}
            />
            <CompanyContactsSection
              contacts={companyContacts}
              onAddContact={() => setCreateContactOpen(true)}
            />
          </div>
        );
      // leads tab removed - opportunities/leads no longer shown on company detail
      case "tasks":
      case "tasks":
        return (
          <EntityTasksList
            entityType="company"
            entityId={company.id}
            entityName={company.name}
          />
        );
      case "documents":
        return <EntityDocumentsList entityType="company" entityId={company.id} />;
      case "invoicing":
        return <EntityInvoicesList entityType="company" entityId={company.id} />;
      case "commercial":
        return <EntityCommercialList entityType="company" entityId={company.id} />;
      case "portal":
        return <CompanyPortalSettings companyId={company.id} companyName={company.name} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {renderTabContent()}
      </div>

      <ContactFormDialog
        mode="create"
        open={createContactOpen}
        onOpenChange={setCreateContactOpen}
        defaultCompanyId={company.id}
      />
    </>
  );
}
