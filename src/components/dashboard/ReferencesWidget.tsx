import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Award, Star, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Reference {
  id: string;
  title: string;
  project_type?: string;
  location?: string;
  is_featured?: boolean;
  completion_date?: string;
}

interface ReferenceImage {
  id: string;
  reference_id: string;
  url?: string;
  is_cover?: boolean;
}

interface ReferencesWidgetProps {
  references: Reference[];
  images: ReferenceImage[];
  isLoading?: boolean;
}

const projectTypeLabels: Record<string, string> = {
  architecture: "Architecture",
  interior: "Intérieur",
  scenography: "Scénographie",
  urban: "Urbanisme",
  landscape: "Paysage",
};

export function ReferencesWidget({ references, images, isLoading }: ReferencesWidgetProps) {
  const navigate = useNavigate();

  // Get featured references first, then most recent
  const featuredReferences = references
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      const dateA = a.completion_date ? new Date(a.completion_date).getTime() : 0;
      const dateB = b.completion_date ? new Date(b.completion_date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 4);

  const getCoverImage = (referenceId: string) => {
    const refImages = images.filter((img) => img.reference_id === referenceId);
    return refImages.find((img) => img.is_cover) || refImages[0];
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="rounded-xl border border-border bg-card"
      >
        <div className="p-6">
          <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/3] bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
          <h3 className="font-display text-lg font-semibold text-foreground">
            Références récentes
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() => navigate("/references")}
        >
          Voir tout
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="p-4">
        {featuredReferences.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Award className="h-10 w-10 text-muted-foreground mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground mb-3">
              Aucune référence créée
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate("/references")}>
              Ajouter une référence
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {featuredReferences.map((ref, index) => {
              const coverImage = getCoverImage(ref.id);
              return (
                <motion.div
                  key={ref.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/references/${ref.id}`)}
                >
                  {coverImage?.url ? (
                    <img
                      src={coverImage.url}
                      alt={ref.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Award className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1 mb-1">
                      {ref.is_featured && (
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      )}
                      <p className="text-white text-sm font-medium truncate">
                        {ref.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ref.project_type && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-white/20 text-white border-none"
                        >
                          {projectTypeLabels[ref.project_type] || ref.project_type}
                        </Badge>
                      )}
                      {ref.location && (
                        <span className="text-white/70 text-[10px] flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {ref.location}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
