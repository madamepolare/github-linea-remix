import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Clock, Mic } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CasPratiqueBlockProps {
  tender: any;
}

export function CasPratiqueBlock({ tender }: CasPratiqueBlockProps) {
  const casPratique = tender.cas_pratique || {};
  
  if (!casPratique.requis && !casPratique.brief) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-600" />
          Cas pratique
          {casPratique.requis && (
            <Badge className="ml-auto bg-amber-100 text-amber-700 text-xs">Requis</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {casPratique.brief && (
          <p className="text-sm line-clamp-3">{casPratique.brief}</p>
        )}
        {casPratique.delai && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Délai : {casPratique.delai}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AuditionBlockProps {
  tender: any;
}

export function AuditionBlock({ tender }: AuditionBlockProps) {
  const audition = tender.audition || {};
  
  if (!audition.prevue && !audition.date) return null;

  return (
    <Card className="border-purple-200 bg-purple-50/30 dark:bg-purple-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Mic className="h-4 w-4 text-purple-600" />
          Audition
          {audition.prevue && (
            <Badge className="ml-auto bg-purple-100 text-purple-700 text-xs">Prévue</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {audition.date && (
          <p className="text-sm font-medium">
            {format(new Date(audition.date), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        )}
        {audition.duree && (
          <p className="text-sm text-muted-foreground">Durée : {audition.duree}</p>
        )}
      </CardContent>
    </Card>
  );
}
