import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CRMSectionCardProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
}

export function CRMSectionCard({
  title,
  icon,
  action,
  children,
  className,
  contentClassName,
  noPadding = false,
}: CRMSectionCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </CardHeader>
      <CardContent className={cn(noPadding ? "p-0" : "", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
