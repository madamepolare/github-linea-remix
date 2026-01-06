import { useState, useEffect } from "react";
import { addMonths, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useProjectPermits,
  CreatePermitInput,
  PERMIT_TYPE_LABELS,
  PERMIT_STATUS_LABELS,
  PERMIT_RESPONSE_DELAYS,
  PermitType,
  PermitStatus,
} from "@/hooks/useProjectPermits";
import { useContacts } from "@/hooks/useContacts";

interface CreatePermitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function CreatePermitDialog({ open, onOpenChange, projectId }: CreatePermitDialogProps) {
  const { createPermit } = useProjectPermits(projectId);
  const { contacts } = useContacts();

  const [formData, setFormData] = useState<Partial<CreatePermitInput>>({
    project_id: projectId,
    permit_type: "pc",
    status: "draft",
    prescriptions: [],
    reserves: [],
    documents: [],
    no_surface: false,
  });

  // Auto-calculate expected response date when submission date or permit type changes
  useEffect(() => {
    if (formData.submission_date && formData.permit_type) {
      const submissionDate = new Date(formData.submission_date);
      const delayMonths = PERMIT_RESPONSE_DELAYS[formData.permit_type] || 2;
      const expectedDate = addMonths(submissionDate, delayMonths);
      setFormData(prev => ({
        ...prev,
        expected_response_date: format(expectedDate, "yyyy-MM-dd")
      }));
    }
  }, [formData.submission_date, formData.permit_type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createPermit.mutateAsync(formData as CreatePermitInput);
    onOpenChange(false);
    setFormData({
      project_id: projectId,
      permit_type: "pc",
      status: "draft",
      prescriptions: [],
      reserves: [],
      documents: [],
      no_surface: false,
    });
  };

  const updateField = <K extends keyof CreatePermitInput>(
    field: K,
    value: CreatePermitInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau permis / autorisation</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de permis *</Label>
              <Select
                value={formData.permit_type}
                onValueChange={(v) => updateField("permit_type", v as PermitType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PERMIT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => updateField("status", v as PermitStatus)}
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
          </div>

          {/* Custom type if "other" */}
          {formData.permit_type === "other" && (
            <div className="space-y-2">
              <Label htmlFor="custom_type">Type personnalisé</Label>
              <Input
                id="custom_type"
                value={formData.custom_type || ""}
                onChange={(e) => updateField("custom_type", e.target.value)}
                placeholder="Précisez le type d'autorisation"
              />
            </div>
          )}

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="reference">Numéro de référence</Label>
            <Input
              id="reference"
              value={formData.reference_number || ""}
              onChange={(e) => updateField("reference_number", e.target.value)}
              placeholder="PC 075 123 456 000"
            />
          </div>

          {/* Affaire suivie par */}
          <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
            <Label className="text-sm font-medium">Affaire suivie par</Label>
            
            <div className="space-y-2">
              <Label htmlFor="contact_name" className="text-sm text-muted-foreground">Nom</Label>
              <Input
                id="contact_name"
                value={formData.contact_name || ""}
                onChange={(e) => updateField("contact_name", e.target.value)}
                placeholder="Nom du chargé de dossier"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email" className="text-sm text-muted-foreground">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email || ""}
                onChange={(e) => updateField("contact_email", e.target.value)}
                placeholder="email@autorite.fr"
              />
            </div>

            {/* Load from CRM */}
            {contacts.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Ou charger depuis le CRM</Label>
                <Select
                  value=""
                  onValueChange={(contactId) => {
                    const contact = contacts.find(c => c.id === contactId);
                    if (contact) {
                      setFormData(prev => ({
                        ...prev,
                        contact_name: contact.name,
                        contact_email: contact.email || "",
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un contact..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name} {contact.email && `(${contact.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Authority */}
          <div className="space-y-2">
            <Label htmlFor="authority">Autorité compétente</Label>
            <Input
              id="authority"
              value={formData.authority_name || ""}
              onChange={(e) => updateField("authority_name", e.target.value)}
              placeholder="Mairie de Paris"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="authority_email">Email autorité</Label>
              <Input
                id="authority_email"
                type="email"
                value={formData.authority_email || ""}
                onChange={(e) => updateField("authority_email", e.target.value)}
                placeholder="urbanisme@mairie.fr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authority_phone">Téléphone</Label>
              <Input
                id="authority_phone"
                value={formData.authority_phone || ""}
                onChange={(e) => updateField("authority_phone", e.target.value)}
                placeholder="01 23 45 67 89"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="submission_date">Date de dépôt</Label>
              <Input
                id="submission_date"
                type="date"
                value={formData.submission_date || ""}
                onChange={(e) => updateField("submission_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_date">
                Réponse attendue
                <span className="text-xs text-muted-foreground ml-1">
                  ({PERMIT_RESPONSE_DELAYS[formData.permit_type as PermitType] || 2} mois)
                </span>
              </Label>
              <Input
                id="expected_date"
                type="date"
                value={formData.expected_response_date || ""}
                onChange={(e) => updateField("expected_response_date", e.target.value)}
              />
            </div>
          </div>

          {/* Surface with switch */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Aucune surface créée</Label>
              <Switch
                checked={formData.no_surface || false}
                onCheckedChange={(checked) => {
                  updateField("no_surface", checked);
                  if (checked) {
                    updateField("surface_plancher", null);
                  }
                }}
              />
            </div>
            
            {!formData.no_surface && (
              <div className="space-y-2">
                <Label htmlFor="surface">Surface de plancher (m²)</Label>
                <Input
                  id="surface"
                  type="number"
                  value={formData.surface_plancher || ""}
                  onChange={(e) => updateField("surface_plancher", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="150"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Notes et observations..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createPermit.isPending}>
              {createPermit.isPending ? "Création..." : "Créer le permis"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
