import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink,
  Heart,
  Pencil,
  Save,
  X,
  Armchair,
} from "lucide-react";
import { DesignObject, useDesignObjects, useObjectCategories } from "@/hooks/useDesignObjects";
import { cn } from "@/lib/utils";
import { AutoSourceImageButton } from "./AutoSourceImageButton";

interface ObjectDetailSheetProps {
  object: DesignObject | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ObjectDetailSheet({ object, open, onOpenChange }: ObjectDetailSheetProps) {
  const { data: categories = [] } = useObjectCategories();
  const { updateObject, toggleFavorite } = useDesignObjects();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<DesignObject>>({});

  useEffect(() => {
    if (object) {
      setFormData(object);
    }
  }, [object]);

  if (!object) return null;

  const formatPrice = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return null;
    const formatter = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 0,
    });
    if (min && max && min !== max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    }
    return formatter.format(min || max || 0);
  };

  const handleSave = async () => {
    await updateObject.mutateAsync({
      id: object.id,
      name: formData.name,
      brand: formData.brand,
      designer: formData.designer,
      description: formData.description,
      dimensions: formData.dimensions,
      materials: formData.materials,
      price_min: formData.price_min,
      price_max: formData.price_max,
      source_url: formData.source_url,
      source_name: formData.source_name,
      image_url: formData.image_url,
      category_id: formData.category_id,
    });
    setIsEditing(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <SheetTitle className="text-xl">{object.name}</SheetTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavorite.mutate({ id: object.id, isFavorite: !object.is_favorite })}
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    object.is_favorite && "fill-red-500 text-red-500"
                  )}
                />
              </Button>
              {isEditing ? (
                <>
                  <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                  <Button size="icon" onClick={handleSave} disabled={updateObject.isPending}>
                    <Save className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="aspect-square rounded-lg bg-muted overflow-hidden">
            {isEditing ? (
              <div className="p-4 space-y-2">
                <Label>URL de l'image</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.image_url || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, image_url: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <AutoSourceImageButton
                    name={formData.name || ""}
                    brand={formData.brand || undefined}
                    designer={formData.designer || undefined}
                    description={formData.description || undefined}
                    onImageFound={(url) => setFormData((p) => ({ ...p, image_url: url }))}
                  />
                </div>
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt={formData.name}
                    className="w-full h-48 object-cover rounded-lg mt-2"
                  />
                )}
              </div>
            ) : object.image_url ? (
              <img
                src={object.image_url}
                alt={object.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Armchair className="h-24 w-24 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Info */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label>Nom</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Marque</Label>
                  <Input
                    value={formData.brand || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Designer</Label>
                  <Input
                    value={formData.designer || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, designer: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select
                  value={formData.category_id || ""}
                  onValueChange={(v) => setFormData((p) => ({ ...p, category_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
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
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dimensions</Label>
                  <Input
                    value={formData.dimensions || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, dimensions: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Matériaux</Label>
                  <Input
                    value={formData.materials || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, materials: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prix min (€)</Label>
                  <Input
                    type="number"
                    value={formData.price_min || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, price_min: parseFloat(e.target.value) || null }))}
                  />
                </div>
                <div>
                  <Label>Prix max (€)</Label>
                  <Input
                    type="number"
                    value={formData.price_max || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, price_max: parseFloat(e.target.value) || null }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Source</Label>
                  <Input
                    value={formData.source_name || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, source_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>URL source</Label>
                  <Input
                    value={formData.source_url || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, source_url: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {object.brand && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{object.brand}</span>
                  {object.designer && (
                    <span className="text-muted-foreground">• {object.designer}</span>
                  )}
                </div>
              )}

              {object.category && (
                <Badge variant="secondary">{object.category.name}</Badge>
              )}

              {formatPrice(object.price_min, object.price_max, object.currency) && (
                <p className="text-lg font-semibold">
                  {formatPrice(object.price_min, object.price_max, object.currency)}
                </p>
              )}

              {object.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{object.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {object.dimensions && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Dimensions</h4>
                    <p className="text-sm">{object.dimensions}</p>
                  </div>
                )}
                {object.materials && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Matériaux</h4>
                    <p className="text-sm">{object.materials}</p>
                  </div>
                )}
              </div>

              {object.source_name && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Source</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{object.source_name}</span>
                    {object.source_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(object.source_url!, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {object.tags && object.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {object.tags.map((tag, i) => (
                      <Badge key={i} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
