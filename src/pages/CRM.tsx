import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Building2, Target } from "lucide-react";
import { CRMContactsTable } from "@/components/crm/CRMContactsTable";
import { CRMCompanyTable } from "@/components/crm/CRMCompanyTable";
import { LeadPipeline } from "@/components/crm/LeadPipeline";
import { CreateContactDialog } from "@/components/crm/CreateContactDialog";
import { CreateCompanyDialog } from "@/components/crm/CreateCompanyDialog";
import { CreateLeadDialog } from "@/components/crm/CreateLeadDialog";
import { usePipelines } from "@/hooks/useLeads";

export default function CRM() {
  const [activeTab, setActiveTab] = useState("contacts");
  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);

  const { pipelines, isLoading: pipelinesLoading, createDefaultPipeline } = usePipelines();

  useEffect(() => {
    if (!pipelinesLoading && pipelines.length === 0) {
      createDefaultPipeline.mutate();
    }
  }, [pipelinesLoading, pipelines.length]);

  const getCreateAction = () => {
    switch (activeTab) {
      case "contacts":
        return { label: "Contact", onClick: () => setCreateContactOpen(true) };
      case "companies":
        return { label: "Entreprise", onClick: () => setCreateCompanyOpen(true) };
      case "leads":
        return { label: "Opportunité", onClick: () => setCreateLeadOpen(true) };
      default:
        return undefined;
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <PageHeader
          icon={Target}
          title="CRM"
          description="Gérez vos contacts, entreprises et opportunités"
          primaryAction={getCreateAction()}
          tabs={
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-9 p-1 bg-transparent border-0">
                <TabsTrigger value="contacts" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
                  <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Contacts
                </TabsTrigger>
                <TabsTrigger value="companies" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
                  <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Entreprises
                </TabsTrigger>
                <TabsTrigger value="leads" className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-muted">
                  <Target className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Opportunités
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
        />

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "contacts" && (
            <CRMContactsTable onCreateContact={() => setCreateContactOpen(true)} />
          )}
          {activeTab === "companies" && (
            <CRMCompanyTable onCreateCompany={() => setCreateCompanyOpen(true)} />
          )}
          {activeTab === "leads" && (
            pipelinesLoading || createDefaultPipeline.isPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pipelines.length > 0 ? (
              <LeadPipeline pipeline={pipelines[0]} onCreateLead={() => setCreateLeadOpen(true)} />
            ) : null
          )}
        </div>
      </div>

      <CreateContactDialog open={createContactOpen} onOpenChange={setCreateContactOpen} />
      <CreateCompanyDialog open={createCompanyOpen} onOpenChange={setCreateCompanyOpen} />
      <CreateLeadDialog 
        open={createLeadOpen} 
        onOpenChange={setCreateLeadOpen} 
        pipeline={pipelines[0]}
      />
    </MainLayout>
  );
}
