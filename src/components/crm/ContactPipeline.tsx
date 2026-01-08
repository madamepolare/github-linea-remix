import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Plus, 
  MoreHorizontal,
  Calendar,
  Send
} from "lucide-react";
import { Pipeline, PipelineStage } from "@/hooks/useCRMPipelines";
import { useContactPipeline, PipelineEntry } from "@/hooks/useContactPipeline";
import { PipelineEmailModal } from "./PipelineEmailModal";
import { BulkAddToPipelineDialog } from "./BulkAddToPipelineDialog";
import { PipelineEntrySidebar } from "./PipelineEntrySidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  const [sidebarEntry, setSidebarEntry] = useState<PipelineEntry | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Group entries by stage
  const entriesByStage = useMemo(() => {
    const grouped: Record<string, PipelineEntry[]> = {};
    pipeline.stages.forEach((stage) => {
      grouped[stage.id] = entries.filter((e) => e.stage_id === stage.id);
    });
    return grouped;
  }, [entries, pipeline.stages]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const entryId = result.draggableId;
    const newStageId = result.destination.droppableId;
    const entry = entries.find((e) => e.id === entryId);
    
    if (!entry || entry.stage_id === newStageId) return;

    const newStage = pipeline.stages.find((s) => s.id === newStageId);
    
    if (newStage?.requires_email_on_enter) {
      // Open email modal
      setSelectedEntry(entry);
      setTargetStage(newStage);
      setEmailModalOpen(true);
    } else {
      // Move directly
      moveEntry.mutate({ entryId, newStageId });
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

  if (isLoading) {
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
        <Button size="sm" onClick={() => setBulkAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={`flex gap-4 overflow-x-auto pb-4 ${kanbanHeightClass}`}>
          {pipeline.stages.map((stage) => (
            <div key={stage.id} className="flex-shrink-0 w-72">
              {/* Stage Header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: stage.color || "#6B7280" }}
                />
                <span className="font-medium text-sm">{stage.name}</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {entriesByStage[stage.id]?.length || 0}
                </Badge>
                {stage.requires_email_on_enter && (
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>

              {/* Stage Column */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] p-2 rounded-lg border border-dashed transition-colors ${
                      snapshot.isDraggingOver
                        ? "bg-accent/50 border-primary"
                        : "bg-muted/30 border-border"
                    }`}
                  >
                    {entriesByStage[stage.id]?.map((entry, index) => (
                      <Draggable
                        key={entry.id}
                        draggableId={entry.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-2 ${
                              snapshot.isDragging ? "rotate-2" : ""
                            }`}
                          >
                            <EntryCard
                              entry={entry}
                              onRemove={() => removeEntry.mutate(entry.id)}
                              onClick={() => {
                                setSidebarEntry(entry);
                                setSidebarOpen(true);
                              }}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Email Modal */}
      <PipelineEmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        entry={selectedEntry}
        stage={targetStage}
        pipelineId={pipeline.id}
        onEmailSent={handleEmailSent}
        onSkip={handleSkipEmail}
      />

      {/* Bulk Add Dialog */}
      <BulkAddToPipelineDialog
        open={bulkAddOpen}
        onOpenChange={setBulkAddOpen}
        pipeline={pipeline}
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

// Entry Card Component
function EntryCard({
  entry,
  onRemove,
  onClick,
}: {
  entry: PipelineEntry;
  onRemove: () => void;
  onClick: () => void;
}) {
  const isContact = !!entry.contact;
  const entity = entry.contact || entry.company;
  const name = entity?.name || "Sans nom";
  const email = isContact ? entry.contact?.email : entry.company?.email;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={isContact ? entry.contact?.avatar_url : entry.company?.logo_url} />
            <AvatarFallback className="text-xs">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              {isContact ? (
                <User className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Building2 className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="font-medium text-sm truncate">{name}</span>
            </div>
            
            {/* Company for contacts */}
            {isContact && entry.company && (
              <p className="text-xs text-muted-foreground truncate">
                {entry.company.name}
              </p>
            )}
            
            {/* Email */}
            {email && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Mail className="h-3 w-3" />
                <span className="truncate">{email}</span>
              </div>
            )}
            
            {/* Last email sent */}
            {entry.last_email_sent_at && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Send className="h-3 w-3" />
                <span>
                  {format(new Date(entry.last_email_sent_at), "dd MMM", { locale: fr })}
                </span>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={onRemove}
              >
                Retirer du pipeline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Notes preview */}
        {entry.notes && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {entry.notes}
          </p>
        )}
        
        {/* Entry date */}
        {entry.entered_at && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Calendar className="h-3 w-3" />
            <span>
              Entré le {format(new Date(entry.entered_at), "dd MMM yyyy", { locale: fr })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
