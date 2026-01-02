import { useState } from "react";
import { useChantier, ObservationStatus, ProjectMeeting, MeetingAttendee, ProjectLot, ProjectObservation } from "@/hooks/useChantier";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { useProject } from "@/hooks/useProjects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { generateMeetingPDF } from "@/lib/generateMeetingPDF";
import { ChantierGantt } from "./ChantierGantt";
import { MeetingReportBuilder } from "./MeetingReportBuilder";
import { LoadLotsTemplateDialog } from "./LoadLotsTemplateDialog";
import { ChantierOverview } from "./chantier/ChantierOverview";
import { ChantierPlanningTab } from "./chantier/ChantierPlanningTab";
import { MeetingsAndReportsSection } from "./chantier/MeetingsAndReportsSection";
import { SendConvocationDialog } from "./chantier/SendConvocationDialog";
import { DefaultLot } from "@/lib/defaultLots";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  Download,
  Eye,
  FileStack,
  FileText,
  GanttChart,
  Hammer,
  LayoutDashboard,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2,
  UserCheck,
  UserX,
  Users,
  Wallet,
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
import { toast } from "sonner";

interface ProjectChantierTabProps {
  projectId: string;
}

export function ProjectChantierTab({ projectId }: ProjectChantierTabProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMeetingForReport, setSelectedMeetingForReport] = useState<ProjectMeeting | null>(null);
  const [convocationMeeting, setConvocationMeeting] = useState<ProjectMeeting | null>(null);
  const [editingLot, setEditingLot] = useState<ProjectLot | null>(null);
  const { data: project } = useProject(projectId);
  const { lots, lotsLoading, updateLot, createLot, deleteLot } = useChantier(projectId);
  const { companies } = useCRMCompanies();

  // If a meeting is selected for report building, show the builder
  if (selectedMeetingForReport) {
    return (
      <MeetingReportBuilder
        projectId={projectId}
        meeting={selectedMeetingForReport}
        onBack={() => setSelectedMeetingForReport(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="planning">
            <GanttChart className="h-4 w-4 mr-2" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="lots">
            <Hammer className="h-4 w-4 mr-2" />
            Lots
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <FileText className="h-4 w-4 mr-2" />
            Réunions & CR
          </TabsTrigger>
          <TabsTrigger value="observations">
            <Eye className="h-4 w-4 mr-2" />
            Observations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <ChantierOverview 
            projectId={projectId} 
            onNavigate={setActiveTab}
            onOpenReport={setSelectedMeetingForReport}
            onOpenPlanning={() => setActiveTab("planning")}
          />
        </TabsContent>

        <TabsContent value="planning" className="mt-4">
          <ChantierPlanningTab
            projectId={projectId}
            lots={lots}
            lotsLoading={lotsLoading}
            onUpdateLot={(id, updates) => updateLot.mutate({ id, ...updates })}
            onCreateLot={(name, start_date, end_date) => createLot.mutate({ name, start_date, end_date, status: "pending", sort_order: lots.length })}
            onDeleteLot={(id) => deleteLot.mutate(id)}
            onEditLot={(lot) => setEditingLot(lot)}
            companies={companies}
            projectName={project?.name}
          />
        </TabsContent>

        <TabsContent value="lots" className="mt-4">
          <LotsSection projectId={projectId} onOpenPlanning={() => setActiveTab("planning")} />
        </TabsContent>

        <TabsContent value="meetings" className="mt-4">
          <MeetingsAndReportsSection 
            projectId={projectId} 
            onOpenReport={setSelectedMeetingForReport}
            onSendConvocation={setConvocationMeeting}
          />
        </TabsContent>

        <TabsContent value="observations" className="mt-4">
          <ObservationsSection projectId={projectId} />
        </TabsContent>
      </Tabs>

      {/* Send Convocation Dialog */}
      <SendConvocationDialog
        meeting={convocationMeeting}
        projectName={project?.name || "Projet"}
        projectId={projectId}
        onClose={() => setConvocationMeeting(null)}
      />
    </div>
  );
}

// Reports Section - Liste des comptes rendus
function ReportsSection({ projectId, onOpenReport }: { projectId: string; onOpenReport: (meeting: ProjectMeeting) => void }) {
  const { meetings, meetingsLoading, duplicateMeeting, updateMeeting, deleteMeeting }  = useChantier(projectId);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingMeeting, setLinkingMeeting] = useState<ProjectMeeting | null>(null);

  const handleDuplicate = (e: React.MouseEvent, meeting: ProjectMeeting) => {
    e.stopPropagation();
    duplicateMeeting.mutate(meeting);
  };

  const handleClearReport = (e: React.MouseEvent, meeting: ProjectMeeting) => {
    e.stopPropagation();
    if (confirm("Effacer le contenu de ce compte rendu ? Cette action ne supprime pas la réunion.")) {
      updateMeeting.mutate({ id: meeting.id, report_data: null as unknown as Record<string, unknown> });
      toast.success("Compte rendu effacé");
    }
  };

  const handleDeleteMeeting = (e: React.MouseEvent, meetingId: string) => {
    e.stopPropagation();
    if (confirm("Supprimer cette réunion et son compte rendu ? Cette action est irréversible.")) {
      deleteMeeting.mutate(meetingId);
    }
  };

  const handleOpenLinkDialog = (e: React.MouseEvent, meeting: ProjectMeeting) => {
    e.stopPropagation();
    setLinkingMeeting(meeting);
    setLinkDialogOpen(true);
  };

  const handleLinkMeetings = (sourceMeetingId: string) => {
    if (!linkingMeeting) return;
    const sourceMeeting = meetings.find(m => m.id === sourceMeetingId);
    if (sourceMeeting?.report_data) {
      updateMeeting.mutate({ 
        id: linkingMeeting.id, 
        report_data: JSON.parse(JSON.stringify(sourceMeeting.report_data)) 
      });
      toast.success("Données du CR liées");
    }
    setLinkDialogOpen(false);
    setLinkingMeeting(null);
  };

  if (meetingsLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (meetings.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Aucun compte rendu"
        description="Créez d'abord une réunion dans l'onglet Réunions, puis rédigez son compte rendu."
      />
    );
  }

  // Check if a meeting has report content
  const hasReportContent = (meeting: ProjectMeeting) => {
    if (!meeting.report_data) return false;
    const data = meeting.report_data as Record<string, unknown>;
    return Boolean(
      data.context || 
      (data.lot_progress && (data.lot_progress as unknown[]).length > 0) ||
      (data.technical_decisions && (data.technical_decisions as unknown[]).length > 0) ||
      (data.blocking_points && (data.blocking_points as unknown[]).length > 0) ||
      data.general_progress
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Comptes rendus de chantier</h3>
      </div>

      <div className="grid gap-3">
        {meetings.map((meeting) => {
          const attendees = meeting.attendees || [];
          const presentCount = attendees.filter(a => a.present).length;
          const hasContent = hasReportContent(meeting);
          
          return (
            <Card key={meeting.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onOpenReport(meeting)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">CR n°{meeting.meeting_number || "?"}</span>
                      <span className="text-muted-foreground">-</span>
                      <span>{meeting.title}</span>
                      {!hasContent && (
                        <Badge variant="outline" className="text-xs">Vide</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(meeting.meeting_date), "d MMMM yyyy", { locale: fr })}
                      {attendees.length > 0 && ` • ${presentCount}/${attendees.length} présents`}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpenReport(meeting); }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Éditer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleDuplicate(e, meeting)} disabled={duplicateMeeting.isPending}>
                        <Copy className="h-4 w-4 mr-2" />
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleOpenLinkDialog(e, meeting)}>
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Lier à un autre CR
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {hasContent && (
                        <DropdownMenuItem 
                          onClick={(e) => handleClearReport(e, meeting)}
                          className="text-amber-600 focus:text-amber-600"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Effacer le contenu
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={(e) => handleDeleteMeeting(e, meeting.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer la réunion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onOpenReport(meeting); }}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Éditer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Link CR Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lier à un compte rendu existant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Sélectionnez un compte rendu pour copier son contenu dans le CR actuel.
            </p>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {meetings
                  .filter(m => m.id !== linkingMeeting?.id && hasReportContent(m))
                  .map((meeting) => (
                    <Card 
                      key={meeting.id} 
                      className="cursor-pointer hover:border-primary/50"
                      onClick={() => handleLinkMeetings(meeting.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-medium">CR n°{meeting.meeting_number}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-sm">{meeting.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(meeting.meeting_date), "d MMMM yyyy", { locale: fr })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                {meetings.filter(m => m.id !== linkingMeeting?.id && hasReportContent(m)).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun autre compte rendu avec du contenu disponible
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Lots Section
function LotsSection({ projectId, onOpenPlanning }: { projectId: string; onOpenPlanning?: () => void }) {
  const { lots, lotsLoading, createLot, updateLot, deleteLot } = useChantier(projectId);
  const { data: project } = useProject(projectId);
  const { companies } = useCRMCompanies();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<ProjectLot | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "gantt">("list");

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

  const handleLoadLots = (lotsToLoad: DefaultLot[]) => {
    lotsToLoad.forEach((lot, index) => {
      createLot.mutate({
        name: lot.name,
        status: "pending",
        sort_order: lots.length + index,
      });
    });
    toast.success(`${lotsToLoad.length} lots importés`);
  };

  const openEditDialog = (lot: ProjectLot) => {
    setEditingLot(lot);
    setFormName(lot.name);
    setFormCompanyId(lot.crm_company_id);
    setFormBudget(lot.budget?.toString() || "");
    setFormStartDate(lot.start_date ? parseISO(lot.start_date) : null);
    setFormEndDate(lot.end_date ? parseISO(lot.end_date) : null);
    setFormStatus(lot.status);
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

  const handleUpdate = () => {
    if (!editingLot || !formName.trim()) return;

    updateLot.mutate({
      id: editingLot.id,
      name: formName.trim(),
      crm_company_id: formCompanyId,
      budget: formBudget ? parseFloat(formBudget) : null,
      start_date: formStartDate ? format(formStartDate, "yyyy-MM-dd") : null,
      end_date: formEndDate ? format(formEndDate, "yyyy-MM-dd") : null,
      status: formStatus,
    });

    setEditingLot(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer ce lot ?")) {
      deleteLot.mutate(id);
    }
  };

  const handleGanttUpdate = (id: string, updates: { start_date?: string | null; end_date?: string | null }) => {
    updateLot.mutate({ id, ...updates });
  };

  const handleGanttCreate = (name: string, start_date: string, end_date: string) => {
    createLot.mutate({
      name,
      start_date,
      end_date,
      status: "pending",
      sort_order: lots.length,
    });
  };

  const handleGanttDelete = (id: string) => {
    if (confirm("Supprimer ce lot ?")) {
      deleteLot.mutate(id);
    }
  };

  // Filter entreprises
  const entreprises = companies.filter(c => c.industry?.startsWith("entreprise_") || c.industry === "artisan");

  if (lotsLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (lots.length === 0 && !isCreateOpen) {
    return (
      <>
        <EmptyState
          icon={Hammer}
          title="Aucun lot"
          description="Créez des lots ou chargez un modèle prédéfini."
          action={{ label: "Charger un modèle", onClick: () => setIsTemplateOpen(true) }}
        />
        <LoadLotsTemplateDialog
          isOpen={isTemplateOpen}
          onClose={() => setIsTemplateOpen(false)}
          projectType={project?.project_type || null}
          onLoadLots={handleLoadLots}
        />
        <LotDialog
          isOpen={isCreateOpen}
          onClose={() => { setIsCreateOpen(false); resetForm(); }}
          formName={formName}
          setFormName={setFormName}
          formCompanyId={formCompanyId}
          setFormCompanyId={setFormCompanyId}
          formBudget={formBudget}
          setFormBudget={setFormBudget}
          formStartDate={formStartDate}
          setFormStartDate={setFormStartDate}
          formEndDate={formEndDate}
          setFormEndDate={setFormEndDate}
          formStatus={formStatus}
          setFormStatus={setFormStatus}
          entreprises={entreprises}
          onSubmit={handleCreate}
          isEdit={false}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Lots du chantier ({lots.length})</h3>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border rounded-lg p-1 bg-muted/30">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          <Button
            variant={viewMode === "gantt" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => setViewMode("gantt")}
          >
            <GanttChart className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsTemplateOpen(true)}>
          <FileStack className="h-4 w-4 mr-1" />
          Modèle
        </Button>
        <Button size="sm" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>
    </div>

    {viewMode === "gantt" ? (
      <ChantierGantt
        lots={lots}
        onUpdateLot={handleGanttUpdate}
        onCreateLot={handleGanttCreate}
        onDeleteLot={handleGanttDelete}
        companies={companies}
      />
    ) : (
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
                        <DropdownMenuItem onClick={() => openEditDialog(lot)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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
      )}

    <LotDialog
      isOpen={isCreateOpen || !!editingLot}
      onClose={() => { setIsCreateOpen(false); setEditingLot(null); resetForm(); }}
      formName={formName}
      setFormName={setFormName}
      formCompanyId={formCompanyId}
      setFormCompanyId={setFormCompanyId}
      formBudget={formBudget}
      setFormBudget={setFormBudget}
      formStartDate={formStartDate}
      setFormStartDate={setFormStartDate}
      formEndDate={formEndDate}
      setFormEndDate={setFormEndDate}
      formStatus={formStatus}
      setFormStatus={setFormStatus}
      entreprises={entreprises}
      onSubmit={editingLot ? handleUpdate : handleCreate}
      isEdit={!!editingLot}
    />

    <LoadLotsTemplateDialog
      isOpen={isTemplateOpen}
      onClose={() => setIsTemplateOpen(false)}
      projectType={project?.project_type || null}
      onLoadLots={handleLoadLots}
    />
  </div>
);
}

// Lot Dialog Component (Create/Edit)
function LotDialog({
  isOpen,
  onClose,
  formName,
  setFormName,
  formCompanyId,
  setFormCompanyId,
  formBudget,
  setFormBudget,
  formStartDate,
  setFormStartDate,
  formEndDate,
  setFormEndDate,
  formStatus,
  setFormStatus,
  entreprises,
  onSubmit,
  isEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  formName: string;
  setFormName: (v: string) => void;
  formCompanyId: string | null;
  setFormCompanyId: (v: string | null) => void;
  formBudget: string;
  setFormBudget: (v: string) => void;
  formStartDate: Date | null;
  setFormStartDate: (v: Date | null) => void;
  formEndDate: Date | null;
  setFormEndDate: (v: Date | null) => void;
  formStatus: string;
  setFormStatus: (v: string) => void;
  entreprises: any[];
  onSubmit: () => void;
  isEdit: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le lot" : "Nouveau lot"}</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Budget (€)</Label>
              <Input
                type="number"
                value={formBudget}
                onChange={(e) => setFormBudget(e.target.value)}
                placeholder="50000"
              />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOT_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={!formName.trim()}>
            {isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Meetings Section - Updated to support report opening and convocation
interface MeetingsSectionProps {
  projectId: string;
  onOpenReport: (meeting: ProjectMeeting) => void;
  onSendConvocation?: (meeting: ProjectMeeting) => void;
}

// Meetings Section
function MeetingsSection({ projectId, onOpenReport, onSendConvocation }: MeetingsSectionProps) {
  const { meetings, meetingsLoading, observations, lots, createMeeting, updateMeeting, deleteMeeting } = useChantier(projectId);
  const { data: project } = useProject(projectId);
  const { allContacts } = useContacts();
  const { companies } = useCRMCompanies();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ProjectMeeting | null>(null);
  const [attendeesDialogMeeting, setAttendeesDialogMeeting] = useState<ProjectMeeting | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState<Date | null>(new Date());
  const [formLocation, setFormLocation] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formAttendees, setFormAttendees] = useState<MeetingAttendee[]>([]);

  const resetForm = () => {
    setFormTitle("");
    setFormDate(new Date());
    setFormLocation("");
    setFormNotes("");
    setFormAttendees([]);
    setEditingMeeting(null);
  };

  const openEditDialog = (meeting: ProjectMeeting) => {
    setEditingMeeting(meeting);
    setFormTitle(meeting.title);
    setFormDate(parseISO(meeting.meeting_date));
    setFormLocation(meeting.location || "");
    setFormNotes(meeting.notes || "");
    setFormAttendees(meeting.attendees || []);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    if (!formTitle.trim() || !formDate) return;

    createMeeting.mutate({
      title: formTitle.trim(),
      meeting_date: formDate.toISOString(),
      location: formLocation.trim() || undefined,
      notes: formNotes.trim() || undefined,
      attendees: formAttendees,
    });

    setIsDialogOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingMeeting || !formTitle.trim() || !formDate) return;

    updateMeeting.mutate({
      id: editingMeeting.id,
      title: formTitle.trim(),
      meeting_date: formDate.toISOString(),
      location: formLocation.trim() || null,
      notes: formNotes.trim() || null,
      attendees: formAttendees,
    });

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette réunion ?")) {
      deleteMeeting.mutate(id);
    }
  };

  const handleTogglePresence = (meetingId: string, attendees: MeetingAttendee[], index: number) => {
    const updated = [...attendees];
    updated[index] = { ...updated[index], present: !updated[index].present };
    updateMeeting.mutate({ id: meetingId, attendees: updated });
  };

  const handleGeneratePDF = (meeting: ProjectMeeting) => {
    const meetingObservations = observations.filter(
      (obs) => obs.meeting_id === meeting.id
    );

    try {
      const meetingReportData = meeting.report_data as unknown as import("@/hooks/useMeetingReportData").ReportData | null;
      const { blob, fileName } = generateMeetingPDF({
        meeting,
        observations: meetingObservations,
        projectName: project?.name || "Projet",
        projectAddress: project?.address || undefined,
        projectClient: project?.client || undefined,
        reportData: meetingReportData || undefined,
        lots: (lots || []).map(l => ({ id: l.id, name: l.name })),
      });
      
      // Download the PDF
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF généré avec succès");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  if (meetingsLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (meetings.length === 0 && !isDialogOpen) {
    return (
      <>
        <EmptyState
          icon={Users}
          title="Aucune réunion"
          description="Planifiez des réunions de chantier."
          action={{ label: "Planifier une réunion", onClick: () => setIsDialogOpen(true) }}
        />
        <MeetingDialog
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); resetForm(); }}
          formTitle={formTitle}
          setFormTitle={setFormTitle}
          formDate={formDate}
          setFormDate={setFormDate}
          formLocation={formLocation}
          setFormLocation={setFormLocation}
          formNotes={formNotes}
          setFormNotes={setFormNotes}
          formAttendees={formAttendees}
          setFormAttendees={setFormAttendees}
          contacts={allContacts}
          companies={companies}
          onSubmit={handleCreate}
          isEdit={false}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Réunions de chantier ({meetings.length})</h3>
        <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Planifier
        </Button>
      </div>

      <div className="grid gap-3">
        {meetings.map((meeting) => {
          const attendees = meeting.attendees || [];
          const presentCount = attendees.filter(a => a.present).length;
          
          return (
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
                      {attendees.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {presentCount}/{attendees.length} présents
                        </Badge>
                      )}
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
                    
                    {/* Attendees preview */}
                    {attendees.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {attendees.slice(0, 5).map((att, idx) => (
                          <Avatar key={idx} className={cn("h-6 w-6 border-2", att.present ? "border-green-500" : "border-red-400")}>
                            <AvatarFallback className="text-xs">
                              {att.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {attendees.length > 5 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            +{attendees.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {onSendConvocation && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => onSendConvocation(meeting)}
                        title="Envoyer une convocation"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setAttendeesDialogMeeting(meeting)}
                      title="Gérer les participants"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleGeneratePDF(meeting)}
                      title="Générer le compte-rendu PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onSendConvocation && (
                          <DropdownMenuItem onClick={() => onSendConvocation(meeting)}>
                            <Send className="h-4 w-4 mr-2" />
                            Envoyer une convocation
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openEditDialog(meeting)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAttendeesDialogMeeting(meeting)}>
                          <Users className="h-4 w-4 mr-2" />
                          Gérer les participants
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGeneratePDF(meeting)}>
                          <Download className="h-4 w-4 mr-2" />
                          Générer PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onOpenReport(meeting)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Rédiger le compte rendu
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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
          );
        })}
      </div>

      <MeetingDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); resetForm(); }}
        formTitle={formTitle}
        setFormTitle={setFormTitle}
        formDate={formDate}
        setFormDate={setFormDate}
        formLocation={formLocation}
        setFormLocation={setFormLocation}
        formNotes={formNotes}
        setFormNotes={setFormNotes}
        formAttendees={formAttendees}
        setFormAttendees={setFormAttendees}
        contacts={allContacts}
        companies={companies}
        onSubmit={editingMeeting ? handleUpdate : handleCreate}
        isEdit={!!editingMeeting}
      />

      {/* Attendees Management Dialog */}
      <AttendeesDialog
        meeting={attendeesDialogMeeting}
        onClose={() => setAttendeesDialogMeeting(null)}
        onTogglePresence={handleTogglePresence}
        contacts={allContacts}
        companies={companies}
        onAddAttendee={(attendee) => {
          if (!attendeesDialogMeeting) return;
          const updated = [...(attendeesDialogMeeting.attendees || []), attendee];
          updateMeeting.mutate({ id: attendeesDialogMeeting.id, attendees: updated });
        }}
        onRemoveAttendee={(index) => {
          if (!attendeesDialogMeeting) return;
          const updated = (attendeesDialogMeeting.attendees || []).filter((_, i) => i !== index);
          updateMeeting.mutate({ id: attendeesDialogMeeting.id, attendees: updated });
        }}
      />
    </div>
  );
}

// Meeting Dialog Component (Create/Edit)
function MeetingDialog({
  isOpen,
  onClose,
  formTitle,
  setFormTitle,
  formDate,
  setFormDate,
  formLocation,
  setFormLocation,
  formNotes,
  setFormNotes,
  formAttendees,
  setFormAttendees,
  contacts,
  companies,
  onSubmit,
  isEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  formTitle: string;
  setFormTitle: (v: string) => void;
  formDate: Date | null;
  setFormDate: (v: Date | null) => void;
  formLocation: string;
  setFormLocation: (v: string) => void;
  formNotes: string;
  setFormNotes: (v: string) => void;
  formAttendees: MeetingAttendee[];
  setFormAttendees: (v: MeetingAttendee[]) => void;
  contacts: any[];
  companies: any[];
  onSubmit: () => void;
  isEdit: boolean;
}) {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const addAttendee = () => {
    if (!selectedContactId) return;
    const contact = contacts.find(c => c.id === selectedContactId);
    if (!contact) return;
    
    // Check if already added
    if (formAttendees.some(a => a.contact_id === selectedContactId)) {
      toast.error("Ce contact est déjà dans la liste");
      return;
    }

    setFormAttendees([
      ...formAttendees,
      {
        contact_id: contact.id,
        company_id: contact.crm_company_id || undefined,
        name: contact.name,
        present: true,
      }
    ]);
    setSelectedContactId(null);
  };

  const removeAttendee = (index: number) => {
    setFormAttendees(formAttendees.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la réunion" : "Nouvelle réunion"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Ex: Réunion de chantier"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-2">
            <Label>Notes / Ordre du jour</Label>
            <Textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Points à aborder..."
              rows={2}
            />
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label>Participants</Label>
            <div className="flex gap-2">
              <Select value={selectedContactId || "none"} onValueChange={(v) => setSelectedContactId(v === "none" ? null : v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner un contact..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sélectionner...</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} {contact.company ? `(${contact.company.name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={addAttendee} disabled={!selectedContactId}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formAttendees.length > 0 && (
              <div className="space-y-1 mt-2">
                {formAttendees.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm">{att.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAttendee(idx)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={!formTitle.trim() || !formDate}>
            {isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Attendees Management Dialog
function AttendeesDialog({
  meeting,
  onClose,
  onTogglePresence,
  contacts,
  companies,
  onAddAttendee,
  onRemoveAttendee,
}: {
  meeting: ProjectMeeting | null;
  onClose: () => void;
  onTogglePresence: (meetingId: string, attendees: MeetingAttendee[], index: number) => void;
  contacts: any[];
  companies: any[];
  onAddAttendee: (attendee: MeetingAttendee) => void;
  onRemoveAttendee: (index: number) => void;
}) {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  if (!meeting) return null;

  const attendees = meeting.attendees || [];

  const handleAdd = () => {
    if (!selectedContactId) return;
    const contact = contacts.find(c => c.id === selectedContactId);
    if (!contact) return;
    
    if (attendees.some(a => a.contact_id === selectedContactId)) {
      toast.error("Ce contact est déjà dans la liste");
      return;
    }

    onAddAttendee({
      contact_id: contact.id,
      company_id: contact.crm_company_id || undefined,
      name: contact.name,
      present: false,
    });
    setSelectedContactId(null);
  };

  return (
    <Dialog open={!!meeting} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Participants - {meeting.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add participant */}
          <div className="flex gap-2">
            <Select value={selectedContactId || "none"} onValueChange={(v) => setSelectedContactId(v === "none" ? null : v)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Ajouter un participant..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sélectionner...</SelectItem>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} {contact.company ? `(${contact.company.name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleAdd} disabled={!selectedContactId}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Attendees list */}
          {attendees.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun participant ajouté
            </p>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {attendees.map((att, idx) => {
                  const company = att.company_id ? companies.find(c => c.id === att.company_id) : null;
                  
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        att.present ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-red-400 bg-red-50 dark:bg-red-950/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={att.present}
                          onCheckedChange={() => onTogglePresence(meeting.id, attendees, idx)}
                        />
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1">
                            {att.present ? (
                              <UserCheck className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <UserX className="h-3.5 w-3.5 text-red-500" />
                            )}
                            {att.name}
                          </p>
                          {company && (
                            <p className="text-xs text-muted-foreground">{company.name}</p>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveAttendee(idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Summary */}
          {attendees.length > 0 && (
            <div className="flex justify-between text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground">Présents</span>
              <span className="font-medium">
                {attendees.filter(a => a.present).length} / {attendees.length}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Observations Section
function ObservationsSection({ projectId }: { projectId: string }) {
  const { observations, lots, observationsLoading, createObservation, updateObservation, deleteObservation } = useChantier(projectId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingObservation, setEditingObservation] = useState<any | null>(null);

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

  const openEditDialog = (obs: any) => {
    setEditingObservation(obs);
    setFormDescription(obs.description);
    setFormLotId(obs.lot_id);
    setFormPriority(obs.priority || "normal");
    setFormDueDate(obs.due_date ? parseISO(obs.due_date) : null);
  };

  const handleCreate = () => {
    if (!formDescription.trim()) return;

    createObservation.mutate({
      description: formDescription.trim(),
      lot_id: formLotId || undefined,
      priority: formPriority as any,
      due_date: formDueDate ? format(formDueDate, "yyyy-MM-dd") : undefined,
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingObservation || !formDescription.trim()) return;

    updateObservation.mutate({
      id: editingObservation.id,
      description: formDescription.trim(),
      lot_id: formLotId,
      priority: formPriority as any,
      due_date: formDueDate ? format(formDueDate, "yyyy-MM-dd") : null,
    });

    setEditingObservation(null);
    resetForm();
  };

  const handleStatusChange = (id: string, newStatus: ObservationStatus) => {
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

  if (observationsLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  // Stats
  const openCount = observations.filter(o => o.status === "open").length;
  const inProgressCount = observations.filter(o => o.status === "in_progress").length;
  const resolvedCount = observations.filter(o => o.status === "resolved").length;

  if (observations.length === 0) {
    return (
      <>
        <EmptyState
          icon={ClipboardList}
          title="Aucune observation"
          description="Ajoutez des observations de chantier."
          action={{ label: "Ajouter une observation", onClick: () => setIsCreateOpen(true) }}
        />
        <ObservationDialog
          isOpen={isCreateOpen}
          onClose={() => { setIsCreateOpen(false); resetForm(); }}
          formDescription={formDescription}
          setFormDescription={setFormDescription}
          formLotId={formLotId}
          setFormLotId={setFormLotId}
          formPriority={formPriority}
          setFormPriority={setFormPriority}
          formDueDate={formDueDate}
          setFormDueDate={setFormDueDate}
          lots={lots}
          onSubmit={handleCreate}
          isEditing={false}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-medium">Observations</h3>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {openCount} ouvertes
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {inProgressCount} en cours
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {resolvedCount} résolues
            </Badge>
          </div>
        </div>
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

          return (
            <Card key={obs.id} className={cn(
              "transition-colors",
              obs.priority === "critical" && "border-destructive/50 bg-destructive/5",
              obs.priority === "high" && "border-orange-500/50 bg-orange-50/50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    obs.status === "resolved" ? "bg-green-100" : 
                    obs.status === "in_progress" ? "bg-blue-100" : "bg-muted"
                  )}>
                    {obs.status === "resolved" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : obs.status === "in_progress" ? (
                      <Clock className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm",
                      obs.status === "resolved" && "line-through text-muted-foreground"
                    )}>
                      {obs.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{
                          backgroundColor: statusConfig.value === "open" ? "#fef3c7" :
                                           statusConfig.value === "in_progress" ? "#dbeafe" : "#dcfce7",
                          color: statusConfig.value === "open" ? "#92400e" :
                                 statusConfig.value === "in_progress" ? "#1e40af" : "#166534"
                        }}
                      >
                        {statusConfig.label}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          obs.priority === "critical" && "bg-red-100 text-red-700 border-red-200",
                          obs.priority === "high" && "bg-orange-100 text-orange-700 border-orange-200",
                          obs.priority === "normal" && "bg-gray-100 text-gray-700 border-gray-200",
                          obs.priority === "low" && "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {priorityConfig.label}
                      </Badge>
                      {lot && (
                        <Badge variant="outline" className="text-xs">
                          {lot.name}
                        </Badge>
                      )}
                      {obs.due_date && (
                        <span className={cn(
                          "text-xs flex items-center gap-1",
                          new Date(obs.due_date) < new Date() && obs.status !== "resolved" 
                            ? "text-destructive font-medium" 
                            : "text-muted-foreground"
                        )}>
                          <Clock className="h-3 w-3" />
                          {format(parseISO(obs.due_date), "d MMM yyyy", { locale: fr })}
                        </span>
                      )}
                      {obs.created_at && (
                        <span className="text-xs text-muted-foreground">
                          Créé le {format(parseISO(obs.created_at), "d MMM", { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(obs)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      {obs.status === "open" && (
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
                      {obs.status === "resolved" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(obs.id, "open")}>
                          <Eye className="h-4 w-4 mr-2" />
                          Réouvrir
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

      <ObservationDialog
        isOpen={isCreateOpen || !!editingObservation}
        onClose={() => { setIsCreateOpen(false); setEditingObservation(null); resetForm(); }}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        formLotId={formLotId}
        setFormLotId={setFormLotId}
        formPriority={formPriority}
        setFormPriority={setFormPriority}
        formDueDate={formDueDate}
        setFormDueDate={setFormDueDate}
        lots={lots}
        onSubmit={editingObservation ? handleUpdate : handleCreate}
        isEditing={!!editingObservation}
      />
    </div>
  );
}

// Observation Dialog Component (Create/Edit)
function ObservationDialog({
  isOpen,
  onClose,
  formDescription,
  setFormDescription,
  formLotId,
  setFormLotId,
  formPriority,
  setFormPriority,
  formDueDate,
  setFormDueDate,
  lots,
  onSubmit,
  isEditing,
}: {
  isOpen: boolean;
  onClose: () => void;
  formDescription: string;
  setFormDescription: (v: string) => void;
  formLotId: string | null;
  setFormLotId: (v: string | null) => void;
  formPriority: string;
  setFormPriority: (v: string) => void;
  formDueDate: Date | null;
  setFormDueDate: (v: Date | null) => void;
  lots: any[];
  onSubmit: () => void;
  isEditing: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier l'observation" : "Nouvelle observation"}</DialogTitle>
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
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={!formDescription.trim()}>
            {isEditing ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
