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
  Send,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users
} from "lucide-react";
import { Pipeline, PipelineStage } from "@/hooks/useCRMPipelines";
import { useContactPipeline, PipelineEntry } from "@/hooks/useContactPipeline";
import { usePipelineActions } from "@/hooks/usePipelineActions";
import { useAuth } from "@/contexts/AuthContext";
import { PipelineEmailModal } from "./PipelineEmailModal";
import { BulkAddToPipelineDialog } from "./BulkAddToPipelineDialog";
import { BulkEmailDialog } from "./BulkEmailDialog";
import { PipelineEntrySidebar } from "./PipelineEntrySidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, differenceInHours, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
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

// Entry Card Component with action alerts
function EntryCard({
  entry,
  onRemove,
  onClick,
}: {
  entry: PipelineEntry;
  onRemove: () => void;
  onClick: () => void;
}) {
  const { activeWorkspace } = useAuth();
  const { actions, pendingCount, overdueCount } = usePipelineActions(entry.id, activeWorkspace?.id);
  
  const isContact = !!entry.contact;
  const entity = entry.contact || entry.company;
  const name = entity?.name || "Sans nom";
  const email = isContact ? entry.contact?.email : entry.company?.email;

  // Check for urgent upcoming action (within 24h)
  const urgentAction = actions.find(a => {
    if (a.status !== 'pending' || !a.due_date) return false;
    const hoursUntil = differenceInHours(new Date(a.due_date), new Date());
    return hoursUntil > 0 && hoursUntil <= 24;
  });

  // Determine alert state
  const hasOverdue = overdueCount > 0;
  const hasNoActions = pendingCount === 0;
  const hasUrgent = !!urgentAction && !hasOverdue;

  return (
    <Card 
      className={cn(
        "shadow-sm hover:shadow-md transition-shadow cursor-pointer",
        hasOverdue && "border-red-500 border-l-4",
        hasNoActions && !hasOverdue && "border-amber-500 border-l-4",
        hasUrgent && !hasOverdue && !hasNoActions && "border-orange-500 border-l-4"
      )} 
      onClick={onClick}
    >
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

          {/* Alert indicators */}
          <div className="flex flex-col items-end gap-1">
            {hasOverdue && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="destructive" className="h-5 px-1.5 gap-0.5">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-[10px]">{overdueCount}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {overdueCount} action{overdueCount > 1 ? 's' : ''} en retard
                </TooltipContent>
              </Tooltip>
            )}
            
            {hasNoActions && !hasOverdue && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="h-5 px-1.5 border-amber-500 text-amber-600">
                    <Clock className="h-3 w-3" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Aucune action planifiée
                </TooltipContent>
              </Tooltip>
            )}
            
            {hasUrgent && !hasOverdue && !hasNoActions && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="h-5 px-1.5 border-orange-500 text-orange-600">
                    <AlertTriangle className="h-3 w-3" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Action urgente aujourd'hui
                </TooltipContent>
              </Tooltip>
            )}

            {pendingCount > 0 && !hasOverdue && !hasUrgent && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="h-5 px-1.5 text-green-600 border-green-500">
                    <CheckCircle className="h-3 w-3" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {pendingCount} action{pendingCount > 1 ? 's' : ''} planifiée{pendingCount > 1 ? 's' : ''}
                </TooltipContent>
              </Tooltip>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                >
                  Retirer du pipeline
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
