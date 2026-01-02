import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/KanbanBoard";
import { Plus, Building2, DollarSign, Pencil } from "lucide-react";
import { useLeads, Lead, Pipeline } from "@/hooks/useLeads";
import { LeadDetailSheet } from "./LeadDetailSheet";
import { EditLeadDialog } from "./EditLeadDialog";

interface LeadPipelineProps {
  pipeline: Pipeline;
  onCreateLead: () => void;
}

export function LeadPipeline({ pipeline, onCreateLead }: LeadPipelineProps) {
  const { leads, isLoading, updateLeadStage } = useLeads({ pipelineId: pipeline.id });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const stages = pipeline.stages || [];

  const handleDrop = (leadId: string, _fromColumn: string, toColumn: string) => {
    updateLeadStage.mutate({ leadId, stageId: toColumn });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
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
      metadata: totalValue > 0 ? (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <DollarSign className="h-3.5 w-3.5" />
          <span className="font-medium">{formatCurrency(totalValue)}</span>
        </div>
      ) : undefined,
    };
  });

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 px-6 h-full pt-4">
        <KanbanBoard<Lead>
          columns={kanbanColumns}
          isLoading={isLoading}
          onDrop={handleDrop}
          getItemId={(lead) => lead.id}
          renderCard={(lead, isDragging) => (
            <LeadKanbanCard
              lead={lead}
              stageColor={stages.find(s => s.id === lead.stage_id)?.color}
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
            className="w-full h-full min-h-[300px] border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors"
            onClick={onCreateLead}
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle opportunité
          </Button>
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
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate weighted value
  const weightedValue = lead.estimated_value && lead.probability
    ? lead.estimated_value * (lead.probability / 100)
    : null;

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

        {/* Value and probability */}
        <div className="flex items-center gap-2 flex-wrap">
          {lead.estimated_value && (
            <Badge variant="secondary" className="text-2xs font-medium">
              {formatCurrency(lead.estimated_value)}
            </Badge>
          )}
          {lead.probability && (
            <span className="text-xs text-muted-foreground">
              {lead.probability}%
            </span>
          )}
          {weightedValue && (
            <span className="text-2xs text-muted-foreground">
              (~{formatCurrency(weightedValue)})
            </span>
          )}
        </div>

        {/* Next action */}
        {lead.next_action && (
          <p className="text-xs text-muted-foreground line-clamp-1 pt-1 border-t border-border/30">
            → {lead.next_action}
          </p>
        )}
      </div>
    </KanbanCard>
  );
}
