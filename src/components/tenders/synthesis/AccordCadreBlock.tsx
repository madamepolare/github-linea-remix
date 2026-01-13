import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro, Clock, RefreshCw, Users, Calendar } from "lucide-react";

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

  // Check if there's any financial/duration data to display
  const hasMonetaryData = tender.montant_minimum || tender.montant_maximum || tender.estimated_budget;
  const hasDurationData = tender.duree_initiale_mois || tender.nb_reconductions;
  const hasValidityData = tender.validite_offre_jours;
  const hasData = hasMonetaryData || hasDurationData || hasValidityData;

  if (!hasData) return null;

  // Calculate total duration with reconductions
  const totalDuration = tender.duree_initiale_mois 
    ? tender.duree_initiale_mois + (tender.nb_reconductions || 0) * (tender.duree_reconduction_mois || tender.duree_initiale_mois)
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Euro className="h-4 w-4 text-green-600" />
          Accord-cadre
          {tender.is_multi_attributaire && (
            <Badge variant="secondary" className="ml-auto text-xs flex items-center gap-1">
              <Users className="h-3 w-3" />
              Multi-attr.
              {tender.nb_attributaires && ` (${tender.nb_attributaires})`}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Montants */}
        {hasMonetaryData && (
          <div className="grid gap-3 grid-cols-2">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Minimum</p>
              <p className="text-lg font-bold">
                {formatCurrency(tender.montant_minimum)}
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Maximum</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(tender.montant_maximum)}
              </p>
            </div>
          </div>
        )}
        
        {/* Budget estimé si différent des montants min/max */}
        {tender.estimated_budget && !tender.montant_minimum && !tender.montant_maximum && (
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Budget estimé</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(tender.estimated_budget)}
            </p>
          </div>
        )}
        
        {/* Durée et reconductions */}
        {hasDurationData && (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {tender.duree_initiale_mois && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{tender.duree_initiale_mois} mois</span>
                <span className="text-muted-foreground text-xs">(initial)</span>
              </div>
            )}
            {tender.nb_reconductions > 0 && (
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  +{tender.nb_reconductions} × {tender.duree_reconduction_mois || tender.duree_initiale_mois || '?'} mois
                </span>
              </div>
            )}
            {totalDuration && totalDuration !== tender.duree_initiale_mois && (
              <Badge variant="outline" className="text-xs">
                Total max: {totalDuration} mois
              </Badge>
            )}
          </div>
        )}
        
        {/* Validité des offres */}
        {hasValidityData && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Validité des offres: <strong className="text-foreground">{tender.validite_offre_jours} jours</strong></span>
          </div>
        )}
        
        {/* Date de début de mission */}
        {tender.date_debut_mission && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Début mission prévu: <strong className="text-foreground">
              {new Date(tender.date_debut_mission).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </strong></span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}