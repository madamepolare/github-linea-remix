import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro, Clock, RefreshCw, Users } from "lucide-react";

interface AccordCadreBlockProps {
  tender: any;
}

export function AccordCadreBlock({ tender }: AccordCadreBlockProps) {
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "—";
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M€`;
    if (amount >= 1000) return `${Math.round(amount / 1000)}k€`;
    return `${amount.toLocaleString()}€`;
  };

  const hasData = tender.montant_minimum || tender.montant_maximum || tender.duree_initiale_mois;

  if (!hasData) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Euro className="h-4 w-4 text-green-600" />
          Accord-cadre
          {tender.is_multi_attributaire && (
            <Badge variant="secondary" className="ml-auto text-xs">
              Multi-attributaire
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-2">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Minimum</p>
            <p className="text-lg font-bold">{formatCurrency(tender.montant_minimum)}</p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Maximum</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(tender.montant_maximum)}</p>
          </div>
        </div>
        {(tender.duree_initiale_mois || tender.nb_reconductions) && (
          <div className="flex items-center gap-4 mt-3 text-sm">
            {tender.duree_initiale_mois && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{tender.duree_initiale_mois} mois</span>
              </div>
            )}
            {tender.nb_reconductions > 0 && (
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{tender.nb_reconductions} reconduction(s)</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
