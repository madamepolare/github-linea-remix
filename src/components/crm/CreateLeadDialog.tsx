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
import { useLeads, Pipeline } from "@/hooks/useLeads";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";

const schema = z.object({
  title: z.string().min(2, "Le titre doit contenir au moins 2 caractères"),
  crm_company_id: z.string().optional(),
  stage_id: z.string().optional(),
  estimated_value: z.string().optional(),
  source: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline?: Pipeline;
}

export function CreateLeadDialog({ open, onOpenChange, pipeline }: CreateLeadDialogProps) {
  const { createLead } = useLeads();
  const { companies } = useCRMCompanies();
  const stages = pipeline?.stages || [];

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
      title: "", 
      crm_company_id: "", 
      stage_id: stages[0]?.id || "", 
      estimated_value: "", 
      source: "",
      description: "" 
    },
  });

  const onSubmit = async (data: FormData) => {
    await createLead.mutateAsync({
      title: data.title,
      crm_company_id: data.crm_company_id || undefined,
      pipeline_id: pipeline?.id,
      stage_id: data.stage_id || stages[0]?.id,
      estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : undefined,
      source: data.source || undefined,
      description: data.description || undefined,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle Opportunité</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input {...form.register("title")} placeholder="Ex: Projet Villa Moderne" />
            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
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
          <div className="grid grid-cols-2 gap-4">
            {stages.length > 0 && (
              <div className="space-y-2">
                <Label>Étape</Label>
                <Select value={form.watch("stage_id")} onValueChange={(v) => form.setValue("stage_id", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Valeur estimée (€)</Label>
              <Input {...form.register("estimated_value")} type="number" placeholder="50000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <Select value={form.watch("source")} onValueChange={(v) => form.setValue("source", v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="referral">Recommandation</SelectItem>
                <SelectItem value="website">Site web</SelectItem>
                <SelectItem value="network">Réseau</SelectItem>
                <SelectItem value="tender">Appel d'offres</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} placeholder="Notes sur l'opportunité..." rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
