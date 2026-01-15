import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CRMContactsTable } from "@/components/crm/CRMContactsTable";
import { CRMCompanyTable } from "@/components/crm/CRMCompanyTable";
import { CRMProspectionView } from "@/components/crm/CRMProspectionView";
import { ContactFormDialog } from "@/components/crm/ContactFormDialog";
import { CompanyFormDialog } from "@/components/crm/CompanyFormDialog";
import { ImportContactsDialog } from "@/components/crm/ImportContactsDialog";
import { CRMOverview } from "@/components/crm/CRMOverview";
import { CRMCommandBar } from "@/components/crm/CRMCommandBar";
import { AIProspectingSheet } from "@/components/crm/AIProspectingSheet";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { useContactPipeline } from "@/hooks/useContactPipeline";
import { useCRMPipelines } from "@/hooks/useCRMPipelines";
type CRMView = "overview" | "contacts" | "companies" | "prospection";

export default function CRM() {
  const { section } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [importContactsOpen, setImportContactsOpen] = useState(false);
  const [commandBarOpen, setCommandBarOpen] = useState(false);
  const [aiProspectingOpen, setAiProspectingOpen] = useState(false);

  // Redirect old routes (leads -> prospection)
  useEffect(() => {
    if (section === "leads-table" || section === "development" || section === "leads") {
      navigate("/crm/prospection", { replace: true });
    }
  }, [section, navigate]);

  const view = (section as CRMView) || "overview";
  
  // Redirect invalid views to overview
  useEffect(() => {
    const validViews: CRMView[] = ["overview", "contacts", "companies", "prospection"];
    if (section && !validViews.includes(section as CRMView)) {
      navigate("/crm/overview", { replace: true });
    }
  }, [section, navigate]);

  const { allCompanies } = useCRMCompanies();
  const { allContacts } = useContacts();
  const { pipelines } = useCRMPipelines();
  
  // Calculate pipeline stats for overview
  const pipelineStats = {
    total: pipelines.length,
    entries: 0, // Will be calculated from pipeline entries
  };

  // Listen for command palette events
  useEffect(() => {
    const handleCreateContact = () => setCreateContactOpen(true);
    const handleCreateCompany = () => setCreateCompanyOpen(true);
    const handleAIProspecting = () => setAiProspectingOpen(true);
    
    window.addEventListener("open-create-contact", handleCreateContact);
    window.addEventListener("open-create-company", handleCreateCompany);
    window.addEventListener("open-ai-prospecting", handleAIProspecting);
    return () => {
      window.removeEventListener("open-create-contact", handleCreateContact);
      window.removeEventListener("open-create-company", handleCreateCompany);
      window.removeEventListener("open-ai-prospecting", handleAIProspecting);
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
            leadStats={pipelineStats}
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

      case "prospection":
        return <CRMProspectionView searchQuery={searchQuery} />;

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
      <ContactFormDialog mode="create" open={createContactOpen} onOpenChange={setCreateContactOpen} />
      <CompanyFormDialog mode="create" open={createCompanyOpen} onOpenChange={setCreateCompanyOpen} />
      <ImportContactsDialog open={importContactsOpen} onOpenChange={setImportContactsOpen} />
      <AIProspectingSheet open={aiProspectingOpen} onOpenChange={setAiProspectingOpen} />
    </>
  );
}
