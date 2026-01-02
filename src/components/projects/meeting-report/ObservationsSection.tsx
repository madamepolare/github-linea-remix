import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { FileUpload } from "@/components/shared/FileUpload";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Clock, MessageSquare, Plus, Image, X } from "lucide-react";
import { ProjectObservation, ObservationStatus, ProjectLot } from "@/hooks/useChantier";
import { OBSERVATION_PRIORITY, OBSERVATION_STATUS } from "@/lib/projectTypes";

interface ObservationsSectionProps {
  observations: ProjectObservation[];
  allProjectObservations: ProjectObservation[];
  lots: ProjectLot[];
  meetingId: string;
  onStatusChange: (id: string, status: ObservationStatus) => void;
  onAddObservation: (obs: {
    description: string;
    lot_id?: string;
    priority: string;
    due_date?: string;
    photo_urls?: string[];
  }) => void;
  onUpdateObservation: (id: string, updates: Partial<ProjectObservation>) => void;
  onUpdateComment: (id: string, comment: string) => void;
  observationComments: Record<string, string>;
}

export function ObservationsSection({
  observations,
  allProjectObservations,
  lots,
  meetingId,
  onStatusChange,
  onAddObservation,
  onUpdateObservation,
  onUpdateComment,
  observationComments,
}: ObservationsSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [description, setDescription] = useState("");
  const [lotId, setLotId] = useState<string | null>(null);
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  // Get all unresolved observations from the project (not just this meeting)
  const unresolvedFromOtherMeetings = allProjectObservations.filter(
    o => o.status !== "resolved" && o.meeting_id !== meetingId
  );

  // Combine: meeting observations + unresolved from project
  const displayObservations = [
    ...observations,
    ...unresolvedFromOtherMeetings.filter(o => !observations.find(mo => mo.id === o.id))
  ];

  const handleAdd = () => {
    if (!description.trim()) return;
    onAddObservation({
      description: description.trim(),
      lot_id: lotId || undefined,
      priority,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
      photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
    });
    setDescription("");
    setLotId(null);
    setPriority("normal");
    setDueDate(null);
    setPhotoUrls([]);
    setShowAddForm(false);
  };

  const handlePhotoUpload = (obsId: string, newUrls: string[], existingUrls: string[]) => {
    onUpdateObservation(obsId, { photo_urls: [...existingUrls, ...newUrls] });
  };

  const handlePhotoRemove = (obsId: string, urlToRemove: string, existingUrls: string[]) => {
    onUpdateObservation(obsId, { photo_urls: existingUrls.filter(u => u !== urlToRemove) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Observations non résolues du chantier automatiquement incluses
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Ajouter
        </Button>
      </div>

      {showAddForm && (
        <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description de l'observation..."
            rows={2}
            className="text-sm"
          />
          
          {/* Photo upload for new observation */}
          <FileUpload
            bucket="observation-files"
            folder={`observations/${meetingId}`}
            existingUrls={photoUrls}
            onUpload={(urls) => setPhotoUrls(prev => [...prev, ...urls])}
            onRemove={(url) => setPhotoUrls(prev => prev.filter(u => u !== url))}
            maxFiles={5}
          />
          
          <div className="flex gap-2 flex-wrap">
            <Select value={lotId || "none"} onValueChange={(v) => setLotId(v === "none" ? null : v)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Lot..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun lot</SelectItem>
                {lots.map((lot) => (
                  <SelectItem key={lot.id} value={lot.id}>{lot.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OBSERVATION_PRIORITY.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InlineDatePicker
              value={dueDate}
              onChange={setDueDate}
              placeholder="Échéance"
              className="w-[140px] h-8 text-xs"
            />
            <div className="flex-1" />
            <Button size="sm" className="h-8" onClick={handleAdd} disabled={!description.trim()}>
              Ajouter
            </Button>
          </div>
        </div>
      )}

      {displayObservations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucune observation
        </p>
      ) : (
        <div className="space-y-2">
          {displayObservations.map((obs) => {
            const lot = lots.find(l => l.id === obs.lot_id);
            const priorityConfig = OBSERVATION_PRIORITY.find(p => p.value === obs.priority);
            const statusConfig = OBSERVATION_STATUS.find(s => s.value === obs.status);
            const isFromOtherMeeting = obs.meeting_id !== meetingId;
            const comment = observationComments[obs.id] || "";

            return (
              <div
                key={obs.id}
                className={cn(
                  "p-3 rounded-lg border",
                  obs.priority === "critical" && "border-destructive/50 bg-destructive/5",
                  obs.priority === "high" && "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20",
                  isFromOtherMeeting && "opacity-80"
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={obs.status === "resolved"}
                    onCheckedChange={(checked) => 
                      onStatusChange(obs.id, checked ? "resolved" : "open")
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-2">
                    <p className={cn(
                      "text-sm",
                      obs.status === "resolved" && "line-through text-muted-foreground"
                    )}>
                      {obs.description}
                    </p>
                    
                    {/* Photo display and upload */}
                    <FileUpload
                      bucket="observation-files"
                      folder={`observations/${obs.meeting_id || obs.id}`}
                      existingUrls={obs.photo_urls || []}
                      onUpload={(urls) => handlePhotoUpload(obs.id, urls, obs.photo_urls || [])}
                      onRemove={(url) => handlePhotoRemove(obs.id, url, obs.photo_urls || [])}
                      maxFiles={5}
                    />
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {statusConfig?.label || obs.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {priorityConfig?.label || obs.priority}
                      </Badge>
                      {lot && (
                        <Badge variant="outline" className="text-xs">
                          {lot.name}
                        </Badge>
                      )}
                      {obs.created_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(obs.created_at), "d MMM yyyy", { locale: fr })}
                        </span>
                      )}
                      {isFromOtherMeeting && obs.meeting && (
                        <Badge variant="secondary" className="text-xs bg-muted">
                          CR #{obs.meeting.meeting_number}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Ajouter un commentaire pour ce CR..."
                        value={comment}
                        onChange={(e) => onUpdateComment(obs.id, e.target.value)}
                        className="h-7 text-xs flex-1"
                      />
                    </div>
                  </div>
                  <Select
                    value={obs.status}
                    onValueChange={(v) => onStatusChange(obs.id, v as ObservationStatus)}
                  >
                    <SelectTrigger className="w-[110px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OBSERVATION_STATUS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
