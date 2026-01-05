import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileCheck,
  Building2,
  Calendar,
  Save,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useProjectPermits,
  ProjectPermit,
  PermitMilestone,
  PERMIT_TYPE_LABELS,
  PERMIT_STATUS_LABELS,
  PERMIT_STATUS_COLORS,
  PermitStatus,
} from "@/hooks/useProjectPermits";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";

interface PermitDetailSheetProps {
  permit: ProjectPermit | null;
  onClose: () => void;
  projectId: string;
}

export function PermitDetailSheet({ permit, onClose, projectId }: PermitDetailSheetProps) {
  const { updatePermit, addMilestone, updateMilestone, deleteMilestone } = useProjectPermits(projectId);
  const [editData, setEditData] = useState<Partial<ProjectPermit>>({});
  const [newMilestone, setNewMilestone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!permit) return null;

  const data = { ...permit, ...editData };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePermit.mutateAsync({ id: permit.id, ...editData });
      setEditData({});
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.trim()) return;
    await addMilestone.mutateAsync({
      permit_id: permit.id,
      title: newMilestone,
      description: null,
      target_date: null,
      completed_date: null,
      status: "pending",
      documents: [],
      notes: null,
      sort_order: (permit.milestones?.length || 0) + 1,
    });
    setNewMilestone("");
  };

  const toggleMilestoneStatus = async (milestone: PermitMilestone) => {
    const newStatus = milestone.status === "completed" ? "pending" : "completed";
    await updateMilestone.mutateAsync({
      id: milestone.id,
      status: newStatus,
      completed_date: newStatus === "completed" ? new Date().toISOString() : null,
    });
  };

  return (
    <Sheet open={!!permit} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-primary" strokeWidth={THIN_STROKE} />
                </div>
                <div className="flex-1">
                  <SheetTitle>{PERMIT_TYPE_LABELS[permit.permit_type]}</SheetTitle>
                  {permit.reference_number && (
                    <p className="text-sm text-muted-foreground">N° {permit.reference_number}</p>
                  )}
                </div>
                <Badge className={cn(PERMIT_STATUS_COLORS[data.status as PermitStatus])}>
                  {PERMIT_STATUS_LABELS[data.status as PermitStatus]}
                </Badge>
              </div>
            </SheetHeader>

            <Separator />

            {/* Status */}
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={data.status}
                onValueChange={(v) => setEditData({ ...editData, status: v as PermitStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PERMIT_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label>Numéro de référence</Label>
              <Input
                value={data.reference_number || ""}
                onChange={(e) => setEditData({ ...editData, reference_number: e.target.value })}
                placeholder="PC 075 123 456 000"
              />
            </div>

            {/* Authority */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" strokeWidth={THIN_STROKE} />
                Autorité compétente
              </h4>
              <div className="space-y-3">
                <Input
                  value={data.authority_name || ""}
                  onChange={(e) => setEditData({ ...editData, authority_name: e.target.value })}
                  placeholder="Nom de l'autorité"
                />
                <Input
                  value={data.authority_contact || ""}
                  onChange={(e) => setEditData({ ...editData, authority_contact: e.target.value })}
                  placeholder="Contact"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="email"
                    value={data.authority_email || ""}
                    onChange={(e) => setEditData({ ...editData, authority_email: e.target.value })}
                    placeholder="Email"
                  />
                  <Input
                    value={data.authority_phone || ""}
                    onChange={(e) => setEditData({ ...editData, authority_phone: e.target.value })}
                    placeholder="Téléphone"
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" strokeWidth={THIN_STROKE} />
                Dates clés
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Dépôt</Label>
                  <Input
                    type="date"
                    value={data.submission_date || ""}
                    onChange={(e) => setEditData({ ...editData, submission_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Accusé réception</Label>
                  <Input
                    type="date"
                    value={data.acknowledgment_date || ""}
                    onChange={(e) => setEditData({ ...editData, acknowledgment_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Réponse attendue</Label>
                  <Input
                    type="date"
                    value={data.expected_response_date || ""}
                    onChange={(e) => setEditData({ ...editData, expected_response_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date d'accord</Label>
                  <Input
                    type="date"
                    value={data.granted_date || ""}
                    onChange={(e) => setEditData({ ...editData, granted_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Validité</Label>
                  <Input
                    type="date"
                    value={data.validity_end_date || ""}
                    onChange={(e) => setEditData({ ...editData, validity_end_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Début travaux max</Label>
                  <Input
                    type="date"
                    value={data.work_start_deadline || ""}
                    onChange={(e) => setEditData({ ...editData, work_start_deadline: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" strokeWidth={THIN_STROKE} />
                Jalons
              </h4>
              <div className="space-y-2">
                {permit.milestones?.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    <button
                      onClick={() => toggleMilestoneStatus(milestone)}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        milestone.status === "completed"
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-muted-foreground"
                      )}
                    >
                      {milestone.status === "completed" && (
                        <CheckCircle2 className="h-3 w-3" strokeWidth={THIN_STROKE} />
                      )}
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        milestone.status === "completed" && "line-through text-muted-foreground"
                      )}
                    >
                      {milestone.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteMilestone.mutate(milestone.id)}
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={THIN_STROKE} />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    placeholder="Nouveau jalon..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddMilestone()}
                  />
                  <Button size="icon" onClick={handleAddMilestone}>
                    <Plus className="h-4 w-4" strokeWidth={THIN_STROKE} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              <Label>Conditions / Prescriptions</Label>
              <Textarea
                value={data.conditions || ""}
                onChange={(e) => setEditData({ ...editData, conditions: e.target.value })}
                placeholder="Conditions imposées par l'autorité..."
                rows={3}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={data.notes || ""}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                placeholder="Notes et observations..."
                rows={3}
              />
            </div>

            {/* Save Button */}
            {Object.keys(editData).length > 0 && (
              <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
                {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
