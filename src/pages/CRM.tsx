import { useState, useEffect, lazy, Suspense, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CRMCommandBar } from "@/components/crm/CRMCommandBar";
import { AIProspectingSheet } from "@/components/crm/AIProspectingSheet";
import { ContactFormDialog } from "@/components/crm/ContactFormDialog";
import { CompanyFormDialog } from "@/components/crm/CompanyFormDialog";
import { ImportContactsDialog } from "@/components/crm/ImportContactsDialog";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy components to improve navigation speed
const CRMOverview = lazy(() => import("@/components/crm/CRMOverview").then(m => ({ default: m.CRMOverview })));
const CRMContactsTable = lazy(() => import("@/components/crm/CRMContactsTable").then(m => ({ default: m.CRMContactsTable })));
const CRMCompanyTable = lazy(() => import("@/components/crm/CRMCompanyTable").then(m => ({ default: m.CRMCompanyTable })));
const CRMProspectionView = lazy(() => import("@/components/crm/CRMProspectionView").then(m => ({ default: m.CRMProspectionView })));

type CRMView = "overview" | "contacts" | "companies" | "prospection";

function CRMLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  );
}

function CRM() {
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
          <Suspense fallback={<CRMLoadingSkeleton />}>
            {renderContent()}
          </Suspense>
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

export default memo(CRM);
