import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Users } from "lucide-react";

interface LotsBlockProps {
  tender: any;
}

export function LotsBlock({ tender }: LotsBlockProps) {
  const lots = Array.isArray(tender.lots) ? tender.lots : [];
  
  if (lots.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="h-4 w-4 text-purple-600" />
          Lots
          <Badge variant="secondary" className="ml-auto text-xs">{lots.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {lots.slice(0, 4).map((lot: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
              <span className="truncate">
                <Badge variant="outline" className="mr-2 text-xs">
                  {lot.numero || i + 1}
                </Badge>
                {lot.intitule || lot.titre || "Sans titre"}
              </span>
            </div>
          ))}
          {lots.length > 4 && (
            <p className="text-xs text-muted-foreground text-center">
              +{lots.length - 4} autres lots
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SortantsBlockProps {
  tender: any;
}

export function SortantsBlock({ tender }: SortantsBlockProps) {
  const sortants = Array.isArray(tender.anciens_prestataires) ? tender.anciens_prestataires : [];
  
  if (sortants.length === 0) return null;

  return (
    <Card className="border-orange-200 bg-orange-50/30 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-orange-600" />
          Prestataires sortants
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {sortants.map((p: any, i: number) => (
            <Badge key={i} variant="secondary" className="bg-orange-100 text-orange-700">
              {typeof p === 'string' ? p : p.nom || p.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
