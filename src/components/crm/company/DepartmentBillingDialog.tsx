import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Save, X } from "lucide-react";
import { useBillingProfiles, BillingProfile, CreateBillingProfileInput } from "@/hooks/useBillingProfiles";
import { useAuth } from "@/contexts/AuthContext";

interface DepartmentBillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentId: string;
  departmentName: string;
  workspaceId: string;
}

const LEGAL_FORMS = [
  { value: "sarl", label: "SARL" },
  { value: "sas", label: "SAS" },
  { value: "sa", label: "SA" },
  { value: "sasu", label: "SASU" },
  { value: "eurl", label: "EURL" },
  { value: "ei", label: "EI" },
  { value: "other", label: "Autre" },
];

const VAT_TYPES = [
  { value: "normal", label: "TVA normale" },
  { value: "reduced", label: "TVA réduite" },
  { value: "exempt", label: "Exonéré de TVA" },
  { value: "intra", label: "TVA intracommunautaire" },
];

const PAYMENT_TERMS = [
  { value: "immediate", label: "Paiement immédiat" },
  { value: "30_days", label: "30 jours" },
  { value: "30_days_end", label: "30 jours fin de mois" },
  { value: "45_days", label: "45 jours" },
  { value: "60_days", label: "60 jours" },
];

export function DepartmentBillingDialog({
  open,
  onOpenChange,
  departmentId,
  departmentName,
  workspaceId,
}: DepartmentBillingDialogProps) {
  const { profiles, createProfile, updateProfile } = useBillingProfiles("department", departmentId);
  const [formData, setFormData] = useState<Partial<BillingProfile>>({});

  const billingProfile = profiles[0];

  useEffect(() => {
    if (billingProfile) {
      setFormData(billingProfile);
    } else {
      setFormData({
        billing_name: departmentName,
      });
    }
  }, [billingProfile, departmentName, open]);

  const handleSave = async () => {
    if (billingProfile) {
      await updateProfile.mutateAsync({
        id: billingProfile.id,
        ...formData,
      });
    } else {
      await createProfile.mutateAsync({
        workspace_id: workspaceId,
        department_id: departmentId,
        company_id: null,
        contact_id: null,
        ...formData,
      } as CreateBillingProfileInput);
    }
    onOpenChange(false);
  };

  const updateField = (field: keyof BillingProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Facturation - {departmentName}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Identification */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Identification</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">SIRET</Label>
                  <Input
                    value={formData.siret || ""}
                    onChange={(e) => updateField("siret", e.target.value)}
                    placeholder="12345678901234"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">N° TVA</Label>
                  <Input
                    value={formData.vat_number || ""}
                    onChange={(e) => updateField("vat_number", e.target.value)}
                    placeholder="FR12345678901"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Forme juridique</Label>
                  <Select
                    value={formData.legal_form || ""}
                    onValueChange={(v) => updateField("legal_form", v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {LEGAL_FORMS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Code NAF</Label>
                  <Input
                    value={formData.code_naf || ""}
                    onChange={(e) => updateField("code_naf", e.target.value)}
                    placeholder="7112B"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Adresse de facturation */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Adresse de facturation</h4>
              <div className="space-y-1.5">
                <Label className="text-xs">Nom / Raison sociale</Label>
                <Input
                  value={formData.billing_name || ""}
                  onChange={(e) => updateField("billing_name", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Adresse</Label>
                <Input
                  value={formData.billing_address || ""}
                  onChange={(e) => updateField("billing_address", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Code postal</Label>
                  <Input
                    value={formData.billing_postal_code || ""}
                    onChange={(e) => updateField("billing_postal_code", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ville</Label>
                  <Input
                    value={formData.billing_city || ""}
                    onChange={(e) => updateField("billing_city", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Email facturation</Label>
                  <Input
                    type="email"
                    value={formData.billing_email || ""}
                    onChange={(e) => updateField("billing_email", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Téléphone</Label>
                  <Input
                    value={formData.billing_phone || ""}
                    onChange={(e) => updateField("billing_phone", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Coordonnées bancaires */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Coordonnées bancaires</h4>
              <div className="space-y-1.5">
                <Label className="text-xs">IBAN</Label>
                <Input
                  value={formData.iban || ""}
                  onChange={(e) => updateField("iban", e.target.value)}
                  placeholder="FR76..."
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">BIC</Label>
                  <Input
                    value={formData.bic || ""}
                    onChange={(e) => updateField("bic", e.target.value)}
                    placeholder="BNPAFRPP"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Banque</Label>
                  <Input
                    value={formData.bank_name || ""}
                    onChange={(e) => updateField("bank_name", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Conditions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Conditions de paiement</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Délai de paiement</Label>
                  <Select
                    value={formData.payment_terms || ""}
                    onValueChange={(v) => updateField("payment_terms", v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TERMS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Type de TVA</Label>
                  <Select
                    value={formData.vat_type || ""}
                    onValueChange={(v) => updateField("vat_type", v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {VAT_TYPES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Taux TVA (%)</Label>
                  <Input
                    type="number"
                    value={formData.vat_rate || ""}
                    onChange={(e) => updateField("vat_rate", parseFloat(e.target.value) || null)}
                    placeholder="20"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Remise par défaut (%)</Label>
                  <Input
                    type="number"
                    value={formData.default_discount_percent || ""}
                    onChange={(e) => updateField("default_discount_percent", parseFloat(e.target.value) || null)}
                    placeholder="0"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={createProfile.isPending || updateProfile.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
