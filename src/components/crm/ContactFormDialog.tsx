import { useState, useEffect, useMemo } from "react";
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
import { Loader2, FileText } from "lucide-react";
import { useContacts, Contact } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { useToast } from "@/hooks/use-toast";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { CONTACT_ROLES } from "@/lib/crmDefaults";
import { GENDER_OPTIONS, parseLocationString, buildLocationString } from "@/lib/crmConstants";
import { CompanySearchSelect } from "./shared/CompanySearchSelect";
import { SiretSearchDialog } from "./SiretSearchDialog";

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

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  contact?: Contact | null;
  defaultCompanyId?: string;
}

export function ContactFormDialog({ 
  open, 
  onOpenChange, 
  mode,
  contact,
  defaultCompanyId 
}: ContactFormDialogProps) {
  const { createContact, updateContact } = useContacts();
  const { companies, createCompany } = useCRMCompanies();
  const { contactTypes } = useCRMSettings();
  const { toast } = useToast();
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  const isEdit = mode === "edit";

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

  // Pre-fill form when editing or when defaultCompanyId changes
  useEffect(() => {
    if (isEdit && contact) {
      const locationParts = parseLocationString(contact.location);
      const isParticulier = contact.contact_type === "particulier" || !contact.crm_company_id;
      const matchingRole = CONTACT_ROLES.find(r => r.label === contact.role);
      
      let firstName = contact.first_name || "";
      let lastName = contact.last_name || "";
      
      if (!firstName && !lastName && contact.name) {
        const nameParts = contact.name.split(" ");
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(" ") || "";
      }
      
      form.reset({
        first_name: firstName,
        last_name: lastName,
        gender: (contact.gender as "male" | "female" | "other") || undefined,
        email: contact.email || "",
        phone: contact.phone || "",
        role: matchingRole?.value || (contact.role ? "autre" : ""),
        custom_role: matchingRole ? "" : (contact.role || ""),
        contact_type: contact.contact_type || "client",
        crm_company_id: contact.crm_company_id || "",
        address: locationParts.address,
        city: locationParts.city,
        postal_code: locationParts.postalCode,
        notes: contact.notes || "",
        is_individual: isParticulier,
        is_lead: contact.status === "lead",
      });
    } else if (!isEdit && defaultCompanyId) {
      form.setValue("crm_company_id", defaultCompanyId);
    }
  }, [contact, isEdit, defaultCompanyId, form, open]);

  // Reset form when dialog closes (create mode only)
  useEffect(() => {
    if (!open && !isEdit) {
      form.reset();
    }
  }, [open, isEdit, form]);

  const isIndividual = form.watch("is_individual");
  const selectedRole = form.watch("role");
  const selectedCompanyId = form.watch("crm_company_id");

  const handleCreateCompany = async (name: string) => {
    setIsCreatingCompany(true);
    try {
      const newCompany = await createCompany.mutateAsync({ name });
      return newCompany;
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
      form.setValue("crm_company_id", existingCompany.id);
      if (!form.getValues("address") && (existingCompany.address || siretData.address)) {
        form.setValue("address", existingCompany.address || siretData.address);
      }
      if (!form.getValues("city") && (existingCompany.city || siretData.city)) {
        form.setValue("city", existingCompany.city || siretData.city);
      }
      if (!form.getValues("postal_code") && (existingCompany.postal_code || siretData.postal_code)) {
        form.setValue("postal_code", existingCompany.postal_code || siretData.postal_code);
      }
      
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
      if (!form.getValues("address") && siretData.address) {
        form.setValue("address", siretData.address);
      }
      if (!form.getValues("city") && siretData.city) {
        form.setValue("city", siretData.city);
      }
      if (!form.getValues("postal_code") && siretData.postal_code) {
        form.setValue("postal_code", siretData.postal_code);
      }
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    const fullName = `${data.first_name} ${data.last_name}`.trim();
    
    let finalRole = data.is_individual 
      ? undefined 
      : data.role === "autre" && data.custom_role 
        ? data.custom_role 
        : CONTACT_ROLES.find(r => r.value === data.role)?.label || data.role;

    const contactType = data.is_individual ? "particulier" : (data.contact_type || "client");
    const location = buildLocationString(data.address, data.postal_code, data.city);

    const contactData = {
      name: fullName,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender || null,
      email: data.email || null,
      phone: data.phone || null,
      role: finalRole || null,
      contact_type: contactType,
      crm_company_id: data.is_individual ? null : (data.crm_company_id || null),
      location: location || null,
      notes: data.notes || null,
    };

    if (isEdit && contact) {
      await updateContact.mutateAsync({
        id: contact.id,
        ...contactData,
      });
    } else {
      await createContact.mutateAsync({
        ...contactData,
        status: data.is_lead ? 'lead' : 'confirmed',
      });
      form.reset();
    }
    onOpenChange(false);
  };

  const isPending = createContact.isPending || updateContact.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le contact" : "Nouveau Contact"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Lead toggle - only for create */}
          {!isEdit && (
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
          )}

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

          {/* Type de contact */}
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

          {/* Fonction/Rôle */}
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

          {/* Entreprise */}
          {!isIndividual && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Entreprise</Label>
                {!isEdit && (
                  <SiretSearchDialog
                    onSelect={handleCreateCompanyFromSiret}
                    trigger={
                      <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 text-xs text-muted-foreground hover:text-primary">
                        <FileText className="h-3 w-3" />
                        SIRET
                      </Button>
                    }
                  />
                )}
              </div>
              <CompanySearchSelect
                value={selectedCompanyId}
                onChange={(id) => form.setValue("crm_company_id", id)}
                onCreateCompany={!isEdit ? handleCreateCompany : undefined}
                allowCreate={!isEdit}
                disabled={isCreatingCompany}
              />
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
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEdit ? "Enregistrer" : "Créer le contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
