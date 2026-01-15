import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Plus, ChevronDown, Sparkles, UserPlus } from "lucide-react";
import { CRMLeadsTable } from "./CRMLeadsTable";
import { LeadPipeline } from "./LeadPipeline";
import { AIProspectingPanel } from "./AIProspectingPanel";
import { CreateLeadDialog } from "./CreateLeadDialog";
import { useCRMPipelines } from "@/hooks/useCRMPipelines";
import { useIsModuleEnabled } from "@/hooks/useModules";

type ProspectionTab = "leads" | "pipelines";

interface ProspectionUnifiedProps {
  searchQuery?: string;
}

export function ProspectionUnified({ searchQuery = "" }: ProspectionUnifiedProps) {
  const isAISalesAgentEnabled = useIsModuleEnabled("ai-sales-agent");
  const [activeTab, setActiveTab] = useState<ProspectionTab>("leads");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [preselectedStageId, setPreselectedStageId] = useState<string | undefined>();
  
  const pipelineAutoCreatedRef = useRef(false);

  const {
    opportunityPipelines,
    isLoading: pipelinesLoading,
    createDefaultPipeline,
  } = useCRMPipelines();

  // Create default pipeline if none exist
  useEffect(() => {
    if (
      !pipelinesLoading && 
      opportunityPipelines.length === 0 && 
      !createDefaultPipeline.isPending &&
      !pipelineAutoCreatedRef.current
    ) {
      pipelineAutoCreatedRef.current = true;
      createDefaultPipeline.mutate();
    }
  }, [pipelinesLoading, opportunityPipelines.length, createDefaultPipeline]);

  // Select first pipeline by default
  useEffect(() => {
    if (opportunityPipelines.length > 0 && !selectedPipelineId) {
      const defaultPipeline = opportunityPipelines.find((p) => p.is_default) || opportunityPipelines[0];
      setSelectedPipelineId(defaultPipeline.id);
    }
  }, [opportunityPipelines, selectedPipelineId]);

  const selectedPipeline = useMemo(
    () => opportunityPipelines.find((p) => p.id === selectedPipelineId) || (opportunityPipelines[0] ?? null),
    [opportunityPipelines, selectedPipelineId]
  );

  const handleAddLead = (mode: "manual" | "ai") => {
    if (mode === "manual") {
      setCreateLeadOpen(true);
    } else {
      setAiPanelOpen(true);
    }
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

    if (opportunityPipelines.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    // If only one pipeline, show it directly
    if (opportunityPipelines.length === 1) {
      return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <LeadPipeline
            pipeline={opportunityPipelines[0]}
            kanbanHeightClass="h-[calc(100vh-280px)]"
            onCreateLead={(stageId) => {
              setPreselectedStageId(stageId);
              setCreateLeadOpen(true);
            }}
          />
        </div>
      );
    }

    // Multiple pipelines: use sub-tabs
    return (
      <Tabs
        value={selectedPipelineId || opportunityPipelines[0]?.id}
        onValueChange={setSelectedPipelineId}
        className="space-y-3"
      >
        <TabsList className="h-8 bg-muted/50">
          {opportunityPipelines.map((pipeline) => (
            <TabsTrigger
              key={pipeline.id}
              value={pipeline.id}
              className="text-xs gap-1.5 px-3 data-[state=active]:font-semibold"
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: pipeline.color || "hsl(var(--primary))" }}
              />
              {pipeline.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {opportunityPipelines.map((pipeline) => (
          <TabsContent key={pipeline.id} value={pipeline.id} className="mt-0">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <LeadPipeline
                pipeline={pipeline}
                kanbanHeightClass="h-[calc(100vh-320px)]"
                onCreateLead={(stageId) => {
                  setSelectedPipelineId(pipeline.id);
                  setPreselectedStageId(stageId);
                  setCreateLeadOpen(true);
                }}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProspectionTab)} className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <TabsList className="h-9">
            <TabsTrigger value="leads" className="text-xs px-4 data-[state=active]:font-semibold">
              Leads
            </TabsTrigger>
            <TabsTrigger value="pipelines" className="text-xs px-4 data-[state=active]:font-semibold">
              Pipelines
            </TabsTrigger>
          </TabsList>

          {/* Add Lead Button with dropdown */}
          {isAISalesAgentEnabled ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 gap-1">
                  <Plus className="h-4 w-4" />
                  Ajouter
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleAddLead("manual")} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Créer un lead
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddLead("ai")} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Prospecter avec IA
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" className="h-8" onClick={() => setCreateLeadOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Ajouter
            </Button>
          )}
        </div>

        <TabsContent value="leads" className="mt-0">
          {renderLeadsTab()}
        </TabsContent>

        <TabsContent value="pipelines" className="mt-0">
          {renderPipelinesTab()}
        </TabsContent>
      </Tabs>

      {/* Create Lead Dialog */}
      <CreateLeadDialog
        open={createLeadOpen}
        onOpenChange={setCreateLeadOpen}
        pipeline={selectedPipeline}
        defaultStageId={preselectedStageId}
      />

      {/* AI Prospecting Sheet */}
      <Sheet open={aiPanelOpen} onOpenChange={setAiPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Prospection IA
            </SheetTitle>
          </SheetHeader>
          <AIProspectingPanel />
        </SheetContent>
      </Sheet>
    </>
  );
}
