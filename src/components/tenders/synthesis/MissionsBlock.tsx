import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MissionsBlockProps {
  tender: any;
}

// Définition des missions MOE standard
const MOE_PHASES = [
  { code: 'ESQ', name: 'Esquisse', fullName: 'Études d\'esquisse' },
  { code: 'APS', name: 'APS', fullName: 'Avant-Projet Sommaire' },
  { code: 'APD', name: 'APD', fullName: 'Avant-Projet Définitif' },
  { code: 'PRO', name: 'Projet', fullName: 'Études de Projet' },
  { code: 'DCE', name: 'DCE', fullName: 'Dossier de Consultation' },
  { code: 'ACT', name: 'ACT', fullName: 'Assistance Contrats Travaux' },
  { code: 'VISA', name: 'VISA', fullName: 'Visa des études d\'exécution' },
  { code: 'DET', name: 'DET', fullName: 'Direction Exécution Travaux' },
  { code: 'AOR', name: 'AOR', fullName: 'Assistance Opérations Réception' },
  { code: 'OPC', name: 'OPC', fullName: 'Ordonnancement Pilotage' },
];

export function MissionsBlock({ tender }: MissionsBlockProps) {
  const moePhases = tender.moe_phases;
  
  if (!moePhases || !Array.isArray(moePhases) || moePhases.length === 0) return null;

  // Normaliser les codes de phases (en majuscules)
  const normalizedPhases = moePhases.map((p: string) => p.toUpperCase().trim());
  
  // Déterminer quelles phases sont incluses
  const includedPhases = MOE_PHASES.filter(phase => 
    normalizedPhases.includes(phase.code)
  );

  // Calculer si c'est une mission complète
  const hasAllMainPhases = ['ESQ', 'APS', 'APD', 'PRO', 'DCE', 'ACT', 'DET', 'AOR']
    .every(code => normalizedPhases.includes(code));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-purple-600" />
          Missions MOE
          {hasAllMainPhases ? (
            <Badge className="ml-auto text-xs bg-green-100 text-green-700">
              Mission complète
            </Badge>
          ) : (
            <Badge variant="secondary" className="ml-auto text-xs">
              {includedPhases.length} phases
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Grille des phases */}
          <div className="grid grid-cols-5 gap-1.5">
            {MOE_PHASES.map(phase => {
              const isIncluded = normalizedPhases.includes(phase.code);
              return (
                <div
                  key={phase.code}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all",
                    isIncluded 
                      ? "bg-purple-100 dark:bg-purple-900/50" 
                      : "bg-muted/50 opacity-50"
                  )}
                  title={phase.fullName}
                >
                  {isIncluded && (
                    <Check className="absolute -top-1 -right-1 h-3.5 w-3.5 text-purple-600 bg-white rounded-full" />
                  )}
                  <span className={cn(
                    "text-xs font-semibold",
                    isIncluded ? "text-purple-700 dark:text-purple-300" : "text-muted-foreground"
                  )}>
                    {phase.code}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Liste détaillée des phases incluses */}
          <div className="pt-2 border-t">
            <div className="flex flex-wrap gap-1.5">
              {includedPhases.map(phase => (
                <Badge 
                  key={phase.code} 
                  variant="outline" 
                  className="text-xs bg-purple-50 dark:bg-purple-950/30"
                >
                  {phase.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Alerte si missions partielles */}
          {!hasAllMainPhases && includedPhases.length < 5 && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Mission partielle - vérifier le périmètre exact dans le DCE</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
