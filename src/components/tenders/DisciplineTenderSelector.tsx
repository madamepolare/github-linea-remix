import { useEffect } from "react";
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
  const { activeDisciplineConfigs, defaultDiscipline, isLoading } = useWorkspaceDisciplines();

  // Auto-select default discipline if current value is not active
  useEffect(() => {
    const isValueActive = activeDisciplineConfigs.some(d => d.slug === value);
    if (!isValueActive && activeDisciplineConfigs.length > 0) {
      onChange(defaultDiscipline);
    }
  }, [activeDisciplineConfigs, value, defaultDiscipline, onChange]);

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

  // Sort by the configured order (first = default)
  const sortedConfigs = [...activeDisciplineConfigs].sort((a, b) => {
    if (a.slug === defaultDiscipline) return -1;
    if (b.slug === defaultDiscipline) return 1;
    return 0;
  });

  return (
    <div className={cn(
      "grid gap-4",
      sortedConfigs.length === 2 ? "grid-cols-2" : "grid-cols-3"
    )}>
      {sortedConfigs.map((discipline, idx) => {
        const Icon = ICONS[discipline.icon] || Building2;
        const isSelected = value === discipline.slug;
        const isDefault = discipline.slug === defaultDiscipline;
        
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
            {isDefault && (
              <div className="absolute top-2 left-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                Par défaut
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
