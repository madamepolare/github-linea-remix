import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  Heart,
  ExternalLink,
  FileText,
  Tag,
  Building2,
  Clock,
  Leaf,
  Ruler,
  Weight,
} from "lucide-react";
import { Material } from "@/hooks/useMaterials";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";

interface MaterialDetailSheetProps {
  material: Material | null;
  onClose: () => void;
}

export function MaterialDetailSheet({ material, onClose }: MaterialDetailSheetProps) {
  if (!material) return null;

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return null;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(price);
  };

  const sustainabilityLabels = ["", "Faible", "Moyen-faible", "Moyen", "Bon", "Excellent"];
  const sustainabilityColors = ["", "text-red-500", "text-orange-500", "text-yellow-500", "text-lime-500", "text-emerald-500"];

  return (
    <Sheet open={!!material} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <ScrollArea className="h-full">
          {/* Cover Image */}
          {material.images?.[0] && (
            <div className="aspect-video bg-muted relative">
              <img
                src={material.images[0]}
                alt={material.name}
                className="w-full h-full object-cover"
              />
              {material.is_favorite && (
                <div className="absolute top-3 right-3">
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" strokeWidth={THIN_STROKE} />
                </div>
              )}
            </div>
          )}

          <div className="p-6 space-y-6">
            <SheetHeader>
              <div className="flex items-start gap-3">
                {!material.images?.[0] && (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Package className="h-6 w-6 text-muted-foreground" strokeWidth={THIN_STROKE} />
                  </div>
                )}
                <div className="flex-1">
                  <SheetTitle className="text-xl">{material.name}</SheetTitle>
                  {material.manufacturer && (
                    <p className="text-sm text-muted-foreground">{material.manufacturer}</p>
                  )}
                  {material.reference && (
                    <p className="text-xs text-muted-foreground mt-1">Réf: {material.reference}</p>
                  )}
                </div>
              </div>
            </SheetHeader>

            {/* Category & Price */}
            <div className="flex items-center justify-between">
              {material.category && (
                <Badge variant="secondary">{material.category.name}</Badge>
              )}
              {material.price_unit && (
                <div className="text-right">
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(material.price_unit, material.price_currency)}
                  </span>
                  <span className="text-sm text-muted-foreground">/{material.unit}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            {material.description && (
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{material.description}</p>
              </div>
            )}

            {/* Specifications */}
            <div className="grid grid-cols-2 gap-4">
              {/* Supplier */}
              {material.supplier_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
                  <span>{material.supplier_name}</span>
                </div>
              )}

              {/* Lead Time */}
              {material.lead_time_days && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
                  <span>Délai: {material.lead_time_days} jours</span>
                </div>
              )}

              {/* Dimensions */}
              {material.dimensions && (
                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
                  <span>
                    {material.dimensions.length}x{material.dimensions.width}
                    {material.dimensions.height ? `x${material.dimensions.height}` : ""} {material.dimensions.unit || "mm"}
                  </span>
                </div>
              )}

              {/* Weight */}
              {material.weight && (
                <div className="flex items-center gap-2 text-sm">
                  <Weight className="h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
                  <span>{material.weight} {material.weight_unit}</span>
                </div>
              )}

              {/* Sustainability */}
              {material.sustainability_score && (
                <div className="flex items-center gap-2 text-sm">
                  <Leaf className={cn("h-4 w-4", sustainabilityColors[material.sustainability_score])} strokeWidth={THIN_STROKE} />
                  <span>{sustainabilityLabels[material.sustainability_score]}</span>
                </div>
              )}

              {/* Min Order */}
              {material.min_order_quantity && (
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
                  <span>Min: {material.min_order_quantity} {material.unit}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {material.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" strokeWidth={THIN_STROKE} />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1">
                  {material.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {material.certifications.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Certifications</h4>
                <div className="flex flex-wrap gap-1">
                  {material.certifications.map((cert) => (
                    <Badge key={cert} variant="secondary">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {material.documents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Documents</h4>
                <div className="space-y-2">
                  {material.documents.map((doc, index) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" strokeWidth={THIN_STROKE} />
                      Document {index + 1}
                      <ExternalLink className="h-3 w-3" strokeWidth={THIN_STROKE} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Images Gallery */}
            {material.images.length > 1 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Images</h4>
                <div className="grid grid-cols-3 gap-2">
                  {material.images.map((img, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications JSON */}
            {Object.keys(material.specifications).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Spécifications techniques</h4>
                <div className="bg-muted rounded-lg p-3">
                  <dl className="space-y-1 text-sm">
                    {Object.entries(material.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <dt className="text-muted-foreground">{key}</dt>
                        <dd className="font-medium">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
