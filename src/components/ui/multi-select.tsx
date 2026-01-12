import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface MultiSelectOption {
  value: string;
  label: string;
  color?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  maxDisplayed?: number;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Sélectionner...",
  className,
  maxDisplayed = 2,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedLabels = selected
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean) as string[];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between h-8 text-xs font-normal min-w-[120px]",
            selected.length === 0 && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
            {selected.length === 0 ? (
              placeholder
            ) : selected.length <= maxDisplayed ? (
              <div className="flex gap-1 flex-wrap">
                {selectedLabels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-[10px] px-1 py-0 h-5">
                    {label}
                  </Badge>
                ))}
              </div>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {selected.length} sélectionnés
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {selected.length > 0 && (
              <X
                className="h-3 w-3 opacity-50 hover:opacity-100"
                onClick={clearAll}
              />
            )}
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <ScrollArea className="max-h-[200px]">
          <div className="p-1">
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent/50"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {option.color && (
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
            {options.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune option
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
