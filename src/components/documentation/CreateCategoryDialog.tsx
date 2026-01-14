import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useDocumentationCategories } from "@/hooks/useDocumentation";
import { Briefcase, Layers, Users, CheckSquare, Wrench, FileText } from "lucide-react";

const ICONS = [
  { value: "agency", label: "Agence", icon: Briefcase },
  { value: "projects", label: "Projets", icon: Layers },
  { value: "roles", label: "Rôles", icon: Users },
  { value: "checklists", label: "Checklists", icon: CheckSquare },
  { value: "tools", label: "Outils", icon: Wrench },
  { value: "default", label: "Document", icon: FileText },
];

const COLORS = [
  { value: "primary", label: "Principal", class: "bg-primary" },
  { value: "info", label: "Info", class: "bg-info" },
  { value: "success", label: "Succès", class: "bg-success" },
  { value: "warning", label: "Attention", class: "bg-warning" },
  { value: "destructive", label: "Urgent", class: "bg-destructive" },
  { value: "accent", label: "Accent", class: "bg-accent" },
];

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCategoryDialog({ open, onOpenChange }: CreateCategoryDialogProps) {
  const { categories, createCategory } = useDocumentationCategories();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("default");
  const [color, setColor] = useState("primary");
  const [parentId, setParentId] = useState<string>("");

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createCategory.mutateAsync({
        name: name.trim(),
        slug: generateSlug(name),
        description: description.trim() || undefined,
        icon,
        color,
        parent_id: parentId || undefined,
      });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setIcon("default");
    setColor("primary");
    setParentId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle catégorie</DialogTitle>
          <DialogDescription>
            Créez une catégorie pour organiser vos pages de documentation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la catégorie *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Vie d'agence, Workflows projet..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le contenu de cette catégorie..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icône</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <div className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${item.class}`} />
                        <span>{item.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>Catégorie parente (optionnel)</Label>
              <Select value={parentId || "__none__"} onValueChange={(v) => setParentId(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucune (racine)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucune (racine)</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createCategory.isPending || !name.trim()}>
              {createCategory.isPending ? "Création..." : "Créer la catégorie"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
