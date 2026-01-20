import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Plus, 
  Users
} from "lucide-react";
import { Pipeline, PipelineStage } from "@/hooks/useCRMPipelines";
import { useContactPipeline, PipelineEntry } from "@/hooks/useContactPipeline";
import { PipelineEmailModal } from "./PipelineEmailModal";
import { BulkAddToPipelineDialog } from "./BulkAddToPipelineDialog";
import { BulkEmailDialog } from "./BulkEmailDialog";
import { PipelineEntrySidebar } from "./PipelineEntrySidebar";
import { KanbanBoard, KanbanColumn } from "@/components/shared/KanbanBoard";
import { PipelineEntryKanbanCard } from "./pipeline/PipelineEntryKanbanCard";
import { cn } from "@/lib/utils";

export interface ContactPipelineProps {
  pipeline: Pipeline;
  kanbanHeightClass?: string;
}

export function ContactPipeline({ pipeline, kanbanHeightClass = "h-[600px]" }: ContactPipelineProps) {
  const { entries, isLoading, moveEntry, removeEntry, updateEntryNotes } = useContactPipeline(pipeline.id);
  const [selectedEntry, setSelectedEntry] = useState<PipelineEntry | null>(null);
  const [targetStage, setTargetStage] = useState<PipelineStage | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [sidebarEntry, setSidebarEntry] = useState<PipelineEntry | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Build Kanban columns from pipeline stages
  const kanbanColumns: KanbanColumn<PipelineEntry>[] = useMemo(() => {
    return pipeline.stages.map((stage) => ({
      id: stage.id,
      label: stage.name,
      color: stage.color || "#6B7280",
      items: entries.filter((e) => e.stage_id === stage.id),
      metadata: stage.requires_email_on_enter ? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span>Email requis</span>
        </div>
      ) : undefined,
    }));
  }, [entries, pipeline.stages]);

  const handleDrop = (entryId: string, fromStageId: string, toStageId: string) => {
    if (fromStageId === toStageId) return;

    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    const newStage = pipeline.stages.find((s) => s.id === toStageId);
    
    if (newStage?.requires_email_on_enter) {
      // Open email modal
      setSelectedEntry(entry);
      setTargetStage(newStage);
      setEmailModalOpen(true);
    } else {
      // Move directly
      moveEntry.mutate({ entryId, newStageId: toStageId });
    }
  };

  const handleEmailSent = () => {
    if (selectedEntry && targetStage) {
      moveEntry.mutate({ entryId: selectedEntry.id, newStageId: targetStage.id });
    }
    setEmailModalOpen(false);
    setSelectedEntry(null);
    setTargetStage(null);
  };

  const handleSkipEmail = () => {
    if (selectedEntry && targetStage) {
      moveEntry.mutate({ entryId: selectedEntry.id, newStageId: targetStage.id });
    }
    setEmailModalOpen(false);
    setSelectedEntry(null);
    setTargetStage(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: pipeline.color || "#6B7280" }}
          />
          <h3 className="font-semibold">{pipeline.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {entries.length} entrée{entries.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setBulkEmailOpen(true)}
            disabled={entries.length === 0}
          >
            <Users className="h-4 w-4 mr-1" />
            Email groupé
          </Button>
          <Button size="sm" onClick={() => setBulkAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Kanban Board using shared component */}
      <div className={cn("overflow-hidden", kanbanHeightClass)}>
        <KanbanBoard<PipelineEntry>
          columns={kanbanColumns}
          isLoading={isLoading}
          onDrop={handleDrop}
          getItemId={(entry) => entry.id}
          renderCard={(entry, isDragging) => (
            <PipelineEntryKanbanCard
              entry={entry}
              onClick={() => {
                setSidebarEntry(entry);
                setSidebarOpen(true);
              }}
              onRemove={() => removeEntry.mutate(entry.id)}
              isDragging={isDragging}
            />
          )}
          emptyColumnContent="Aucune entrée"
          className="h-full px-0"
        />
      </div>

      {/* Email Modal */}
      <PipelineEmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        entry={selectedEntry}
        stage={targetStage}
        pipelineId={pipeline.id}
        pipelineEmailAiPrompt={pipeline.email_ai_prompt}
        onEmailSent={handleEmailSent}
        onSkip={handleSkipEmail}
      />

      {/* Bulk Add Dialog */}
      <BulkAddToPipelineDialog
        open={bulkAddOpen}
        onOpenChange={setBulkAddOpen}
        pipeline={pipeline}
      />

      {/* Bulk Email Dialog */}
      <BulkEmailDialog
        open={bulkEmailOpen}
        onOpenChange={setBulkEmailOpen}
        entries={entries}
        pipelineId={pipeline.id}
        pipelineName={pipeline.name}
      />

      {/* Entry Detail Sidebar */}
      <PipelineEntrySidebar
        entry={sidebarEntry}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        onUpdateNotes={(entryId, notes) => {
          updateEntryNotes?.mutate({ entryId, notes });
        }}
      />
    </div>
  );
}
