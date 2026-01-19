import { useState, forwardRef } from "react";
import { format, addMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Users, 
  X,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamEvaluation, evaluationTypeLabels } from "@/hooks/useTeamEvaluations";

interface InterviewSchedulerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (data: ScheduleData) => void;
  isLoading?: boolean;
  initialData?: Partial<ScheduleData>;
}

export interface ScheduleData {
  user_id: string;
  evaluation_type: TeamEvaluation["evaluation_type"];
  scheduled_date: string;
  duration_minutes: number;
  location?: string;
  meeting_link?: string;
  panel_members: string[];
  notes?: string;
}

const durationOptions = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1h" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2h" },
];

export function InterviewScheduler({
  open,
  onOpenChange,
  onSchedule,
  isLoading,
  initialData,
}: InterviewSchedulerProps) {
  const { data: members } = useTeamMembers();
  const { user } = useAuth();
  const [step, setStep] = useState<"details" | "panel">("details");
  const [searchPanel, setSearchPanel] = useState("");
  
  const [formData, setFormData] = useState<ScheduleData>({
    user_id: initialData?.user_id || "",
    evaluation_type: initialData?.evaluation_type || "annual",
    scheduled_date: initialData?.scheduled_date || "",
    duration_minutes: initialData?.duration_minutes || 60,
    location: initialData?.location || "",
    meeting_link: initialData?.meeting_link || "",
    panel_members: initialData?.panel_members || [],
    notes: initialData?.notes || "",
  });

  const selectedMember = members?.find(m => m.user_id === formData.user_id);
  const availablePanelMembers = members?.filter(
    m => m.user_id !== formData.user_id && m.user_id !== user?.id
  ) || [];

  const filteredPanelMembers = availablePanelMembers.filter(m =>
    m.profile?.full_name?.toLowerCase().includes(searchPanel.toLowerCase()) ||
    m.profile?.job_title?.toLowerCase().includes(searchPanel.toLowerCase())
  );

  const togglePanelMember = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      panel_members: prev.panel_members.includes(userId)
        ? prev.panel_members.filter(id => id !== userId)
        : [...prev.panel_members, userId]
    }));
  };

  const handleSubmit = () => {
    if (!formData.user_id || !formData.scheduled_date) return;
    onSchedule(formData);
  };

  const resetForm = () => {
    setFormData({
      user_id: "",
      evaluation_type: "annual",
      scheduled_date: "",
      duration_minutes: 60,
      location: "",
      meeting_link: "",
      panel_members: [],
      notes: "",
    });
    setStep("details");
    setSearchPanel("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const getInitials = (name?: string) => 
    name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  const scheduledDateTime = formData.scheduled_date 
    ? new Date(formData.scheduled_date) 
    : null;
  const endTime = scheduledDateTime 
    ? addMinutes(scheduledDateTime, formData.duration_minutes) 
    : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "details" ? "Planifier un entretien" : "Sélectionner le jury"}
          </DialogTitle>
        </DialogHeader>

        {step === "details" ? (
          <div className="space-y-4 py-4">
            {/* Collaborateur */}
            <div className="space-y-2">
              <Label>Collaborateur à évaluer</Label>
              <Select
                value={formData.user_id}
                onValueChange={(v) => setFormData({ ...formData, user_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {members?.filter(m => m.user_id !== user?.id).map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={m.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(m.profile?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{m.profile?.full_name || m.profile?.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Type d'entretien</Label>
              <Select
                value={formData.evaluation_type}
                onValueChange={(v) => setFormData({ 
                  ...formData, 
                  evaluation_type: v as TeamEvaluation["evaluation_type"] 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(evaluationTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date/Time + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Date et heure
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Durée
                </Label>
                <Select
                  value={String(formData.duration_minutes)}
                  onValueChange={(v) => setFormData({ ...formData, duration_minutes: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview time */}
            {scheduledDateTime && endTime && (
              <p className="text-xs text-muted-foreground">
                {format(scheduledDateTime, "EEEE d MMMM yyyy", { locale: fr })} de{" "}
                {format(scheduledDateTime, "HH:mm")} à {format(endTime, "HH:mm")}
              </p>
            )}

            {/* Location */}
            <Tabs defaultValue="physical" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="physical">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  Présentiel
                </TabsTrigger>
                <TabsTrigger value="remote">
                  <Video className="h-3.5 w-3.5 mr-1" />
                  Visio
                </TabsTrigger>
              </TabsList>
              <TabsContent value="physical" className="mt-2">
                <Input
                  placeholder="Salle de réunion, bureau..."
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value, meeting_link: "" })}
                />
              </TabsContent>
              <TabsContent value="remote" className="mt-2">
                <Input
                  placeholder="https://meet.google.com/..."
                  value={formData.meeting_link || ""}
                  onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value, location: "" })}
                />
              </TabsContent>
            </Tabs>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes préliminaires (optionnel)</Label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Points à aborder, objectifs..."
                rows={2}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Selected collaborator summary */}
            {selectedMember && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar>
                  <AvatarImage src={selectedMember.profile?.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(selectedMember.profile?.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedMember.profile?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {evaluationTypeLabels[formData.evaluation_type]} • {scheduledDateTime && format(scheduledDateTime, "d MMM à HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>
            )}

            {/* Selected panel members */}
            {formData.panel_members.length > 0 && (
              <div className="space-y-2">
                <Label>Jury sélectionné ({formData.panel_members.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.panel_members.map(userId => {
                    const m = members?.find(m => m.user_id === userId);
                    return (
                      <Badge key={userId} variant="secondary" className="gap-1 pr-1">
                        {m?.profile?.full_name || "Inconnu"}
                        <button 
                          onClick={() => togglePanelMember(userId)}
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un membre..."
                value={searchPanel}
                onChange={(e) => setSearchPanel(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Member list */}
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {filteredPanelMembers.map(m => {
                  const isSelected = formData.panel_members.includes(m.user_id);
                  return (
                    <div
                      key={m.user_id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        isSelected ? "bg-primary/10" : "hover:bg-muted"
                      )}
                      onClick={() => togglePanelMember(m.user_id)}
                    >
                      <Checkbox checked={isSelected} />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={m.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(m.profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {m.profile?.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.profile?.job_title || m.role}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <p className="text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 inline mr-1" />
              Vous serez automatiquement ajouté comme évaluateur principal
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "panel" && (
            <Button variant="outline" onClick={() => setStep("details")}>
              Retour
            </Button>
          )}
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          {step === "details" ? (
            <Button
              onClick={() => setStep("panel")}
              disabled={!formData.user_id || !formData.scheduled_date}
            >
              <Users className="h-4 w-4 mr-2" />
              Définir le jury
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              Planifier l'entretien
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}