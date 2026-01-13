import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro, Clock, RefreshCw, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface TenderBudgetCommTabProps {
  tender: any;
}

export function TenderBudgetCommTab({ tender }: TenderBudgetCommTabProps) {
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const lots = Array.isArray(tender.lots) ? tender.lots : [];
  const anciensTitulaires = Array.isArray(tender.anciens_prestataires) ? tender.anciens_prestataires : [];

  return (
    <div className="space-y-6">
      {/* Accord-cadre Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Euro className="h-4 w-4 text-green-600" />
            Montants de l'accord-cadre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Montant minimum</span>
                <span className="font-semibold text-lg">{formatCurrency(tender.montant_minimum)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Montant maximum</span>
                <span className="font-semibold text-lg text-green-600">{formatCurrency(tender.montant_maximum)}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Durée initiale</span>
                </div>
                <span className="font-medium">{tender.duree_initiale_mois ? `${tender.duree_initiale_mois} mois` : "—"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Reconductions</span>
                </div>
                <span className="font-medium">
                  {tender.nb_reconductions 
                    ? `${tender.nb_reconductions} x ${tender.duree_reconduction_mois || "—"} mois`
                    : "Aucune"
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Multi-attributaire */}
          {tender.is_multi_attributaire && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-200">
                  Accord-cadre multi-attributaire
                </span>
                {tender.nb_attributaires && (
                  <Badge variant="secondary" className="ml-2">
                    {tender.nb_attributaires} titulaires prévus
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Validité offre */}
          {tender.validite_offre_jours && (
            <div className="mt-4 text-sm text-muted-foreground">
              Validité de l'offre : <span className="font-medium text-foreground">{tender.validite_offre_jours} jours</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lots */}
      {lots.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              Lots
              <Badge variant="secondary" className="ml-auto">{lots.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lots.map((lot: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Lot {lot.numero || index + 1}
                      </Badge>
                      <span className="font-medium">{lot.intitule || lot.titre || "Sans titre"}</span>
                    </div>
                    {lot.description && (
                      <p className="text-sm text-muted-foreground mt-1">{lot.description}</p>
                    )}
                  </div>
                  {lot.montant_max && (
                    <span className="text-sm font-medium text-green-600 ml-4">
                      {formatCurrency(lot.montant_max)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anciens titulaires / Sortants */}
      {anciensTitulaires.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              Prestataires sortants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {anciensTitulaires.map((presta: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">{presta.nom || presta.name || presta}</p>
                    {presta.lot && (
                      <p className="text-xs text-muted-foreground">Lot {presta.lot}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!tender.montant_minimum && !tender.montant_maximum && lots.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Euro className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Aucune information budgétaire renseignée</p>
          <p className="text-sm">Ces données seront extraites automatiquement du DCE</p>
        </div>
      )}
    </div>
  );
}
