import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useContacts, Contact } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { CONTACT_TYPES } from "@/lib/crmTypes";

const schema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().optional(),
  contact_type: z.string().optional(),
  crm_company_id: z.string().optional(),
  location: z.string().optional(),
  avatar_url: z.string().optional(),
  notes: z.string().optional(),
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

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
      name: "", 
      email: "", 
      phone: "", 
      role: "", 
      contact_type: "client",
      crm_company_id: "",
      location: "",
      avatar_url: "",
      notes: "",
    },
  });

  // Pre-fill form when contact changes
  useEffect(() => {
    if (contact) {
      form.reset({
        name: contact.name || "",
        email: contact.email || "",
        phone: contact.phone || "",
        role: contact.role || "",
        contact_type: contact.contact_type || "client",
        crm_company_id: contact.crm_company_id || "",
        location: contact.location || "",
        avatar_url: contact.avatar_url || "",
        notes: contact.notes || "",
      });
    }
  }, [contact, form]);

  const onSubmit = async (data: FormData) => {
    if (!contact) return;
    
    await updateContact.mutateAsync({
      id: contact.id,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      role: data.role || null,
      contact_type: data.contact_type || null,
      crm_company_id: data.crm_company_id || null,
      location: data.location || null,
      avatar_url: data.avatar_url || null,
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
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input {...form.register("name")} placeholder="Jean Dupont" />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
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
                  {CONTACT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {companies.length > 0 && (
            <div className="space-y-2">
              <Label>Entreprise</Label>
              <Select 
                value={form.watch("crm_company_id") || ""} 
                onValueChange={(v) => form.setValue("crm_company_id", v)}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Localisation</Label>
            <Input {...form.register("location")} placeholder="Paris, France" />
          </div>

          <div className="space-y-2">
            <Label>URL de l'avatar</Label>
            <Input {...form.register("avatar_url")} placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...form.register("notes")} placeholder="Notes internes..." rows={3} />
          </div>

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
