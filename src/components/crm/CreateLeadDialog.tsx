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
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";

const schema = z.object({
  title: z.string().min(2, "Le titre doit contenir au moins 2 caractères"),
  crm_company_id: z.string().optional(),
  contact_id: z.string().optional(),
  stage_id: z.string().optional(),
  estimated_value: z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
  source: z.string().optional(),
  next_action: z.string().optional(),
  next_action_date: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type PipelineStageLike = { id: string; name: string; color: string | null; probability?: number | null };

type PipelineLike = { id: string; name: string; stages?: PipelineStageLike[] };

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline?: PipelineLike | null;
  defaultStageId?: string;
}

const SOURCES = [
  { value: "referral", label: "Recommandation" },
  { value: "website", label: "Site web" },
  { value: "network", label: "Réseau professionnel" },
  { value: "tender", label: "Appel d'offres" },
  { value: "direct", label: "Contact direct" },
  { value: "social", label: "Réseaux sociaux" },
  { value: "event", label: "Événement / Salon" },
  { value: "cold", label: "Prospection" },
];

export function CreateLeadDialog({ open, onOpenChange, pipeline, defaultStageId }: CreateLeadDialogProps) {
  const { createLead } = useLeads();
  const { companies } = useCRMCompanies();
  const { contacts } = useContacts();
  const stages = pipeline?.stages || [];

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
      title: "", 
      crm_company_id: "", 
      contact_id: "",
      stage_id: defaultStageId || stages[0]?.id || "", 
      estimated_value: "", 
      probability: 50,
      source: "",
      next_action: "",
      next_action_date: "",
      description: "" 
    },
  });

  // Update stage_id when defaultStageId changes
  useEffect(() => {
    if (defaultStageId) {
      form.setValue("stage_id", defaultStageId);
    }
  }, [defaultStageId, form]);

  const selectedCompanyId = form.watch("crm_company_id");
  const probability = form.watch("probability") || 50;

  // Filter contacts by selected company
  const filteredContacts = selectedCompanyId 
    ? contacts.filter(c => c.crm_company_id === selectedCompanyId)
    : contacts;

  const onSubmit = async (data: FormData) => {
    await createLead.mutateAsync({
      title: data.title,
      crm_company_id: data.crm_company_id || undefined,
      contact_id: data.contact_id || undefined,
      pipeline_id: pipeline?.id,
      stage_id: data.stage_id || stages[0]?.id,
      estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : undefined,
      probability: data.probability,
      source: data.source || undefined,
      next_action: data.next_action || undefined,
      next_action_date: data.next_action_date || undefined,
      description: data.description || undefined,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle Opportunité</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>Titre du projet *</Label>
            <Input {...form.register("title")} placeholder="Ex: Résidence Les Cèdres - Lot Structure" />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Company & Contact */}
          <div className="grid grid-cols-2 gap-4">
            {companies.length > 0 && (
              <div className="space-y-2">
                <Label>Maître d'ouvrage</Label>
                <Select 
                  value={form.watch("crm_company_id")} 
                  onValueChange={(v) => {
                    form.setValue("crm_company_id", v);
                    form.setValue("contact_id", ""); // Reset contact when company changes
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {filteredContacts.length > 0 && (
              <div className="space-y-2">
                <Label>Contact principal</Label>
                <Select 
                  value={form.watch("contact_id")} 
                  onValueChange={(v) => form.setValue("contact_id", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    {filteredContacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.role && <span className="text-muted-foreground ml-1">- {c.role}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Stage & Value */}
          <div className="grid grid-cols-2 gap-4">
            {stages.length > 0 && (
              <div className="space-y-2">
                <Label>Étape</Label>
                <Select value={form.watch("stage_id")} onValueChange={(v) => form.setValue("stage_id", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: s.color || "#6366f1" }} 
                          />
                          {s.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Valeur estimée (€)</Label>
              <Input {...form.register("estimated_value")} type="number" placeholder="150000" />
            </div>
          </div>

          {/* Probability Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Probabilité de succès</Label>
              <span className="text-sm font-medium">{probability}%</span>
            </div>
            <Slider
              value={[probability]}
              onValueChange={([value]) => form.setValue("probability", value)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label>Source</Label>
            <Select value={form.watch("source")} onValueChange={(v) => form.setValue("source", v)}>
              <SelectTrigger><SelectValue placeholder="Comment avez-vous obtenu ce lead ?" /></SelectTrigger>
              <SelectContent>
                {SOURCES.map((source) => (
                  <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Next Action */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prochaine action</Label>
              <Input {...form.register("next_action")} placeholder="Envoyer la proposition" />
            </div>
            <div className="space-y-2">
              <Label>Date prévue</Label>
              <Input {...form.register("next_action_date")} type="date" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description / Notes</Label>
            <Textarea 
              {...form.register("description")} 
              placeholder="Détails du projet, contexte, enjeux..." 
              rows={3} 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Créer l'opportunité
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
