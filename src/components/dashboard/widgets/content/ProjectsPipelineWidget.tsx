import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PipelineStage {
  id: string;
  name: string;
  code: string;
  count: number;
  color: string;
}

const PHASE_CONFIG: Record<string, { name: string; code: string; color: string }> = {
  planning: { name: "Planification", code: "PLAN", color: "#6b7280" },
  design: { name: "Conception", code: "CONC", color: "#3b82f6" },
  development: { name: "Développement", code: "DEV", color: "#8b5cf6" },
  execution: { name: "Exécution", code: "EXE", color: "#f97316" },
  review: { name: "Revue", code: "REV", color: "#ec4899" },
  completed: { name: "Terminé", code: "FIN", color: "#22c55e" },
};

export function ProjectsPipelineWidget() {
  const { projects, isLoading } = useProjects();

  // Group projects by phase
  const stages: PipelineStage[] = Object.entries(PHASE_CONFIG).map(([code, config]) => ({
    id: code,
    name: config.name,
    code: config.code,
    count: projects.filter(p => p.phase === code).length,
    color: config.color,
  }));

  const maxCount = Math.max(1, ...stages.map(s => s.count));
  const total = projects.length;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col gap-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex-1 flex gap-2 items-end">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="flex-1" 
              style={{ height: `${30 + Math.random() * 50}%` }} 
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {total} projets en cours
        </span>
      </div>

      {/* Bar Chart */}
      <div className="flex-1 flex items-end gap-2 min-h-[120px]">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-xs font-medium tabular-nums">{stage.count}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((stage.count / maxCount) * 100, 8)}%` }}
              transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
              className="w-full rounded-t-md min-h-[8px]"
              style={{ backgroundColor: stage.color }}
            />
            <span className="text-[10px] text-muted-foreground font-medium">
              {stage.code}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
        {stages.slice(0, 4).map((stage) => (
          <div key={stage.id} className="flex items-center gap-1.5">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: stage.color }}
            />
            <span className="text-xs text-muted-foreground">{stage.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
