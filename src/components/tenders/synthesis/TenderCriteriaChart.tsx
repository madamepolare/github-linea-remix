import { useMemo } from "react";
import { motion } from "framer-motion";
import { Scale, TrendingUp, Clock, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTenderCriteria } from "@/hooks/useTenderCriteria";

interface TenderCriteriaChartProps {
  tenderId: string;
}

const CRITERION_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  price: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    bar: "bg-gradient-to-r from-green-400 to-emerald-500",
  },
  technical: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    bar: "bg-gradient-to-r from-blue-400 to-indigo-500",
  },
  delay: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    bar: "bg-gradient-to-r from-amber-400 to-orange-500",
  },
  methodology: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    bar: "bg-gradient-to-r from-purple-400 to-fuchsia-500",
  },
  other: {
    bg: "bg-gray-100 dark:bg-gray-800/30",
    text: "text-gray-700 dark:text-gray-400",
    bar: "bg-gradient-to-r from-gray-400 to-slate-500",
  },
};

const CRITERION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  price: TrendingUp,
  technical: Award,
  delay: Clock,
  methodology: Scale,
};

export function TenderCriteriaChart({ tenderId }: TenderCriteriaChartProps) {
  const { criteria, priceWeight, technicalWeight, isLoading } = useTenderCriteria(tenderId);

  // Group by type for visualization
  const groupedCriteria = useMemo(() => {
    const groups: Record<string, { total: number; items: typeof criteria }> = {};
    
    criteria.forEach((c) => {
      const type = c.criterion_type || "other";
      if (!groups[type]) {
        groups[type] = { total: 0, items: [] };
      }
      groups[type].total += c.weight || 0;
      groups[type].items.push(c);
    });

    return Object.entries(groups)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([type, data]) => ({ type, ...data }));
  }, [criteria]);

  const totalWeight = groupedCriteria.reduce((sum, g) => sum + g.total, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-20 flex items-center justify-center text-muted-foreground">
            Chargement des critères...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (criteria.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun critère de jugement défini</p>
            <p className="text-xs mt-1">Analysez le DCE pour extraire les critères</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              Critères de jugement
            </span>
            <div className="flex gap-2">
              <Badge variant="secondary" className={cn(CRITERION_COLORS.price.bg, CRITERION_COLORS.price.text)}>
                Prix {priceWeight}%
              </Badge>
              <Badge variant="secondary" className={cn(CRITERION_COLORS.technical.bg, CRITERION_COLORS.technical.text)}>
                Technique {technicalWeight}%
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stacked Bar */}
          <div className="relative h-10 rounded-full overflow-hidden bg-muted flex">
            {groupedCriteria.map((group, index) => {
              const colors = CRITERION_COLORS[group.type] || CRITERION_COLORS.other;
              const widthPercent = totalWeight > 0 ? (group.total / totalWeight) * 100 : 0;

              return (
                <motion.div
                  key={group.type}
                  className={cn("h-full flex items-center justify-center relative", colors.bar)}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.6, ease: "easeOut" }}
                >
                  {widthPercent >= 10 && (
                    <span className="text-white text-sm font-semibold drop-shadow-md">
                      {group.total}%
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
            {groupedCriteria.map((group, index) => {
              const colors = CRITERION_COLORS[group.type] || CRITERION_COLORS.other;
              const Icon = CRITERION_ICONS[group.type] || Scale;

              return (
                <motion.div
                  key={group.type}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg",
                    colors.bg
                  )}
                >
                  <Icon className={cn("h-4 w-4", colors.text)} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-xs font-medium capitalize truncate", colors.text)}>
                      {group.type === "price" ? "Prix" 
                        : group.type === "technical" ? "Technique"
                        : group.type === "delay" ? "Délais"
                        : group.type === "methodology" ? "Méthodologie"
                        : group.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {group.items.length} critère{group.items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {group.total}%
                  </Badge>
                </motion.div>
              );
            })}
          </div>

          {/* Detail list */}
          {criteria.length > 0 && (
            <div className="pt-2 space-y-1">
              {criteria.slice(0, 5).map((c, index) => {
                const colors = CRITERION_COLORS[c.criterion_type || "other"] || CRITERION_COLORS.other;
                
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className={cn("w-2 h-2 rounded-full", colors.bar.replace("bg-gradient-to-r", "bg-gradient-to-br"))} />
                    <span className="flex-1 truncate text-muted-foreground">{c.name}</span>
                    <span className="font-medium">{c.weight}%</span>
                  </motion.div>
                );
              })}
              {criteria.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{criteria.length - 5} autres critères
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
