import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PipelineEntry } from "@/hooks/useContactPipelineEntries";
import { cn } from "@/lib/utils";

interface PipelineBadgesProps {
  entries: PipelineEntry[];
  maxVisible?: number;
  size?: "sm" | "default";
}

export function PipelineBadges({ entries, maxVisible = 2, size = "sm" }: PipelineBadgesProps) {
  if (!entries || entries.length === 0) {
    return <span className="text-xs text-muted-foreground/50">—</span>;
  }

  const visibleEntries = entries.slice(0, maxVisible);
  const remainingCount = entries.length - maxVisible;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1">
        {visibleEntries.map((entry) => (
          <Tooltip key={entry.id}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  "cursor-default",
                  size === "sm" ? "text-[10px] h-5 px-1.5" : "text-xs"
                )}
                style={{
                  borderColor: entry.stage?.color || entry.pipeline?.color || undefined,
                  backgroundColor: entry.stage?.color ? `${entry.stage.color}10` : undefined,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full mr-1 shrink-0"
                  style={{ backgroundColor: entry.stage?.color || entry.pipeline?.color || "hsl(var(--primary))" }}
                />
                <span className="truncate max-w-[80px]">
                  {entry.stage?.name || "—"}
                </span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="text-xs space-y-1">
                <p className="font-medium">{entry.pipeline?.name}</p>
                <p className="text-muted-foreground">Étape : {entry.stage?.name}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className={cn(
                "cursor-default",
                size === "sm" ? "text-[10px] h-5 px-1.5" : "text-xs"
              )}>
                +{remainingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="text-xs space-y-1">
                {entries.slice(maxVisible).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.stage?.color || "hsl(var(--primary))" }}
                    />
                    <span>{entry.pipeline?.name} → {entry.stage?.name}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
