import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, ChevronRight } from "lucide-react";
import { useTenderCriteria } from "@/hooks/useTenderCriteria";
import { cn } from "@/lib/utils";

interface CriteresBlockProps {
  tender: any;
  onNavigateToTab?: (tab: string) => void;
}

const CRITERION_COLORS: Record<string, string> = {
  price: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  technical: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  methodology: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  creative: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
  strategic: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  experience: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  team: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
  delay: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
};

const CRITERION_LABELS: Record<string, string> = {
  price: "Prix",
  technical: "Technique",
  methodology: "Méthodologie",
  creative: "Créativité",
  strategic: "Stratégie",
  experience: "Références",
  team: "Équipe",
  delay: "Délais",
  media: "Média",
  digital: "Digital",
};

export function CriteresBlock({ tender, onNavigateToTab }: CriteresBlockProps) {
  const { criteria, priceWeight, technicalWeight } = useTenderCriteria(tender.id);
  
  if (criteria.length === 0) return null;

  // Sort by weight descending
  const sortedCriteria = [...criteria].sort((a, b) => (b.weight || 0) - (a.weight || 0));
  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Scale className="h-4 w-4 text-indigo-600" />
          Critères de jugement
          {totalWeight > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {totalWeight}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedCriteria.slice(0, 5).map((criterion) => {
            const type = criterion.criterion_type || 'technical';
            const colorClass = CRITERION_COLORS[type] || CRITERION_COLORS.technical;
            const label = CRITERION_LABELS[type] || type;
            const weight = criterion.weight || 0;
            
            return (
              <div key={criterion.id} className="flex items-center gap-3">
                {/* Weight bar */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">
                      {criterion.name}
                    </span>
                    <span className="text-sm font-bold ml-2">{weight}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all", colorClass.replace('text-', 'bg-').split(' ')[0])}
                      style={{ width: `${Math.min(weight, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          
          {criteria.length > 5 && (
            <button 
              onClick={() => onNavigateToTab?.('budget')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-2"
            >
              +{criteria.length - 5} autres critères
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
        
        {/* Quick summary */}
        {(priceWeight > 0 || technicalWeight > 0) && (
          <div className="flex gap-2 mt-4 pt-3 border-t">
            {technicalWeight > 0 && (
              <Badge variant="outline" className="text-xs">
                Technique: {technicalWeight}%
              </Badge>
            )}
            {priceWeight > 0 && (
              <Badge variant="outline" className="text-xs">
                Prix: {priceWeight}%
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}