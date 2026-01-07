import { Building2, Theater } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TenderType } from "@/lib/tenderTypes";

interface TenderTypeSelectorProps {
  value: TenderType;
  onChange: (value: TenderType) => void;
}

export function TenderTypeSelector({ value, onChange }: TenderTypeSelectorProps) {
  const options = [
    {
      value: 'architecture' as TenderType,
      label: 'Architecture',
      description: 'Projets de construction, réhabilitation, aménagement',
      icon: Building2,
    },
    {
      value: 'scenographie' as TenderType,
      label: 'Scénographie',
      description: 'Expositions, muséographie, événementiel',
      icon: Theater,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
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
                {option.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {option.description}
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
