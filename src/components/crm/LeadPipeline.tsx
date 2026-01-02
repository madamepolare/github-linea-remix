import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/KanbanBoard";
import { Plus, Building2, User } from "lucide-react";
import { useLeads, Lead, Pipeline } from "@/hooks/useLeads";
import { LeadDetailSheet } from "./LeadDetailSheet";
import { EditLeadDialog } from "./EditLeadDialog";

interface LeadPipelineProps {
  pipeline: Pipeline;
  onCreateLead: () => void;
}

export function LeadPipeline({ pipeline, onCreateLead }: LeadPipelineProps) {
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
      <div className="p-4 space-y-4">
        {/* Stats bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {stats.total} opportunités
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <span className="text-muted-foreground">€</span>
              {formatCurrency(stats.weightedValue)} pondéré
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowClosed(!showClosed)}>
            {showClosed ? "Masquer clôturés" : "Afficher clôturés"}
          </Button>
        </div>

        {/* Kanban */}
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)]">
          <KanbanBoard<Lead>
            columns={kanbanColumns}
            isLoading={isLoading}
            onDrop={handleDrop}
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

          {/* Add lead button */}
          <div className="flex-shrink-0 w-72">
            <Button
              variant="outline"
              className="w-full h-full min-h-[200px] border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={onCreateLead}
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle opportunité
            </Button>
          </div>
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

      <EditLeadDialog
        lead={editingLead}
        open={!!editingLead}
        onOpenChange={(open) => !open && setEditingLead(null)}
      />
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
