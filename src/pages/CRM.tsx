import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
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

  // Create default pipeline if none exists
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
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">CRM</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos contacts, entreprises et opportunités
            </p>
          </div>
          {createAction && (
            <Button onClick={createAction.action}>
              <Plus className="h-4 w-4 mr-2" />
              {createAction.label}
            </Button>
          )}
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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

          <TabsContent value="contacts">
            <CRMContactsTable onCreateContact={() => setCreateContactOpen(true)} />
          </TabsContent>

          <TabsContent value="companies">
            <CRMCompanyTable onCreateCompany={() => setCreateCompanyOpen(true)} />
          </TabsContent>

          <TabsContent value="leads">
            {pipelinesLoading || createDefaultPipeline.isPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pipelines.length > 0 ? (
              <LeadPipeline pipeline={pipelines[0]} onCreateLead={() => setCreateLeadOpen(true)} />
            ) : null}
          </TabsContent>
        </Tabs>
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
