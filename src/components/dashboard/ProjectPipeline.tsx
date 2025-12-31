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
  { id: "aps", name: "Avant-Projet Sommaire", code: "APS", count: 5, color: "bg-accent" },
  { id: "apd", name: "Avant-Projet Détaillé", code: "APD", count: 4, color: "bg-warning" },
  { id: "pro", name: "Projet", code: "PRO", count: 2, color: "bg-success" },
  { id: "dce", name: "Dossier Consultation", code: "DCE", count: 3, color: "bg-primary" },
  { id: "act", name: "Assistance Contrats", code: "ACT", count: 1, color: "bg-destructive" },
  { id: "visa", name: "Visa", code: "VISA", count: 2, color: "bg-info" },
  { id: "det", name: "Direction Exécution", code: "DET", count: 4, color: "bg-accent" },
  { id: "aor", name: "Assistance Réception", code: "AOR", count: 1, color: "bg-success" },
];

const totalProjects = stages.reduce((acc, stage) => acc + stage.count, 0);

export function ProjectPipeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            Project Pipeline
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalProjects} active projects across all phases
          </p>
        </div>
        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View details
        </button>
      </div>
      
      {/* Pipeline visualization */}
      <div className="p-6">
        {/* Bar chart */}
        <div className="flex h-32 items-end gap-2">
          {stages.map((stage, index) => {
            const maxCount = Math.max(...stages.map((s) => s.count));
            const height = (stage.count / maxCount) * 100;
            return (
              <motion.div
                key={stage.id}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.05, ease: "easeOut" }}
                className="group relative flex-1 cursor-pointer"
              >
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-200 group-hover:opacity-80",
                    stage.color
                  )}
                  style={{ height: "100%" }}
                />
                {/* Tooltip on hover */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="bg-foreground text-background text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                    <div className="font-semibold">{stage.name}</div>
                    <div>{stage.count} projects</div>
                  </div>
                  <div className="w-2 h-2 bg-foreground rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Labels */}
        <div className="flex gap-2 mt-3">
          {stages.map((stage) => (
            <div key={stage.id} className="flex-1 text-center">
              <span className="text-xs font-medium text-muted-foreground">
                {stage.code}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-border px-6 py-4">
        <div className="flex flex-wrap gap-4">
          {stages.slice(0, 5).map((stage) => (
            <div key={stage.id} className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-sm", stage.color)} />
              <span className="text-xs text-muted-foreground">
                {stage.code}: {stage.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
