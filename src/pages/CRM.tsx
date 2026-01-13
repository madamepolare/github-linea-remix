import { useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useWorkspaceNavigation } from "@/hooks/useWorkspaceNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Target, Users, Building2, Layers, Search, Sparkles } from "lucide-react";
import { CRMContactsTable } from "@/components/crm/CRMContactsTable";
import { CRMLeadsTable } from "@/components/crm/CRMLeadsTable";
import { CRMCompanyTable } from "@/components/crm/CRMCompanyTable";
import { LeadPipeline } from "@/components/crm/LeadPipeline";
import { ContactPipeline } from "@/components/crm/ContactPipeline";
import { CreateContactDialog } from "@/components/crm/CreateContactDialog";
import { CreateCompanyDialog } from "@/components/crm/CreateCompanyDialog";
import { CreateLeadDialog } from "@/components/crm/CreateLeadDialog";
import { ImportContactsDialog } from "@/components/crm/ImportContactsDialog";
import { CRMOverview } from "@/components/crm/CRMOverview";
import { CRMCommandBar } from "@/components/crm/CRMCommandBar";
import { AIProspectingPanel } from "@/components/crm/AIProspectingPanel";
import { useLeads } from "@/hooks/useLeads";
import { useCRMPipelines } from "@/hooks/useCRMPipelines";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { useIsModuleEnabled } from "@/hooks/useModules";
import { cn } from "@/lib/utils";

type CRMView = "overview" | "leads" | "leads-table" | "prospection" | "contacts" | "companies" | "development";

type PipelineMode = "all" | "single";

const sectionDescriptions: Record<CRMView, string> = {
  overview: "Vue d'ensemble de votre activité commerciale",
  leads: "Gérez vos opportunités et pipelines",
  "leads-table": "Liste de tous vos leads (manuels et IA)",
  prospection: "Pipelines de prospection contacts et sociétés",
  contacts: "Annuaire de vos contacts",
  companies: "Répertoire de vos entreprises",
  development: "Agent AI de développement commercial",
};

export default function CRM() {
  const { section } = useParams();
  const { navigate } = useWorkspaceNavigation();
  const view = (section as CRMView) || "overview";
  const [searchQuery, setSearchQuery] = useState("");

  const [leadsMode, setLeadsMode] = useState<PipelineMode>("all");
  const [prospectionMode, setProspectionMode] = useState<PipelineMode>("all");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [selectedContactPipelineId, setSelectedContactPipelineId] = useState<string | null>(null);

  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [importContactsOpen, setImportContactsOpen] = useState(false);
  const [preselectedStageId, setPreselectedStageId] = useState<string | undefined>();
  const [commandBarOpen, setCommandBarOpen] = useState(false);

  const prospectionAutoCreatedRef = useRef(false);
  
  // Check if AI Sales Agent module is enabled
  const isAISalesAgentEnabled = useIsModuleEnabled("ai-sales-agent");
  
  // Redirect to overview if trying to access development view without the module
  useEffect(() => {
    if (view === "development" && !isAISalesAgentEnabled) {
      navigate("/crm/overview", { replace: true });
    }
  }, [view, isAISalesAgentEnabled, navigate]);

  const { 
    opportunityPipelines, 
    contactPipelines, 
    isLoading: pipelinesLoading, 
    createDefaultPipeline,
    createDefaultContactPipelines 
  } = useCRMPipelines();
  const { stats: leadStats } = useLeads();
  const { allCompanies } = useCRMCompanies();
  const { allContacts } = useContacts();

  // Create default pipeline if none exist
  useEffect(() => {
    if (!pipelinesLoading && opportunityPipelines.length === 0) {
      createDefaultPipeline.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelinesLoading, opportunityPipelines.length]);

  // If there is a single pipeline, default to single view
  useEffect(() => {
    if (!pipelinesLoading && opportunityPipelines.length <= 1) {
      setLeadsMode("single");
    }
  }, [pipelinesLoading, opportunityPipelines.length]);

  useEffect(() => {
    if (!pipelinesLoading && contactPipelines.length <= 1) {
      setProspectionMode("single");
    }
  }, [pipelinesLoading, contactPipelines.length]);

  // Auto-création des pipelines Prospection lors de la première visite
  useEffect(() => {
    if (
      view === "prospection" &&
      !pipelinesLoading &&
      contactPipelines.length === 0 &&
      !createDefaultContactPipelines.isPending &&
      !prospectionAutoCreatedRef.current
    ) {
      prospectionAutoCreatedRef.current = true;
      createDefaultContactPipelines.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, pipelinesLoading, contactPipelines.length]);

  // Select default pipeline for single mode
  useEffect(() => {
    if (opportunityPipelines.length > 0 && !selectedPipelineId) {
      const defaultPipeline = opportunityPipelines.find((p) => p.is_default) || opportunityPipelines[0];
      setSelectedPipelineId(defaultPipeline.id);
    }
  }, [opportunityPipelines, selectedPipelineId]);

  useEffect(() => {
    if (contactPipelines.length > 0 && !selectedContactPipelineId) {
      setSelectedContactPipelineId(contactPipelines[0].id);
    }
  }, [contactPipelines, selectedContactPipelineId]);

  const selectedPipeline = useMemo(
    () => opportunityPipelines.find((p) => p.id === selectedPipelineId) || (opportunityPipelines[0] ?? null),
    [opportunityPipelines, selectedPipelineId]
  );

  const selectedContactPipeline = useMemo(
    () => contactPipelines.find((p) => p.id === selectedContactPipelineId) || (contactPipelines[0] ?? null),
    [contactPipelines, selectedContactPipelineId]
  );

  const renderPipelinesBar = () => {
    if (view === "leads" && opportunityPipelines.length > 1) {
      return (
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
            Pipeline
          </span>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <Button
              variant={leadsMode === "all" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => {
                setLeadsMode("all");
                setSelectedPipelineId(null);
              }}
            >
              Tous
            </Button>

            {opportunityPipelines.map((pipeline) => (
              <Button
                key={pipeline.id}
                variant={
                  leadsMode === "single" && selectedPipelineId === pipeline.id
                    ? "default"
                    : "outline"
                }
                size="sm"
                className={cn(
                  "h-7 text-xs gap-1.5 shrink-0 transition-all",
                  leadsMode === "single" && selectedPipelineId === pipeline.id && "shadow-sm"
                )}
                onClick={() => {
                  setLeadsMode("single");
                  setSelectedPipelineId(pipeline.id);
                }}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-white/20"
                  style={{ backgroundColor: pipeline.color || "hsl(var(--primary))" }}
                />
                {pipeline.name}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    if (view === "prospection" && contactPipelines.length > 1) {
      return (
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
            Pipeline
          </span>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <Button
              variant={prospectionMode === "all" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => {
                setProspectionMode("all");
                setSelectedContactPipelineId(null);
              }}
            >
              Tous
            </Button>

            {contactPipelines.map((pipeline) => (
              <Button
                key={pipeline.id}
                variant={
                  prospectionMode === "single" && selectedContactPipelineId === pipeline.id
                    ? "default"
                    : "outline"
                }
                size="sm"
                className={cn(
                  "h-7 text-xs gap-1.5 shrink-0 transition-all",
                  prospectionMode === "single" && selectedContactPipelineId === pipeline.id && "shadow-sm"
                )}
                onClick={() => {
                  setProspectionMode("single");
                  setSelectedContactPipelineId(pipeline.id);
                }}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-white/20"
                  style={{ backgroundColor: pipeline.color || "hsl(var(--primary))" }}
                />
                {pipeline.name}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

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

      case "leads-table":
        return (
          <CRMLeadsTable 
            search={searchQuery} 
            onCreateLead={() => setCreateLeadOpen(true)}
          />
        );

      case "prospection":
        if (pipelinesLoading) {
          return (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          );
        }

        if (contactPipelines.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Layers className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <h3 className="font-medium mb-1">Aucun pipeline de prospection</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Créez des pipelines pour suivre vos contacts et sociétés
                </p>
                <Button 
                  onClick={() => createDefaultContactPipelines.mutate()}
                  disabled={createDefaultContactPipelines.isPending}
                >
                  {createDefaultContactPipelines.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Créer les pipelines par défaut
                </Button>
              </div>
            </div>
          );
        }

        if (prospectionMode === "all") {
          return (
            <div className="space-y-8">
              {contactPipelines.map((pipeline) => (
                <section key={pipeline.id} className="space-y-3">
                  <header className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: pipeline.color || "hsl(var(--primary))" }}
                      />
                      <h2 className="text-sm sm:text-base font-semibold truncate">{pipeline.name}</h2>
                      {pipeline.target_contact_type && (
                        <Badge variant="outline" className="text-[10px] h-5">
                          {pipeline.target_contact_type}
                        </Badge>
                      )}
                    </div>
                  </header>

                  <ContactPipeline
                    pipeline={pipeline}
                    kanbanHeightClass="h-[480px]"
                  />
                </section>
              ))}
            </div>
          );
        }

        if (selectedContactPipeline) {
          return (
            <ContactPipeline
              pipeline={selectedContactPipeline}
              kanbanHeightClass="h-[calc(100vh-340px)]"
            />
          );
        }

        return null;

      case "leads":
        if (pipelinesLoading || createDefaultPipeline.isPending) {
          return (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          );
        }

        if (leadsMode === "all") {
          return (
            <div className="space-y-8">
              {opportunityPipelines.map((pipeline) => (
                <section key={pipeline.id} className="space-y-3">
                  <header className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: pipeline.color || "hsl(var(--primary))" }}
                      />
                      <h2 className="text-sm sm:text-base font-semibold truncate">{pipeline.name}</h2>
                      {pipeline.is_default && (
                        <Badge variant="secondary" className="text-[10px] h-5">
                          défaut
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        setSelectedPipelineId(pipeline.id);
                        setPreselectedStageId(undefined);
                        setCreateLeadOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Nouvelle opportunité</span>
                    </Button>
                  </header>

                  <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <LeadPipeline
                      pipeline={pipeline}
                      kanbanHeightClass="h-[480px]"
                      hideHeader
                      onCreateLead={(stageId) => {
                        setSelectedPipelineId(pipeline.id);
                        setPreselectedStageId(stageId);
                        setCreateLeadOpen(true);
                      }}
                    />
                  </div>
                </section>
              ))}
            </div>
          );
        }

        if (selectedPipeline) {
          return (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <LeadPipeline
                pipeline={selectedPipeline}
                kanbanHeightClass="h-[calc(100vh-340px)]"
                onCreateLead={(stageId) => {
                  setPreselectedStageId(stageId);
                  setCreateLeadOpen(true);
                }}
              />
            </div>
          );
        }

        return null;

      case "development":
        return <AIProspectingPanel />;

      default:
        return null;
    }
  };

  // Listen for command palette events
  useEffect(() => {
    const handleCreateLead = () => {
      if (!selectedPipelineId && opportunityPipelines.length > 0) {
        const defaultPipeline = opportunityPipelines.find((p) => p.is_default) || opportunityPipelines[0];
        setSelectedPipelineId(defaultPipeline.id);
      }
      setCreateLeadOpen(true);
    };
    const handleCreateContact = () => setCreateContactOpen(true);
    const handleCreateCompany = () => setCreateCompanyOpen(true);
    
    window.addEventListener("open-create-lead", handleCreateLead);
    window.addEventListener("open-create-contact", handleCreateContact);
    window.addEventListener("open-create-company", handleCreateCompany);
    return () => {
      window.removeEventListener("open-create-lead", handleCreateLead);
      window.removeEventListener("open-create-contact", handleCreateContact);
      window.removeEventListener("open-create-company", handleCreateCompany);
    };
  }, [selectedPipelineId, opportunityPipelines]);

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Quick search button */}
        <div className="px-4 pt-4 pb-2">
          <Button
            variant="outline"
            className="w-full max-w-sm justify-start text-muted-foreground h-9 gap-2"
            onClick={() => setCommandBarOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left text-sm">Recherche rapide...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {renderPipelinesBar()}
          {renderContent()}
        </div>
      </div>

      <CRMCommandBar open={commandBarOpen} onOpenChange={setCommandBarOpen} />
      <CreateContactDialog open={createContactOpen} onOpenChange={setCreateContactOpen} />
      <CreateCompanyDialog open={createCompanyOpen} onOpenChange={setCreateCompanyOpen} />
      <ImportContactsDialog open={importContactsOpen} onOpenChange={setImportContactsOpen} />
      <CreateLeadDialog
        open={createLeadOpen}
        onOpenChange={(open) => {
          setCreateLeadOpen(open);
          if (!open) setPreselectedStageId(undefined);
        }}
        pipeline={selectedPipeline}
        defaultStageId={preselectedStageId}
      />
    </>
  );
}
