import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ruler, Maximize2, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface SurfaceBlockProps {
  tender: any;
}

export function SurfaceBlock({ tender }: SurfaceBlockProps) {
  const surfaceArea = tender.surface_area;
  
  if (!surfaceArea) return null;

  // Déterminer la catégorie de projet par surface
  const getSurfaceCategory = (surface: number): { label: string; icon: typeof Ruler; color: string } => {
    if (surface >= 10000) return { label: 'Grand projet', icon: LayoutGrid, color: 'text-purple-600 bg-purple-100' };
    if (surface >= 3000) return { label: 'Projet moyen', icon: Maximize2, color: 'text-blue-600 bg-blue-100' };
    if (surface >= 500) return { label: 'Petit projet', icon: Ruler, color: 'text-green-600 bg-green-100' };
    return { label: 'Très petit', icon: Ruler, color: 'text-gray-600 bg-gray-100' };
  };

  const category = getSurfaceCategory(surfaceArea);

  // Format surface
  const formatSurface = (surface: number) => {
    if (surface >= 10000) {
      return `${(surface / 1000).toFixed(1).replace('.0', '')} 000`;
    }
    return surface.toLocaleString();
  };

  // Estimation du coût au m² (si budget disponible)
  const budget = tender.estimated_budget;
  const costPerSqm = budget && surfaceArea ? Math.round(budget / surfaceArea) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Ruler className="h-4 w-4 text-blue-600" />
          Surface
          <Badge className={cn("ml-auto text-xs", category.color)}>
            {category.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Surface principale */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {formatSurface(surfaceArea)}
            </span>
            <span className="text-lg text-muted-foreground">m²</span>
          </div>

          {/* Indicateur visuel */}
          <div className="space-y-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                style={{ width: `${Math.min(surfaceArea / 20000 * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0</span>
              <span>5 000</span>
              <span>10 000</span>
              <span>20 000 m²</span>
            </div>
          </div>

          {/* Coût au m² si disponible */}
          {costPerSqm && (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
              <span className="text-muted-foreground">Coût estimé au m²</span>
              <span className="font-semibold">{costPerSqm.toLocaleString()} €/m²</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
