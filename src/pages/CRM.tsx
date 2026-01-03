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
          <div className="flex-shrink-0 border-b border-border bg-card">
            <div className="px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-muted/80 flex items-center justify-center shrink-0">
                    <Target className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-foreground/70" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">CRM</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {totalEntities} entités · {formatCurrency(leadStats.weightedValue)} en pipeline
                    </p>
                  </div>
                </div>

                {/* Add dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="h-8 sm:h-9 gap-1.5 px-3 sm:px-4">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Ajouter</span>
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
            </div>

            {/* Tabs */}
            <Tabs value={view} onValueChange={(v) => setView(v as CRMView)} className="px-4 sm:px-6 overflow-x-auto">
              <TabsList className="h-10 bg-transparent p-0 gap-0.5 sm:gap-1 w-max min-w-full sm:w-auto">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-t-lg border-b-2 border-transparent data-[state=active]:border-primary px-2 sm:px-4 text-xs sm:text-sm"
                >
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Vue d'ensemble</span>
                </TabsTrigger>
                <TabsTrigger
                  value="leads"
                  className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-t-lg border-b-2 border-transparent data-[state=active]:border-primary px-2 sm:px-4 text-xs sm:text-sm"
                >
                  <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Opportunités</span>
                  <Badge variant="secondary" className="ml-1 sm:ml-2 text-[10px] sm:text-xs h-4 sm:h-5 px-1 sm:px-1.5">
                    {leadStats.total}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="contacts"
                  className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-t-lg border-b-2 border-transparent data-[state=active]:border-primary px-2 sm:px-4 text-xs sm:text-sm"
                >
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Contacts</span>
                  <Badge variant="secondary" className="ml-1 sm:ml-2 text-[10px] sm:text-xs h-4 sm:h-5 px-1 sm:px-1.5">
                    {allContacts.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="companies"
                  className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-t-lg border-b-2 border-transparent data-[state=active]:border-primary px-2 sm:px-4 text-xs sm:text-sm"
                >
                  <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Entreprises</span>
                  <Badge variant="secondary" className="ml-1 sm:ml-2 text-[10px] sm:text-xs h-4 sm:h-5 px-1 sm:px-1.5">
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
