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
import { Loader2, Search, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useContacts, Contact } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { CONTACT_ROLES } from "@/lib/crmDefaults";

// Helper pour obtenir le label d'industrie
const getIndustryLabel = (industry: string | null) => {
  const labels: Record<string, string> = {
    "promoteur": "Promoteur",
    "bet_structure": "BET Structure",
    "bet_fluides": "BET Fluides",
    "architecte": "Architecte",
    "constructeur": "Constructeur",
    "maitre_ouvrage": "Maître d'ouvrage",
    "entreprise_generale": "Entreprise Générale",
  };
  if (!industry) return null;
  return labels[industry] || industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const schema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
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
});

type FormData = z.infer<typeof schema>;

interface EditContactDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditContactDialog({ contact, open, onOpenChange }: EditContactDialogProps) {
  const { updateContact } = useContacts();
  const { companies } = useCRMCompanies();
  const { contactTypes } = useCRMSettings();
  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
      name: "", 
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
    },
  });

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

  // Pre-fill form when contact changes
  useEffect(() => {
    if (contact) {
      // Parse location back to address parts
      const locationParts = contact.location?.split(", ") || [];
      const isParticulier = contact.contact_type === "particulier" || !contact.crm_company_id;
      
      // Find matching role from CONTACT_ROLES or set as custom
      const matchingRole = CONTACT_ROLES.find(r => r.label === contact.role);
      
      form.reset({
        name: contact.name || "",
        email: contact.email || "",
        phone: contact.phone || "",
        role: matchingRole?.value || (contact.role ? "autre" : ""),
        custom_role: matchingRole ? "" : (contact.role || ""),
        contact_type: contact.contact_type || "client",
        crm_company_id: contact.crm_company_id || "",
        address: locationParts[0] || "",
        city: locationParts[2] || locationParts[1] || "",
        postal_code: locationParts.length > 2 ? locationParts[1] : "",
        notes: contact.notes || "",
        is_individual: isParticulier,
      });
      setCompanySearch("");
    }
  }, [contact, form]);

  const onSubmit = async (data: FormData) => {
    if (!contact) return;
    
    // Determine the final role
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

    await updateContact.mutateAsync({
      id: contact.id,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      role: finalRole || null,
      contact_type: contactType,
      crm_company_id: data.is_individual ? null : (data.crm_company_id || null),
      location: location || null,
      notes: data.notes || null,
    });
    onOpenChange(false);
  };

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Switch particulier */}
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
                }
              }}
            />
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input {...form.register("name")} placeholder="Jean Dupont" />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
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
                  {contactTypes.map((type) => (
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
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredCompanies.length > 0 ? (
                          <>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors text-muted-foreground"
                              onClick={() => {
                                form.setValue("crm_company_id", "");
                                setCompanySearch("");
                                setShowCompanyDropdown(false);
                              }}
                            >
                              Aucune entreprise
                            </button>
                            {filteredCompanies.map((company) => (
                              <button
                                key={company.id}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                                onClick={() => {
                                  form.setValue("crm_company_id", company.id);
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
                        ) : companySearch.trim() ? (
                          <p className="text-xs text-muted-foreground p-3">
                            Aucune entreprise trouvée
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground p-3">
                            Tapez pour rechercher...
                          </p>
                        )}
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
            <Button type="submit" disabled={updateContact.isPending}>
              {updateContact.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
