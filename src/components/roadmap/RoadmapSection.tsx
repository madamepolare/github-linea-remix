import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface RoadmapSectionProps {
  title: string;
  icon: ReactNode;
  count: number;
  children: ReactNode;
  defaultOpen?: boolean;
  colorClass?: string;
}

export function RoadmapSection({
  title,
  icon,
  count,
  children,
  defaultOpen = true,
  colorClass = "bg-muted",
}: RoadmapSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colorClass)}>
            {icon}
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{count} éléments</p>
          </div>
        </div>
        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <div className="space-y-2 pl-0 md:pl-[52px]">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
