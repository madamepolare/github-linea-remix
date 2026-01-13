import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Maximize2,
  Pencil,
  Ruler,
  Star,
  Users,
  X,
} from "lucide-react";
import { useReferences } from "@/hooks/useReferences";

const projectTypeLabels: Record<string, string> = {
  architecture: "Architecture",
  interior: "Architecture intérieure",
  scenography: "Scénographie",
  urban: "Urbanisme",
  landscape: "Paysage",
};

const clientTypeLabels: Record<string, string> = {
  prive: "Client privé",
  public: "Client public",
  promoteur: "Promoteur",
  association: "Association",
};

export default function ReferenceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { references, isLoading } = useReferences();

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const reference = references.find((r) => r.id === id);
  const images = reference?.images || [];
  const team = reference?.team_members || [];

  const coverImage = useMemo(() => {
    return images.find((img) => img.is_cover) || images[0];
  }, [images]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!reference) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/references")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux références
        </Button>
        <div className="text-center py-16">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Référence non trouvée</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/references")}
                className="h-9 w-9 rounded-full hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold tracking-tight">{reference.title}</h1>
                  {reference.project_type && (
                    <Badge variant="secondary">
                      {projectTypeLabels[reference.project_type] || reference.project_type}
                    </Badge>
                  )}
                  {reference.is_featured && (
                    <Badge className="bg-amber-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      À la une
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {reference.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {reference.location}
                    </span>
                  )}
                  {reference.completion_date && (
                    <>
                      <span className="text-border">•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(reference.completion_date), "yyyy")}
                      </span>
                    </>
                  )}
                  {reference.surface_m2 && (
                    <>
                      <span className="text-border">•</span>
                      <span className="flex items-center gap-1">
                        <Ruler className="h-3.5 w-3.5" />
                        {reference.surface_m2} m²
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Hero Image */}
        {coverImage && (
          <div className="relative h-[400px] bg-muted">
            <img
              src={coverImage.url || ""}
              alt={reference.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-4 right-4"
              onClick={() => {
                setCurrentImageIndex(images.indexOf(coverImage));
                setLightboxOpen(true);
              }}
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Agrandir
            </Button>
          </div>
        )}

        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Description */}
          {reference.description && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-neutral dark:prose-invert max-w-none"
            >
              <p className="text-lg text-muted-foreground leading-relaxed">
                {reference.description}
              </p>
            </motion.div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Client */}
            {reference.client_name && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{reference.client_name}</p>
                    {reference.client_type && (
                      <p className="text-xs text-muted-foreground">
                        {clientTypeLabels[reference.client_type]}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Surface & Budget */}
            {(reference.surface_m2 || reference.budget_range) && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                    <Ruler className="h-5 w-5 text-chart-2" strokeWidth={1.5} />
                  </div>
                  <div>
                    {reference.surface_m2 && (
                      <>
                        <p className="text-sm text-muted-foreground">Surface</p>
                        <p className="font-medium">{reference.surface_m2} m²</p>
                      </>
                    )}
                    {reference.budget_range && (
                      <p className="text-xs text-muted-foreground">
                        {reference.budget_range}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location */}
            {reference.location && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-chart-3" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Localisation</p>
                    <p className="font-medium">{reference.location}</p>
                    {reference.country && (
                      <p className="text-xs text-muted-foreground">
                        {reference.country}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Gallery */}
          {images.length > 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Galerie</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setLightboxOpen(true);
                    }}
                  >
                    <img
                      src={image.url || ""}
                      alt={image.caption || `Image ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Awards */}
          {reference.awards && reference.awards.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
                Distinctions
              </h3>
              <div className="flex flex-wrap gap-2">
                {reference.awards.map((award, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {award}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Team */}
          {team.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" strokeWidth={1.5} />
                Équipe projet
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {team.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-muted">
                        {(member.company_name || member.contact_name || "?")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.company_name || member.contact_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Press Mentions */}
          {reference.press_mentions && reference.press_mentions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Presse</h3>
              <div className="space-y-2">
                {reference.press_mentions.map((mention, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                    <span>{mention}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-[90vh] flex items-center justify-center"
            >
              {images[currentImageIndex] && (
                <img
                  src={images[currentImageIndex].url || ""}
                  alt={images[currentImageIndex].caption || ""}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={prevImage}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={nextImage}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>

          {/* Caption */}
          {images[currentImageIndex]?.caption && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white text-center max-w-md">
              <p>{images[currentImageIndex].caption}</p>
              {images[currentImageIndex].credits && (
                <p className="text-white/60 text-sm mt-1">
                  © {images[currentImageIndex].credits}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
