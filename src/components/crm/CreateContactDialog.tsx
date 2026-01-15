import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Search, Plus, Building2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useContacts } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { useToast } from "@/hooks/use-toast";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { CONTACT_ROLES } from "@/lib/crmDefaults";
import { SiretSearchDialog } from "./SiretSearchDialog";

// Helper pour obtenir le label d'industrie - formatage propre
const getIndustryLabel = (industry: string | null) => {
  const labels: Record<string, string> = {
    "promoteur": "Promoteur",
    "bet_structure": "BET Structure",
    "bet_fluides": "BET Fluides",
    "bet_environnement": "BET Environnement",
    "bet_acoustique": "BET Acoustique",
    "bet_vrd": "BET VRD",
    "bet_electricite": "BET Électricité",
    "paysagiste": "Paysagiste",
    "agenceur": "Agenceur",
    "epa_sem": "EPA/SEM",
    "acousticien": "Acousticien",
    "economiste": "Économiste",
    "vrd": "VRD",
    "electricite": "Électricité",
    "architecte": "Architecte",
    "constructeur": "Constructeur",
    "maitre_ouvrage": "Maître d'ouvrage",
    "entreprise_generale": "Entreprise Générale",
    "bureau_controle": "Bureau de Contrôle",
    "coordinateur_sps": "Coordinateur SPS",
    "geometre": "Géomètre",
    "notaire": "Notaire",
    "assureur": "Assureur",
    "banque": "Banque",
  };
  if (!industry) return null;
  return labels[industry] || industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const GENDER_OPTIONS = [
  { value: "male", label: "Monsieur" },
  { value: "female", label: "Madame" },
  { value: "other", label: "Autre" },
] as const;

const schema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  gender: z.enum(["male", "female", "other"]).optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().optional(),
  custom_role: z.string().optional(),
  contact_type: z.string().optional(),
  crm_company_id: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  notes: z.string().optional(),
  is_individual: z.boolean().default(false),
  is_lead: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCompanyId?: string;
}

export function CreateContactDialog({ open, onOpenChange, defaultCompanyId }: CreateContactDialogProps) {
  const { createContact } = useContacts();
  const { companies, createCompany } = useCRMCompanies();
  const { contactTypes } = useCRMSettings();
  const { toast } = useToast();
  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
      first_name: "",
      last_name: "",
      gender: undefined,
      email: "", 
      phone: "", 
      role: "",
      custom_role: "",
      contact_type: "client",
      crm_company_id: "",
      address: "",
      city: "",
      postal_code: "",
      notes: "",
      is_individual: false,
      is_lead: false,
    },
  });

  // Pre-fill company when defaultCompanyId is provided
  const hasInitializedDefault = useState(false);
  if (defaultCompanyId && !hasInitializedDefault[0] && open) {
    form.setValue("crm_company_id", defaultCompanyId);
    hasInitializedDefault[1](true);
  }
  // Reset initialization flag when dialog closes
  if (!open && hasInitializedDefault[0]) {
    hasInitializedDefault[1](false);
  }

  const isIndividual = form.watch("is_individual");
  const selectedRole = form.watch("role");
  const selectedCompanyId = form.watch("crm_company_id");

  // Filtered companies based on search
  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return companies.slice(0, 10);
    const search = companySearch.toLowerCase();
    return companies.filter(c => 
      c.name.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [companies, companySearch]);

  const selectedCompany = useMemo(() => {
    return companies.find(c => c.id === selectedCompanyId);
  }, [companies, selectedCompanyId]);

  const handleCreateCompany = async () => {
    if (!companySearch.trim()) return;
    
    setIsCreatingCompany(true);
    try {
      const newCompany = await createCompany.mutateAsync({
        name: companySearch.trim(),
      });
      form.setValue("crm_company_id", newCompany.id);
      setCompanySearch("");
      setShowCompanyDropdown(false);
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const handleCreateCompanyFromSiret = async (siretData: {
    siren: string;
    siret: string;
    name: string;
    address: string;
    postal_code: string;
    city: string;
    code_naf: string;
    forme_juridique: string;
  }) => {
    // Check for existing company with same SIRET or SIREN
    const existingBySiret = siretData.siret 
      ? companies.find(c => c.siret === siretData.siret)
      : null;
    const existingBySiren = siretData.siren && !existingBySiret
      ? companies.find(c => c.siren === siretData.siren)
      : null;
    const existingByName = !existingBySiret && !existingBySiren
      ? companies.find(c => c.name.toLowerCase().trim() === siretData.name.toLowerCase().trim())
      : null;
    
    const existingCompany = existingBySiret || existingBySiren || existingByName;
    
    if (existingCompany) {
      // Use existing company instead of creating duplicate
      form.setValue("crm_company_id", existingCompany.id);
      // Auto-fill contact address if empty
      if (!form.getValues("address") && (existingCompany.address || siretData.address)) {
        form.setValue("address", existingCompany.address || siretData.address);
      }
      if (!form.getValues("city") && (existingCompany.city || siretData.city)) {
        form.setValue("city", existingCompany.city || siretData.city);
      }
      if (!form.getValues("postal_code") && (existingCompany.postal_code || siretData.postal_code)) {
        form.setValue("postal_code", existingCompany.postal_code || siretData.postal_code);
      }
      setCompanySearch("");
      setShowCompanyDropdown(false);
      
      // Show toast about using existing company
      const reason = existingBySiret ? "SIRET" : existingBySiren ? "SIREN" : "nom";
      toast({
        title: "Entreprise existante utilisée",
        description: `"${existingCompany.name}" existe déjà (même ${reason}). Elle a été sélectionnée automatiquement.`,
      });
      return;
    }
    
    setIsCreatingCompany(true);
    try {
      const newCompany = await createCompany.mutateAsync({
        name: siretData.name,
        siren: siretData.siren,
        siret: siretData.siret,
        address: siretData.address,
        postal_code: siretData.postal_code,
        city: siretData.city,
        code_naf: siretData.code_naf,
        forme_juridique: siretData.forme_juridique,
      });
      form.setValue("crm_company_id", newCompany.id);
      // Auto-fill contact address if empty
      if (!form.getValues("address") && siretData.address) {
        form.setValue("address", siretData.address);
      }
      if (!form.getValues("city") && siretData.city) {
        form.setValue("city", siretData.city);
      }
      if (!form.getValues("postal_code") && siretData.postal_code) {
        form.setValue("postal_code", siretData.postal_code);
      }
      setCompanySearch("");
      setShowCompanyDropdown(false);
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    // Build full name from first_name and last_name
    const fullName = `${data.first_name} ${data.last_name}`.trim();
    
    // Determine the final role (only for non-individuals)
    let finalRole = data.is_individual 
      ? undefined 
      : data.role === "autre" && data.custom_role 
        ? data.custom_role 
        : CONTACT_ROLES.find(r => r.value === data.role)?.label || data.role;

    // Determine contact type
    const contactType = data.is_individual ? "particulier" : (data.contact_type || "client");

    // Build full location string from address parts
    const locationParts = [data.address, data.postal_code, data.city].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(", ") : undefined;

    await createContact.mutateAsync({
      name: fullName,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender,
      email: data.email || undefined,
      phone: data.phone || undefined,
      role: finalRole || undefined,
      contact_type: contactType,
      crm_company_id: data.is_individual ? undefined : (data.crm_company_id || undefined),
      location,
      notes: data.notes || undefined,
      status: data.is_lead ? 'lead' : 'confirmed',
    });
    form.reset();
    setCompanySearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Switch particulier - only show if not pre-linked to a company */}
          {/* Lead toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-orange-700 dark:text-orange-400">Créer comme Lead</Label>
              <p className="text-xs text-orange-600/80 dark:text-orange-500/80">
                Les leads doivent être qualifiés avant de devenir des contacts
              </p>
            </div>
            <Switch
              checked={form.watch("is_lead")}
              onCheckedChange={(checked) => form.setValue("is_lead", checked)}
            />
          </div>

          {/* Individual toggle */}
          {!defaultCompanyId && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Contact particulier</Label>
                <p className="text-xs text-muted-foreground">
                  Activer si ce contact n'est pas rattaché à une entreprise
                </p>
              </div>
              <Switch
                checked={isIndividual}
                onCheckedChange={(checked) => {
                  form.setValue("is_individual", checked);
                  if (checked) {
                    form.setValue("crm_company_id", "");
                    form.setValue("contact_type", "particulier");
                  } else {
                    form.setValue("contact_type", "client");
                  }
                }}
              />
            </div>
          )}

          {/* Civilité */}
          <div className="space-y-2">
            <Label>Civilité</Label>
            <Select 
              value={form.watch("gender")} 
              onValueChange={(v) => form.setValue("gender", v as "male" | "female" | "other")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prénom & Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prénom *</Label>
              <Input {...form.register("first_name")} placeholder="Jean" />
              {form.formState.errors.first_name && (
                <p className="text-sm text-destructive">{form.formState.errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input {...form.register("last_name")} placeholder="Dupont" />
              {form.formState.errors.last_name && (
                <p className="text-sm text-destructive">{form.formState.errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Email & Téléphone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...form.register("email")} type="email" placeholder="jean@exemple.fr" />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input {...form.register("phone")} placeholder="+33 1 23 45 67 89" />
            </div>
          </div>

          {/* Type de contact - visible seulement si pas particulier */}
          {!isIndividual && (
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={form.watch("contact_type")} 
                onValueChange={(v) => form.setValue("contact_type", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contactTypes.filter(t => t.key !== "particulier").map((type) => (
                    <SelectItem key={type.key} value={type.key}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: type.color }}
                        />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Fonction/Rôle - masqué pour les particuliers */}
          {!isIndividual && (
            <>
              <div className="space-y-2">
                <Label>Fonction</Label>
                <Select 
                  value={selectedRole} 
                  onValueChange={(v) => {
                    form.setValue("role", v);
                    if (v !== "autre") {
                      form.setValue("custom_role", "");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une fonction..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover max-h-60">
                    {CONTACT_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Champ personnalisé si "Autre" */}
              {selectedRole === "autre" && (
                <div className="space-y-2">
                  <Label>Fonction personnalisée</Label>
                  <Input 
                    {...form.register("custom_role")} 
                    placeholder="Précisez la fonction..." 
                  />
                </div>
              )}
            </>
          )}

          {/* Entreprise (masqué si particulier) */}
          {!isIndividual && (
            <div className="space-y-2">
              <Label>Entreprise</Label>
              <div className="relative">
                {selectedCompany ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-md border border-border bg-muted/30">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm truncate">{selectedCompany.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        form.setValue("crm_company_id", "");
                        setCompanySearch("");
                      }}
                    >
                      Changer
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={companySearch}
                        onChange={(e) => {
                          setCompanySearch(e.target.value);
                          setShowCompanyDropdown(true);
                        }}
                        onFocus={() => setShowCompanyDropdown(true)}
                        placeholder="Rechercher une entreprise..."
                        className="pl-9"
                      />
                    </div>
                    
                    {showCompanyDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {/* Quick actions - always visible */}
                        <div className="p-2 border-b border-border space-y-1">
                          {/* SIRET search button */}
                          <SiretSearchDialog
                            onSelect={handleCreateCompanyFromSiret}
                            trigger={
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full justify-start gap-2 h-9"
                                disabled={isCreatingCompany}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Rechercher par SIRET/SIREN
                              </Button>
                            }
                          />
                          
                          {/* Quick create from search text */}
                          {companySearch.trim() && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start gap-2 h-9 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={handleCreateCompany}
                              disabled={isCreatingCompany}
                            >
                              {isCreatingCompany ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Plus className="h-3.5 w-3.5" />
                              )}
                              Créer "{companySearch.trim()}"
                            </Button>
                          )}
                        </div>

                        {filteredCompanies.length > 0 ? (
                          <>
                            {filteredCompanies.map((company) => (
                              <button
                                key={company.id}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                                onClick={() => {
                                  form.setValue("crm_company_id", company.id);
                                  // Auto-fill address from company if available and contact address is empty
                                  if (company.address && !form.getValues("address")) {
                                    form.setValue("address", company.address);
                                  }
                                  if (company.city && !form.getValues("city")) {
                                    form.setValue("city", company.city);
                                  }
                                  if (company.postal_code && !form.getValues("postal_code")) {
                                    form.setValue("postal_code", company.postal_code);
                                  }
                                  setCompanySearch("");
                                  setShowCompanyDropdown(false);
                                }}
                              >
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate flex-1">{company.name}</span>
                                {company.industry && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                                    {getIndustryLabel(company.industry)}
                                  </Badge>
                                )}
                              </button>
                            ))}
                          </>
                        ) : !companySearch.trim() ? (
                          <p className="text-xs text-muted-foreground p-3">
                            Tapez pour rechercher ou créer...
                          </p>
                        ) : null}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Adresse */}
          <div className="space-y-2">
            <Label>Adresse</Label>
            <AddressAutocomplete
              value={form.watch("address") || ""}
              onChange={(address) => form.setValue("address", address)}
              onAddressSelect={(result) => {
                form.setValue("address", result.address);
                form.setValue("city", result.city);
                form.setValue("postal_code", result.postalCode);
              }}
              placeholder="Rechercher une adresse..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...form.register("notes")} placeholder="Notes internes..." rows={2} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createContact.isPending}>
              {createContact.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Créer le contact
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
