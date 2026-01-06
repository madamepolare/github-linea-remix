import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, Target, Users, Building2 } from "lucide-react";
import { CRMContactsTable } from "@/components/crm/CRMContactsTable";
import { CRMCompanyTable } from "@/components/crm/CRMCompanyTable";
import { LeadPipeline } from "@/components/crm/LeadPipeline";
import { CreateContactDialog } from "@/components/crm/CreateContactDialog";
import { CreateCompanyDialog } from "@/components/crm/CreateCompanyDialog";
import { CreateLeadDialog } from "@/components/crm/CreateLeadDialog";
import { CRMOverview } from "@/components/crm/CRMOverview";
import { useLeads } from "@/hooks/useLeads";
import { useCRMPipelines } from "@/hooks/useCRMPipelines";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { cn } from "@/lib/utils";

type CRMView = "overview" | "leads" | "contacts" | "companies";

type LeadsMode = "all" | "single";

const sectionDescriptions: Record<CRMView, string> = {
  overview: "Vue d'ensemble de votre activité commerciale",
  leads: "Gérez vos opportunités et pipelines",
  contacts: "Annuaire de vos contacts",
  companies: "Répertoire de vos entreprises",
};

export default function CRM() {
  const { section } = useParams();
  const navigate = useNavigate();
  const view = (section as CRMView) || "overview";
  const [searchQuery, setSearchQuery] = useState("");

  const [leadsMode, setLeadsMode] = useState<LeadsMode>("all");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);

  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [preselectedStageId, setPreselectedStageId] = useState<string | undefined>();

  const { pipelines, isLoading: pipelinesLoading, createDefaultPipeline } = useCRMPipelines();
  const { stats: leadStats } = useLeads();
  const { allCompanies } = useCRMCompanies();
  const { allContacts } = useContacts();

  // Create default pipeline if none exist
  useEffect(() => {
    if (!pipelinesLoading && pipelines.length === 0) {
      createDefaultPipeline.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelinesLoading, pipelines.length]);

  // If there is a single pipeline, default to single view
  useEffect(() => {
    if (!pipelinesLoading && pipelines.length <= 1) {
      setLeadsMode("single");
    }
  }, [pipelinesLoading, pipelines.length]);

  // Select default pipeline for single mode
  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      const defaultPipeline = pipelines.find((p) => p.is_default) || pipelines[0];
      setSelectedPipelineId(defaultPipeline.id);
    }
  }, [pipelines, selectedPipelineId]);

  const selectedPipeline = useMemo(
    () => pipelines.find((p) => p.id === selectedPipelineId) || (pipelines[0] ?? null),
    [pipelines, selectedPipelineId]
  );

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k€`;
    }
    return `${value.toLocaleString()}€`;
  };

  const totalEntities = allCompanies.length + allContacts.length + leadStats.total;

  const renderPipelinesBar = () => {
    if (view !== "leads" || pipelines.length <= 1) return null;

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

          {pipelines.map((pipeline) => (
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
          <CRMContactsTable search={searchQuery} onCreateContact={() => setCreateContactOpen(true)} />
        );

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
              {pipelines.map((pipeline) => (
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

      default:
        return null;
    }
  };

  // Listen for command palette events
  useEffect(() => {
    const handleCreateLead = () => {
      if (!selectedPipelineId && pipelines.length > 0) {
        const defaultPipeline = pipelines.find((p) => p.is_default) || pipelines[0];
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
  }, [selectedPipelineId, pipelines]);

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          {renderPipelinesBar()}
          {renderContent()}
        </div>
      </div>

      <CreateContactDialog open={createContactOpen} onOpenChange={setCreateContactOpen} />
      <CreateCompanyDialog open={createCompanyOpen} onOpenChange={setCreateCompanyOpen} />
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
