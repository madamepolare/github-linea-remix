import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DurationInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const QUICK_DURATIONS = [
  { value: "0.25", label: "15m" },
  { value: "0.5", label: "30m" },
  { value: "1", label: "1h" },
  { value: "2", label: "2h" },
  { value: "4", label: "4h" },
  { value: "8", label: "1j" },
];

export function DurationInput({ value, onChange, className, placeholder = "Durée" }: DurationInputProps) {
  const [inputMode, setInputMode] = useState<"buttons" | "manual">("buttons");
  
  // Check if value matches a quick duration
  const isQuickValue = QUICK_DURATIONS.some(d => d.value === value);
  
  useEffect(() => {
    // If value doesn't match quick durations, show manual input
    if (value && !isQuickValue) {
      setInputMode("manual");
    }
  }, [value, isQuickValue]);

  const formatDisplayValue = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "";
    if (num < 1) return `${Math.round(num * 60)}m`;
    return `${num}h`;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Quick duration buttons */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_DURATIONS.map((duration) => (
          <Button
            key={duration.value}
            type="button"
            variant={value === duration.value ? "default" : "outline"}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => {
              onChange(duration.value);
              setInputMode("buttons");
            }}
          >
            {duration.label}
          </Button>
        ))}
        <Button
          type="button"
          variant={inputMode === "manual" && !isQuickValue ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => setInputMode("manual")}
        >
          Autre
        </Button>
      </div>
      
      {/* Manual input */}
      {inputMode === "manual" && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.25"
            min="0.25"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-8 text-sm"
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            heures {value && `(${formatDisplayValue(value)})`}
          </span>
        </div>
      )}
    </div>
  );
}