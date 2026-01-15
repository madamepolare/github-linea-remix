import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Plus, ChevronDown, Sparkles, UserPlus, List, Kanban, Target, Users } from "lucide-react";
import { CRMLeadsTable } from "./CRMLeadsTable";
import { LeadPipeline } from "./LeadPipeline";
import { AIProspectingPanel } from "./AIProspectingPanel";
import { AIProspectsManager } from "./AIProspectsManager";
import { CreateLeadDialog } from "./CreateLeadDialog";
import { ModuleFiltersBar } from "@/components/shared/ModuleFiltersBar";
import { useCRMPipelines } from "@/hooks/useCRMPipelines";
import { useIsModuleEnabled } from "@/hooks/useModules";
import { useAIProspects } from "@/hooks/useAIProspects";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "pipeline";
type TabType = "leads" | "prospects";

interface TabConfig {
  key: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ProspectionUnifiedProps {
  searchQuery?: string;
}

export function ProspectionUnified({ searchQuery: initialSearchQuery = "" }: ProspectionUnifiedProps) {
  const isAISalesAgentEnabled = useIsModuleEnabled("ai-sales-agent");
  const { prospects } = useAIProspects();
  
  const [activeTab, setActiveTab] = useState<TabType>("leads");
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

  // Count pending prospects
  const pendingProspectsCount = useMemo(() => 
    prospects.filter(p => p.status === "new" || p.status === "reviewed").length,
    [prospects]
  );

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

  // Tabs configuration
  const tabs: TabConfig[] = useMemo(() => {
    const baseTabs: TabConfig[] = [
      { key: "leads", label: "Leads", icon: Users },
    ];
    
    if (isAISalesAgentEnabled) {
      baseTabs.push({
        key: "prospects",
        label: "Prospects IA",
        icon: Target,
      });
    }
    
    return baseTabs;
  }, [isAISalesAgentEnabled]);

  const renderLeadsContent = () => {
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

  const viewToggle = activeTab === "leads" ? (
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
  ) : null;

  // Pipeline selector dropdown (only visible in pipeline view with multiple pipelines)
  const pipelineSelector = activeTab === "leads" && viewMode === "pipeline" && opportunityPipelines.length > 1 ? (
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

  const filters = activeTab === "leads" ? (
    <div className="flex items-center gap-2">
      {pipelineSelector}
      {addButton}
    </div>
  ) : (
    <Button size="sm" className="h-9" onClick={() => setAiPanelOpen(true)}>
      <Sparkles className="h-4 w-4 mr-1.5" />
      Nouvelle recherche
    </Button>
  );

  return (
    <>
      <div className="space-y-4">
        {/* Tab navigation like contacts */}
        <div className="flex items-center gap-4">
          <nav className="flex items-center">
            <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const Icon = tab.icon;
                
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all duration-150",
                      isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.key === "prospects" && pendingProspectsCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "h-5 min-w-5 px-1.5 text-xs font-medium",
                          isActive 
                            ? "bg-foreground text-background" 
                            : "bg-muted-foreground/20 text-muted-foreground"
                        )}
                      >
                        {pendingProspectsCount > 99 ? "99+" : pendingProspectsCount}
                      </Badge>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="prospection-active-tab"
                        className="absolute inset-0 bg-background rounded-md shadow-sm -z-10"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Header with search, view toggle, and actions */}
        <ModuleFiltersBar
          search={activeTab === "leads" ? {
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: "Rechercher un lead...",
          } : undefined}
          viewToggle={viewToggle}
          filters={filters}
        />

        {/* Content based on active tab */}
        {activeTab === "leads" ? renderLeadsContent() : <AIProspectsManager />}
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
