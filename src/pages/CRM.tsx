import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Plus, Target, Users, Building2, TrendingUp } from "lucide-react";
import { CRMContactsTable } from "@/components/crm/CRMContactsTable";
import { CRMCompanyTable } from "@/components/crm/CRMCompanyTable";
import { LeadPipeline } from "@/components/crm/LeadPipeline";
import { CreateContactDialog } from "@/components/crm/CreateContactDialog";
import { CreateCompanyDialog } from "@/components/crm/CreateCompanyDialog";
import { CreateLeadDialog } from "@/components/crm/CreateLeadDialog";
import { CRMOverview } from "@/components/crm/CRMOverview";
import { usePipelines, useLeads } from "@/hooks/useLeads";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";

type CRMView = "overview" | "leads" | "contacts" | "companies";

export default function CRM() {
  const [view, setView] = useState<CRMView>("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);

  const { pipelines, isLoading: pipelinesLoading, createDefaultPipeline } = usePipelines();
  const { stats: leadStats } = useLeads();
  const { allCompanies } = useCRMCompanies();
  const { allContacts } = useContacts();

  useEffect(() => {
    if (!pipelinesLoading && pipelines.length === 0) {
      createDefaultPipeline.mutate();
    }
  }, [pipelinesLoading, pipelines.length]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M€`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k€`;
    }
    return `${value}€`;
  };

  const totalEntities = allCompanies.length + allContacts.length + leadStats.total;

  return (
    <>
      <MainLayout>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">CRM</h1>
                <p className="text-sm text-muted-foreground">
                  {totalEntities} entités · {formatCurrency(leadStats.weightedValue)} en pipeline
                </p>
              </div>

              {/* Add dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setCreateCompanyOpen(true)}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Entreprise
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCreateContactOpen(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    Contact
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCreateLeadOpen(true)}>
                    <Target className="h-4 w-4 mr-2" />
                    Opportunité
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Tabs */}
            <Tabs value={view} onValueChange={(v) => setView(v as CRMView)}>
              <TabsList className="bg-transparent border-b-0 p-0 h-auto gap-0">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 py-2.5"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger
                  value="leads"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 py-2.5"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Opportunités
                  <Badge variant="secondary" className="ml-2 text-xs h-5 px-1.5">
                    {leadStats.total}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="contacts"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 py-2.5"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Contacts
                  <Badge variant="secondary" className="ml-2 text-xs h-5 px-1.5">
                    {allContacts.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="companies"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 py-2.5"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Entreprises
                  <Badge variant="secondary" className="ml-2 text-xs h-5 px-1.5">
                    {allCompanies.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {view === "overview" && (
              <CRMOverview
                onNavigate={(v) => setView(v as CRMView)}
                companiesCount={allCompanies.length}
                contactsCount={allContacts.length}
                leadStats={leadStats}
                companies={allCompanies}
                contacts={allContacts}
              />
            )}

            {view === "companies" && (
              <CRMCompanyTable
                search={searchQuery}
                onCreateCompany={() => setCreateCompanyOpen(true)}
              />
            )}

            {view === "contacts" && (
              <CRMContactsTable
                search={searchQuery}
                onCreateContact={() => setCreateContactOpen(true)}
              />
            )}

            {view === "leads" && (
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
      </MainLayout>

      <CreateContactDialog open={createContactOpen} onOpenChange={setCreateContactOpen} />
      <CreateCompanyDialog open={createCompanyOpen} onOpenChange={setCreateCompanyOpen} />
      <CreateLeadDialog
        open={createLeadOpen}
        onOpenChange={setCreateLeadOpen}
        pipeline={pipelines[0]}
      />
    </>
  );
}
