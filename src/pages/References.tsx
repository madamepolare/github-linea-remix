import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Award, 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  MapPin,
  Calendar,
  Star,
  Building2,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useReferences, ProjectReference } from "@/hooks/useReferences";
import { CreateReferenceDialog } from "@/components/references/CreateReferenceDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";

const PROJECT_TYPE_LABELS: Record<string, string> = {
  architecture: "Architecture",
  interior: "Design d'intérieur",
  scenography: "Scénographie",
  urban: "Urbanisme",
  landscape: "Paysage",
};

const PROJECT_TYPE_COLORS: Record<string, string> = {
  architecture: "bg-blue-500",
  interior: "bg-purple-500",
  scenography: "bg-amber-500",
  urban: "bg-emerald-500",
  landscape: "bg-green-500",
};

const CLIENT_TYPE_LABELS: Record<string, string> = {
  prive: "Privé",
  public: "Public",
  promoteur: "Promoteur",
  association: "Association",
};

export default function References() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get("type") || "all");
  const [showFeatured, setShowFeatured] = useState(searchParams.get("featured") === "true");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { references, isLoading, deleteReference } = useReferences({
    type: typeFilter !== "all" ? typeFilter : undefined,
    featured: showFeatured || undefined,
  });

  // Filter by search
  const filteredReferences = references.filter((ref) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      ref.title.toLowerCase().includes(s) ||
      ref.client_name?.toLowerCase().includes(s) ||
      ref.location?.toLowerCase().includes(s)
    );
  });

  const handleDelete = (ref: ProjectReference) => {
    if (confirm(`Supprimer la référence "${ref.title}" ?`)) {
      deleteReference.mutate(ref.id);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-card px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-primary" strokeWidth={THIN_STROKE} />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Références</h1>
                <p className="text-sm text-muted-foreground">Portfolio de vos projets réalisés</p>
              </div>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
              Nouvelle référence
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type de projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(PROJECT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showFeatured ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFeatured(!showFeatured)}
              className="gap-2"
            >
              <Star className="h-4 w-4" strokeWidth={THIN_STROKE} />
              À la une
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
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {isLoading ? (
            <div className={cn(
              "grid gap-4",
              viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className={viewMode === "grid" ? "h-72" : "h-24"} />
              ))}
            </div>
          ) : filteredReferences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="h-12 w-12 text-muted-foreground mb-4" strokeWidth={THIN_STROKE} />
              <h3 className="text-lg font-medium mb-2">Aucune référence</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search ? "Aucune référence ne correspond à votre recherche" : "Créez votre première référence pour votre portfolio"}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
                Créer une référence
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReferences.map((ref, index) => (
                <motion.div
                  key={ref.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ReferenceCard
                    reference={ref}
                    onClick={() => navigate(`/references/${ref.id}`)}
                    onEdit={() => navigate(`/references/${ref.id}?edit=true`)}
                    onDelete={() => handleDelete(ref)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReferences.map((ref, index) => (
                <motion.div
                  key={ref.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <ReferenceListItem
                    reference={ref}
                    onClick={() => navigate(`/references/${ref.id}`)}
                    onEdit={() => navigate(`/references/${ref.id}?edit=true`)}
                    onDelete={() => handleDelete(ref)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateReferenceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}

interface ReferenceCardProps {
  reference: ProjectReference;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ReferenceCard({ reference, onClick, onEdit, onDelete }: ReferenceCardProps) {
  const coverImage = reference.images?.find(img => img.is_cover) || reference.images?.[0];

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all overflow-hidden"
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {coverImage?.url ? (
          <img
            src={coverImage.url}
            alt={reference.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50" strokeWidth={THIN_STROKE} />
          </div>
        )}

        {/* Featured badge */}
        {reference.is_featured && (
          <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
            <Star className="h-3 w-3 mr-1" strokeWidth={THIN_STROKE} />
            À la une
          </Badge>
        )}

        {/* Type badge */}
        {reference.project_type && (
          <Badge 
            className={cn(
              "absolute top-2 right-2 text-white",
              PROJECT_TYPE_COLORS[reference.project_type]
            )}
          >
            {PROJECT_TYPE_LABELS[reference.project_type]}
          </Badge>
        )}

        {/* Actions overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            <Pencil className="h-4 w-4 mr-1" strokeWidth={THIN_STROKE} />
            Modifier
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold truncate mb-1">{reference.title}</h3>
        
        {reference.client_name && (
          <p className="text-sm text-muted-foreground truncate mb-2">{reference.client_name}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {reference.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" strokeWidth={THIN_STROKE} />
              {reference.location}
            </span>
          )}
          {reference.completion_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" strokeWidth={THIN_STROKE} />
              {format(new Date(reference.completion_date), "yyyy", { locale: fr })}
            </span>
          )}
        </div>

        {reference.surface_m2 && (
          <div className="mt-2 text-sm font-medium text-primary">
            {reference.surface_m2.toLocaleString("fr-FR")} m²
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReferenceListItem({ reference, onClick, onEdit, onDelete }: ReferenceCardProps) {
  const coverImage = reference.images?.find(img => img.is_cover) || reference.images?.[0];

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
          {coverImage?.url ? (
            <img src={coverImage.url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground/50" strokeWidth={THIN_STROKE} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{reference.title}</h3>
            {reference.is_featured && (
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" strokeWidth={THIN_STROKE} />
            )}
          </div>
          
          {reference.client_name && (
            <p className="text-sm text-muted-foreground truncate">{reference.client_name}</p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {reference.project_type && (
              <Badge variant="outline" className="text-xs">
                {PROJECT_TYPE_LABELS[reference.project_type]}
              </Badge>
            )}
            {reference.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" strokeWidth={THIN_STROKE} />
                {reference.location}
              </span>
            )}
            {reference.completion_date && (
              <span>{format(new Date(reference.completion_date), "yyyy")}</span>
            )}
            {reference.surface_m2 && (
              <span>{reference.surface_m2.toLocaleString("fr-FR")} m²</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" strokeWidth={THIN_STROKE} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
