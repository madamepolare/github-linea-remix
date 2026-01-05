import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Heart,
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
  Grid3X3,
  List,
  Armchair,
  Filter,
} from "lucide-react";
import { useDesignObjects, useObjectCategories } from "@/hooks/useDesignObjects";
import { CreateObjectDialog } from "@/components/objects/CreateObjectDialog";
import { ObjectDetailSheet } from "@/components/objects/ObjectDetailSheet";
import { cn } from "@/lib/utils";

export default function Objects() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  const { data: categories = [] } = useObjectCategories();
  const { objects, isLoading, deleteObject, toggleFavorite } = useDesignObjects({
    categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
    favorite: favoriteFilter || undefined,
    search: search || undefined,
  });

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

  const selectedObject = objects.find((o) => o.id === selectedObjectId);

  return (
    <PageLayout title="Objets & Mobilier" hideHeader>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Armchair className="h-6 w-6" />
              Objets & Mobilier
            </h1>
            <p className="text-muted-foreground">
              Catalogue d'objets design pour vos prescriptions
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un objet
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, marque, designer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={favoriteFilter ? "default" : "outline"}
            size="icon"
            onClick={() => setFavoriteFilter(!favoriteFilter)}
          >
            <Heart className={cn("h-4 w-4", favoriteFilter && "fill-current")} />
          </Button>
          <div className="flex border rounded-lg">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setView("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setView("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className={cn(
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-3"
          )}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={view === "grid" ? "h-72" : "h-24"} />
            ))}
          </div>
        ) : objects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Armchair className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Aucun objet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Commencez par ajouter des objets à votre catalogue
              </p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un objet
              </Button>
            </CardContent>
          </Card>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {objects.map((obj) => (
              <Card
                key={obj.id}
                className="group cursor-pointer hover:shadow-lg transition-all overflow-hidden"
                onClick={() => setSelectedObjectId(obj.id)}
              >
                <div className="aspect-square relative bg-muted">
                  {obj.image_url ? (
                    <img
                      src={obj.image_url}
                      alt={obj.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Armchair className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite.mutate({ id: obj.id, isFavorite: !obj.is_favorite });
                      }}
                    >
                      <Heart
                        className={cn("h-4 w-4", obj.is_favorite && "fill-red-500 text-red-500")}
                      />
                    </Button>
                    {obj.source_url && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(obj.source_url!, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {obj.category && (
                    <Badge
                      variant="secondary"
                      className="absolute bottom-2 left-2"
                    >
                      {obj.category.name}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold truncate">{obj.name}</h3>
                  {obj.brand && (
                    <p className="text-sm text-muted-foreground truncate">
                      {obj.brand}
                      {obj.designer && ` • ${obj.designer}`}
                    </p>
                  )}
                  {formatPrice(obj.price_min, obj.price_max, obj.currency) && (
                    <p className="text-sm font-medium mt-1">
                      {formatPrice(obj.price_min, obj.price_max, obj.currency)}
                    </p>
                  )}
                  {obj.source_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Source: {obj.source_name}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {objects.map((obj) => (
              <Card
                key={obj.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedObjectId(obj.id)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-16 w-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    {obj.image_url ? (
                      <img
                        src={obj.image_url}
                        alt={obj.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Armchair className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{obj.name}</h3>
                      {obj.is_favorite && (
                        <Heart className="h-4 w-4 fill-red-500 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {[obj.brand, obj.designer].filter(Boolean).join(" • ")}
                    </p>
                    {obj.category && (
                      <Badge variant="outline" className="mt-1">
                        {obj.category.name}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {formatPrice(obj.price_min, obj.price_max, obj.currency) && (
                      <p className="font-medium">
                        {formatPrice(obj.price_min, obj.price_max, obj.currency)}
                      </p>
                    )}
                    {obj.source_name && (
                      <p className="text-xs text-muted-foreground">{obj.source_name}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setSelectedObjectId(obj.id);
                      }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      {obj.source_url && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          window.open(obj.source_url!, "_blank");
                        }}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Voir la source
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteObject.mutate(obj.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateObjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      
      <ObjectDetailSheet
        object={selectedObject}
        open={!!selectedObjectId}
        onOpenChange={(open) => !open && setSelectedObjectId(null)}
      />
    </PageLayout>
  );
}
