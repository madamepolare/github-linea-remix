import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, Building2, Target, Plus, Loader2 } from "lucide-react";
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
        return { label: "Nouveau Contact", action: () => setCreateContactOpen(true) };
      case "companies":
        return { label: "Nouvelle Entreprise", action: () => setCreateCompanyOpen(true) };
      case "leads":
        return { label: "Nouvelle Opportunité", action: () => setCreateLeadOpen(true) };
      default:
        return null;
    }
  };

  const createAction = getCreateAction();

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <PageHeader
          icon={Target}
          title="CRM"
          description="Gérez vos contacts, entreprises et opportunités"
          actions={
            createAction && (
              <Button onClick={createAction.action}>
                <Plus className="h-4 w-4 mr-2" />
                {createAction.label}
              </Button>
            )
          }
          tabs={
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="contacts" className="gap-2">
                  <Users className="h-4 w-4" />
                  Contacts
                </TabsTrigger>
                <TabsTrigger value="companies" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Entreprises
                </TabsTrigger>
                <TabsTrigger value="leads" className="gap-2">
                  <Target className="h-4 w-4" />
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
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
