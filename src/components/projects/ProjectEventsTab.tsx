import { useState } from "react";
import { useProjectDeliverables, DeliverableStatus } from "@/hooks/useProjectDeliverables";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { useProject } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { format, parseISO, isPast, isToday, isFuture, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DELIVERABLE_STATUS } from "@/lib/projectTypes";
import { getDefaultDeliverablesForPhase } from "@/lib/defaultDeliverables";
import { toast } from "sonner";
import {
  AlertCircle,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ProjectEventsTabProps {
  projectId: string;
}

export function ProjectEventsTab({ projectId }: ProjectEventsTabProps) {
  const { deliverables, isLoading, createDeliverable, updateDeliverable, deleteDeliverable } = useProjectDeliverables(projectId);
  const { phases } = useProjectPhases(projectId);
  const { data: project } = useProject(projectId);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<any | null>(null);
  const [filterPhase, setFilterPhase] = useState<string>("all");
  
  const [isSendEmailOpen, setIsSendEmailOpen] = useState(false);
  const [emailDeliverable, setEmailDeliverable] = useState<any | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPhaseId, setFormPhaseId] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<DeliverableStatus>("pending");
  const [formDueDate, setFormDueDate] = useState<Date | null>(null);
  const [formFileUrl, setFormFileUrl] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormPhaseId(null);
    setFormStatus("pending");
    setFormDueDate(null);
    setFormFileUrl("");
  };

  const openEditDialog = (deliverable: any) => {
    setEditingDeliverable(deliverable);
    setFormName(deliverable.name);
    setFormDescription(deliverable.description || "");
    setFormPhaseId(deliverable.phase_id);
    setFormStatus(deliverable.status as DeliverableStatus);
    setFormDueDate(deliverable.due_date ? parseISO(deliverable.due_date) : null);
    setFormFileUrl(deliverable.file_url || "");
  };

  const handleCreate = () => {
    if (!formName.trim()) return;

    createDeliverable.mutate({
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      phase_id: formPhaseId || undefined,
      status: formStatus,
      due_date: formDueDate ? format(formDueDate, "yyyy-MM-dd") : undefined,
      file_url: formFileUrl.trim() || undefined,
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingDeliverable || !formName.trim()) return;

    updateDeliverable.mutate({
      id: editingDeliverable.id,
      name: formName.trim(),
      description: formDescription.trim() || null,
      phase_id: formPhaseId,
      status: formStatus,
      due_date: formDueDate ? format(formDueDate, "yyyy-MM-dd") : null,
      file_url: formFileUrl.trim() || null,
    });

    setEditingDeliverable(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cet événement ?")) {
      deleteDeliverable.mutate(id);
    }
  };

  const handleStatusChange = (id: string, newStatus: DeliverableStatus) => {
    updateDeliverable.mutate({ 
      id, 
      status: newStatus,
      delivered_at: newStatus === "delivered" || newStatus === "validated" ? new Date().toISOString() : null
    });
  };

  const handleGenerateDeliverables = async () => {
    if (phases.length === 0) {
      toast.error("Aucune phase définie pour ce projet");
      return;
    }

    let createdCount = 0;
    for (const phase of phases) {
      const defaultDeliverables = getDefaultDeliverablesForPhase(phase.name);
      for (const deliverable of defaultDeliverables) {
        const exists = deliverables.some(
          d => d.name === deliverable.name && d.phase_id === phase.id
        );
        if (!exists) {
          await createDeliverable.mutateAsync({
            name: deliverable.name,
            description: deliverable.description,
            phase_id: phase.id,
            status: "pending",
          });
          createdCount++;
        }
      }
    }

    if (createdCount > 0) {
      toast.success(`${createdCount} livrables créés automatiquement`);
    } else {
      toast.info("Tous les livrables par défaut existent déjà");
    }
  };

  const openSendEmailDialog = (deliverable: any) => {
    setEmailDeliverable(deliverable);
    setEmailTo("");
    setEmailSubject(`Livrable: ${deliverable.name} - ${project?.name || "Projet"}`);
    setIsSendEmailOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailTo || !emailDeliverable) return;

    setIsSendingEmail(true);
    try {
      const phase = phases.find(p => p.id === emailDeliverable.phase_id);
      
      const { data, error } = await supabase.functions.invoke("send-deliverable-email", {
        body: {
          to: emailTo,
          subject: emailSubject,
          deliverableName: emailDeliverable.name,
          projectName: project?.name || "Projet",
          phaseName: phase?.name,
          description: emailDeliverable.description,
          fileUrl: emailDeliverable.file_url,
        },
      });

      if (error) throw error;

      await updateDeliverable.mutateAsync({
        id: emailDeliverable.id,
        status: "delivered",
        delivered_at: new Date().toISOString(),
      });

      toast.success("Email envoyé et livrable marqué comme livré");
      setIsSendEmailOpen(false);
      setEmailDeliverable(null);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error("Erreur lors de l'envoi: " + error.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  // Separate into upcoming and past
  const now = new Date();
  const upcomingEvents = deliverables
    .filter(d => d.due_date && (isFuture(parseISO(d.due_date)) || isToday(parseISO(d.due_date))) && d.status !== "delivered" && d.status !== "validated")
    .sort((a, b) => parseISO(a.due_date!).getTime() - parseISO(b.due_date!).getTime());
  
  const overdueEvents = deliverables
    .filter(d => d.due_date && isPast(parseISO(d.due_date)) && !isToday(parseISO(d.due_date)) && d.status !== "delivered" && d.status !== "validated")
    .sort((a, b) => parseISO(b.due_date!).getTime() - parseISO(a.due_date!).getTime());
  
  const completedEvents = deliverables
    .filter(d => d.status === "delivered" || d.status === "validated")
    .sort((a, b) => parseISO(b.delivered_at || b.updated_at).getTime() - parseISO(a.delivered_at || a.updated_at).getTime());
  
  const unscheduledEvents = deliverables
    .filter(d => !d.due_date && d.status !== "delivered" && d.status !== "validated");

  // Filter by phase
  const filterByPhase = (items: typeof deliverables) => {
    if (filterPhase === "all") return items;
    if (filterPhase === "none") return items.filter(d => !d.phase_id);
    return items.filter(d => d.phase_id === filterPhase);
  };

  if (deliverables.length === 0) {
    return (
      <>
        <EmptyState
          icon={Calendar}
          title="Aucun événement planifié"
          description="Planifiez l'envoi de livrables ou d'invitations réunion."
          action={{ label: "Ajouter un événement", onClick: () => setIsCreateOpen(true) }}
        />
        <EventDialog
          isOpen={isCreateOpen}
          onClose={() => { setIsCreateOpen(false); resetForm(); }}
          formName={formName}
          setFormName={setFormName}
          formDescription={formDescription}
          setFormDescription={setFormDescription}
          formPhaseId={formPhaseId}
          setFormPhaseId={setFormPhaseId}
          formStatus={formStatus}
          setFormStatus={setFormStatus}
          formDueDate={formDueDate}
          setFormDueDate={setFormDueDate}
          formFileUrl={formFileUrl}
          setFormFileUrl={setFormFileUrl}
          phases={phases}
          onSubmit={handleCreate}
          isEditing={false}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={filterPhase} onValueChange={setFilterPhase}>
            <SelectTrigger className="w-[180px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Toutes phases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les phases</SelectItem>
              <SelectItem value="none">Sans phase</SelectItem>
              {phases.map((phase) => (
                <SelectItem key={phase.id} value={phase.id}>
                  {phase.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleGenerateDeliverables}>
            <Sparkles className="h-4 w-4 mr-1.5" />
            Auto-générer
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nouvel événement
          </Button>
        </div>
      </div>

      {/* Overdue Section */}
      {filterByPhase(overdueEvents).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <h3 className="font-medium text-destructive">En retard</h3>
            <Badge variant="destructive" className="text-xs">{filterByPhase(overdueEvents).length}</Badge>
          </div>
          <div className="space-y-2">
            {filterByPhase(overdueEvents).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                phase={phases.find(p => p.id === event.phase_id)}
                onEdit={() => openEditDialog(event)}
                onDelete={() => handleDelete(event.id)}
                onStatusChange={handleStatusChange}
                onSendEmail={() => openSendEmailDialog(event)}
                isOverdue
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Section */}
      {filterByPhase(upcomingEvents).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-medium">À venir</h3>
            <Badge variant="secondary" className="text-xs">{filterByPhase(upcomingEvents).length}</Badge>
          </div>
          <div className="space-y-2">
            {filterByPhase(upcomingEvents).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                phase={phases.find(p => p.id === event.phase_id)}
                onEdit={() => openEditDialog(event)}
                onDelete={() => handleDelete(event.id)}
                onStatusChange={handleStatusChange}
                onSendEmail={() => openSendEmailDialog(event)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unscheduled Section */}
      {filterByPhase(unscheduledEvents).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarPlus className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-muted-foreground">Non planifié</h3>
            <Badge variant="outline" className="text-xs">{filterByPhase(unscheduledEvents).length}</Badge>
          </div>
          <div className="space-y-2">
            {filterByPhase(unscheduledEvents).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                phase={phases.find(p => p.id === event.phase_id)}
                onEdit={() => openEditDialog(event)}
                onDelete={() => handleDelete(event.id)}
                onStatusChange={handleStatusChange}
                onSendEmail={() => openSendEmailDialog(event)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Section */}
      {filterByPhase(completedEvents).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h3 className="font-medium text-emerald-600">Terminé</h3>
            <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
              {filterByPhase(completedEvents).length}
            </Badge>
          </div>
          <div className="space-y-2">
            {filterByPhase(completedEvents).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                phase={phases.find(p => p.id === event.phase_id)}
                onEdit={() => openEditDialog(event)}
                onDelete={() => handleDelete(event.id)}
                onStatusChange={handleStatusChange}
                onSendEmail={() => openSendEmailDialog(event)}
                isCompleted
              />
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <EventDialog
        isOpen={isCreateOpen || !!editingDeliverable}
        onClose={() => { setIsCreateOpen(false); setEditingDeliverable(null); resetForm(); }}
        formName={formName}
        setFormName={setFormName}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        formPhaseId={formPhaseId}
        setFormPhaseId={setFormPhaseId}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        formDueDate={formDueDate}
        setFormDueDate={setFormDueDate}
        formFileUrl={formFileUrl}
        setFormFileUrl={setFormFileUrl}
        phases={phases}
        onSubmit={editingDeliverable ? handleUpdate : handleCreate}
        isEditing={!!editingDeliverable}
      />

      {/* Send Email Dialog */}
      <Dialog open={isSendEmailOpen} onOpenChange={setIsSendEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Envoyer par email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Destinataire</Label>
              <Input
                type="email"
                placeholder="email@exemple.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sujet</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            {emailDeliverable && (
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p className="font-medium">{emailDeliverable.name}</p>
                {emailDeliverable.description && (
                  <p className="text-muted-foreground text-xs">{emailDeliverable.description}</p>
                )}
                {emailDeliverable.file_url && (
                  <p className="text-xs text-primary flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Fichier joint
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendEmailOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSendEmail} disabled={!emailTo || isSendingEmail}>
              {isSendingEmail ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1.5" />
              )}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Event Card Component
interface EventCardProps {
  event: any;
  phase?: any;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (id: string, status: DeliverableStatus) => void;
  onSendEmail: () => void;
  isOverdue?: boolean;
  isCompleted?: boolean;
}

function EventCard({ event, phase, onEdit, onDelete, onStatusChange, onSendEmail, isOverdue, isCompleted }: EventCardProps) {
  const statusConfig = DELIVERABLE_STATUS.find(s => s.value === event.status);
  
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg border bg-card transition-colors",
        isOverdue && "border-destructive/50 bg-destructive/5",
        isCompleted && "opacity-60"
      )}
    >
      {/* Phase indicator */}
      <div
        className="w-1 h-12 rounded-full flex-shrink-0"
        style={{ backgroundColor: phase?.color || "#e5e7eb" }}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className={cn("font-medium text-sm truncate", isCompleted && "line-through")}>
            {event.name}
          </span>
          {phase && (
            <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
              {phase.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {event.due_date && (
            <span className={cn("flex items-center gap-1", isOverdue && "text-destructive font-medium")}>
              <Calendar className="h-3 w-3" />
              {format(parseISO(event.due_date), "dd MMM yyyy", { locale: fr })}
            </span>
          )}
          {event.description && (
            <span className="truncate max-w-[200px]">{event.description}</span>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <Badge 
        variant="secondary" 
        className={cn("text-xs", statusConfig?.color)}
      >
        {statusConfig?.label || event.status}
      </Badge>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSendEmail}>
            <Send className="h-3.5 w-3.5 mr-2" />
            Envoyer par email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onStatusChange(event.id, "pending")}>
            En attente
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange(event.id, "in_progress")}>
            En cours
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange(event.id, "delivered")}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
            Marquer comme envoyé
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Event Dialog Component
interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formName: string;
  setFormName: (v: string) => void;
  formDescription: string;
  setFormDescription: (v: string) => void;
  formPhaseId: string | null;
  setFormPhaseId: (v: string | null) => void;
  formStatus: DeliverableStatus;
  setFormStatus: (v: DeliverableStatus) => void;
  formDueDate: Date | null;
  setFormDueDate: (v: Date | null) => void;
  formFileUrl: string;
  setFormFileUrl: (v: string) => void;
  phases: any[];
  onSubmit: () => void;
  isEditing: boolean;
}

function EventDialog({
  isOpen,
  onClose,
  formName,
  setFormName,
  formDescription,
  setFormDescription,
  formPhaseId,
  setFormPhaseId,
  formStatus,
  setFormStatus,
  formDueDate,
  setFormDueDate,
  formFileUrl,
  setFormFileUrl,
  phases,
  onSubmit,
  isEditing,
}: EventDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier l'événement" : "Nouvel événement"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input
              placeholder="Ex: Envoi APD, Invitation réunion..."
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Description optionnelle..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Phase</Label>
              <Select value={formPhaseId || "none"} onValueChange={(v) => setFormPhaseId(v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune phase</SelectItem>
                  {phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date prévue</Label>
              <InlineDatePicker
                value={formDueDate}
                onChange={setFormDueDate}
                placeholder="Sélectionner..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={formStatus} onValueChange={(v) => setFormStatus(v as DeliverableStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELIVERABLE_STATUS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lien fichier (optionnel)</Label>
            <Input
              placeholder="https://..."
              value={formFileUrl}
              onChange={(e) => setFormFileUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={!formName.trim()}>
            {isEditing ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
