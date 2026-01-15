import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Plus, ChevronDown, Sparkles, UserPlus, List, Kanban } from "lucide-react";
import { CRMLeadsTable } from "./CRMLeadsTable";
import { LeadPipeline } from "./LeadPipeline";
import { AIProspectingPanel } from "./AIProspectingPanel";
import { CreateLeadDialog } from "./CreateLeadDialog";
import { ModuleFiltersBar } from "@/components/shared/ModuleFiltersBar";
import { useCRMPipelines } from "@/hooks/useCRMPipelines";
import { useIsModuleEnabled } from "@/hooks/useModules";

type ViewMode = "list" | "pipeline";

interface ProspectionUnifiedProps {
  searchQuery?: string;
}

export function ProspectionUnified({ searchQuery: initialSearchQuery = "" }: ProspectionUnifiedProps) {
  const isAISalesAgentEnabled = useIsModuleEnabled("ai-sales-agent");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
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

  const renderListView = () => (
    <CRMLeadsTable search={searchQuery} onCreateLead={() => setCreateLeadOpen(true)} />
  );

  const renderPipelineView = () => {
    if (pipelinesLoading || opportunityPipelines.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!selectedPipeline) return null;

    return (
      <LeadPipeline
        pipeline={selectedPipeline}
        kanbanHeightClass="h-[calc(100vh-200px)]"
        hideHeader
        onCreateLead={(stageId) => {
          setPreselectedStageId(stageId);
          setCreateLeadOpen(true);
        }}
      />
    );
  };

  const addButton = isAISalesAgentEnabled ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="h-9 gap-1">
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
    <Button size="sm" className="h-9" onClick={() => setCreateLeadOpen(true)}>
      <Plus className="h-4 w-4 mr-1.5" />
      Ajouter
    </Button>
  );

  const viewToggle = (
    <ToggleGroup
      type="single"
      value={viewMode}
      onValueChange={(v) => v && setViewMode(v as ViewMode)}
      className="h-9"
    >
      <ToggleGroupItem value="list" aria-label="Vue liste" className="h-9 px-3 gap-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
        <List className="h-4 w-4" />
        <span className="text-xs hidden sm:inline">Liste</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="pipeline" aria-label="Vue pipeline" className="h-9 px-3 gap-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
        <Kanban className="h-4 w-4" />
        <span className="text-xs hidden sm:inline">Pipeline</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );

  // Pipeline selector dropdown (only visible in pipeline view with multiple pipelines)
  const pipelineSelector = viewMode === "pipeline" && opportunityPipelines.length > 1 ? (
    <Select value={selectedPipelineId || ""} onValueChange={setSelectedPipelineId}>
      <SelectTrigger className="w-[180px] h-9">
        <SelectValue placeholder="Sélectionner un pipeline" />
      </SelectTrigger>
      <SelectContent>
        {opportunityPipelines.map((pipeline) => (
          <SelectItem key={pipeline.id} value={pipeline.id}>
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: pipeline.color || "hsl(var(--primary))" }}
              />
              {pipeline.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : null;

  const filters = (
    <div className="flex items-center gap-2">
      {pipelineSelector}
      {addButton}
    </div>
  );

  return (
    <>
      <div className="space-y-4">
        {/* Header with search, view toggle, pipeline selector and add button */}
        <ModuleFiltersBar
          search={{
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: "Rechercher un lead...",
          }}
          viewToggle={viewToggle}
          filters={filters}
        />

        {/* Content based on view mode */}
        {viewMode === "list" ? renderListView() : renderPipelineView()}
      </div>

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
