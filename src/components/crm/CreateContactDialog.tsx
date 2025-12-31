import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";

const schema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().optional(),
  contact_type: z.string().optional(),
  crm_company_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContactDialog({ open, onOpenChange }: CreateContactDialogProps) {
  const { createContact } = useContacts();
  const { companies } = useCRMCompanies();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", role: "", contact_type: "client" },
  });

  const onSubmit = async (data: FormData) => {
    await createContact.mutateAsync({
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      role: data.role || undefined,
      contact_type: data.contact_type || undefined,
      crm_company_id: data.crm_company_id || undefined,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input {...form.register("name")} placeholder="Jean Dupont" />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fonction</Label>
              <Input {...form.register("role")} placeholder="Directeur" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.watch("contact_type")} onValueChange={(v) => form.setValue("contact_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="partner">Partenaire</SelectItem>
                  <SelectItem value="supplier">Fournisseur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {companies.length > 0 && (
            <div className="space-y-2">
              <Label>Entreprise</Label>
              <Select value={form.watch("crm_company_id")} onValueChange={(v) => form.setValue("crm_company_id", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={createContact.isPending}>
              {createContact.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
