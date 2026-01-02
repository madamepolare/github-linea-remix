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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X } from "lucide-react";
import { useCRMCompanies, CRMCompanyEnriched } from "@/hooks/useCRMCompanies";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
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

interface EditCompanyDialogProps {
  company: CRMCompanyEnriched | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BET_SPECIALTIES = [
  { value: "structure", label: "Structure" },
  { value: "fluides", label: "Fluides" },
  { value: "electricite", label: "Électricité" },
  { value: "thermique", label: "Thermique" },
  { value: "acoustique", label: "Acoustique" },
  { value: "vrd", label: "VRD" },
  { value: "economie", label: "Économie" },
  { value: "facade", label: "Façade" },
  { value: "paysage", label: "Paysage" },
  { value: "securite", label: "Sécurité incendie" },
  { value: "geotechnique", label: "Géotechnique" },
];

export function EditCompanyDialog({ company, open, onOpenChange }: EditCompanyDialogProps) {
  const { updateCompany } = useCRMCompanies();
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
      name: "", 
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

  // Pre-fill form when company changes
  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name || "",
        industry: company.industry || "",
        email: company.email || "",
        phone: company.phone || "",
        website: company.website || "",
        address: company.address || "",
        city: company.city || "",
        postal_code: company.postal_code || "",
        billing_email: company.billing_email || "",
        notes: company.notes || "",
      });
      setSelectedSpecialties(company.bet_specialties || []);
    }
  }, [company, form]);

  const industry = form.watch("industry");
  const isBET = industry === "bet";

  const toggleSpecialty = (value: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(value) 
        ? prev.filter(s => s !== value)
        : [...prev, value]
    );
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
      billing_email: data.billing_email || null,
      notes: data.notes || null,
      bet_specialties: isBET && selectedSpecialties.length > 0 ? selectedSpecialties : null,
    });
    onOpenChange(false);
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'entreprise</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input {...form.register("name")} placeholder="Nom de l'entreprise" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.watch("industry") || ""} onValueChange={(v) => form.setValue("industry", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="maitre_ouvrage">Maître d'ouvrage</SelectItem>
                  <SelectItem value="moe">Maître d'œuvre</SelectItem>
                  <SelectItem value="bet">Bureau d'études (BET)</SelectItem>
                  <SelectItem value="entreprise">Entreprise générale</SelectItem>
                  <SelectItem value="fournisseur">Fournisseur</SelectItem>
                  <SelectItem value="partenaire">Partenaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* BET Specialties */}
          {isBET && (
            <div className="space-y-2">
              <Label>Spécialités BET</Label>
              <div className="flex flex-wrap gap-1.5">
                {BET_SPECIALTIES.map((spec) => (
                  <Badge
                    key={spec.value}
                    variant={selectedSpecialties.includes(spec.value) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedSpecialties.includes(spec.value) && "bg-primary"
                    )}
                    onClick={() => toggleSpecialty(spec.value)}
                  >
                    {spec.label}
                    {selectedSpecialties.includes(spec.value) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...form.register("email")} type="email" placeholder="contact@exemple.fr" />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input {...form.register("phone")} placeholder="+33 1 23 45 67 89" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Site web</Label>
            <Input {...form.register("website")} placeholder="https://www.exemple.fr" />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input {...form.register("address")} placeholder="123 rue de l'Architecture" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input {...form.register("city")} placeholder="Paris" />
            </div>
            <div className="space-y-2">
              <Label>Code postal</Label>
              <Input {...form.register("postal_code")} placeholder="75001" />
            </div>
          </div>

          {/* Billing */}
          <div className="space-y-2">
            <Label>Email de facturation</Label>
            <Input {...form.register("billing_email")} type="email" placeholder="facturation@exemple.fr" />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...form.register("notes")} placeholder="Notes internes..." rows={2} />
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
      </DialogContent>
    </Dialog>
  );
}
