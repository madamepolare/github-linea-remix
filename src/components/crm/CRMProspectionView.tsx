import { useState, useMemo, useEffect } from "react";
import { useCRMPipelines } from "@/hooks/useCRMPipelines";
import { ContactPipeline } from "./ContactPipeline";
import { BulkAddToPipelineDialog } from "./BulkAddToPipelineDialog";
import { CreateContactDialog } from "./CreateContactDialog";
import { CreateCompanyDialog } from "./CreateCompanyDialog";
import { ModuleFiltersBar } from "@/components/shared/ModuleFiltersBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  ChevronDown, 
  Building2, 
  User, 
  Target
} from "lucide-react";

interface CRMProspectionViewProps {
  searchQuery?: string;
}

export function CRMProspectionView({ searchQuery = "" }: CRMProspectionViewProps) {
  const { pipelines, isLoading: pipelinesLoading, createDefaultContactPipelines } = useCRMPipelines();
  
  const [search, setSearch] = useState(searchQuery);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
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

  // Add button with dropdown
  const addButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="h-9 gap-1">
          <Plus className="h-4 w-4" />
          Ajouter
          <ChevronDown className="h-3 w-3 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => setBulkAddOpen(true)} className="gap-2">
          <Target className="h-4 w-4" />
          Ajouter au pipeline
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setCreateContactOpen(true)} className="gap-2">
          <User className="h-4 w-4" />
          Nouveau contact
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCreateCompanyOpen(true)} className="gap-2">
          <Building2 className="h-4 w-4" />
          Nouvelle entreprise
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Filters for the filter bar
  const filters = (
    <div className="flex items-center gap-2">
      {pipelineSelector}
      {addButton}
    </div>
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
        <ModuleFiltersBar
          search={{ value: search, onChange: setSearch, placeholder: "Rechercher dans le pipeline..." }}
          filters={filters}
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
      <CreateContactDialog
        open={createContactOpen}
        onOpenChange={setCreateContactOpen}
      />

      {/* Create Company Dialog */}
      <CreateCompanyDialog
        open={createCompanyOpen}
        onOpenChange={setCreateCompanyOpen}
      />
    </>
  );
}
