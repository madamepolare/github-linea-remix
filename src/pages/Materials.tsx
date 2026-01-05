import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  Star,
  Grid3X3,
  List,
  FolderTree,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Heart,
  Tag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useMaterials, useMaterialCategories, Material, MaterialCategory } from "@/hooks/useMaterials";
import { CreateMaterialDialog } from "@/components/materials/CreateMaterialDialog";
import { MaterialDetailSheet } from "@/components/materials/MaterialDetailSheet";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";

export default function Materials() {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const { categories, isLoading: categoriesLoading } = useMaterialCategories();
  const { materials, isLoading: materialsLoading, deleteMaterial, toggleFavorite } = useMaterials({
    categoryId: selectedCategoryId || undefined,
    favorite: showFavorites || undefined,
    search: search || undefined,
  });

  const isLoading = categoriesLoading || materialsLoading;

  const handleDelete = (material: Material) => {
    if (confirm(`Archiver le matériau "${material.name}" ?`)) {
      deleteMaterial.mutate(material.id);
    }
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return null;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(price);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-card px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-emerald-500" strokeWidth={THIN_STROKE} />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Bibliothèque Matériaux</h1>
                <p className="text-sm text-muted-foreground">Fiches produits et matériaux</p>
              </div>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
              Nouveau matériau
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
              <Input
                placeholder="Rechercher un matériau..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Button
              variant={showFavorites ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavorites(!showFavorites)}
              className="gap-2"
            >
              <Heart className={cn("h-4 w-4", showFavorites && "fill-current")} strokeWidth={THIN_STROKE} />
              Favoris
            </Button>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" strokeWidth={THIN_STROKE} />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" strokeWidth={THIN_STROKE} />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Categories Sidebar */}
          <div className="w-64 border-r border-border bg-muted/30 hidden lg:block">
            <div className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <FolderTree className="h-4 w-4" strokeWidth={THIN_STROKE} />
                Catégories
              </h3>
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-1">
                  <Button
                    variant={selectedCategoryId === null ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setSelectedCategoryId(null)}
                  >
                    Tous les matériaux
                  </Button>
                  {categories.map((category) => (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      selectedId={selectedCategoryId}
                      onSelect={setSelectedCategoryId}
                      level={0}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Materials Grid */}
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            {isLoading ? (
              <div className={cn(
                "grid gap-4",
                viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              )}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className={viewMode === "grid" ? "h-64" : "h-20"} />
                ))}
              </div>
            ) : materials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" strokeWidth={THIN_STROKE} />
                <h3 className="text-lg font-medium mb-2">Aucun matériau</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {search ? "Aucun matériau ne correspond à votre recherche" : "Créez votre premier matériau"}
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
                  Nouveau matériau
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {materials.map((material, index) => (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <MaterialCard
                      material={material}
                      onClick={() => setSelectedMaterial(material)}
                      onToggleFavorite={() => toggleFavorite.mutate({ id: material.id, is_favorite: !material.is_favorite })}
                      onDelete={() => handleDelete(material)}
                      formatPrice={formatPrice}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {materials.map((material, index) => (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <MaterialListItem
                      material={material}
                      onClick={() => setSelectedMaterial(material)}
                      onToggleFavorite={() => toggleFavorite.mutate({ id: material.id, is_favorite: !material.is_favorite })}
                      onDelete={() => handleDelete(material)}
                      formatPrice={formatPrice}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateMaterialDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <MaterialDetailSheet
        material={selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
      />
    </>
  );
}

interface CategoryItemProps {
  category: MaterialCategory;
  selectedId: string | null;
  onSelect: (id: string) => void;
  level: number;
}

function CategoryItem({ category, selectedId, onSelect, level }: CategoryItemProps) {
  return (
    <>
      <Button
        variant={selectedId === category.id ? "secondary" : "ghost"}
        className="w-full justify-start"
        size="sm"
        onClick={() => onSelect(category.id)}
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
      >
        {category.icon && <span className="mr-2">{category.icon}</span>}
        {category.name}
      </Button>
      {category.children?.map((child) => (
        <CategoryItem
          key={child.id}
          category={child}
          selectedId={selectedId}
          onSelect={onSelect}
          level={level + 1}
        />
      ))}
    </>
  );
}

interface MaterialCardProps {
  material: Material;
  onClick: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  formatPrice: (price: number | null, currency: string) => string | null;
}

function MaterialCard({ material, onClick, onToggleFavorite, onDelete, formatPrice }: MaterialCardProps) {
  const image = material.images?.[0];

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all overflow-hidden"
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-square bg-muted relative overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={material.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/50" strokeWidth={THIN_STROKE} />
          </div>
        )}

        {/* Favorite button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        >
          <Heart className={cn("h-4 w-4", material.is_favorite && "fill-red-500 text-red-500")} strokeWidth={THIN_STROKE} />
        </Button>

        {/* Category badge */}
        {material.category && (
          <Badge className="absolute bottom-2 left-2" variant="secondary">
            {material.category.name}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{material.name}</h3>
            {material.manufacturer && (
              <p className="text-sm text-muted-foreground truncate">{material.manufacturer}</p>
            )}
          </div>
          {material.price_unit && (
            <div className="text-right shrink-0">
              <div className="font-semibold text-primary">
                {formatPrice(material.price_unit, material.price_currency)}
              </div>
              <div className="text-xs text-muted-foreground">/{material.unit}</div>
            </div>
          )}
        </div>

        {material.reference && (
          <p className="text-xs text-muted-foreground mb-2">Réf: {material.reference}</p>
        )}

        {material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {material.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {material.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">+{material.tags.length - 3}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MaterialListItem({ material, onClick, onToggleFavorite, onDelete, formatPrice }: MaterialCardProps) {
  const image = material.images?.[0];

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
          {image ? (
            <img src={image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground/50" strokeWidth={THIN_STROKE} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{material.name}</h3>
            {material.is_favorite && (
              <Heart className="h-4 w-4 fill-red-500 text-red-500" strokeWidth={THIN_STROKE} />
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {material.manufacturer && <span>{material.manufacturer}</span>}
            {material.reference && <span>• Réf: {material.reference}</span>}
          </div>

          {material.category && (
            <Badge variant="outline" className="text-xs mt-1">
              {material.category.name}
            </Badge>
          )}
        </div>

        {/* Price */}
        {material.price_unit && (
          <div className="text-right shrink-0">
            <div className="font-semibold text-primary">
              {formatPrice(material.price_unit, material.price_currency)}
            </div>
            <div className="text-xs text-muted-foreground">/{material.unit}</div>
          </div>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" strokeWidth={THIN_STROKE} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}>
              <Heart className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
              {material.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
              Archiver
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
