import { useState } from "react";
import { Button } from "@/components/ui/button";
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/KanbanBoard";
import { Plus, Building2 } from "lucide-react";
import { useLeads, Lead } from "@/hooks/useLeads";
import { cn } from "@/lib/utils";
import { LeadDetailSheet } from "./LeadDetailSheet";
import { EditLeadDialog } from "./EditLeadDialog";

type PipelineStageLike = {
  id: string;
  name: string;
  color: string | null;
};

type PipelineLike = {
  id: string;
  name: string;
  color: string | null;
  is_default: boolean | null;
  stages?: PipelineStageLike[];
};

interface LeadPipelineProps {
  pipeline: PipelineLike;
  onCreateLead: (stageId?: string) => void;
  kanbanHeightClass?: string;
}

export function LeadPipeline({ pipeline, onCreateLead, kanbanHeightClass }: LeadPipelineProps) {
  const { leads, stats, isLoading, updateLeadStage } = useLeads({ pipelineId: pipeline.id });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const stages = pipeline.stages || [];

  const handleDrop = (leadId: string, _fromColumn: string, toColumn: string) => {
    updateLeadStage.mutate({ leadId, stageId: toColumn });
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M€`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k€`;
    }
    return `${value}€`;
  };

  const getTotalValue = (stageLeads: Lead[]) => {
    return stageLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
  };

  const kanbanColumns: KanbanColumn<Lead>[] = stages.map((stage) => {
    const stageLeads = leads.filter((lead) => lead.stage_id === stage.id);
    const totalValue = getTotalValue(stageLeads);

    return {
      id: stage.id,
      label: stage.name,
      color: stage.color || "#6366f1",
      items: stageLeads,
      metadata:
        totalValue > 0 ? (
          <span className="text-sm text-muted-foreground">€ {formatCurrency(totalValue)}</span>
        ) : undefined,
    };
  });

  return (
    <>
      <div className="p-4 sm:p-6 space-y-4">
        {/* Stats bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-sm">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="font-medium">{stats.total}</span>
              <span className="text-muted-foreground hidden sm:inline">opportunités</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-sm">
              <span className="text-muted-foreground">€</span>
              <span className="font-medium">{formatCurrency(stats.weightedValue)}</span>
              <span className="text-muted-foreground hidden sm:inline">pondéré</span>
            </div>
            {stats.wonValue > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-sm text-emerald-600">
                <span>✓</span>
                <span className="font-medium">{formatCurrency(stats.wonValue)}</span>
                <span className="hidden sm:inline">gagné</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={() => setShowClosed(!showClosed)}
            >
              {showClosed ? "Masquer clôturés" : "Voir clôturés"}
            </Button>
            <Button size="sm" className="h-8" onClick={() => onCreateLead()}>
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Nouvelle opportunité</span>
            </Button>
          </div>
        </div>

        {/* Kanban */}
        <div className={cn("flex gap-4 overflow-x-auto pb-4", kanbanHeightClass || "h-[calc(100vh-320px)]")}>
          <KanbanBoard<Lead>
            columns={kanbanColumns}
            isLoading={isLoading}
            onDrop={handleDrop}
            onColumnAdd={(stageId) => onCreateLead(stageId)}
            getItemId={(lead) => lead.id}
            renderCard={(lead, isDragging) => (
              <LeadKanbanCard
                lead={lead}
                stageColor={stages.find((s) => s.id === lead.stage_id)?.color}
                onClick={() => setSelectedLead(lead)}
                isDragging={isDragging}
              />
            )}
            emptyColumnContent="Aucune opportunité"
            className="px-0"
          />
        </div>
      </div>

      <LeadDetailSheet
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onEdit={(lead) => {
          setSelectedLead(null);
          setEditingLead(lead);
        }}
      />

      <EditLeadDialog lead={editingLead} open={!!editingLead} onOpenChange={(open) => !open && setEditingLead(null)} />
    </>
  );
}

interface LeadKanbanCardProps {
  lead: Lead;
  stageColor?: string | null;
  onClick: () => void;
  isDragging: boolean;
}

function LeadKanbanCard({ lead, stageColor, onClick, isDragging }: LeadKanbanCardProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k€`;
    }
    return `${value}€`;
  };

  return (
    <KanbanCard onClick={onClick} accentColor={stageColor || undefined}>
      <div className="space-y-2.5">
        {/* Title */}
        <p className="text-sm font-medium leading-snug line-clamp-2">{lead.title}</p>

        {/* Company */}
        {lead.company && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{lead.company.name}</span>
          </div>
        )}

        {/* Value */}
        {lead.estimated_value && (
          <p className="text-sm font-semibold">{formatCurrency(lead.estimated_value)}</p>
        )}

        {/* Assigned user */}
        {lead.assigned_to && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/30">
            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
              {lead.assigned_to.slice(0, 2).toUpperCase()}
            </div>
            <span className="truncate">{lead.assigned_to}</span>
          </div>
        )}
      </div>
    </KanbanCard>
  );
}
