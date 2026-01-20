import { useState } from "react";
import { Calendar, Clock, CalendarDays, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, isToday, isThisWeek, isThisMonth, isPast, addDays } from "date-fns";
import { fr } from "date-fns/locale";

interface DatePreset {
  id: string;
  label: string;
  icon?: React.ElementType;
  getValue: () => { from?: Date; to?: Date } | null;
}

const defaultPresets: DatePreset[] = [
  {
    id: "today",
    label: "Aujourd'hui",
    icon: Clock,
    getValue: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { from: today, to: end };
    },
  },
  {
    id: "this_week",
    label: "Cette semaine",
    icon: CalendarDays,
    getValue: () => {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay() + 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { from: start, to: end };
    },
  },
  {
    id: "this_month",
    label: "Ce mois",
    icon: CalendarRange,
    getValue: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { from: start, to: end };
    },
  },
  {
    id: "overdue",
    label: "En retard",
    icon: Clock,
    getValue: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return { to: addDays(today, -1) };
    },
  },
];

interface DateRangeFilterProps {
  icon?: React.ElementType;
  label: string;
  value: string | null; // preset id or "custom"
  dateRange?: { from?: Date; to?: Date };
  onChange: (presetId: string | null, range?: { from?: Date; to?: Date }) => void;
  presets?: DatePreset[];
  showCalendar?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
}

export function DateRangeFilter({
  icon: Icon = Calendar,
  label,
  value,
  dateRange,
  onChange,
  presets = defaultPresets,
  showCalendar = true,
  className,
  align = "start",
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const isActive = value !== null;
  const activePreset = presets.find((p) => p.id === value);

  const displayLabel = activePreset?.label || (value === "custom" ? "Personnalisé" : label);

  const handlePresetSelect = (preset: DatePreset) => {
    const range = preset.getValue();
    onChange(preset.id, range || undefined);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setShowCustom(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange("custom", { from: date, to: date });
    }
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
            {displayLabel}
          </span>
          {isActive && (
            <Badge
              variant="secondary"
              className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20"
            >
              ✓
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
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

        {!showCustom && (
          <div className="p-2 space-y-0.5">
            {presets.map((preset) => {
              const PresetIcon = preset.icon || Calendar;
              const isSelected = value === preset.id;

              return (
                <div
                  key={preset.id}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors",
                    isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                  )}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <PresetIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 text-sm">{preset.label}</span>
                  {isSelected && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showCalendar && (
          <>
            <div className="border-t px-2 py-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm h-8"
                onClick={() => setShowCustom(!showCustom)}
              >
                <Calendar className="h-3.5 w-3.5 mr-2" />
                {showCustom ? "Voir les raccourcis" : "Choisir une date"}
              </Button>
            </div>

            {showCustom && (
              <div className="border-t p-2">
                <CalendarComponent
                  mode="single"
                  selected={dateRange?.from}
                  onSelect={handleDateSelect}
                  locale={fr}
                  className="rounded-md"
                />
              </div>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
