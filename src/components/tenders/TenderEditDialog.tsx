import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import type { Tender, ProcedureType } from "@/lib/tenderTypes";
import { PROCEDURE_TYPE_LABELS } from "@/lib/tenderTypes";

interface TenderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tender: Tender;
  onSave: (updates: Partial<Tender>) => void;
}

export function TenderEditDialog({ open, onOpenChange, tender, onSave }: TenderEditDialogProps) {
  const [formData, setFormData] = useState<Partial<Tender>>({});

  useEffect(() => {
    if (open) {
      setFormData({
        reference: tender.reference,
        title: tender.title,
        description: tender.description,
        client_name: tender.client_name,
        contracting_authority: tender.contracting_authority,
        location: tender.location,
        region: tender.region,
        estimated_budget: tender.estimated_budget,
        budget_disclosed: tender.budget_disclosed,
        surface_area: tender.surface_area,
        procedure_type: tender.procedure_type,
        submission_deadline: tender.submission_deadline?.slice(0, 16),
        site_visit_required: tender.site_visit_required,
        site_visit_date: tender.site_visit_date?.slice(0, 16),
        jury_date: tender.jury_date?.slice(0, 16),
        results_date: tender.results_date?.slice(0, 10),
        source_platform: tender.source_platform,
        source_url: tender.source_url,
      });
    }
  }, [open, tender]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le concours</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Référence</Label>
              <Input
                value={formData.reference || ""}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Procédure</Label>
              <Select
                value={formData.procedure_type || ""}
                onValueChange={(v) => setFormData({ ...formData, procedure_type: v as ProcedureType })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROCEDURE_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Titre</Label>
            <Textarea
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Maître d'ouvrage</Label>
              <Input
                value={formData.client_name || ""}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Localisation</Label>
              <Input
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
              <Label>Budget estimé (€)</Label>
              <Input
                type="number"
                value={formData.estimated_budget || ""}
                onChange={(e) => setFormData({ ...formData, estimated_budget: parseFloat(e.target.value) || null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Surface (m²)</Label>
              <Input
                type="number"
                value={formData.surface_area || ""}
                onChange={(e) => setFormData({ ...formData, surface_area: parseFloat(e.target.value) || null })}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date limite de dépôt</Label>
              <Input
                type="datetime-local"
                value={formData.submission_deadline || ""}
                onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date du jury</Label>
              <Input
                type="datetime-local"
                value={formData.jury_date || ""}
                onChange={(e) => setFormData({ ...formData, jury_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Switch
                  checked={formData.site_visit_required || false}
                  onCheckedChange={(v) => setFormData({ ...formData, site_visit_required: v })}
                />
                <Label>Visite de site obligatoire</Label>
              </div>
              {formData.site_visit_required && (
                <Input
                  type="datetime-local"
                  value={formData.site_visit_date || ""}
                  onChange={(e) => setFormData({ ...formData, site_visit_date: e.target.value })}
                  placeholder="Date de visite"
                />
              )}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plateforme source</Label>
              <Input
                value={formData.source_platform || ""}
                onChange={(e) => setFormData({ ...formData, source_platform: e.target.value })}
                placeholder="G360, BOAMP..."
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
