import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";

const schema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  industry: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCompanyDialog({ open, onOpenChange }: CreateCompanyDialogProps) {
  const { createCompany } = useCRMCompanies();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", industry: "", email: "", phone: "", city: "", postal_code: "" },
  });

  const onSubmit = async (data: FormData) => {
    await createCompany.mutateAsync({
      name: data.name,
      industry: data.industry || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      city: data.city || undefined,
      postal_code: data.postal_code || undefined,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle Entreprise</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input {...form.register("name")} placeholder="Nom de l'entreprise" />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.watch("industry")} onValueChange={(v) => form.setValue("industry", v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="maitre_ouvrage">Maître d'ouvrage</SelectItem>
                <SelectItem value="bet">BET</SelectItem>
                <SelectItem value="entreprise">Entreprise</SelectItem>
                <SelectItem value="fournisseur">Fournisseur</SelectItem>
                <SelectItem value="partenaire">Partenaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={createCompany.isPending}>
              {createCompany.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
