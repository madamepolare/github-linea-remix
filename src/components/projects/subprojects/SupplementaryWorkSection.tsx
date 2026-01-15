import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubProjectWithStats } from "@/hooks/useSubProjects";
import { SubProjectCard } from "./SubProjectCard";
import { Plus, DollarSign, ChevronDown, ChevronUp, FileText, Receipt, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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

  // Fetch linked quotes for all supplementary projects
  const linkedQuoteIds = subProjects
    .map(p => p.linked_quote_id)
    .filter((id): id is string => !!id);

  const { data: linkedQuotes } = useQuery({
    queryKey: ['supplementary-quotes', linkedQuoteIds],
    queryFn: async () => {
      if (linkedQuoteIds.length === 0) return [];
      const { data, error } = await supabase
        .from('commercial_documents')
        .select('id, status, total_amount, document_number')
        .in('id', linkedQuoteIds);
      if (error) throw error;
      return data;
    },
    enabled: linkedQuoteIds.length > 0
  });

  // Create a map for quick lookup
  const quoteMap = new Map(linkedQuotes?.map(q => [q.id, q]) || []);

  // Calculate total budget from supplementary work quotes
  const totalBudget = linkedQuotes
    ?.filter(q => q.status === 'accepted' || q.status === 'signed')
    .reduce((sum, q) => sum + (q.total_amount || 0), 0) || 0;

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
                quoteData={subProject.linked_quote_id ? quoteMap.get(subProject.linked_quote_id) : undefined}
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
                        quoteData={subProject.linked_quote_id ? quoteMap.get(subProject.linked_quote_id) : undefined}
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
  color,
  quoteData
}: { 
  subProject: SubProjectWithStats; 
  color?: string;
  quoteData?: {
    id: string;
    status: string | null;
    total_amount: number | null;
    document_number: string | null;
  };
}) {
  const navigate = useNavigate();
  
  const quoteStatus = quoteData?.status as "draft" | "sent" | "accepted" | "rejected" | "signed" | null;
  const quoteAmount = quoteData?.total_amount;

  const getQuoteStatusBadge = () => {
    if (!quoteStatus) return null;
    
    switch (quoteStatus) {
      case 'accepted':
      case 'signed':
        return (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800">
            <FileText className="h-3 w-3 mr-1" />
            Devis accepté
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
            <FileText className="h-3 w-3 mr-1" />
            Devis envoyé
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
            <FileText className="h-3 w-3 mr-1" />
            Devis brouillon
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800">
            <FileText className="h-3 w-3 mr-1" />
            Devis refusé
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <SubProjectCard subProject={subProject} color={color} />
      
      {/* Billing overlay indicators */}
      <div className="absolute top-2 right-2 flex gap-1 items-center">
        {quoteAmount && quoteAmount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(quoteAmount)}
          </Badge>
        )}
        {getQuoteStatusBadge()}
        {quoteData?.id && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/commercial/quote/${quoteData.id}`);
            }}
            title="Voir le devis"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
