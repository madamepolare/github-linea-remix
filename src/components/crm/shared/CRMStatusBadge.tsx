import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, CircleDot, Target } from "lucide-react";

export type CRMStatusType = "lead" | "confirmed" | "prospect";

interface CRMStatusBadgeProps {
  status: CRMStatusType | string;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<CRMStatusType, {
  label: string;
  icon: typeof CheckCircle2;
  className: string;
}> = {
  lead: {
    label: "Lead",
    icon: Target,
    className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50",
  },
  confirmed: {
    label: "Confirmé",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50",
  },
  prospect: {
    label: "Prospect",
    icon: CircleDot,
    className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
  },
};

export function CRMStatusBadge({ 
  status, 
  className, 
  showIcon = true,
  size = "sm" 
}: CRMStatusBadgeProps) {
  const config = STATUS_CONFIG[status as CRMStatusType] || STATUS_CONFIG.lead;
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium border gap-1",
        size === "sm" ? "text-[10px] px-1.5 py-0.5 h-5" : "text-xs px-2 py-1",
        config.className,
        className
      )}
    >
      {showIcon && <Icon className={cn("shrink-0", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />}
      {config.label}
    </Badge>
  );
}
