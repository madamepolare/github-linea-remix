import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CRMContactsTable } from "@/components/crm/CRMContactsTable";
import { CRMCompanyTable } from "@/components/crm/CRMCompanyTable";
import { CRMLeadsView } from "@/components/crm/CRMLeadsView";
import { CreateContactDialog } from "@/components/crm/CreateContactDialog";
import { CreateCompanyDialog } from "@/components/crm/CreateCompanyDialog";
import { ImportContactsDialog } from "@/components/crm/ImportContactsDialog";
import { CRMOverview } from "@/components/crm/CRMOverview";
import { CRMCommandBar } from "@/components/crm/CRMCommandBar";
import { AIProspectionPlayground } from "@/components/crm/AIProspectionPlayground";
import { useLeads } from "@/hooks/useLeads";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";

type CRMView = "overview" | "contacts" | "companies" | "leads" | "prospection";

export default function CRM() {
  const { section } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [importContactsOpen, setImportContactsOpen] = useState(false);
  const [commandBarOpen, setCommandBarOpen] = useState(false);

  // Redirect old routes
  useEffect(() => {
    if (section === "leads-table" || section === "development") {
      navigate("/crm/leads", { replace: true });
    }
  }, [section, navigate]);

  const view = (section as CRMView) || "overview";
  
  // Redirect invalid views to overview
  useEffect(() => {
    const validViews: CRMView[] = ["overview", "contacts", "companies", "leads", "prospection"];
    if (section && !validViews.includes(section as CRMView)) {
      navigate("/crm/overview", { replace: true });
    }
  }, [section, navigate]);

  const { stats: leadStats } = useLeads();
  const { allCompanies } = useCRMCompanies();
  const { allContacts } = useContacts();

  // Listen for command palette events
  useEffect(() => {
    const handleCreateContact = () => setCreateContactOpen(true);
    const handleCreateCompany = () => setCreateCompanyOpen(true);
    
    window.addEventListener("open-create-contact", handleCreateContact);
    window.addEventListener("open-create-company", handleCreateCompany);
    return () => {
      window.removeEventListener("open-create-contact", handleCreateContact);
      window.removeEventListener("open-create-company", handleCreateCompany);
    };
  }, []);

  const renderContent = () => {
    switch (view) {
      case "overview":
        return (
          <CRMOverview
            onNavigate={(v) => navigate(`/crm/${v}`)}
            companiesCount={allCompanies.length}
            contactsCount={allContacts.length}
            leadStats={leadStats}
            companies={allCompanies}
            contacts={allContacts}
          />
        );

      case "companies":
        return (
          <CRMCompanyTable search={searchQuery} onCreateCompany={() => setCreateCompanyOpen(true)} />
        );

      case "contacts":
        return (
          <CRMContactsTable 
            search={searchQuery} 
            onCreateContact={() => setCreateContactOpen(true)} 
            onImportContacts={() => setImportContactsOpen(true)}
          />
        );

      case "leads":
        return <CRMLeadsView searchQuery={searchQuery} />;

      case "prospection":
        return <AIProspectionPlayground />;

      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">        
        <div className="flex-1 overflow-auto p-4">
          {renderContent()}
        </div>
      </div>

      <CRMCommandBar open={commandBarOpen} onOpenChange={setCommandBarOpen} />
      <CreateContactDialog open={createContactOpen} onOpenChange={setCreateContactOpen} />
      <CreateCompanyDialog open={createCompanyOpen} onOpenChange={setCreateCompanyOpen} />
      <ImportContactsDialog open={importContactsOpen} onOpenChange={setImportContactsOpen} />
    </>
  );
}
