import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PipelineStage {
  id: string;
  name: string;
  code: string;
  count: number;
  color: string;
}

const stages: PipelineStage[] = [
  { id: "esq", name: "Esquisse", code: "ESQ", count: 3, color: "bg-info" },
  { id: "aps", name: "Avant-projet", code: "APS", count: 5, color: "bg-accent" },
  { id: "apd", name: "Projet", code: "APD", count: 4, color: "bg-warning" },
  { id: "pro", name: "Pro/DCE", code: "PRO", count: 2, color: "bg-success" },
  { id: "exe", name: "Exécution", code: "EXE", count: 6, color: "bg-primary" },
  { id: "dqe", name: "Réception", code: "AOR", count: 1, color: "bg-muted-foreground" },
];

export function ProjectsPipelineWidget() {
  const maxCount = Math.max(...stages.map((s) => s.count));
  const total = stages.reduce((acc, s) => acc + s.count, 0);

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
            <span className="text-xs font-medium">{stage.count}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(stage.count / maxCount) * 100}%` }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={cn("w-full rounded-t-md min-h-[8px]", stage.color)}
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
            <div className={cn("w-2 h-2 rounded-full", stage.color)} />
            <span className="text-xs text-muted-foreground">{stage.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
