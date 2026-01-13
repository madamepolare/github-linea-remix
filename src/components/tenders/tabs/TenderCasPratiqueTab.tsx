import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Clock, AlertTriangle, FileText, Mic } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TenderCasPratiqueTabProps {
  tender: any;
}

export function TenderCasPratiqueTab({ tender }: TenderCasPratiqueTabProps) {
  const casPratique = tender.cas_pratique || {};
  const audition = tender.audition || {};

  const hasAnyCasPratique = casPratique.requis || casPratique.brief || casPratique.delai;
  const hasAnyAudition = audition.prevue || audition.date || audition.duree;

  return (
    <div className="space-y-6">
      {/* Cas pratique */}
      <Card className={hasAnyCasPratique ? "border-amber-300 bg-amber-50/30 dark:bg-amber-950/20" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            Cas pratique
            {casPratique.requis && (
              <Badge className="ml-2 bg-amber-100 text-amber-700 hover:bg-amber-100">
                Requis
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasAnyCasPratique ? (
            <div className="space-y-4">
              {/* Brief du cas pratique */}
              {casPratique.brief && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Brief / Sujet
                  </div>
                  <div className="p-4 bg-white dark:bg-background border rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{casPratique.brief}</p>
                  </div>
                </div>
              )}

              {/* Délai */}
              {casPratique.delai && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Délai de réalisation</p>
                    <p className="font-medium">{casPratique.delai}</p>
                  </div>
                </div>
              )}

              {/* Livrables attendus */}
              {casPratique.livrables && Array.isArray(casPratique.livrables) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Livrables attendus</p>
                  <div className="flex flex-wrap gap-2">
                    {casPratique.livrables.map((livrable: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {livrable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Consignes */}
              {casPratique.consignes && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                        Consignes importantes
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        {casPratique.consignes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Aucun cas pratique requis pour cette consultation</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audition / Soutenance */}
      <Card className={hasAnyAudition ? "border-purple-300 bg-purple-50/30 dark:bg-purple-950/20" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="h-4 w-4 text-purple-600" />
            Audition / Soutenance
            {audition.prevue && (
              <Badge className="ml-2 bg-purple-100 text-purple-700 hover:bg-purple-100">
                Prévue
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasAnyAudition ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Date */}
                {audition.date && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date d'audition</p>
                      <p className="font-medium">
                        {format(new Date(audition.date), "EEEE d MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Durée */}
                {audition.duree && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Durée</p>
                      <p className="font-medium">{audition.duree}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Format / Modalités */}
              {audition.format && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Format</p>
                  <p className="text-sm text-muted-foreground">{audition.format}</p>
                </div>
              )}

              {/* Participants attendus */}
              {audition.participants && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Participants attendus côté agence</p>
                  <p className="text-sm text-muted-foreground">{audition.participants}</p>
                </div>
              )}

              {/* Consignes */}
              {audition.consignes && (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                        Consignes pour l'audition
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                        {audition.consignes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Mic className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Aucune audition prévue pour le moment</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
