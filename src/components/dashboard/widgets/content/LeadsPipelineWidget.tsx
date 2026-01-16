import { useLeads, usePipelines } from "@/hooks/useLeads";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LeadsPipelineWidget() {
  const { leads, isLoading: leadsLoading } = useLeads();
  const { pipelines, isLoading: pipelinesLoading } = usePipelines();

  const isLoading = leadsLoading || pipelinesLoading;

  // Get default pipeline and its stages
  const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0];
  const stages = defaultPipeline?.stages || [];

  // Group leads by stage
  const leadsPerStage = stages.map(stage => {
    const stageLeads = leads.filter(l => l.stage_id === stage.id);
    const totalValue = stageLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
    return {
      ...stage,
      count: stageLeads.length,
      totalValue,
    };
  });

  const maxCount = Math.max(1, ...leadsPerStage.map(s => s.count));
  const totalLeads = leads.length;
  const totalValue = leads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M €`;
    if (value >= 1000) return `${Math.round(value / 1000)}k €`;
    return `${value} €`;
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col gap-3">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex-1 flex gap-1 items-end">
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

  if (stages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Aucun pipeline configuré
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="text-2xl font-semibold tabular-nums">{totalLeads}</span>
          <span className="text-xs text-muted-foreground ml-2">opportunités</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-primary tabular-nums">{formatCurrency(totalValue)}</span>
          <span className="text-xs text-muted-foreground ml-1">potentiel</span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex-1 flex gap-1.5 items-end min-h-0 pb-6 relative">
        {leadsPerStage.slice(0, 7).map((stage, index) => {
          const heightPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          const stageColor = stage.color || '#6b7280';
          
          return (
            <div key={stage.id} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(heightPercent, 5)}%` }}
                transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
                className="w-full rounded-t-sm relative group cursor-pointer"
                style={{ backgroundColor: stageColor }}
              >
                {/* Count badge on hover */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium bg-popover border rounded px-1.5 py-0.5 shadow-sm whitespace-nowrap">
                    {stage.count}
                  </span>
                </div>
              </motion.div>
              {/* Stage label */}
              <span 
                className={cn(
                  "absolute bottom-0 text-[9px] text-muted-foreground truncate max-w-full px-0.5 text-center",
                  "transform origin-center"
                )}
                style={{ width: `${100 / Math.min(leadsPerStage.length, 7)}%` }}
              >
                {stage.name.slice(0, 8)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
