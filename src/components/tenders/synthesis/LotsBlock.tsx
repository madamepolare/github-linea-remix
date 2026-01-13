import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Users, Euro } from "lucide-react";
import { cn } from "@/lib/utils";

interface LotTeamMember {
  specialty: string;
  is_mandatory: boolean;
  notes?: string;
}

interface Lot {
  numero?: number;
  intitule?: string;
  titre?: string;
  domaine?: string;
  description?: string;
  budget_min?: number;
  budget_max?: number;
  is_multi_attributaire?: boolean;
  nb_attributaires?: number;
  duree_mois?: number;
  required_team?: LotTeamMember[];
}

interface LotsBlockProps {
  tender: any;
}

const DOMAINE_COLORS: Record<string, string> = {
  graphisme: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  digital: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  evenementiel: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
  video: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  impression: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  strategie: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  conseil: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  creation: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300",
  production: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  rp: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  signaletique: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
  global: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

// Team specialty labels for display
const TEAM_SPECIALTY_LABELS: Record<string, string> = {
  imprimeur: 'Imprimeur',
  routeur: 'Routeur / Façonneur',
  signaletique: 'Signalétique / Enseigniste',
  producteur_video: 'Producteur vidéo',
  photographe: 'Photographe',
  studio_son: 'Studio son / Voix off',
  agence_rp: 'Agence RP',
  agence_influence: 'Agence influence',
  agence_media: 'Agence média / Régie',
  agence_digitale: 'Agence digitale / Web',
  agence_evenementielle: 'Agence événementielle',
  standiste: 'Standiste',
  traiteur: 'Traiteur',
  location_materiel: 'Location matériel',
  traducteur: 'Traducteur',
  redacteur: 'Rédacteur freelance',
  graphiste_freelance: 'Graphiste freelance',
  developpeur: 'Développeur',
  autre: 'Autre partenaire',
};

const formatCurrency = (amount: number | null | undefined) => {
  if (!amount) return null;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M€`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}k€`;
  return `${amount.toLocaleString()}€`;
};

const getSpecialtyLabel = (value: string) => {
  return TEAM_SPECIALTY_LABELS[value] || value;
};

export function LotsBlock({ tender }: LotsBlockProps) {
  const lots: Lot[] = Array.isArray(tender.lots) ? tender.lots : [];
  
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
        <div className="space-y-3">
          {lots.map((lot, i) => {
            const domaine = lot.domaine || 'autre';
            const domaineColor = DOMAINE_COLORS[domaine] || DOMAINE_COLORS.global;
            const hasBudget = lot.budget_min || lot.budget_max;
            const isMulti = lot.is_multi_attributaire;
            const hasTeam = lot.required_team && lot.required_team.length > 0;
            
            return (
              <div 
                key={i} 
                className="p-3 bg-muted/50 rounded-lg border border-border/50"
              >
                {/* Lot header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-mono text-xs shrink-0">
                      Lot {lot.numero || i + 1}
                    </Badge>
                    <span className="font-medium text-sm">
                      {lot.intitule || lot.titre || "Sans titre"}
                    </span>
                  </div>
                  <Badge className={cn("text-xs shrink-0", domaineColor)}>
                    {domaine.charAt(0).toUpperCase() + domaine.slice(1)}
                  </Badge>
                </div>
                
                {/* Lot details */}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {/* Budget par lot */}
                  {hasBudget && (
                    <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                      <Euro className="h-3 w-3" />
                      {lot.budget_min && lot.budget_max 
                        ? `${formatCurrency(lot.budget_min)} - ${formatCurrency(lot.budget_max)}`
                        : lot.budget_max 
                          ? `Max ${formatCurrency(lot.budget_max)}`
                          : `Min ${formatCurrency(lot.budget_min)}`
                      }
                    </span>
                  )}
                  
                  {/* Multi-attributaire par lot */}
                  {isMulti && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                      <Users className="h-3 w-3" />
                      Multi-attr.
                      {lot.nb_attributaires && ` (${lot.nb_attributaires})`}
                    </span>
                  )}
                  
                  {/* Durée spécifique */}
                  {lot.duree_mois && (
                    <span className="px-2 py-0.5 bg-muted rounded">
                      {lot.duree_mois} mois
                    </span>
                  )}
                </div>
                
                {/* Required team for this lot */}
                {hasTeam && (
                  <div className="mt-3 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="h-3.5 w-3.5 text-orange-600" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Équipe / Partenaires requis
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {lot.required_team!.map((member, j) => (
                        <Badge 
                          key={j}
                          variant={member.is_mandatory ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            member.is_mandatory 
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200"
                              : ""
                          )}
                        >
                          {getSpecialtyLabel(member.specialty)}
                          {member.is_mandatory && <span className="ml-1 opacity-70">*</span>}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Description if present */}
                {lot.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {lot.description}
                  </p>
                )}
              </div>
            );
          })}
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
            <Badge key={i} variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
              {typeof p === 'string' ? p : p.nom || p.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}