import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, List, Kanban } from "lucide-react";
import { CRMLeadsTable } from "./CRMLeadsTable";
import { LeadPipeline } from "./LeadPipeline";
import { CreateLeadDialog } from "./CreateLeadDialog";
import { ModuleFiltersBar } from "@/components/shared/ModuleFiltersBar";
import { useCRMPipelines } from "@/hooks/useCRMPipelines";

type ViewMode = "list" | "pipeline";

interface CRMLeadsViewProps {
  searchQuery?: string;
}

export function CRMLeadsView({ searchQuery: initialSearchQuery = "" }: CRMLeadsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
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

  const renderContent = () => {
    if (viewMode === "list") {
      return <CRMLeadsTable search={searchQuery} onCreateLead={() => setCreateLeadOpen(true)} />;
    }

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
      <Button size="sm" className="h-9" onClick={() => setCreateLeadOpen(true)}>
        <Plus className="h-4 w-4 mr-1.5" />
        Ajouter
      </Button>
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
        {renderContent()}
      </div>

      {/* Create Lead Dialog */}
      <CreateLeadDialog
        open={createLeadOpen}
        onOpenChange={setCreateLeadOpen}
        pipeline={selectedPipeline}
        defaultStageId={preselectedStageId}
      />
    </>
  );
}
