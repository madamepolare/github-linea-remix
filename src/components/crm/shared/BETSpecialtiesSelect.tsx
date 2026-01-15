import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCRMSettings } from "@/hooks/useCRMSettings";

interface BETSpecialtiesSelectProps {
  value: string[];
  onChange: (specialties: string[]) => void;
  disabled?: boolean;
}

export function BETSpecialtiesSelect({
  value,
  onChange,
  disabled = false,
}: BETSpecialtiesSelectProps) {
  const { betSpecialties } = useCRMSettings();

  const toggleSpecialty = (spec: string) => {
    if (value.includes(spec)) {
      onChange(value.filter(s => s !== spec));
    } else {
      onChange([...value, spec]);
    }
  };

  const removeSpecialty = (spec: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(s => s !== spec));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button variant="outline" className="w-full justify-between h-auto min-h-10 py-2">
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.map((spec) => {
                const specialty = betSpecialties.find((s) => s.key === spec);
                return (
                  <Badge
                    key={spec}
                    className="text-white text-xs gap-1"
                    style={{ backgroundColor: specialty?.color }}
                  >
                    {specialty?.label || spec}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={(e) => removeSpecialty(spec, e)}
                    />
                  </Badge>
                );
              })}
            </div>
          ) : (
            <span className="text-muted-foreground">Sélectionnez une ou plusieurs spécialités</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
        {betSpecialties.map((spec) => (
          <DropdownMenuCheckboxItem
            key={spec.key}
            checked={value.includes(spec.key)}
            onCheckedChange={() => toggleSpecialty(spec.key)}
          >
            <Badge 
              className="text-white text-xs mr-2"
              style={{ backgroundColor: spec.color }}
            >
              {spec.label}
            </Badge>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
