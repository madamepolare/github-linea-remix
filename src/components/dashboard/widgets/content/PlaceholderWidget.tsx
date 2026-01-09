import { LucideIcon, Construction } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaceholderWidgetProps {
  title: string;
  icon?: LucideIcon;
  description?: string;
}

export function PlaceholderWidget({
  title,
  icon: Icon = Construction,
  description = "Ce widget sera bientôt disponible",
}: PlaceholderWidgetProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <div className="p-3 rounded-full bg-muted mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
    </div>
  );
}
