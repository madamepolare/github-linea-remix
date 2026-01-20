import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IconFilterButtonProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  count?: number;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
}

export function IconFilterButton({ 
  icon: Icon, 
  label, 
  isActive, 
  count,
  children,
  align = "start"
}: IconFilterButtonProps) {
  return (
    <Popover>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button 
                variant={isActive ? "secondary" : "ghost"} 
                size="icon-sm"
                className={cn(
                  "relative",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                <Icon className="h-4 w-4" />
                {count && count > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                    {count}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent align={align} className="w-auto min-w-44 p-1">
        {children}
      </PopoverContent>
    </Popover>
  );
}
