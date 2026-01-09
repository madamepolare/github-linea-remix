import { Sparkles, Check, Edit2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AIFieldIndicatorProps {
  isAIFilled?: boolean;
  isConfirmed?: boolean;
  confidence?: 'high' | 'medium' | 'low';
  source?: string;
  className?: string;
}

export function AIFieldIndicator({ 
  isAIFilled = false, 
  isConfirmed = false,
  confidence = 'high',
  source,
  className 
}: AIFieldIndicatorProps) {
  if (!isAIFilled) return null;

  const confidenceColors = {
    high: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
    low: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "h-5 px-1.5 gap-1 cursor-help",
              isConfirmed ? "bg-green-50 text-green-600 border-green-200" : confidenceColors[confidence],
              className
            )}
          >
            {isConfirmed ? (
              <Check className="h-3 w-3" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            <span className="text-[10px] font-medium">IA</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-sm">
              {isConfirmed ? "Vérifié par l'utilisateur" : "Pré-rempli par l'IA"}
            </p>
            {!isConfirmed && (
              <p className="text-xs text-muted-foreground">
                Confiance: {confidence === 'high' ? 'Élevée' : confidence === 'medium' ? 'Moyenne' : 'Faible'}
              </p>
            )}
            {source && (
              <p className="text-xs text-muted-foreground">
                Source: {source}
              </p>
            )}
            {!isConfirmed && (
              <p className="text-xs text-muted-foreground italic">
                Cliquez pour modifier et valider
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Wrapper component for form fields with AI indicator
interface AIFieldWrapperProps {
  isAIFilled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AIFieldWrapper({ isAIFilled, children, className }: AIFieldWrapperProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isAIFilled && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <AIFieldIndicator isAIFilled />
        </div>
      )}
    </div>
  );
}
