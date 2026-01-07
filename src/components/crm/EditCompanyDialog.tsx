import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X, ChevronDown } from "lucide-react";
import { useCRMCompanies, CRMCompanyEnriched } from "@/hooks/useCRMCompanies";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { COMPANY_CATEGORIES, COMPANY_TYPE_CONFIG, CompanyCategory, CompanyType } from "@/lib/crmTypes";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const schema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  category: z.string().optional(),
  industry: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  billing_email: z.string().email("Email invalide").optional().or(z.literal("")),
  logo_url: z.string().optional(),
  notes: z.string().optional(),
  // Financial fields
  siren: z.string().max(9).optional(),
  siret: z.string().max(14).optional(),
  vat_number: z.string().max(20).optional(),
  capital_social: z.string().optional(),
  forme_juridique: z.string().optional(),
  code_naf: z.string().max(10).optional(),
  rcs_city: z.string().max(100).optional(),
});

type FormData = z.infer<typeof schema>;

interface EditCompanyDialogProps {
  company: CRMCompanyEnriched | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to find category from industry type
function getCategoryFromIndustry(industry: string | null): CompanyCategory | "" {
  if (!industry) return "";
  for (const cat of COMPANY_CATEGORIES) {
    if (cat.types?.includes(industry as CompanyType)) {
      return cat.id;
    }
  }
  return "";
}

export function EditCompanyDialog({ company, open, onOpenChange }: EditCompanyDialogProps) {
  const { updateCompany } = useCRMCompanies();
  const { betSpecialties } = useCRMSettings();
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CompanyCategory | "">("");
  const [sameAsBilling, setSameAsBilling] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
      name: "", 
      category: "",
      industry: "", 
      email: "", 
      phone: "", 
      website: "",
      address: "",
      city: "", 
      postal_code: "",
      country: "France",
      billing_email: "",
      logo_url: "",
      notes: "",
      siren: "",
      siret: "",
      vat_number: "",
      capital_social: "",
      forme_juridique: "",
      code_naf: "",
      rcs_city: "",
    },
  });

  // Pre-fill form when company changes
  useEffect(() => {
    if (company) {
      const legacyBet = company.industry?.startsWith("bet_") ? company.industry.slice("bet_".length) : null;
      const normalizedIndustry = legacyBet ? "bet" : company.industry;

      const category = getCategoryFromIndustry(normalizedIndustry);
      setSelectedCategory(category);

      const normalizedSpecs = legacyBet
        ? (company.bet_specialties && company.bet_specialties.length > 0 ? company.bet_specialties : [legacyBet])
        : company.bet_specialties || [];
      setSelectedSpecialties(normalizedSpecs);

      setSameAsBilling(company.email === company.billing_email && !!company.email);

      const companyAny = company as any;
      form.reset({
        name: company.name || "",
        category: category,
        industry: normalizedIndustry || "",
        email: company.email || "",
        phone: company.phone || "",
        website: company.website || "",
        address: company.address || "",
        city: company.city || "",
        postal_code: company.postal_code || "",
        country: company.country || "France",
        billing_email: company.billing_email || "",
        logo_url: company.logo_url || "",
        notes: company.notes || "",
        siren: companyAny.siren || "",
        siret: companyAny.siret || "",
        vat_number: companyAny.vat_number || "",
        capital_social: companyAny.capital_social?.toString() || "",
        forme_juridique: companyAny.forme_juridique || "",
        code_naf: companyAny.code_naf || "",
        rcs_city: companyAny.rcs_city || "",
      });
    }
  }, [company, form]);

  // Get types for selected category
  const categoryTypes = selectedCategory
    ? COMPANY_CATEGORIES.find((c) => c.id === selectedCategory)?.types || []
    : [];

  const isBET = selectedCategory === "bet";

  const toggleSpecialty = (value: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const removeSpecialty = (value: string) => {
    setSelectedSpecialties((prev) => prev.filter((s) => s !== value));
  };

  const onSubmit = async (data: FormData) => {
    if (!company) return;

    await updateCompany.mutateAsync({
      id: company.id,
      name: data.name,
      industry: data.industry || null,
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
      address: data.address || null,
      city: data.city || null,
      postal_code: data.postal_code || null,
      country: data.country || null,
      billing_email: sameAsBilling ? data.email || null : data.billing_email || null,
      logo_url: data.logo_url || null,
      notes: data.notes || null,
      bet_specialties: isBET && selectedSpecialties.length > 0 ? selectedSpecialties : null,
      siren: data.siren || null,
      siret: data.siret || null,
      vat_number: data.vat_number || null,
      capital_social: data.capital_social ? parseFloat(data.capital_social) : null,
      forme_juridique: data.forme_juridique || null,
      code_naf: data.code_naf || null,
      rcs_city: data.rcs_city || null,
    } as any);
    onOpenChange(false);
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Modifier l'entreprise</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Nom de l'entreprise *</Label>
              <Input {...form.register("name")} placeholder="Acme Corporation" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Category & Type */}
            <div className={isBET ? "space-y-2" : "grid grid-cols-2 gap-4"}>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(v) => {
                    setSelectedCategory(v as CompanyCategory);
                    form.setValue("category", v);
                    // When changing to "bet", set industry to "bet" as well
                    form.setValue("industry", v === "bet" ? "bet" : "");
                    setSelectedSpecialties([]); // Reset specialties
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!isBET && (
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={form.watch("industry") || ""}
                    onValueChange={(v) => form.setValue("industry", v)}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryTypes.map((type) => {
                        const config = COMPANY_TYPE_CONFIG[type];
                        return (
                          <SelectItem key={type} value={type}>
                            {config.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* BET Specialties */}
            {isBET && (
              <div className="space-y-2">
                <Label>Spécialités BET</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-auto min-h-10 py-2">
                      {selectedSpecialties.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedSpecialties.map((spec) => {
                            const specialty = betSpecialties.find((s) => s.key === spec);
                            return (
                              <Badge
                                key={spec}
                                className="text-white text-xs gap-1"
                                style={{ backgroundColor: specialty?.color }}
                              >
                                {specialty?.label || spec}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeSpecialty(spec);
                                  }}
                                />
                              </Badge>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sélectionnez une ou plusieurs spécialités</span>
                      )}
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                    {betSpecialties.map((spec) => (
                      <DropdownMenuCheckboxItem
                        key={spec.key}
                        checked={selectedSpecialties.includes(spec.key)}
                        onCheckedChange={() => toggleSpecialty(spec.key)}
                      >
                        <Badge 
                          className="text-white text-xs mr-2"
                          style={{ backgroundColor: spec.color }}
                        >
                          {spec.label}
                        </Badge>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <p className="text-xs text-muted-foreground">
                  Sélectionnez une ou plusieurs spécialités
                </p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label>Email principal</Label>
              <Input {...form.register("email")} type="email" placeholder="contact@entreprise.fr" />
            </div>

            {/* Billing email checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sameAsBilling"
                checked={sameAsBilling}
                onCheckedChange={(checked) => setSameAsBilling(checked === true)}
              />
              <label
                htmlFor="sameAsBilling"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email de facturation identique à l'email principal
              </label>
            </div>

            {!sameAsBilling && (
              <div className="space-y-2">
                <Label>Email de facturation</Label>
                <Input
                  {...form.register("billing_email")}
                  type="email"
                  placeholder="facturation@entreprise.fr"
                />
              </div>
            )}

            {/* Phone */}
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input {...form.register("phone")} placeholder="01 23 45 67 89" />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label>Site web</Label>
              <Input {...form.register("website")} placeholder="https://www.entreprise.fr" />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input {...form.register("address")} placeholder="123 rue de la Paix" />
            </div>

            {/* City & Postal code */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input {...form.register("postal_code")} placeholder="75001" />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input {...form.register("city")} placeholder="Paris" />
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Input {...form.register("country")} placeholder="France" />
              </div>
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label>URL du logo</Label>
              <Input {...form.register("logo_url")} placeholder="https://..." />
            </div>

            {/* Financial Section */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Informations financières</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SIREN</Label>
                  <Input {...form.register("siren")} placeholder="123456789" maxLength={9} />
                </div>
                <div className="space-y-2">
                  <Label>SIRET</Label>
                  <Input {...form.register("siret")} placeholder="12345678900012" maxLength={14} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>N° TVA Intra.</Label>
                  <Input {...form.register("vat_number")} placeholder="FR12345678901" />
                </div>
                <div className="space-y-2">
                  <Label>Code NAF</Label>
                  <Input {...form.register("code_naf")} placeholder="7111Z" maxLength={10} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forme juridique</Label>
                  <Input {...form.register("forme_juridique")} placeholder="SARL, SAS, EURL..." />
                </div>
                <div className="space-y-2">
                  <Label>Capital social (€)</Label>
                  <Input {...form.register("capital_social")} type="number" placeholder="10000" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ville du RCS</Label>
                <Input {...form.register("rcs_city")} placeholder="Paris" />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} placeholder="Notes sur l'entreprise..." rows={2} />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={updateCompany.isPending}>
                {updateCompany.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
