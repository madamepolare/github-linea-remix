import { useState } from "react";
import { useChantier } from "@/hooks/useChantier";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LOT_STATUS, OBSERVATION_STATUS, OBSERVATION_PRIORITY } from "@/lib/projectTypes";
import {
  AlertCircle,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  Hammer,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface ProjectChantierTabProps {
  projectId: string;
}

export function ProjectChantierTab({ projectId }: ProjectChantierTabProps) {
  const [activeTab, setActiveTab] = useState("lots");

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lots">
            <Hammer className="h-4 w-4 mr-2" />
            Lots
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <Users className="h-4 w-4 mr-2" />
            Réunions
          </TabsTrigger>
          <TabsTrigger value="observations">
            <Eye className="h-4 w-4 mr-2" />
            Observations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lots" className="mt-4">
          <LotsSection projectId={projectId} />
        </TabsContent>

        <TabsContent value="meetings" className="mt-4">
          <MeetingsSection projectId={projectId} />
        </TabsContent>

        <TabsContent value="observations" className="mt-4">
          <ObservationsSection projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Lots Section
function LotsSection({ projectId }: { projectId: string }) {
  const { lots, isLoading, createLot, updateLot, deleteLot } = useChantier(projectId);
  const { companies } = useCRMCompanies();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formCompanyId, setFormCompanyId] = useState<string | null>(null);
  const [formBudget, setFormBudget] = useState("");
  const [formStartDate, setFormStartDate] = useState<Date | null>(null);
  const [formEndDate, setFormEndDate] = useState<Date | null>(null);
  const [formStatus, setFormStatus] = useState("pending");

  const resetForm = () => {
    setFormName("");
    setFormCompanyId(null);
    setFormBudget("");
    setFormStartDate(null);
    setFormEndDate(null);
    setFormStatus("pending");
  };

  const handleCreate = () => {
    if (!formName.trim()) return;

    createLot.mutate({
      name: formName.trim(),
      crm_company_id: formCompanyId || undefined,
      budget: formBudget ? parseFloat(formBudget) : undefined,
      start_date: formStartDate ? format(formStartDate, "yyyy-MM-dd") : undefined,
      end_date: formEndDate ? format(formEndDate, "yyyy-MM-dd") : undefined,
      status: formStatus,
      sort_order: lots.length,
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer ce lot ?")) {
      deleteLot.mutate(id);
    }
  };

  // Filter entreprises
  const entreprises = companies.filter(c => c.industry?.startsWith("entreprise_") || c.industry === "artisan");

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (lots.length === 0) {
    return (
      <EmptyState
        icon={Hammer}
        title="Aucun lot"
        description="Créez des lots pour organiser le chantier."
        action={{ label: "Ajouter un lot", onClick: () => setIsCreateOpen(true) }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Lots du chantier</h3>
        <Button size="sm" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <div className="grid gap-3">
        {lots.map((lot) => {
          const statusConfig = LOT_STATUS.find(s => s.value === lot.status) || LOT_STATUS[0];
          const company = companies.find(c => c.id === lot.crm_company_id);

          return (
            <Card key={lot.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted"
                    style={{ backgroundColor: lot.color || undefined }}
                  >
                    <Hammer className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{lot.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {statusConfig.label}
                      </Badge>
                    </div>
                    {company && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Building2 className="h-3 w-3" />
                        {company.name}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {lot.budget && (
                        <span className="flex items-center gap-1">
                          <Wallet className="h-3 w-3" />
                          {lot.budget.toLocaleString("fr-FR")} €
                        </span>
                      )}
                      {lot.start_date && lot.end_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(lot.start_date), "d MMM", { locale: fr })} - {format(parseISO(lot.end_date), "d MMM yyyy", { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDelete(lot.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsCreateOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau lot</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du lot *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Gros œuvre, Électricité..."
              />
            </div>

            <div className="space-y-2">
              <Label>Entreprise attributaire</Label>
              <Select value={formCompanyId || "none"} onValueChange={(v) => setFormCompanyId(v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non attribué</SelectItem>
                  {entreprises.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Budget (€)</Label>
              <Input
                type="number"
                value={formBudget}
                onChange={(e) => setFormBudget(e.target.value)}
                placeholder="50000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <InlineDatePicker
                  value={formStartDate}
                  onChange={setFormStartDate}
                  placeholder="Sélectionner..."
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <InlineDatePicker
                  value={formEndDate}
                  onChange={setFormEndDate}
                  placeholder="Sélectionner..."
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!formName.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Meetings Section
function MeetingsSection({ projectId }: { projectId: string }) {
  const { meetings, isLoading, createMeeting, deleteMeeting } = useChantier(projectId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState<Date | null>(new Date());
  const [formLocation, setFormLocation] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const resetForm = () => {
    setFormTitle("");
    setFormDate(new Date());
    setFormLocation("");
    setFormNotes("");
  };

  const handleCreate = () => {
    if (!formTitle.trim() || !formDate) return;

    createMeeting.mutate({
      title: formTitle.trim(),
      meeting_date: formDate.toISOString(),
      location: formLocation.trim() || undefined,
      notes: formNotes.trim() || undefined,
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette réunion ?")) {
      deleteMeeting.mutate(id);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (meetings.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucune réunion"
        description="Planifiez des réunions de chantier."
        action={{ label: "Planifier une réunion", onClick: () => setIsCreateOpen(true) }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Réunions de chantier</h3>
        <Button size="sm" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Planifier
        </Button>
      </div>

      <div className="grid gap-3">
        {meetings.map((meeting) => (
          <Card key={meeting.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {meeting.meeting_number || "#"}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{meeting.title}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(meeting.meeting_date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </span>
                    {meeting.location && (
                      <span>{meeting.location}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {meeting.pdf_url && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => window.open(meeting.pdf_url!, "_blank")}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDelete(meeting.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsCreateOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle réunion</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Réunion de chantier"
              />
            </div>

            <div className="space-y-2">
              <Label>Date et heure *</Label>
              <InlineDatePicker
                value={formDate}
                onChange={setFormDate}
                placeholder="Sélectionner..."
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="Sur site, Bureau..."
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Ordre du jour..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!formTitle.trim() || !formDate}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Observations Section
function ObservationsSection({ projectId }: { projectId: string }) {
  const { observations, lots, isLoading, createObservation, updateObservation, deleteObservation } = useChantier(projectId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formDescription, setFormDescription] = useState("");
  const [formLotId, setFormLotId] = useState<string | null>(null);
  const [formPriority, setFormPriority] = useState("normal");
  const [formDueDate, setFormDueDate] = useState<Date | null>(null);

  const resetForm = () => {
    setFormDescription("");
    setFormLotId(null);
    setFormPriority("normal");
    setFormDueDate(null);
  };

  const handleCreate = () => {
    if (!formDescription.trim()) return;

    createObservation.mutate({
      description: formDescription.trim(),
      lot_id: formLotId || undefined,
      priority: formPriority,
      due_date: formDueDate ? format(formDueDate, "yyyy-MM-dd") : undefined,
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateObservation.mutate({
      id,
      status: newStatus,
      resolved_at: newStatus === "resolved" ? new Date().toISOString() : null,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette observation ?")) {
      deleteObservation.mutate(id);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (observations.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Aucune observation"
        description="Ajoutez des observations de chantier."
        action={{ label: "Ajouter une observation", onClick: () => setIsCreateOpen(true) }}
      />
    );
  }

  const priorityIcons: Record<string, any> = {
    low: null,
    normal: null,
    high: AlertCircle,
    critical: AlertCircle,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Observations</h3>
        <Button size="sm" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <div className="grid gap-3">
        {observations.map((obs) => {
          const statusConfig = OBSERVATION_STATUS.find(s => s.value === obs.status) || OBSERVATION_STATUS[0];
          const priorityConfig = OBSERVATION_PRIORITY.find(p => p.value === obs.priority) || OBSERVATION_PRIORITY[1];
          const lot = lots.find(l => l.id === obs.lot_id);
          const PriorityIcon = priorityIcons[obs.priority];

          return (
            <Card key={obs.id} className={cn(
              obs.priority === "critical" && "border-red-500",
              obs.priority === "high" && "border-orange-500"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    obs.status === "resolved" ? "bg-green-100" : "bg-muted"
                  )}>
                    {obs.status === "resolved" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn(
                        "text-sm",
                        obs.status === "resolved" && "line-through text-muted-foreground"
                      )}>
                        {obs.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {statusConfig.label}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: priorityConfig.color, color: priorityConfig.color }}
                      >
                        {priorityConfig.label}
                      </Badge>
                      {lot && (
                        <span className="text-xs text-muted-foreground">
                          Lot: {lot.name}
                        </span>
                      )}
                      {obs.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(obs.due_date), "d MMM", { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {obs.status !== "in_progress" && obs.status !== "resolved" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(obs.id, "in_progress")}>
                          <Clock className="h-4 w-4 mr-2" />
                          En cours
                        </DropdownMenuItem>
                      )}
                      {obs.status !== "resolved" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(obs.id, "resolved")}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Résolu
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDelete(obs.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsCreateOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle observation</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Décrivez l'observation..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lot concerné</Label>
                <Select value={formLotId || "none"} onValueChange={(v) => setFormLotId(v === "none" ? null : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun lot</SelectItem>
                    {lots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={formPriority} onValueChange={setFormPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBSERVATION_PRIORITY.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date limite</Label>
              <InlineDatePicker
                value={formDueDate}
                onChange={setFormDueDate}
                placeholder="Sélectionner..."
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!formDescription.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
