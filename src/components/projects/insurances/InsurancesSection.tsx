import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  Phone,
  Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useProjectInsurances,
  ProjectInsurance,
  CreateInsuranceInput,
  INSURANCE_TYPE_LABELS,
  INSURANCE_STATUS_LABELS,
  INSURANCE_STATUS_COLORS,
  InsuranceType,
  InsuranceStatus,
} from "@/hooks/useProjectInsurances";
import { format, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";

interface InsurancesSectionProps {
  projectId: string;
}

export function InsurancesSection({ projectId }: InsurancesSectionProps) {
  const { insurances, isLoading, createInsurance, updateInsurance, deleteInsurance } = useProjectInsurances(projectId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<ProjectInsurance | null>(null);

  const handleDelete = (insurance: ProjectInsurance) => {
    if (confirm(`Supprimer l'assurance "${INSURANCE_TYPE_LABELS[insurance.insurance_type]}" ?`)) {
      deleteInsurance.mutate(insurance.id);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" strokeWidth={THIN_STROKE} />
          <h3 className="font-medium">Assurances</h3>
          <Badge variant="secondary">{insurances.length}</Badge>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" strokeWidth={THIN_STROKE} />
          Ajouter
        </Button>
      </div>

      {/* List */}
      {insurances.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" strokeWidth={THIN_STROKE} />
            <p className="text-sm text-muted-foreground">Aucune assurance configurée</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreateDialogOpen(true)}>
              Ajouter une assurance
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {insurances.map((insurance, index) => (
            <motion.div
              key={insurance.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <InsuranceCard
                insurance={insurance}
                onEdit={() => setEditingInsurance(insurance)}
                onDelete={() => handleDelete(insurance)}
                formatCurrency={formatCurrency}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <InsuranceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        onSave={async (data) => {
          await createInsurance.mutateAsync(data);
          setCreateDialogOpen(false);
        }}
        isSaving={createInsurance.isPending}
      />

      {/* Edit Dialog */}
      {editingInsurance && (
        <InsuranceDialog
          open={!!editingInsurance}
          onOpenChange={() => setEditingInsurance(null)}
          projectId={projectId}
          insurance={editingInsurance}
          onSave={async (data) => {
            await updateInsurance.mutateAsync({ id: editingInsurance.id, ...data });
            setEditingInsurance(null);
          }}
          isSaving={updateInsurance.isPending}
        />
      )}
    </div>
  );
}

interface InsuranceCardProps {
  insurance: ProjectInsurance;
  onEdit: () => void;
  onDelete: () => void;
  formatCurrency: (value: number | null) => string;
}

function InsuranceCard({ insurance, onEdit, onDelete, formatCurrency }: InsuranceCardProps) {
  const daysUntilExpiry = insurance.end_date
    ? differenceInDays(new Date(insurance.end_date), new Date())
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

  return (
    <Card className={cn(
      "hover:shadow-sm transition-all",
      isExpired && "border-destructive/50",
      isExpiringSoon && "border-amber-500/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            insurance.status === "active" ? "bg-emerald-500/10" : "bg-muted"
          )}>
            <Shield className={cn(
              "h-5 w-5",
              insurance.status === "active" ? "text-emerald-500" : "text-muted-foreground"
            )} strokeWidth={THIN_STROKE} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">
                {INSURANCE_TYPE_LABELS[insurance.insurance_type]}
              </h4>
              <Badge className={cn("text-xs", INSURANCE_STATUS_COLORS[insurance.status])}>
                {INSURANCE_STATUS_LABELS[insurance.status]}
              </Badge>
              {isExpiringSoon && (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/50">
                  <AlertTriangle className="h-3 w-3 mr-1" strokeWidth={THIN_STROKE} />
                  Expire dans {daysUntilExpiry}j
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" strokeWidth={THIN_STROKE} />
                {insurance.insurer_name}
              </span>
              {insurance.policy_number && (
                <span>N° {insurance.policy_number}</span>
              )}
            </div>

            {(insurance.end_date || insurance.coverage_amount) && (
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {insurance.end_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" strokeWidth={THIN_STROKE} />
                    Expire le {format(new Date(insurance.end_date), "d MMM yyyy", { locale: fr })}
                  </span>
                )}
                {insurance.coverage_amount && (
                  <span>Garantie: {formatCurrency(insurance.coverage_amount)}</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" strokeWidth={THIN_STROKE} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

interface InsuranceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  insurance?: ProjectInsurance;
  onSave: (data: CreateInsuranceInput) => Promise<void>;
  isSaving: boolean;
}

function InsuranceDialog({ open, onOpenChange, projectId, insurance, onSave, isSaving }: InsuranceDialogProps) {
  const [formData, setFormData] = useState<Partial<CreateInsuranceInput>>(
    insurance || {
      project_id: projectId,
      insurance_type: "decennale",
      insurer_name: "",
      status: "pending",
      premium_frequency: "annual",
      documents: [],
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData as CreateInsuranceInput);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{insurance ? "Modifier l'assurance" : "Nouvelle assurance"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={formData.insurance_type}
                onValueChange={(v) => setFormData({ ...formData, insurance_type: v as InsuranceType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INSURANCE_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as InsuranceStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INSURANCE_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Insurer */}
          <div className="space-y-2">
            <Label>Assureur *</Label>
            <Input
              value={formData.insurer_name || ""}
              onChange={(e) => setFormData({ ...formData, insurer_name: e.target.value })}
              placeholder="Nom de l'assureur"
              required
            />
          </div>

          {/* Policy Number */}
          <div className="space-y-2">
            <Label>Numéro de police</Label>
            <Input
              value={formData.policy_number || ""}
              onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
              placeholder="123456789"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input
                type="date"
                value={formData.start_date || ""}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={formData.end_date || ""}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant garanti (€)</Label>
              <Input
                type="number"
                value={formData.coverage_amount || ""}
                onChange={(e) => setFormData({ ...formData, coverage_amount: parseFloat(e.target.value) || null })}
                placeholder="1000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Prime (€)</Label>
              <Input
                type="number"
                value={formData.premium || ""}
                onChange={(e) => setFormData({ ...formData, premium: parseFloat(e.target.value) || null })}
                placeholder="5000"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving || !formData.insurer_name}>
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
