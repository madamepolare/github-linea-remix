import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Receipt,
  Building2,
  CreditCard,
  FileText,
  Percent,
  ChevronDown,
  ChevronUp,
  Pencil,
  Save,
  X,
  Plus,
  Search,
} from "lucide-react";
import { SiretSearchDialog } from "../SiretSearchDialog";
import { useBillingProfiles, BillingProfile, CreateBillingProfileInput } from "@/hooks/useBillingProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { CRMCompanyEnriched } from "@/hooks/useCRMCompanies";

interface CompanyBillingPanelProps {
  company: CRMCompanyEnriched;
}

const LEGAL_FORMS = [
  { value: "sarl", label: "SARL" },
  { value: "sas", label: "SAS" },
  { value: "sa", label: "SA" },
  { value: "sasu", label: "SASU" },
  { value: "eurl", label: "EURL" },
  { value: "ei", label: "EI" },
  { value: "auto", label: "Auto-entrepreneur" },
  { value: "sci", label: "SCI" },
  { value: "snc", label: "SNC" },
  { value: "association", label: "Association" },
  { value: "other", label: "Autre" },
];

const VAT_TYPES = [
  { value: "normal", label: "TVA normale" },
  { value: "reduced", label: "TVA réduite" },
  { value: "super_reduced", label: "TVA super réduite" },
  { value: "exempt", label: "Exonéré de TVA" },
  { value: "intra", label: "TVA intracommunautaire" },
];

const PAYMENT_METHODS = [
  { value: "virement", label: "Virement bancaire" },
  { value: "cheque", label: "Chèque" },
  { value: "prelevement", label: "Prélèvement" },
  { value: "carte", label: "Carte bancaire" },
  { value: "especes", label: "Espèces" },
];

const PAYMENT_TERMS = [
  { value: "immediate", label: "Paiement immédiat" },
  { value: "15_days", label: "15 jours" },
  { value: "30_days", label: "30 jours" },
  { value: "30_days_end", label: "30 jours fin de mois" },
  { value: "45_days", label: "45 jours" },
  { value: "45_days_end", label: "45 jours fin de mois" },
  { value: "60_days", label: "60 jours" },
  { value: "60_days_end", label: "60 jours fin de mois" },
];

export function CompanyBillingPanel({ company }: CompanyBillingPanelProps) {
  const { activeWorkspace } = useAuth();
  const { profiles, isLoading, createProfile, updateProfile } = useBillingProfiles("company", company.id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["fiscal"]);
  const [formData, setFormData] = useState<Partial<BillingProfile>>({});

  const billingProfile = profiles[0];

  useEffect(() => {
    if (billingProfile) {
      setFormData(billingProfile);
    } else {
      // Pre-fill with company data
      setFormData({
        billing_name: company.name,
        billing_address: company.address,
        billing_city: company.city,
        billing_postal_code: company.postal_code,
        billing_country: company.country || "France",
        billing_email: company.billing_email || company.email,
        billing_phone: company.phone,
        siret: company.siret,
        siren: company.siren,
        vat_number: company.vat_number,
        code_naf: company.code_naf,
        legal_form: company.forme_juridique,
        capital_social: company.capital_social,
        rcs_city: company.rcs_city,
        vat_type: company.vat_type,
        vat_rate: company.vat_rate,
      });
    }
  }, [billingProfile, company]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleSave = async () => {
    if (!activeWorkspace?.id) return;

    if (billingProfile) {
      await updateProfile.mutateAsync({
        id: billingProfile.id,
        ...formData,
      });
    } else {
      await createProfile.mutateAsync({
        workspace_id: activeWorkspace.id,
        company_id: company.id,
        contact_id: null,
        ...formData,
      } as CreateBillingProfileInput);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (billingProfile) {
      setFormData(billingProfile);
    }
    setIsEditing(false);
  };

  const updateField = (field: keyof BillingProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderField = (
    label: string,
    field: keyof BillingProfile,
    placeholder?: string,
    type: "text" | "number" | "email" = "text"
  ) => {
    const value = formData[field];
    
    if (!isEditing) {
      return value ? (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium">{String(value)}</p>
        </div>
      ) : null;
    }

    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{label}</Label>
        <Input
          type={type}
          value={value as string || ""}
          onChange={(e) => updateField(field, type === "number" ? parseFloat(e.target.value) || null : e.target.value)}
          placeholder={placeholder}
          className="h-8 text-sm"
        />
      </div>
    );
  };

  const renderSelect = (
    label: string,
    field: keyof BillingProfile,
    options: { value: string; label: string }[]
  ) => {
    const value = formData[field] as string;
    const selectedOption = options.find((o) => o.value === value);

    if (!isEditing) {
      return selectedOption ? (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium">{selectedOption.label}</p>
        </div>
      ) : null;
    }

    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{label}</Label>
        <Select
          value={value || ""}
          onValueChange={(v) => updateField(field, v)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const SectionHeader = ({
    icon: Icon,
    title,
    section,
  }: {
    icon: any;
    title: string;
    section: string;
  }) => (
    <CollapsibleTrigger
      className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded px-2 -mx-2"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      {expandedSections.includes(section) ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </CollapsibleTrigger>
  );

  const hasAnyData = billingProfile || Object.values(formData).some((v) => v !== null && v !== undefined && v !== "");

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Coordonnées de facturation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Coordonnées de facturation
          </CardTitle>
          <div className="flex gap-1">
            {isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={createProfile.isPending || updateProfile.isPending}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                {hasAnyData ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fiscal Identification */}
        <Collapsible open={expandedSections.includes("fiscal")}>
          <SectionHeader icon={FileText} title="Identification fiscale" section="fiscal" />
          <CollapsibleContent className="pt-3 space-y-3">
            {/* SIRET Search Button */}
            {isEditing && (
              <SiretSearchDialog
                onSelect={(result) => {
                  setFormData((prev) => ({
                    ...prev,
                    siren: result.siren,
                    siret: result.siret,
                    billing_name: result.name || prev.billing_name,
                    billing_address: result.address || prev.billing_address,
                    billing_postal_code: result.postal_code || prev.billing_postal_code,
                    billing_city: result.city || prev.billing_city,
                    code_naf: result.code_naf || prev.code_naf,
                    legal_form: result.forme_juridique || prev.legal_form,
                  }));
                }}
                trigger={
                  <Button type="button" variant="outline" size="sm" className="w-full gap-2 mb-2">
                    <Search className="h-4 w-4" />
                    Rechercher dans le registre national
                  </Button>
                }
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              {renderField("SIRET", "siret", "12345678901234")}
              {renderField("SIREN", "siren", "123456789")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {renderField("N° TVA", "vat_number", "FR12345678901")}
              {renderField("Code NAF", "code_naf", "7112B")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {renderSelect("Forme juridique", "legal_form", LEGAL_FORMS)}
              {renderField("Capital social (€)", "capital_social", "10000", "number")}
            </div>
            {renderField("Ville RCS", "rcs_city", "Paris")}
          </CollapsibleContent>
        </Collapsible>

        {/* Billing Address */}
        <Collapsible open={expandedSections.includes("address")}>
          <SectionHeader icon={Building2} title="Adresse de facturation" section="address" />
          <CollapsibleContent className="pt-3 space-y-3">
            {renderField("Nom / Raison sociale", "billing_name")}
            {renderField("Adresse", "billing_address")}
            <div className="grid grid-cols-2 gap-3">
              {renderField("Code postal", "billing_postal_code")}
              {renderField("Ville", "billing_city")}
            </div>
            {renderField("Pays", "billing_country")}
            <div className="grid grid-cols-2 gap-3">
              {renderField("Email facturation", "billing_email", "", "email")}
              {renderField("Téléphone", "billing_phone")}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Banking */}
        <Collapsible open={expandedSections.includes("banking")}>
          <SectionHeader icon={CreditCard} title="Coordonnées bancaires" section="banking" />
          <CollapsibleContent className="pt-3 space-y-3">
            {renderField("IBAN", "iban", "FR76...")}
            {renderField("BIC", "bic", "BNPAFRPP")}
            {renderField("Nom de la banque", "bank_name")}
          </CollapsibleContent>
        </Collapsible>

        {/* Payment Terms */}
        <Collapsible open={expandedSections.includes("payment")}>
          <SectionHeader icon={Percent} title="Conditions de paiement" section="payment" />
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {renderSelect("Délai de paiement", "payment_terms", PAYMENT_TERMS)}
              {renderSelect("Mode de paiement", "payment_method", PAYMENT_METHODS)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {renderSelect("Type de TVA", "vat_type", VAT_TYPES)}
              {renderField("Taux TVA (%)", "vat_rate", "20", "number")}
            </div>
            {renderField("Remise par défaut (%)", "default_discount_percent", "0", "number")}
            
            {isEditing && (
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Notes sur la facturation..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            )}
            {!isEditing && formData.notes && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm">{formData.notes}</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Empty state */}
        {!isEditing && !hasAnyData && (
          <div className="text-center py-6 text-muted-foreground">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune coordonnée de facturation</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="mt-1"
            >
              Ajouter les coordonnées
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
