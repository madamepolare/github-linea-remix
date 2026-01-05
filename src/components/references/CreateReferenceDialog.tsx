import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useReferences, CreateReferenceInput } from "@/hooks/useReferences";
import { useProjects } from "@/hooks/useProjects";

interface CreateReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROJECT_TYPES = [
  { value: "architecture", label: "Architecture" },
  { value: "interior", label: "Design d'intérieur" },
  { value: "scenography", label: "Scénographie" },
  { value: "urban", label: "Urbanisme" },
  { value: "landscape", label: "Paysage" },
];

const CLIENT_TYPES = [
  { value: "prive", label: "Privé" },
  { value: "public", label: "Public" },
  { value: "promoteur", label: "Promoteur" },
  { value: "association", label: "Association" },
];

export function CreateReferenceDialog({ open, onOpenChange }: CreateReferenceDialogProps) {
  const navigate = useNavigate();
  const { createReference } = useReferences();
  const { projects } = useProjects();

  const [formData, setFormData] = useState<Partial<CreateReferenceInput>>({
    title: "",
    project_type: "architecture",
    is_featured: false,
    is_public: true,
    awards: [],
    press_mentions: [],
    collaborators: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) return;

    const result = await createReference.mutateAsync(formData as CreateReferenceInput);
    onOpenChange(false);
    navigate(`/references/${result.id}`);
  };

  const updateField = <K extends keyof CreateReferenceInput>(
    field: K,
    value: CreateReferenceInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle référence</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Link to existing project */}
          <div className="space-y-2">
            <Label>Lier à un projet existant (optionnel)</Label>
            <Select
              value={formData.project_id || ""}
              onValueChange={(v) => {
                updateField("project_id", v || null);
                // Auto-fill from project
                const project = projects.find((p) => p.id === v);
                if (project) {
                  updateField("title", project.name);
                  updateField("location", project.city || "");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un projet..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Nom du projet"
              required
            />
          </div>

          {/* Project Type & Client Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de projet</Label>
              <Select
                value={formData.project_type || ""}
                onValueChange={(v) => updateField("project_type", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type de client</Label>
              <Select
                value={formData.client_type || ""}
                onValueChange={(v) => updateField("client_type", v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="client_name">Nom du client</Label>
            <Input
              id="client_name"
              value={formData.client_name || ""}
              onChange={(e) => updateField("client_name", e.target.value)}
              placeholder="Nom du maître d'ouvrage"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                value={formData.location || ""}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Ville"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completion_date">Date de livraison</Label>
              <Input
                id="completion_date"
                type="date"
                value={formData.completion_date || ""}
                onChange={(e) => updateField("completion_date", e.target.value)}
              />
            </div>
          </div>

          {/* Surface & Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surface">Surface (m²)</Label>
              <Input
                id="surface"
                type="number"
                value={formData.surface_m2 || ""}
                onChange={(e) => updateField("surface_m2", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="150"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget indicatif</Label>
              <Input
                id="budget"
                value={formData.budget_range || ""}
                onChange={(e) => updateField("budget_range", e.target.value)}
                placeholder="ex: 500k€ - 1M€"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Description du projet..."
              rows={3}
            />
          </div>

          {/* Options */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2">
              <Switch
                id="featured"
                checked={formData.is_featured}
                onCheckedChange={(v) => updateField("is_featured", v)}
              />
              <Label htmlFor="featured" className="text-sm">Mettre à la une</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="public"
                checked={formData.is_public}
                onCheckedChange={(v) => updateField("is_public", v)}
              />
              <Label htmlFor="public" className="text-sm">Publique</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createReference.isPending || !formData.title}>
              {createReference.isPending ? "Création..." : "Créer la référence"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
