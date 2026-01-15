import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Plus, ChevronDown, Sparkles, UserPlus } from "lucide-react";
import { CRMLeadsTable } from "./CRMLeadsTable";
import { AIProspectingPanel } from "./AIProspectingPanel";
import { AIProspectsManager } from "./AIProspectsManager";
import { CreateLeadDialog } from "./CreateLeadDialog";
import { ModuleFiltersBar } from "@/components/shared/ModuleFiltersBar";
import { useIsModuleEnabled } from "@/hooks/useModules";
import { useAIProspects } from "@/hooks/useAIProspects";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Users } from "lucide-react";

type TabType = "list" | "prospects";

interface CRMLeadsViewProps {
  searchQuery?: string;
}

export function CRMLeadsView({ searchQuery: initialSearchQuery = "" }: CRMLeadsViewProps) {
  const isAISalesAgentEnabled = useIsModuleEnabled("ai-sales-agent");
  const { prospects } = useAIProspects();
  
  const [activeTab, setActiveTab] = useState<TabType>("list");
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const pendingProspectsCount = prospects.filter(
    (p) => p.status === "new" || p.status === "reviewed"
  ).length;

  const handleAddLead = (mode: "manual" | "ai") => {
    if (mode === "manual") {
      setCreateLeadOpen(true);
    } else {
      setAiPanelOpen(true);
    }
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

  return (
    <>
      <div className="space-y-4">
        {/* Tabs for leads list vs AI prospects */}
        {isAISalesAgentEnabled && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
            <TabsList className="h-9 bg-muted/50 p-0.5">
              <TabsTrigger value="list" className="h-8 px-3 gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Users className="h-3.5 w-3.5" />
                Tous les leads
              </TabsTrigger>
              <TabsTrigger value="prospects" className="h-8 px-3 gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Target className="h-3.5 w-3.5" />
                Prospects IA
                {pendingProspectsCount > 0 && (
                  <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] ml-1">
                    {pendingProspectsCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Header with search and add button */}
        <ModuleFiltersBar
          search={activeTab === "list" ? {
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: "Rechercher un lead...",
          } : undefined}
          filters={activeTab === "list" ? addButton : (
            <Button size="sm" className="h-9" onClick={() => setAiPanelOpen(true)}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              Nouvelle recherche
            </Button>
          )}
        />

        {/* Content based on active tab */}
        {activeTab === "list" ? (
          <CRMLeadsTable search={searchQuery} onCreateLead={() => setCreateLeadOpen(true)} />
        ) : (
          <AIProspectsManager />
        )}
      </div>

      {/* Create Lead Dialog */}
      <CreateLeadDialog
        open={createLeadOpen}
        onOpenChange={setCreateLeadOpen}
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
