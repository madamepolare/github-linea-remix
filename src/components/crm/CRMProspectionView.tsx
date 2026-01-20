import { useState, useMemo, useEffect } from "react";
import { useCRMPipelines } from "@/hooks/useCRMPipelines";
import { ContactPipeline } from "./ContactPipeline";
import { ProspectionListView } from "./ProspectionListView";
import { BulkAddToPipelineDialog } from "./BulkAddToPipelineDialog";
import { ContactFormDialog } from "./ContactFormDialog";
import { CompanyFormDialog } from "./CompanyFormDialog";
import { CRMDataQualityManager } from "./CRMDataQualityManager";
import { CRMAddDropdown } from "./CRMAddDropdown";
import { CRMEmailSyncButton } from "./CRMEmailSyncButton";
import { ContentFiltersBar } from "@/components/shared/ContentFiltersBar";
import { ViewModeToggle } from "@/components/shared/filters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";

interface CRMProspectionViewProps {
  searchQuery?: string;
}

export function CRMProspectionView({ searchQuery = "" }: CRMProspectionViewProps) {
  const { pipelines, isLoading: pipelinesLoading, createDefaultContactPipelines } = useCRMPipelines();
  
  const [search, setSearch] = useState(searchQuery);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);

  // Update search when prop changes
  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  // All pipelines are now unified
  const allPipelines = pipelines;
  
  // Auto-select first pipeline
  useEffect(() => {
    if (!selectedPipelineId && allPipelines.length > 0) {
      setSelectedPipelineId(allPipelines[0].id);
    }
  }, [allPipelines, selectedPipelineId]);

  // Create default pipelines if none exist
  useEffect(() => {
    if (!pipelinesLoading && allPipelines.length === 0) {
      createDefaultContactPipelines.mutate();
    }
  }, [pipelinesLoading, allPipelines.length]);

  const selectedPipeline = useMemo(() => {
    return allPipelines.find(p => p.id === selectedPipelineId) || null;
  }, [allPipelines, selectedPipelineId]);

  // Pipeline selector
  const pipelineSelector = allPipelines.length > 1 ? (
    <Select value={selectedPipelineId || ""} onValueChange={setSelectedPipelineId}>
      <SelectTrigger className="w-[200px] h-9">
        <SelectValue placeholder="Sélectionner un pipeline" />
      </SelectTrigger>
      <SelectContent>
        {allPipelines.map((pipeline) => (
          <SelectItem key={pipeline.id} value={pipeline.id}>
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: pipeline.color || "#6366f1" }}
              />
              <span>{pipeline.name}</span>
              {pipeline.target_contact_type && (
                <Badge variant="outline" className="text-[10px] ml-1">
                  {pipeline.target_contact_type}
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : null;

  // Filters for the filter bar
  const filters = (
    <>
      {pipelineSelector}
    </>
  );

  // Actions on the right
  const actions = (
    <div className="flex items-center gap-2">
      <CRMEmailSyncButton />
      <CRMAddDropdown
        onCreateContact={() => setCreateContactOpen(true)}
        onCreateCompany={() => setCreateCompanyOpen(true)}
        onCreateLead={() => setBulkAddOpen(true)}
      />
      <CRMDataQualityManager />
    </div>
  );

  // View toggle using new component
  const viewToggle = (
    <ViewModeToggle
      value={viewMode === "pipeline" ? "pipeline" : "list"}
      onChange={(v) => setViewMode(v === "pipeline" ? "pipeline" : "list")}
      variant="kanban"
    />
  );

  const renderContent = () => {
    if (pipelinesLoading) {
      return (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-72">
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (!selectedPipeline) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Aucun pipeline configuré</p>
          <p className="text-sm mb-4">
            Créez un pipeline pour commencer à gérer vos prospects
          </p>
          <Button onClick={() => createDefaultContactPipelines.mutate()}>
            Créer les pipelines par défaut
          </Button>
        </div>
      );
    }

    if (viewMode === "list") {
      return <ProspectionListView pipeline={selectedPipeline} search={search} />;
    }

    return (
      <ContactPipeline 
        pipeline={selectedPipeline} 
        kanbanHeightClass="h-[calc(100vh-220px)]"
      />
    );
  };

  return (
    <>
      <div className="space-y-4">
        <ContentFiltersBar
          viewToggle={viewToggle}
          search={{ value: search, onChange: setSearch, placeholder: "Rechercher dans le pipeline..." }}
          filters={filters}
          actions={actions}
        />

        {renderContent()}
      </div>

      {/* Bulk Add Dialog */}
      {selectedPipeline && (
        <BulkAddToPipelineDialog
          open={bulkAddOpen}
          onOpenChange={setBulkAddOpen}
          pipeline={selectedPipeline}
        />
      )}

      {/* Create Contact Dialog */}
      <ContactFormDialog
        mode="create"
        open={createContactOpen}
        onOpenChange={setCreateContactOpen}
      />

      {/* Create Company Dialog */}
      <CompanyFormDialog
        mode="create"
        open={createCompanyOpen}
        onOpenChange={setCreateCompanyOpen}
      />
    </>
  );
}
