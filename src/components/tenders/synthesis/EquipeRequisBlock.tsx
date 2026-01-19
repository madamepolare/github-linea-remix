import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, UserX, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenderConfig } from "@/hooks/useTenderConfig";

interface EquipeRequisBlockProps {
  tender: any;
  onNavigateToTab?: (tab: string) => void;
}

export function EquipeRequisBlock({ tender, onNavigateToTab }: EquipeRequisBlockProps) {
  const { getSpecialtyLabel, disciplineSlug } = useTenderConfig(tender.id);
  
  const requiredTeam = useMemo(() => {
    if (!tender.required_team) return [];
    if (Array.isArray(tender.required_team)) return tender.required_team;
    return [];
  }, [tender.required_team]);

  if (requiredTeam.length === 0) return null;

  const mandatoryMembers = requiredTeam.filter((m: any) => m.is_mandatory);
  const optionalMembers = requiredTeam.filter((m: any) => !m.is_mandatory);

  // Grouper par catégorie
  const groupedMembers = useMemo(() => {
    const groups: Record<string, { mandatory: any[]; optional: any[] }> = {};
    
    requiredTeam.forEach((member: any) => {
      const category = member.category || 'autre';
      if (!groups[category]) {
        groups[category] = { mandatory: [], optional: [] };
      }
      if (member.is_mandatory) {
        groups[category].mandatory.push(member);
      } else {
        groups[category].optional.push(member);
      }
    });
    
    return groups;
  }, [requiredTeam]);

  const categoryLabels: Record<string, string> = {
    moe: 'Maîtrise d\'œuvre',
    bet: 'Bureaux d\'études',
    direction: 'Direction',
    creation: 'Création',
    production: 'Production',
    digital: 'Digital',
    technique: 'Technique',
    fournisseur: 'Fournisseurs',
    partenaire: 'Partenaires',
    autre: 'Autres',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-orange-600" />
          Équipe requise
          <div className="ml-auto flex items-center gap-2">
            {mandatoryMembers.length > 0 && (
              <Badge className="text-xs bg-orange-100 text-orange-700">
                {mandatoryMembers.length} obligatoire{mandatoryMembers.length > 1 ? 's' : ''}
              </Badge>
            )}
            {optionalMembers.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{optionalMembers.length} optionnel{optionalMembers.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Liste des membres obligatoires */}
          {mandatoryMembers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <UserCheck className="h-3.5 w-3.5 text-orange-600" />
                Obligatoires
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mandatoryMembers.map((member: any, index: number) => (
                  <Badge 
                    key={member.id || index}
                    className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border border-orange-200"
                  >
                    {getSpecialtyLabel(member.specialty) || member.specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Liste des membres optionnels */}
          {optionalMembers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <UserX className="h-3.5 w-3.5" />
                Optionnels / Recommandés
              </div>
              <div className="flex flex-wrap gap-1.5">
                {optionalMembers.map((member: any, index: number) => (
                  <Badge 
                    key={member.id || index}
                    variant="outline"
                    className="text-muted-foreground"
                  >
                    {getSpecialtyLabel(member.specialty) || member.specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Alerte si équipe incomplète */}
          {mandatoryMembers.length > 3 && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Équipe importante requise - vérifier la disponibilité des partenaires</span>
            </div>
          )}

          {/* Bouton vers l'onglet équipe */}
          {onNavigateToTab && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onNavigateToTab('equipe')}
            >
              <Users className="h-4 w-4 mr-2" />
              Gérer l'équipe
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
