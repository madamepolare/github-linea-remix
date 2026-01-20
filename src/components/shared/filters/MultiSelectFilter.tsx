import { useState, useMemo } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  id: string;
  label: string;
  color?: string;
  icon?: React.ElementType;
  count?: number;
  description?: string;
}

interface MultiSelectFilterProps {
  icon: React.ElementType;
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  showCounts?: boolean;
  showSelectAll?: boolean;
  maxHeight?: number;
  className?: string;
  align?: "start" | "center" | "end";
}

export function MultiSelectFilter({
  icon: Icon,
  label,
  options,
  selected,
  onChange,
  placeholder = "Tous",
  emptyMessage = "Aucune option",
  showCounts = true,
  showSelectAll = true,
  maxHeight = 300,
  className,
  align = "start",
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const isActive = selected.length > 0;
  const allSelected = selected.length === options.length && options.length > 0;

  const selectedLabels = useMemo(() => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      return options.find((o) => o.id === selected[0])?.label || placeholder;
    }
    return `${selected.length} sélectionnés`;
  }, [selected, options, placeholder]);

  const handleToggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.id));
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isActive ? "secondary" : "outline"}
          size="sm"
          className={cn(
            "h-8 gap-1.5 font-normal",
            isActive && "bg-primary/10 border-primary/20",
            className
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline max-w-[100px] truncate">
            {selectedLabels}
          </span>
          {isActive && (
            <Badge
              variant="secondary"
              className="ml-1 h-4 px-1 text-[10px] rounded-full"
            >
              {selected.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align={align}>
        <div className="p-2 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            {isActive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleClear}
              >
                Effacer
              </Button>
            )}
          </div>
        </div>

        {showSelectAll && options.length > 0 && (
          <div className="p-2 border-b">
            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5"
              onClick={handleSelectAll}
            >
              <Checkbox
                checked={allSelected}
                className="h-4 w-4"
              />
              <span className="text-sm">Tout sélectionner</span>
            </div>
          </div>
        )}

        <ScrollArea style={{ maxHeight }}>
          <div className="p-2 space-y-0.5">
            {options.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              options.map((option) => {
                const isSelected = selected.includes(option.id);
                const OptionIcon = option.icon;

                return (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors",
                      isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                    )}
                    onClick={() => handleToggle(option.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="h-4 w-4"
                    />
                    {option.color && (
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    {OptionIcon && (
                      <OptionIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="flex-1 text-sm truncate">
                      {option.label}
                    </span>
                    {showCounts && option.count !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {option.count}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
