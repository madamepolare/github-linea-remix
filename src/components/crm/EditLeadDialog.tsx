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
import { useLeads, Lead, usePipelines } from "@/hooks/useLeads";
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

interface EditLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function EditLeadDialog({ lead, open, onOpenChange }: EditLeadDialogProps) {
  const { updateLead } = useLeads();
  const { pipelines } = usePipelines();
  const { companies } = useCRMCompanies();
  const { contacts } = useContacts();

  // Find the pipeline stages for this lead
  const pipeline = pipelines.find(p => p.id === lead?.pipeline_id);
  const stages = pipeline?.stages || [];

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
      title: "", 
      crm_company_id: "", 
      contact_id: "",
      stage_id: "", 
      estimated_value: "", 
      probability: 50,
      source: "",
      next_action: "",
      next_action_date: "",
      description: "" 
    },
  });

  // Pre-fill form when lead changes
  useEffect(() => {
    if (lead) {
      form.reset({
        title: lead.title || "",
        crm_company_id: lead.crm_company_id || "",
        contact_id: lead.contact_id || "",
        stage_id: lead.stage_id || "",
        estimated_value: lead.estimated_value?.toString() || "",
        probability: lead.probability || 50,
        source: lead.source || "",
        next_action: lead.next_action || "",
        next_action_date: lead.next_action_date?.split('T')[0] || "",
        description: lead.description || "",
      });
    }
  }, [lead, form]);

  const selectedCompanyId = form.watch("crm_company_id");
  const probability = form.watch("probability") || 50;

  // Filter contacts by selected company
  const filteredContacts = selectedCompanyId 
    ? contacts.filter(c => c.crm_company_id === selectedCompanyId)
    : contacts;

  const onSubmit = async (data: FormData) => {
    if (!lead) return;

    await updateLead.mutateAsync({
      id: lead.id,
      title: data.title,
      crm_company_id: data.crm_company_id || null,
      contact_id: data.contact_id || null,
      stage_id: data.stage_id || null,
      estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : null,
      probability: data.probability,
      source: data.source || null,
      next_action: data.next_action || null,
      next_action_date: data.next_action_date || null,
      description: data.description || null,
    });
    onOpenChange(false);
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'opportunité</DialogTitle>
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
                  value={form.watch("crm_company_id") || ""} 
                  onValueChange={(v) => {
                    form.setValue("crm_company_id", v);
                    form.setValue("contact_id", "");
                  }}
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
            
            {filteredContacts.length > 0 && (
              <div className="space-y-2">
                <Label>Contact principal</Label>
                <Select 
                  value={form.watch("contact_id") || ""} 
                  onValueChange={(v) => form.setValue("contact_id", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
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
                <Select value={form.watch("stage_id") || ""} onValueChange={(v) => form.setValue("stage_id", v)}>
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
            <Select value={form.watch("source") || ""} onValueChange={(v) => form.setValue("source", v)}>
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
            <Button type="submit" disabled={updateLead.isPending}>
              {updateLead.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
