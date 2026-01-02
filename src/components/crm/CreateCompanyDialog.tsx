import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X, ChevronDown } from "lucide-react";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { COMPANY_CATEGORIES, COMPANY_TYPE_CONFIG, CompanyCategory, CompanyType, BET_SPECIALTIES } from "@/lib/crmTypes";
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
  billing_email: z.string().email("Email invalide").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// BET_SPECIALTIES is now imported from crmTypes.ts

export function CreateCompanyDialog({ open, onOpenChange }: CreateCompanyDialogProps) {
  const { createCompany } = useCRMCompanies();
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CompanyCategory | "">("");
  const [sameAsBilling, setSameAsBilling] = useState(true);

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
      billing_email: "",
      notes: "",
    },
  });

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
    await createCompany.mutateAsync({
      name: data.name,
      industry: data.industry || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      website: data.website || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      postal_code: data.postal_code || undefined,
      billing_email: sameAsBilling ? data.email || undefined : data.billing_email || undefined,
      notes: data.notes || undefined,
      bet_specialties: isBET && selectedSpecialties.length > 0 ? selectedSpecialties : undefined,
    });
    form.reset();
    setSelectedSpecialties([]);
    setSelectedCategory("");
    setSameAsBilling(true);
    onOpenChange(false);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedSpecialties([]);
      setSelectedCategory("");
      setSameAsBilling(true);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col min-h-0">
        <DialogHeader>
          <DialogTitle>Nouvelle entreprise</DialogTitle>
          <DialogDescription>Ajoutez une nouvelle entreprise à votre CRM</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
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
                    form.setValue("industry", ""); // Reset type when category changes
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
                    value={form.watch("industry")}
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
                            const specialty = BET_SPECIALTIES.find((s) => s.value === spec);
                            return (
                              <Badge
                                key={spec}
                                className={cn("text-white text-xs gap-1", specialty?.color)}
                              >
                                {specialty?.label}
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
                    {BET_SPECIALTIES.map((spec) => (
                      <DropdownMenuCheckboxItem
                        key={spec.value}
                        checked={selectedSpecialties.includes(spec.value)}
                        onCheckedChange={() => toggleSpecialty(spec.value)}
                      >
                        <Badge className={cn("text-white text-xs mr-2", spec.color)}>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input {...form.register("postal_code")} placeholder="75001" />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input {...form.register("city")} placeholder="Paris" />
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
              <Button type="submit" disabled={createCompany.isPending}>
                {createCompany.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Créer
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
