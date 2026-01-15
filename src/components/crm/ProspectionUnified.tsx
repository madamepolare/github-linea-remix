import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Target, Layers, Sparkles, List } from "lucide-react";
import { CRMLeadsTable } from "./CRMLeadsTable";
import { LeadPipeline } from "./LeadPipeline";
import { ContactPipeline } from "./ContactPipeline";
import { AIProspectingPanel } from "./AIProspectingPanel";
import { CreateLeadDialog } from "./CreateLeadDialog";
import { useCRMPipelines } from "@/hooks/useCRMPipelines";
import { useIsModuleEnabled } from "@/hooks/useModules";
import { cn } from "@/lib/utils";

type ProspectionSubTab = "leads" | "pipelines" | "agent-ia";
type PipelineMode = "all" | "single";

interface ProspectionUnifiedProps {
  searchQuery?: string;
}

export function ProspectionUnified({ searchQuery = "" }: ProspectionUnifiedProps) {
  const isAISalesAgentEnabled = useIsModuleEnabled("ai-sales-agent");
  const [activeTab, setActiveTab] = useState<ProspectionSubTab>("leads");
  
  const [leadsMode, setLeadsMode] = useState<PipelineMode>("all");
  const [prospectionMode, setProspectionMode] = useState<PipelineMode>("all");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [selectedContactPipelineId, setSelectedContactPipelineId] = useState<string | null>(null);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [preselectedStageId, setPreselectedStageId] = useState<string | undefined>();
  
  const prospectionAutoCreatedRef = useRef(false);

  const {
    opportunityPipelines,
    contactPipelines,
    isLoading: pipelinesLoading,
    createDefaultPipeline,
    createDefaultContactPipelines,
  } = useCRMPipelines();

  // Create default pipeline if none exist
  useEffect(() => {
    if (!pipelinesLoading && opportunityPipelines.length === 0) {
      createDefaultPipeline.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelinesLoading, opportunityPipelines.length]);

  // Default to single view if only one pipeline
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

  // Auto-create contact pipelines on first visit
  useEffect(() => {
    if (
      activeTab === "pipelines" &&
      !pipelinesLoading &&
      contactPipelines.length === 0 &&
      !createDefaultContactPipelines.isPending &&
      !prospectionAutoCreatedRef.current
    ) {
      prospectionAutoCreatedRef.current = true;
      createDefaultContactPipelines.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pipelinesLoading, contactPipelines.length]);

  // Select default pipeline
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

  const renderOpportunityPipelinesBar = () => {
    if (opportunityPipelines.length <= 1) return null;

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
  };

  const renderContactPipelinesBar = () => {
    if (contactPipelines.length <= 1) return null;

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
  };

  const renderLeadsTab = () => (
    <CRMLeadsTable search={searchQuery} onCreateLead={() => setCreateLeadOpen(true)} />
  );

  const renderPipelinesTab = () => {
    if (pipelinesLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Opportunity Pipelines Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Opportunités
            </h3>
            <Button
              size="sm"
              className="h-8"
              onClick={() => {
                if (opportunityPipelines.length > 0 && !selectedPipelineId) {
                  const defaultPipeline = opportunityPipelines.find((p) => p.is_default) || opportunityPipelines[0];
                  setSelectedPipelineId(defaultPipeline.id);
                }
                setCreateLeadOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nouveau lead
            </Button>
          </div>
          
          {renderOpportunityPipelinesBar()}
          
          {leadsMode === "all" ? (
            <div className="space-y-6">
              {opportunityPipelines.map((pipeline) => (
                <div key={pipeline.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: pipeline.color || "hsl(var(--primary))" }}
                    />
                    <span className="text-sm font-medium">{pipeline.name}</span>
                    {pipeline.is_default && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        défaut
                      </Badge>
                    )}
                  </div>
                  <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <LeadPipeline
                      pipeline={pipeline}
                      kanbanHeightClass="h-[400px]"
                      hideHeader
                      onCreateLead={(stageId) => {
                        setSelectedPipelineId(pipeline.id);
                        setPreselectedStageId(stageId);
                        setCreateLeadOpen(true);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : selectedPipeline ? (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <LeadPipeline
                pipeline={selectedPipeline}
                kanbanHeightClass="h-[calc(100vh-420px)]"
                onCreateLead={(stageId) => {
                  setPreselectedStageId(stageId);
                  setCreateLeadOpen(true);
                }}
              />
            </div>
          ) : null}
        </section>

        {/* Contact Pipelines Section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Prospection Contacts
          </h3>

          {contactPipelines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 border rounded-lg bg-muted/30">
              <Layers className="h-10 w-10 text-muted-foreground/50" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Aucun pipeline de prospection contacts
                </p>
                <Button
                  onClick={() => createDefaultContactPipelines.mutate()}
                  disabled={createDefaultContactPipelines.isPending}
                  variant="outline"
                  size="sm"
                >
                  {createDefaultContactPipelines.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Créer les pipelines par défaut
                </Button>
              </div>
            </div>
          ) : (
            <>
              {renderContactPipelinesBar()}
              
              {prospectionMode === "all" ? (
                <div className="space-y-6">
                  {contactPipelines.map((pipeline) => (
                    <div key={pipeline.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: pipeline.color || "hsl(var(--primary))" }}
                        />
                        <span className="text-sm font-medium">{pipeline.name}</span>
                        {pipeline.target_contact_type && (
                          <Badge variant="outline" className="text-[10px] h-5">
                            {pipeline.target_contact_type}
                          </Badge>
                        )}
                      </div>
                      <ContactPipeline
                        pipeline={pipeline}
                        kanbanHeightClass="h-[400px]"
                      />
                    </div>
                  ))}
                </div>
              ) : selectedContactPipeline ? (
                <ContactPipeline
                  pipeline={selectedContactPipeline}
                  kanbanHeightClass="h-[calc(100vh-420px)]"
                />
              ) : null}
            </>
          )}
        </section>
      </div>
    );
  };

  const renderAgentIATab = () => <AIProspectingPanel />;

  return (
    <>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProspectionSubTab)} className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="h-9">
            <TabsTrigger value="leads" className="gap-1.5 text-xs px-3">
              <List className="h-3.5 w-3.5" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="pipelines" className="gap-1.5 text-xs px-3">
              <Layers className="h-3.5 w-3.5" />
              Pipelines
            </TabsTrigger>
            {isAISalesAgentEnabled && (
              <TabsTrigger value="agent-ia" className="gap-1.5 text-xs px-3">
                <Sparkles className="h-3.5 w-3.5" />
                Agent IA
              </TabsTrigger>
            )}
          </TabsList>

          {activeTab === "leads" && (
            <Button size="sm" className="h-8" onClick={() => setCreateLeadOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Nouveau lead
            </Button>
          )}
        </div>

        <TabsContent value="leads" className="mt-0">
          {renderLeadsTab()}
        </TabsContent>

        <TabsContent value="pipelines" className="mt-0">
          {renderPipelinesTab()}
        </TabsContent>

        {isAISalesAgentEnabled && (
          <TabsContent value="agent-ia" className="mt-0">
            {renderAgentIATab()}
          </TabsContent>
        )}
      </Tabs>

      <CreateLeadDialog
        open={createLeadOpen}
        onOpenChange={setCreateLeadOpen}
        pipeline={selectedPipeline}
        defaultStageId={preselectedStageId}
      />
    </>
  );
}
