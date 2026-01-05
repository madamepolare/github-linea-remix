import { useState } from "react";
import {
  Dialog,
  DialogContent,
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
import { useDesignObjects, useObjectCategories } from "@/hooks/useDesignObjects";
import { Loader2 } from "lucide-react";
import { AutoSourceImageButton } from "./AutoSourceImageButton";

interface CreateObjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateObjectDialog({ open, onOpenChange }: CreateObjectDialogProps) {
  const { data: categories = [] } = useObjectCategories();
  const { createObject } = useDesignObjects();

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    designer: "",
    description: "",
    dimensions: "",
    materials: "",
    price_min: "",
    price_max: "",
    source_url: "",
    source_name: "",
    image_url: "",
    category_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createObject.mutateAsync({
      name: formData.name,
      brand: formData.brand || null,
      designer: formData.designer || null,
      description: formData.description || null,
      dimensions: formData.dimensions || null,
      materials: formData.materials || null,
      price_min: formData.price_min ? parseFloat(formData.price_min) : null,
      price_max: formData.price_max ? parseFloat(formData.price_max) : null,
      currency: "EUR",
      source_url: formData.source_url || null,
      source_name: formData.source_name || null,
      image_url: formData.image_url || null,
      images: null,
      colors: null,
      tags: null,
      is_favorite: false,
      notes: null,
      created_by: null,
      category_id: formData.category_id || null,
    });

    setFormData({
      name: "",
      brand: "",
      designer: "",
      description: "",
      dimensions: "",
      materials: "",
      price_min: "",
      price_max: "",
      source_url: "",
      source_name: "",
      image_url: "",
      category_id: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un objet</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Chaise Eames DSW"
                required
              />
            </div>

            <div>
              <Label htmlFor="brand">Marque</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))}
                placeholder="Ex: Vitra"
              />
            </div>

            <div>
              <Label htmlFor="designer">Designer</Label>
              <Input
                id="designer"
                value={formData.designer}
                onChange={(e) => setFormData((p) => ({ ...p, designer: e.target.value }))}
                placeholder="Ex: Charles & Ray Eames"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={formData.category_id}
                onValueChange={(v) => setFormData((p) => ({ ...p, category_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description de l'objet..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                value={formData.dimensions}
                onChange={(e) => setFormData((p) => ({ ...p, dimensions: e.target.value }))}
                placeholder="Ex: L45 x P50 x H83 cm"
              />
            </div>

            <div>
              <Label htmlFor="materials">Matériaux</Label>
              <Input
                id="materials"
                value={formData.materials}
                onChange={(e) => setFormData((p) => ({ ...p, materials: e.target.value }))}
                placeholder="Ex: Bois, plastique ABS"
              />
            </div>

            <div>
              <Label htmlFor="price_min">Prix minimum (€)</Label>
              <Input
                id="price_min"
                type="number"
                value={formData.price_min}
                onChange={(e) => setFormData((p) => ({ ...p, price_min: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="price_max">Prix maximum (€)</Label>
              <Input
                id="price_max"
                type="number"
                value={formData.price_max}
                onChange={(e) => setFormData((p) => ({ ...p, price_max: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="source_name">Source / Fournisseur</Label>
              <Input
                id="source_name"
                value={formData.source_name}
                onChange={(e) => setFormData((p) => ({ ...p, source_name: e.target.value }))}
                placeholder="Ex: Made In Design, Voltex..."
              />
            </div>

            <div>
              <Label htmlFor="source_url">URL source</Label>
              <Input
                id="source_url"
                type="url"
                value={formData.source_url}
                onChange={(e) => setFormData((p) => ({ ...p, source_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="image_url">URL de l'image</Label>
              <div className="flex gap-2">
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData((p) => ({ ...p, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="flex-1"
                />
                <AutoSourceImageButton
                  name={formData.name}
                  brand={formData.brand}
                  designer={formData.designer}
                  description={formData.description}
                  onImageFound={(url) => setFormData((p) => ({ ...p, image_url: url }))}
                />
              </div>
              {formData.image_url && (
                <div className="mt-2 h-32 w-32 rounded-lg border bg-muted overflow-hidden">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createObject.isPending}>
              {createObject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer l'objet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
