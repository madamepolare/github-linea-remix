import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubProjectWithStats } from "@/hooks/useSubProjects";
import { SubProjectCard } from "./SubProjectCard";
import { Plus, DollarSign, ChevronDown, ChevronUp, FileText, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupplementaryWorkSectionProps {
  subProjects: SubProjectWithStats[];
  parentColor?: string;
  onCreateNew?: () => void;
}

export function SupplementaryWorkSection({ 
  subProjects, 
  parentColor,
  onCreateNew 
}: SupplementaryWorkSectionProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const activeSupplementary = subProjects.filter(
    p => p.status !== "completed" && p.status !== "done" && p.status !== "archived"
  );
  
  const completedSupplementary = subProjects.filter(
    p => p.status === "completed" || p.status === "done"
  );

  // Calculate total budget from supplementary work
  // This would typically come from linked quotes
  const totalBudget = 0; // Placeholder - would need to fetch from commercial_documents

  if (subProjects.length === 0 && !onCreateNew) {
    return null;
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/50 to-background dark:from-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-600" />
              Travaux supplémentaires
            </CardTitle>
            {subProjects.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                {activeSupplementary.length} en cours
              </Badge>
            )}
          </div>
          {onCreateNew && (
            <Button size="sm" variant="outline" onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          )}
        </div>
        {totalBudget > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Budget hors-forfait : {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalBudget)}
          </p>
        )}
      </CardHeader>

      <CardContent>
        {subProjects.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun travail supplémentaire</p>
            <p className="text-xs mt-1">
              Les demandes hors forfait apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active supplementary projects */}
            {activeSupplementary.map(subProject => (
              <SupplementaryProjectCard 
                key={subProject.id} 
                subProject={subProject}
                color={parentColor}
              />
            ))}

            {/* Completed supplementary toggle */}
            {completedSupplementary.length > 0 && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  <span className="flex items-center gap-2">
                    Terminés
                    <Badge variant="secondary" className="text-xs">
                      {completedSupplementary.length}
                    </Badge>
                  </span>
                  {showCompleted ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                
                {showCompleted && (
                  <div className="mt-3 space-y-3">
                    {completedSupplementary.map(subProject => (
                      <SupplementaryProjectCard 
                        key={subProject.id} 
                        subProject={subProject}
                        color={parentColor}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Extended card for supplementary work with billing info
function SupplementaryProjectCard({ 
  subProject, 
  color 
}: { 
  subProject: SubProjectWithStats; 
  color?: string;
}) {
  // This would fetch linked quote/invoice data
  const quoteStatus = "pending" as "pending" | "accepted" | "rejected" | null;
  const hasOrder = false;

  return (
    <div className="relative">
      <SubProjectCard subProject={subProject} color={color} />
      
      {/* Billing overlay indicators */}
      <div className="absolute top-2 right-2 flex gap-1">
        {quoteStatus === "accepted" ? (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            <FileText className="h-3 w-3 mr-1" />
            Devis accepté
          </Badge>
        ) : quoteStatus === "pending" ? (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
            <FileText className="h-3 w-3 mr-1" />
            Devis en attente
          </Badge>
        ) : null}
        {hasOrder && (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <Receipt className="h-3 w-3 mr-1" />
            BC reçu
          </Badge>
        )}
      </div>
    </div>
  );
}
