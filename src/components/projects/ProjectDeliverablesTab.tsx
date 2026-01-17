import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectDeliverables, DeliverableStatus } from "@/hooks/useProjectDeliverables";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { useProject } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { format, parseISO, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DELIVERABLE_STATUS } from "@/lib/projectTypes";
import { getDefaultDeliverablesForPhase } from "@/lib/defaultDeliverables";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  File,
  FileText,
  Filter,
  ListTodo,
  Loader2,
  Mail,
  MailCheck,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Upload,
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
import { DeliverableTasksGenerator } from "./DeliverableTasksGenerator";
import { AIDeliverablesGenerator } from "./AIDeliverablesGenerator";
import { DeliverableEmailDialog } from "./DeliverableEmailDialog";

interface ProjectDeliverablesTabProps {
  projectId: string;
}

export function ProjectDeliverablesTab({ projectId }: ProjectDeliverablesTabProps) {
  const queryClient = useQueryClient();
  const { deliverables, isLoading, createDeliverable, updateDeliverable, deleteDeliverable } = useProjectDeliverables(projectId);
  const { phases } = useProjectPhases(projectId);
  const { data: project } = useProject(projectId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPhase, setFilterPhase] = useState<string>("all");
  const [isSendEmailOpen, setIsSendEmailOpen] = useState(false);
  const [emailDeliverable, setEmailDeliverable] = useState<any | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [tasksGeneratorOpen, setTasksGeneratorOpen] = useState(false);
  const [tasksDeliverable, setTasksDeliverable] = useState<any | null>(null);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);

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
    if (confirm("Supprimer ce livrable ?")) {
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
        // Check if already exists
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
    const phase = phases.find(p => p.id === deliverable.phase_id);
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

      // Mark as sent
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

  // Stats
  const totalCount = deliverables.length;
  const pendingCount = deliverables.filter(d => d.status === "pending").length;
  const inProgressCount = deliverables.filter(d => d.status === "in_progress").length;
  const deliveredCount = deliverables.filter(d => d.status === "delivered").length;
  const validatedCount = deliverables.filter(d => d.status === "validated").length;
  const overdueCount = deliverables.filter(d => 
    d.due_date && isPast(parseISO(d.due_date)) && d.status !== "delivered" && d.status !== "validated"
  ).length;
  
  const progressPercent = totalCount > 0 
    ? Math.round(((deliveredCount + validatedCount) / totalCount) * 100) 
    : 0;

  // Filtering
  const filteredDeliverables = deliverables.filter(d => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    if (filterPhase !== "all") {
      if (filterPhase === "none" && d.phase_id !== null) return false;
      if (filterPhase !== "none" && d.phase_id !== filterPhase) return false;
    }
    return true;
  });

  if (deliverables.length === 0) {
    return (
      <>
        <EmptyState
          icon={FileText}
          title="Aucun livrable"
          description="Ajoutez des livrables manuellement ou générez-les automatiquement avec l'IA."
          action={{ label: "Ajouter un livrable", onClick: () => setIsCreateOpen(true) }}
          secondaryAction={{ label: "Générer avec IA", onClick: () => setAiGeneratorOpen(true) }}
        />
        <DeliverableDialog
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
        <AIDeliverablesGenerator
          projectId={projectId}
          open={aiGeneratorOpen}
          onOpenChange={setAiGeneratorOpen}
        />
      </>
    );
  }

  // Group by phase
  const groupedByPhase = filteredDeliverables.reduce((acc, deliverable) => {
    const phaseId = deliverable.phase_id || "no-phase";
    if (!acc[phaseId]) acc[phaseId] = [];
    acc[phaseId].push(deliverable);
    return acc;
  }, {} as Record<string, typeof deliverables>);

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progression</span>
              <span className="text-sm font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">En attente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            <div className="text-xs text-muted-foreground">En cours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{deliveredCount + validatedCount}</div>
            <div className="text-xs text-muted-foreground">Livrés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={cn("text-2xl font-bold", overdueCount > 0 ? "text-destructive" : "text-muted-foreground")}>
              {overdueCount}
            </div>
            <div className="text-xs text-muted-foreground">En retard</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {DELIVERABLE_STATUS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPhase} onValueChange={setFilterPhase}>
            <SelectTrigger className="w-[160px] h-8">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes phases</SelectItem>
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
          <Button size="sm" variant="outline" onClick={() => setAiGeneratorOpen(true)}>
            <Sparkles className="h-4 w-4 mr-1" />
            Générer avec IA
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Deliverables List */}
      <Tabs defaultValue="by-phase" className="w-full">
        <TabsList>
          <TabsTrigger value="by-phase">Par phase</TabsTrigger>
          <TabsTrigger value="all">Liste complète</TabsTrigger>
        </TabsList>

        <TabsContent value="by-phase" className="space-y-6 mt-4">
          {Object.entries(groupedByPhase).map(([phaseId, items]) => {
            const phase = phases.find(p => p.id === phaseId);
            const phaseDelivered = items.filter(d => d.status === "delivered" || d.status === "validated").length;
            const phaseProgress = items.length > 0 ? Math.round((phaseDelivered / items.length) * 100) : 0;
            
            return (
              <div key={phaseId}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {phase && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: phase.color || "#3B82F6" }}
                      />
                    )}
                    <h4 className="font-medium">{phase?.name || "Sans phase"}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {items.length} livrable{items.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{phaseProgress}%</span>
                    <Progress value={phaseProgress} className="w-20 h-1.5" />
                  </div>
                </div>
                <div className="grid gap-3">
                  {items.map((deliverable) => (
                    <DeliverableCard
                      key={deliverable.id}
                      deliverable={deliverable}
                      onEdit={() => openEditDialog(deliverable)}
                      onDelete={() => handleDelete(deliverable.id)}
                      onStatusChange={handleStatusChange}
                      onSendEmail={() => openSendEmailDialog(deliverable)}
                      onGenerateTasks={() => {
                        setTasksDeliverable(deliverable);
                        setTasksGeneratorOpen(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <div className="grid gap-3">
            {filteredDeliverables.map((deliverable) => {
              const phase = phases.find(p => p.id === deliverable.phase_id);
              return (
                <DeliverableCard
                  key={deliverable.id}
                  deliverable={deliverable}
                  phase={phase}
                  showPhase
                  onEdit={() => openEditDialog(deliverable)}
                  onDelete={() => handleDelete(deliverable.id)}
                  onStatusChange={handleStatusChange}
                  onSendEmail={() => openSendEmailDialog(deliverable)}
                  onGenerateTasks={() => {
                    setTasksDeliverable(deliverable);
                    setTasksGeneratorOpen(true);
                  }}
                />
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <DeliverableDialog
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

      {/* Send Email Dialog - New Enhanced Version */}
      {emailDeliverable && (
        <DeliverableEmailDialog
          open={isSendEmailOpen}
          onOpenChange={(open) => { 
            if (!open) {
              setIsSendEmailOpen(false);
              setEmailDeliverable(null);
            }
          }}
          deliverable={{
            id: emailDeliverable.id,
            name: emailDeliverable.name,
            description: emailDeliverable.description,
            file_url: emailDeliverable.file_url,
            email_template: emailDeliverable.email_template,
            email_link: emailDeliverable.email_link,
            email_sent_at: emailDeliverable.email_sent_at,
            email_sent_to: emailDeliverable.email_sent_to,
            phase: emailDeliverable.phase,
          }}
          projectId={projectId}
          projectName={project?.name || "Projet"}
          onEmailSent={() => {
            queryClient.invalidateQueries({ queryKey: ["project-deliverables", projectId] });
          }}
        />
      )}

      {/* Tasks Generator Dialog */}
      {tasksDeliverable && (
        <DeliverableTasksGenerator
          open={tasksGeneratorOpen}
          onOpenChange={setTasksGeneratorOpen}
          deliverable={{
            id: tasksDeliverable.id,
            name: tasksDeliverable.name,
            description: tasksDeliverable.description,
            due_date: tasksDeliverable.due_date,
            phase: tasksDeliverable.phase ? {
              phase_name: tasksDeliverable.phase.name,
              phase_code: tasksDeliverable.phase.phase_code,
            } : null,
          }}
          projectId={projectId}
          projectName={project?.name || "Projet"}
        />
      )}

      {/* AI Deliverables Generator */}
      <AIDeliverablesGenerator
        projectId={projectId}
        open={aiGeneratorOpen}
        onOpenChange={setAiGeneratorOpen}
      />
    </div>
  );
}

// Deliverable Card Component
function DeliverableCard({
  deliverable,
  phase,
  showPhase = false,
  onEdit,
  onDelete,
  onStatusChange,
  onSendEmail,
  onGenerateTasks,
}: {
  deliverable: any;
  phase?: any;
  showPhase?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (id: string, status: DeliverableStatus) => void;
  onSendEmail: () => void;
  onGenerateTasks: () => void;
}) {
  const statusConfig = DELIVERABLE_STATUS.find(s => s.value === deliverable.status) || DELIVERABLE_STATUS[0];
  const isOverdue = deliverable.due_date && 
    isPast(parseISO(deliverable.due_date)) && 
    deliverable.status !== "delivered" && 
    deliverable.status !== "validated";

  return (
    <Card className={cn(
      "transition-colors",
      isOverdue && "border-destructive/50 bg-destructive/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            deliverable.status === "validated" ? "bg-green-100 text-green-600" :
            deliverable.status === "delivered" ? "bg-blue-100 text-blue-600" :
            deliverable.status === "in_progress" ? "bg-amber-100 text-amber-600" :
            "bg-muted text-muted-foreground"
          )}>
            {deliverable.status === "validated" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : isOverdue ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : (
              <File className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{deliverable.name}</span>
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ 
                  backgroundColor: statusConfig.color + "20",
                  color: statusConfig.color 
                }}
              >
                {statusConfig.label}
              </Badge>
              {showPhase && phase && (
                <Badge variant="outline" className="text-xs">
                  <div
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: phase.color || "#3B82F6" }}
                  />
                  {phase.name}
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  En retard
                </Badge>
              )}
            </div>
            {deliverable.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {deliverable.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              {deliverable.due_date && (
                <span className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-destructive font-medium"
                )}>
                  <Clock className="h-3 w-3" />
                  Échéance: {format(parseISO(deliverable.due_date), "d MMMM yyyy", { locale: fr })}
                </span>
              )}
              {deliverable.delivered_at && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Livré: {format(parseISO(deliverable.delivered_at), "d MMM yyyy", { locale: fr })}
                </span>
              )}
              {deliverable.email_sent_at && (
                <span className="flex items-center gap-1 text-blue-600">
                  <MailCheck className="h-3 w-3" />
                  Envoyé: {format(parseISO(deliverable.email_sent_at), "d MMM HH:mm", { locale: fr })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {deliverable.file_url && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => window.open(deliverable.file_url!, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onGenerateTasks}>
                  <ListTodo className="h-4 w-4 mr-2" />
                  Générer tâches (IA)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSendEmail}>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer par email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                {deliverable.status === "pending" && (
                  <DropdownMenuItem onClick={() => onStatusChange(deliverable.id, "in_progress")}>
                    <Clock className="h-4 w-4 mr-2" />
                    En cours
                  </DropdownMenuItem>
                )}
                {deliverable.status !== "delivered" && deliverable.status !== "validated" && (
                  <DropdownMenuItem onClick={() => onStatusChange(deliverable.id, "delivered")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Marquer livré
                  </DropdownMenuItem>
                )}
                {deliverable.status === "delivered" && (
                  <DropdownMenuItem onClick={() => onStatusChange(deliverable.id, "validated")}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Valider
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Deliverable Dialog Component
function DeliverableDialog({
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
}: {
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
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier le livrable" : "Nouveau livrable"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Plans d'exécution"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Description du livrable..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phase</Label>
              <Select value={formPhaseId || "none"} onValueChange={(v) => setFormPhaseId(v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sans phase</SelectItem>
                  {phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: phase.color || "#3B82F6" }}
                        />
                        {phase.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>

          <div className="space-y-2">
            <Label>Date d'échéance</Label>
            <InlineDatePicker
              value={formDueDate}
              onChange={setFormDueDate}
              placeholder="Sélectionner..."
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>URL du fichier</Label>
            <Input
              value={formFileUrl}
              onChange={(e) => setFormFileUrl(e.target.value)}
              placeholder="https://..."
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
