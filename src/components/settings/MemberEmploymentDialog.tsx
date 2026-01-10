import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Briefcase,
  Calendar,
  DollarSign,
  Euro,
  FileText,
  Loader2,
  Save,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  useMemberEmploymentInfo,
  useUpsertMemberEmploymentInfo,
} from "@/hooks/useMemberEmploymentInfo";

interface MemberEmploymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    user_id: string;
    profile: {
      full_name: string | null;
      avatar_url: string | null;
      job_title: string | null;
    } | null;
  } | null;
}

const CONTRACT_TYPES = [
  { value: "CDI", label: "CDI - Contrat à durée indéterminée" },
  { value: "CDD", label: "CDD - Contrat à durée déterminée" },
  { value: "Freelance", label: "Freelance / Indépendant" },
  { value: "Stage", label: "Stage" },
  { value: "Alternance", label: "Alternance / Apprentissage" },
  { value: "Interim", label: "Intérim" },
  { value: "Autre", label: "Autre" },
];

export function MemberEmploymentDialog({
  open,
  onOpenChange,
  member,
}: MemberEmploymentDialogProps) {
  const { data: employmentInfo, isLoading } = useMemberEmploymentInfo(
    member?.user_id
  );
  const upsertMutation = useUpsertMemberEmploymentInfo();

  const [formData, setFormData] = useState({
    salary_monthly: "",
    client_daily_rate: "",
    contract_type: "",
    start_date: "",
    end_date: "",
    trial_end_date: "",
    notes: "",
  });

  useEffect(() => {
    if (employmentInfo) {
      setFormData({
        salary_monthly: employmentInfo.salary_monthly?.toString() || "",
        client_daily_rate: employmentInfo.client_daily_rate?.toString() || "",
        contract_type: employmentInfo.contract_type || "",
        start_date: employmentInfo.start_date || "",
        end_date: employmentInfo.end_date || "",
        trial_end_date: employmentInfo.trial_end_date || "",
        notes: employmentInfo.notes || "",
      });
    } else {
      setFormData({
        salary_monthly: "",
        client_daily_rate: "",
        contract_type: "",
        start_date: "",
        end_date: "",
        trial_end_date: "",
        notes: "",
      });
    }
  }, [employmentInfo, member?.user_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    await upsertMutation.mutateAsync({
      user_id: member.user_id,
      salary_monthly: formData.salary_monthly
        ? parseFloat(formData.salary_monthly)
        : null,
      client_daily_rate: formData.client_daily_rate
        ? parseFloat(formData.client_daily_rate)
        : null,
      contract_type: formData.contract_type || null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      trial_end_date: formData.trial_end_date || null,
      notes: formData.notes || null,
    });

    onOpenChange(false);
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Informations d'emploi
          </DialogTitle>
          <DialogDescription>
            Gérer les informations contractuelles et salariales
          </DialogDescription>
        </DialogHeader>

        {/* Member info header */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {member.profile?.full_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {member.profile?.full_name || "Membre"}
            </p>
            <p className="text-sm text-muted-foreground">
              {member.profile?.job_title || "Équipe"}
            </p>
          </div>
        </div>

        <Separator />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contract and Salary */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contract_type">Type de contrat</Label>
                <Select
                  value={formData.contract_type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, contract_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_monthly">Salaire mensuel (€)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="salary_monthly"
                    type="number"
                    value={formData.salary_monthly}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        salary_monthly: e.target.value,
                      }))
                    }
                    placeholder="3500"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Client Daily Rate */}
            <div className="space-y-2">
              <Label htmlFor="client_daily_rate">Tarif journalier client (€)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client_daily_rate"
                  type="number"
                  value={formData.client_daily_rate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      client_daily_rate: e.target.value,
                    }))
                  }
                  placeholder="500"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tarif par défaut pour ce membre (peut être personnalisé par projet)
              </p>
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="start_date">Date d'entrée</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trial_end_date">Fin période d'essai</Label>
                <Input
                  id="trial_end_date"
                  type="date"
                  value={formData.trial_end_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      trial_end_date: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Date de fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      end_date: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Informations complémentaires..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
