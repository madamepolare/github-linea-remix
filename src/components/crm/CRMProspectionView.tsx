import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, ChevronDown, Building2, User, Target } from "lucide-react";
import { LeadPipeline } from "./LeadPipeline";
import { CreateLeadDialog } from "./CreateLeadDialog";
import { QuickAddToProspectionDialog } from "./QuickAddToProspectionDialog";
import { ModuleFiltersBar } from "@/components/shared/ModuleFiltersBar";
import { useCRMPipelines } from "@/hooks/useCRMPipelines";

interface CRMProspectionViewProps {
  searchQuery?: string;
}

export function CRMProspectionView({ searchQuery: initialSearchQuery = "" }: CRMProspectionViewProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
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
        kanbanHeightClass="h-[calc(100vh-180px)]"
        hideHeader
        onCreateLead={(stageId) => {
          setPreselectedStageId(stageId);
          setCreateLeadOpen(true);
        }}
      />
    );
  };

  // Pipeline selector dropdown
  const pipelineSelector = opportunityPipelines.length > 1 ? (
    <Select value={selectedPipelineId || ""} onValueChange={setSelectedPipelineId}>
      <SelectTrigger className="w-[200px] h-9">
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="h-9 gap-1">
            <Plus className="h-4 w-4" />
            Ajouter
            <ChevronDown className="h-3 w-3 ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setCreateLeadOpen(true)} className="gap-2">
            <Target className="h-4 w-4" />
            Nouvelle opportunité
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setQuickAddOpen(true)} className="gap-2">
            <Building2 className="h-4 w-4" />
            Ajouter contacts / entreprises
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      <div className="space-y-4">
        {/* Header with search, pipeline selector and add button */}
        <ModuleFiltersBar
          search={{
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: "Rechercher...",
          }}
          filters={filters}
        />

        {/* Pipeline view */}
        {renderContent()}
      </div>

      {/* Create Lead Dialog */}
      <CreateLeadDialog
        open={createLeadOpen}
        onOpenChange={setCreateLeadOpen}
        pipeline={selectedPipeline}
        defaultStageId={preselectedStageId}
      />

      {/* Quick Add Dialog */}
      {selectedPipeline && (
        <QuickAddToProspectionDialog
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
          pipeline={selectedPipeline}
        />
      )}
    </>
  );
}
