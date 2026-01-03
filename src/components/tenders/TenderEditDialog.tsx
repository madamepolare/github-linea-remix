import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tender, ProcedureType, JointVentureType } from "@/lib/tenderTypes";
import { 
  PROCEDURE_TYPE_LABELS, 
  JOINT_VENTURE_TYPE_LABELS,
  CLIENT_TYPES,
  WORK_NATURE_TAGS,
} from "@/lib/tenderTypes";
import { X } from "lucide-react";

interface TenderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tender: Tender;
  onSave: (updates: Partial<Tender>) => void;
}

export function TenderEditDialog({ open, onOpenChange, tender, onSave }: TenderEditDialogProps) {
  const [formData, setFormData] = useState<Partial<Tender>>({});
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (open) {
      setFormData({
        // Market identification
        reference: tender.reference,
        consultation_number: tender.consultation_number,
        group_code: tender.group_code,
        title: tender.title,
        description: tender.description,
        market_object: tender.market_object,
        // Client
        client_name: tender.client_name,
        client_type: tender.client_type,
        client_direction: tender.client_direction,
        client_address: tender.client_address,
        client_contact_name: tender.client_contact_name,
        client_contact_phone: tender.client_contact_phone,
        client_contact_email: tender.client_contact_email,
        contracting_authority: tender.contracting_authority,
        // Project
        location: tender.location,
        region: tender.region,
        surface_area: tender.surface_area,
        estimated_budget: tender.estimated_budget,
        budget_disclosed: tender.budget_disclosed,
        work_nature_tags: tender.work_nature_tags || [],
        // Procedure
        procedure_type: tender.procedure_type,
        allows_joint_venture: tender.allows_joint_venture,
        joint_venture_type: tender.joint_venture_type,
        mandataire_must_be_solidary: tender.mandataire_must_be_solidary,
        allows_variants: tender.allows_variants,
        allows_negotiation: tender.allows_negotiation,
        negotiation_candidates_count: tender.negotiation_candidates_count,
        negotiation_method: tender.negotiation_method,
        offer_validity_days: tender.offer_validity_days,
        // Dates
        submission_deadline: tender.submission_deadline?.slice(0, 16),
        site_visit_required: tender.site_visit_required,
        site_visit_date: tender.site_visit_date?.slice(0, 16),
        site_visit_contact_name: tender.site_visit_contact_name,
        site_visit_contact_phone: tender.site_visit_contact_phone,
        site_visit_contact_email: tender.site_visit_contact_email,
        jury_date: tender.jury_date?.slice(0, 16),
        results_date: tender.results_date?.slice(0, 10),
        questions_deadline_days: tender.questions_deadline_days,
        // Source
        source_platform: tender.source_platform,
        source_url: tender.source_url,
        source_contact_email: tender.source_contact_email,
      });
      setActiveTab("general");
    }
  }, [open, tender]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const addTag = (tag: string) => {
    const currentTags = formData.work_nature_tags || [];
    if (!currentTags.includes(tag)) {
      setFormData({ ...formData, work_nature_tags: [...currentTags, tag] });
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = formData.work_nature_tags || [];
    setFormData({ ...formData, work_nature_tags: currentTags.filter(t => t !== tag) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le concours</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="client">Client</TabsTrigger>
            <TabsTrigger value="project">Projet</TabsTrigger>
            <TabsTrigger value="procedure">Procédure</TabsTrigger>
            <TabsTrigger value="dates">Dates</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Référence *</Label>
                <Input
                  value={formData.reference || ""}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>N° consultation</Label>
                <Input
                  value={formData.consultation_number || ""}
                  onChange={(e) => setFormData({ ...formData, consultation_number: e.target.value })}
                  placeholder="Ex: 2M2DTC"
                />
              </div>
              <div className="space-y-2">
                <Label>Code groupe</Label>
                <Input
                  value={formData.group_code || ""}
                  onChange={(e) => setFormData({ ...formData, group_code: e.target.value })}
                  placeholder="Ex: 048021"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Titre *</Label>
              <Textarea
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Objet du marché</Label>
              <Textarea
                value={formData.market_object || ""}
                onChange={(e) => setFormData({ ...formData, market_object: e.target.value })}
                rows={3}
                placeholder="Description complète de l'objet du marché..."
              />
            </div>

            <div className="space-y-2">
              <Label>Description / Notes internes</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plateforme source</Label>
                <Input
                  value={formData.source_platform || ""}
                  onChange={(e) => setFormData({ ...formData, source_platform: e.target.value })}
                  placeholder="AWS, BOAMP, G360..."
                />
              </div>
              <div className="space-y-2">
                <Label>URL source</Label>
                <Input
                  value={formData.source_url || ""}
                  onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="client" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maître d'ouvrage</Label>
                <Input
                  value={formData.client_name || ""}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type de client</Label>
                <Select
                  value={formData.client_type || ""}
                  onValueChange={(v) => setFormData({ ...formData, client_type: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    {CLIENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Direction</Label>
                <Input
                  value={formData.client_direction || ""}
                  onChange={(e) => setFormData({ ...formData, client_direction: e.target.value })}
                  placeholder="Ex: Direction territoriale Centre"
                />
              </div>
              <div className="space-y-2">
                <Label>Pouvoir adjudicateur</Label>
                <Input
                  value={formData.contracting_authority || ""}
                  onChange={(e) => setFormData({ ...formData, contracting_authority: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adresse du client</Label>
              <Input
                value={formData.client_address || ""}
                onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <Label className="mb-3 block">Contact MOA</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Nom</Label>
                  <Input
                    value={formData.client_contact_name || ""}
                    onChange={(e) => setFormData({ ...formData, client_contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Téléphone</Label>
                  <Input
                    value={formData.client_contact_phone || ""}
                    onChange={(e) => setFormData({ ...formData, client_contact_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={formData.client_contact_email || ""}
                    onChange={(e) => setFormData({ ...formData, client_contact_email: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="project" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Localisation</Label>
                <Input
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Adresse du projet"
                />
              </div>
              <div className="space-y-2">
                <Label>Région</Label>
                <Input
                  value={formData.region || ""}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Surface (m²)</Label>
                <Input
                  type="number"
                  value={formData.surface_area || ""}
                  onChange={(e) => setFormData({ ...formData, surface_area: parseFloat(e.target.value) || null })}
                />
              </div>
              <div className="space-y-2">
                <Label>Budget estimé (€)</Label>
                <Input
                  type="number"
                  value={formData.estimated_budget || ""}
                  onChange={(e) => setFormData({ ...formData, estimated_budget: parseFloat(e.target.value) || null })}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <Switch
                  checked={formData.budget_disclosed || false}
                  onCheckedChange={(v) => setFormData({ ...formData, budget_disclosed: v })}
                />
                <Label>Budget affiché</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nature des travaux</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.work_nature_tags || []).map(tag => (
                  <Badge key={tag} variant="secondary" className="pr-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-1 hover:bg-muted rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {WORK_NATURE_TAGS.filter(tag => !(formData.work_nature_tags || []).includes(tag)).map(tag => (
                  <Button 
                    key={tag} 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => addTag(tag)}
                  >
                    + {tag}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="procedure" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de procédure</Label>
                <Select
                  value={formData.procedure_type || ""}
                  onValueChange={(v) => setFormData({ ...formData, procedure_type: v as ProcedureType })}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROCEDURE_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Validité des offres (jours)</Label>
                <Input
                  type="number"
                  value={formData.offer_validity_days || ""}
                  onChange={(e) => setFormData({ ...formData, offer_validity_days: parseInt(e.target.value) || null })}
                  placeholder="180"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Groupement autorisé</Label>
                  <Switch
                    checked={formData.allows_joint_venture ?? true}
                    onCheckedChange={(v) => setFormData({ ...formData, allows_joint_venture: v })}
                  />
                </div>
                {formData.allows_joint_venture && (
                  <div className="space-y-2 pl-4 border-l-2">
                    <Label className="text-xs">Type de groupement</Label>
                    <Select
                      value={formData.joint_venture_type || ""}
                      onValueChange={(v) => setFormData({ ...formData, joint_venture_type: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(JOINT_VENTURE_TYPE_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        checked={formData.mandataire_must_be_solidary || false}
                        onCheckedChange={(v) => setFormData({ ...formData, mandataire_must_be_solidary: v })}
                      />
                      <Label className="text-xs">Mandataire solidaire obligatoire</Label>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Variantes autorisées</Label>
                  <Switch
                    checked={formData.allows_variants || false}
                    onCheckedChange={(v) => setFormData({ ...formData, allows_variants: v })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <Label>Négociation prévue</Label>
                <Switch
                  checked={formData.allows_negotiation || false}
                  onCheckedChange={(v) => setFormData({ ...formData, allows_negotiation: v })}
                />
              </div>
              {formData.allows_negotiation && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Nombre de candidats</Label>
                    <Input
                      type="number"
                      value={formData.negotiation_candidates_count || ""}
                      onChange={(e) => setFormData({ ...formData, negotiation_candidates_count: parseInt(e.target.value) || null })}
                      placeholder="3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Méthode</Label>
                    <Input
                      value={formData.negotiation_method || ""}
                      onChange={(e) => setFormData({ ...formData, negotiation_method: e.target.value })}
                      placeholder="Par plateforme, réunion..."
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dates" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date limite de dépôt *</Label>
                <Input
                  type="datetime-local"
                  value={formData.submission_deadline || ""}
                  onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Délai pour questions (jours avant deadline)</Label>
                <Input
                  type="number"
                  value={formData.questions_deadline_days || ""}
                  onChange={(e) => setFormData({ ...formData, questions_deadline_days: parseInt(e.target.value) || null })}
                  placeholder="4"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <Label>Visite de site obligatoire</Label>
                <Switch
                  checked={formData.site_visit_required || false}
                  onCheckedChange={(v) => setFormData({ ...formData, site_visit_required: v })}
                />
              </div>
              {formData.site_visit_required && (
                <div className="space-y-4 pl-4 border-l-2">
                  <div className="space-y-2">
                    <Label>Date de visite</Label>
                    <Input
                      type="datetime-local"
                      value={formData.site_visit_date || ""}
                      onChange={(e) => setFormData({ ...formData, site_visit_date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Contact visite - Nom</Label>
                      <Input
                        value={formData.site_visit_contact_name || ""}
                        onChange={(e) => setFormData({ ...formData, site_visit_contact_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Téléphone</Label>
                      <Input
                        value={formData.site_visit_contact_phone || ""}
                        onChange={(e) => setFormData({ ...formData, site_visit_contact_phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={formData.site_visit_contact_email || ""}
                        onChange={(e) => setFormData({ ...formData, site_visit_contact_email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date du jury</Label>
                <Input
                  type="datetime-local"
                  value={formData.jury_date || ""}
                  onChange={(e) => setFormData({ ...formData, jury_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date des résultats</Label>
                <Input
                  type="date"
                  value={formData.results_date || ""}
                  onChange={(e) => setFormData({ ...formData, results_date: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
