import { useState } from "react";
import { useMeetingReports, MeetingReport } from "@/hooks/useMeetingReports";
import { useChantier, ProjectMeeting } from "@/hooks/useChantier";
import { useProject } from "@/hooks/useProjects";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { generateMeetingPDF } from "@/lib/generateMeetingPDF";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileText,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";

const STATUS_CONFIG = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  review: { label: "En relecture", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  validated: { label: "Validé", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  sent: { label: "Envoyé", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
};

interface ReportsSectionProps {
  projectId: string;
  onOpenReport: (report: MeetingReport) => void;
}

export function ReportsSection({ projectId, onOpenReport }: ReportsSectionProps) {
  const { reports, reportsLoading, createReport, updateReport, deleteReport, duplicateReport } = useMeetingReports(projectId);
  const { meetings } = useChantier(projectId);
  const { data: project } = useProject(projectId);
  const { lots, observations } = useChantier(projectId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "draft" | "validated" | "sent">("all");

  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState<Date | null>(new Date());
  const [formMeetingId, setFormMeetingId] = useState<string | null>(null);

  const resetForm = () => {
    setFormTitle("");
    setFormDate(new Date());
    setFormMeetingId(null);
  };

  const handleCreate = () => {
    if (!formTitle.trim() || !formDate) return;

    createReport.mutate({
      title: formTitle.trim(),
      report_date: formDate.toISOString().split("T")[0],
      meeting_id: formMeetingId || undefined,
    });

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer ce compte rendu ?")) {
      deleteReport.mutate(id);
    }
  };

  const handleDuplicate = (report: MeetingReport) => {
    duplicateReport.mutate(report);
  };

  const handleGeneratePDF = (report: MeetingReport) => {
    const reportObservations = observations.filter(obs => {
      if (report.meeting_id) {
        return obs.meeting_id === report.meeting_id;
      }
      return false;
    });

    // Create a mock meeting object for PDF generation
    const mockMeeting = {
      id: report.id,
      project_id: report.project_id,
      workspace_id: report.workspace_id,
      title: report.title,
      meeting_date: report.report_date,
      meeting_number: report.report_number,
      location: report.meeting?.location || null,
      attendees: null,
      notes: null,
      pdf_url: report.pdf_url,
      report_data: report.report_data as unknown as Record<string, unknown> | null,
      created_by: report.created_by,
      created_at: report.created_at,
      updated_at: report.updated_at,
    };

    try {
      const { blob, fileName } = generateMeetingPDF({
        meeting: mockMeeting,
        observations: reportObservations,
        projectName: project?.name || "Projet",
        projectAddress: project?.address || undefined,
        projectClient: project?.client || undefined,
        reportData: report.report_data || undefined,
        lots: (lots || []).map(l => ({ id: l.id, name: l.name })),
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF généré");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    switch (filter) {
      case "draft":
        return report.status === "draft";
      case "validated":
        return report.status === "validated";
      case "sent":
        return report.status === "sent";
      default:
        return true;
    }
  });

  // Sort by date desc
  const sortedReports = [...filteredReports].sort((a, b) => {
    return new Date(b.report_date).getTime() - new Date(a.report_date).getTime();
  });

  if (reportsLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (reports.length === 0 && !isDialogOpen) {
    return (
      <>
        <EmptyState
          icon={FileText}
          title="Aucun compte rendu"
          description="Créez des comptes rendus pour documenter vos réunions de chantier."
          action={{ label: "Nouveau compte rendu", onClick: () => setIsDialogOpen(true) }}
        />
        <CreateReportDialog
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); resetForm(); }}
          formTitle={formTitle}
          setFormTitle={setFormTitle}
          formDate={formDate}
          setFormDate={setFormDate}
          formMeetingId={formMeetingId}
          setFormMeetingId={setFormMeetingId}
          meetings={meetings}
          onSubmit={handleCreate}
        />
      </>
    );
  }

  const filterOptions = [
    { value: "all", label: "Tous" },
    { value: "draft", label: "Brouillons" },
    { value: "validated", label: "Validés" },
    { value: "sent", label: "Envoyés" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-medium">Comptes Rendus</h3>
          <Badge variant="secondary">{reports.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1 bg-muted/30">
            {filterOptions.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setFilter(f.value as typeof filter)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Nouveau CR
          </Button>
        </div>
      </div>

      {/* Reports List */}
      <div className="grid gap-3">
        {sortedReports.map((report) => {
          const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.draft;
          const hasContent = report.report_data && Object.keys(report.report_data).length > 0;

          return (
            <Card
              key={report.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => onOpenReport(report)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Report Number */}
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                    hasContent ? "bg-green-100 dark:bg-green-950" : "bg-muted"
                  )}>
                    <span className={cn(
                      "text-lg font-bold",
                      hasContent ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                    )}>
                      {report.report_number || "#"}
                    </span>
                  </div>

                  {/* Report Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{report.title}</span>
                      <Badge className={cn("text-xs", statusConfig.color)}>
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(parseISO(report.report_date), "d MMMM yyyy", { locale: fr })}
                      </span>
                      {report.meeting && (
                        <span className="flex items-center gap-1">
                          <Link2 className="h-3.5 w-3.5" />
                          Réunion n°{report.meeting.meeting_number}
                        </span>
                      )}
                    </div>

                    {!hasContent && (
                      <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        À rédiger
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleGeneratePDF(report)}
                      title="Télécharger le PDF"
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
                        <DropdownMenuItem onClick={() => onOpenReport(report)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Rédiger / Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(report)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(report.id)}
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
        })}
      </div>

      {/* Create Report Dialog */}
      <CreateReportDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); resetForm(); }}
        formTitle={formTitle}
        setFormTitle={setFormTitle}
        formDate={formDate}
        setFormDate={setFormDate}
        formMeetingId={formMeetingId}
        setFormMeetingId={setFormMeetingId}
        meetings={meetings}
        onSubmit={handleCreate}
      />
    </div>
  );
}

// Create Report Dialog Component
interface CreateReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formTitle: string;
  setFormTitle: (v: string) => void;
  formDate: Date | null;
  setFormDate: (v: Date | null) => void;
  formMeetingId: string | null;
  setFormMeetingId: (v: string | null) => void;
  meetings: ProjectMeeting[];
  onSubmit: () => void;
}

function CreateReportDialog({
  isOpen,
  onClose,
  formTitle,
  setFormTitle,
  formDate,
  setFormDate,
  formMeetingId,
  setFormMeetingId,
  meetings,
  onSubmit,
}: CreateReportDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau compte rendu</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input
              placeholder="CR n°... - Réunion de chantier"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Date du CR *</Label>
            <InlineDatePicker
              value={formDate}
              onChange={setFormDate}
              placeholder="Sélectionner une date"
            />
          </div>

          <div className="space-y-2">
            <Label>Rattacher à une réunion (optionnel)</Label>
            <Select value={formMeetingId || "none"} onValueChange={(v) => setFormMeetingId(v === "none" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Aucune réunion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune réunion</SelectItem>
                {meetings.map((meeting) => (
                  <SelectItem key={meeting.id} value={meeting.id}>
                    {meeting.meeting_number ? `N°${meeting.meeting_number} - ` : ""}{meeting.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={!formTitle.trim() || !formDate}>
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
