import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Building2, DollarSign, GripVertical } from "lucide-react";
import { useLeads, Lead, Pipeline, PipelineStage } from "@/hooks/useLeads";
import { LeadDetailSheet } from "./LeadDetailSheet";
import { cn } from "@/lib/utils";

interface LeadPipelineProps {
  pipeline: Pipeline;
  onCreateLead: () => void;
}

export function LeadPipeline({ pipeline, onCreateLead }: LeadPipelineProps) {
  const { leads, isLoading, updateLeadStage } = useLeads({ pipelineId: pipeline.id });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const stages = pipeline.stages || [];

  const getLeadsByStage = (stageId: string) => {
    return leads.filter((lead) => lead.stage_id === stageId);
  };

  const getTotalValue = (stageLeads: Lead[]) => {
    return stageLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedLead && draggedLead.stage_id !== stageId) {
      updateLeadStage.mutate({ leadId: draggedLead.id, stageId });
    }
    setDraggedLead(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-72">
            <Skeleton className="h-8 w-full mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = getLeadsByStage(stage.id);
          const totalValue = getTotalValue(stageLeads);

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-72"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color || "#6366f1" }}
                  />
                  <h3 className="font-medium">{stage.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {stageLeads.length}
                  </Badge>
                </div>
              </div>

              {totalValue > 0 && (
                <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatCurrency(totalValue)}
                </p>
              )}

              <div className="space-y-3 min-h-[200px]">
                {stageLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    stageColor={stage.color}
                    onDragStart={(e) => handleDragStart(e, lead)}
                    onClick={() => setSelectedLead(lead)}
                  />
                ))}

                {stageLeads.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                    Aucune opportunité
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add stage button */}
        <div className="flex-shrink-0 w-72">
          <Button
            variant="outline"
            className="w-full h-full min-h-[200px] border-dashed"
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
      />
    </>
  );
}

interface LeadCardProps {
  lead: Lead;
  stageColor?: string | null;
  onDragStart: (e: React.DragEvent) => void;
  onClick: () => void;
}

function LeadCard({ lead, stageColor, onDragStart, onClick }: LeadCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      draggable
      onDragStart={onDragStart as any}
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border bg-card cursor-pointer transition-all",
        "hover:shadow-md hover:border-primary/20"
      )}
      style={{ borderLeftColor: stageColor || "#6366f1", borderLeftWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium line-clamp-2">{lead.title}</h4>
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab" />
      </div>

      {lead.company && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Building2 className="h-3 w-3" />
          <span className="truncate">{lead.company.name}</span>
        </div>
      )}

      {lead.estimated_value && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {formatCurrency(lead.estimated_value)}
          </Badge>
          {lead.probability && (
            <span className="text-xs text-muted-foreground">{lead.probability}%</span>
          )}
        </div>
      )}

      {lead.next_action && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
          → {lead.next_action}
        </p>
      )}
    </motion.div>
  );
}
