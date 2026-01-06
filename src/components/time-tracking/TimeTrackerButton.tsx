import { Button } from "@/components/ui/button";
import { useTimeTrackerStore } from "@/hooks/useTimeTrackerStore";
import { Timer, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimeTrackerButtonProps {
  projectId?: string;
  projectName?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function TimeTrackerButton({
  projectId,
  projectName,
  variant = "outline",
  size = "sm",
  className,
  showLabel = false,
}: TimeTrackerButtonProps) {
  const { isOpen, isRunning, openTracker } = useTimeTrackerStore();

  const handleClick = () => {
    openTracker(projectId, projectName);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={handleClick}
          className={cn(
            "gap-2",
            isRunning && "text-primary border-primary",
            className
          )}
        >
          {isRunning ? (
            <Timer className="h-4 w-4 animate-pulse" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {showLabel && (isRunning ? "Timer actif" : "Démarrer le temps")}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isRunning ? "Timer en cours" : "Démarrer le time tracking"}
      </TooltipContent>
    </Tooltip>
  );
}
