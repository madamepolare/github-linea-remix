import { Building2, Theater, Megaphone, Frame, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type DisciplineSlug } from "@/lib/tenderDisciplineConfig";
import { useWorkspaceDisciplines } from "@/hooks/useWorkspaceDisciplines";

interface DisciplineTenderSelectorProps {
  value: DisciplineSlug;
  onChange: (value: DisciplineSlug) => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Theater,
  Frame,
  Megaphone,
};

export function DisciplineTenderSelector({ value, onChange }: DisciplineTenderSelectorProps) {
  const { activeDisciplineConfigs, isLoading } = useWorkspaceDisciplines();

  // Auto-select first discipline if current value is not active
  const isValueActive = activeDisciplineConfigs.some(d => d.slug === value);
  if (!isValueActive && activeDisciplineConfigs.length > 0 && activeDisciplineConfigs[0].slug !== value) {
    // Schedule onChange for next tick to avoid setState during render
    setTimeout(() => onChange(activeDisciplineConfigs[0].slug), 0);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Single discipline: auto-select and don't show selector
  if (activeDisciplineConfigs.length === 1) {
    return null;
  }

  return (
    <div className={cn(
      "grid gap-4",
      activeDisciplineConfigs.length === 2 ? "grid-cols-2" : "grid-cols-3"
    )}>
      {activeDisciplineConfigs.map((discipline) => {
        const Icon = ICONS[discipline.icon] || Building2;
        const isSelected = value === discipline.slug;
        
        return (
          <button
            key={discipline.slug}
            type="button"
            onClick={() => onChange(discipline.slug)}
            className={cn(
              "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
              "hover:border-primary/50 hover:bg-muted/50",
              isSelected 
                ? "border-primary bg-primary/5" 
                : "border-border"
            )}
          >
            <div className={cn(
              "p-4 rounded-full transition-colors",
              isSelected ? "bg-primary/10" : "bg-muted"
            )}>
              <Icon className={cn(
                "h-8 w-8",
                isSelected ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div className="text-center">
              <h3 className={cn(
                "font-semibold",
                isSelected && "text-primary"
              )}>
                {discipline.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {discipline.description}
              </p>
            </div>
            {isSelected && (
              <div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
