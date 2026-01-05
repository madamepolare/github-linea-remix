import { useState } from "react";
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
import { useMaterials, useMaterialCategories, CreateMaterialInput } from "@/hooks/useMaterials";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";

interface CreateMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UNITS = [
  { value: "unité", label: "Unité" },
  { value: "m²", label: "m²" },
  { value: "ml", label: "ml (mètre linéaire)" },
  { value: "m³", label: "m³" },
  { value: "kg", label: "kg" },
  { value: "lot", label: "Lot" },
];

export function CreateMaterialDialog({ open, onOpenChange }: CreateMaterialDialogProps) {
  const { createMaterial } = useMaterials();
  const { categories } = useMaterialCategories();
  const { allCompanies } = useCRMCompanies();

  // Flatten categories for select
  const flatCategories: { id: string; name: string; level: number }[] = [];
  const flattenCategories = (cats: typeof categories, level = 0) => {
    for (const cat of cats) {
      flatCategories.push({ id: cat.id, name: cat.name, level });
      if (cat.children) flattenCategories(cat.children, level + 1);
    }
  };
  flattenCategories(categories);

  const suppliers = allCompanies.filter((c) => c.industry === "fournisseur");

  const [formData, setFormData] = useState<Partial<CreateMaterialInput>>({
    name: "",
    unit: "unité",
    price_currency: "EUR",
    specifications: {},
    images: [],
    documents: [],
    certifications: [],
    tags: [],
    is_favorite: false,
    is_archived: false,
  });

  const [tagsInput, setTagsInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) return;

    // Process tags
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

    await createMaterial.mutateAsync({
      ...formData,
      tags,
    } as CreateMaterialInput);

    onOpenChange(false);
    setFormData({
      name: "",
      unit: "unité",
      price_currency: "EUR",
      specifications: {},
      images: [],
      documents: [],
      certifications: [],
      tags: [],
      is_favorite: false,
      is_archived: false,
    });
    setTagsInput("");
  };

  const updateField = <K extends keyof CreateMaterialInput>(
    field: K,
    value: CreateMaterialInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau matériau</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Nom du matériau"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select
              value={formData.category_id || ""}
              onValueChange={(v) => updateField("category_id", v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie..." />
              </SelectTrigger>
              <SelectContent>
                {flatCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {"—".repeat(cat.level)} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference & Manufacturer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Référence</Label>
              <Input
                id="reference"
                value={formData.reference || ""}
                onChange={(e) => updateField("reference", e.target.value)}
                placeholder="REF-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Fabricant</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer || ""}
                onChange={(e) => updateField("manufacturer", e.target.value)}
                placeholder="Nom du fabricant"
              />
            </div>
          </div>

          {/* Supplier */}
          <div className="space-y-2">
            <Label>Fournisseur</Label>
            <Select
              value={formData.supplier_id || ""}
              onValueChange={(v) => {
                const supplier = suppliers.find((s) => s.id === v);
                updateField("supplier_id", v || null);
                updateField("supplier_name", supplier?.name || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un fournisseur..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price & Unit */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="price">Prix unitaire</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price_unit || ""}
                onChange={(e) => updateField("price_unit", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Unité</Label>
              <Select
                value={formData.unit || "unité"}
                onValueChange={(v) => updateField("unit", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lead Time & Min Order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead_time">Délai (jours)</Label>
              <Input
                id="lead_time"
                type="number"
                value={formData.lead_time_days || ""}
                onChange={(e) => updateField("lead_time_days", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_order">Qté minimum</Label>
              <Input
                id="min_order"
                type="number"
                step="0.01"
                value={formData.min_order_quantity || ""}
                onChange={(e) => updateField("min_order_quantity", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="1"
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
              placeholder="Description du matériau..."
              rows={2}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="bois, naturel, FSC"
            />
          </div>

          {/* Sustainability */}
          <div className="space-y-2">
            <Label>Score durabilité (1-5)</Label>
            <Select
              value={formData.sustainability_score?.toString() || ""}
              onValueChange={(v) => updateField("sustainability_score", v ? parseInt(v) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Non évalué" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Faible</SelectItem>
                <SelectItem value="2">2 - Moyen-faible</SelectItem>
                <SelectItem value="3">3 - Moyen</SelectItem>
                <SelectItem value="4">4 - Bon</SelectItem>
                <SelectItem value="5">5 - Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMaterial.isPending || !formData.name}>
              {createMaterial.isPending ? "Création..." : "Créer le matériau"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
