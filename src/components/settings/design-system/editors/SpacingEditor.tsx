import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

interface SpacingEditorProps {
  label: string;
  value: string; // e.g., "0.5rem", "8px", "1em"
  onChange: (value: string) => void;
  onReset?: () => void;
  showReset?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

type Unit = "rem" | "px" | "em" | "%";

function parseValue(value: string): { num: number; unit: Unit } {
  const match = value.match(/^([\d.]+)(rem|px|em|%)$/);
  if (match) {
    return { num: parseFloat(match[1]), unit: match[2] as Unit };
  }
  return { num: 0.5, unit: "rem" };
}

export function SpacingEditor({
  label,
  value,
  onChange,
  onReset,
  showReset = true,
  min = 0,
  max = 4,
  step = 0.125,
  className,
}: SpacingEditorProps) {
  const [parsed, setParsed] = useState(() => parseValue(value));

  useEffect(() => {
    setParsed(parseValue(value));
  }, [value]);

  const handleNumChange = (num: number) => {
    setParsed((prev) => ({ ...prev, num }));
    onChange(`${num}${parsed.unit}`);
  };

  const handleUnitChange = (unit: Unit) => {
    setParsed((prev) => ({ ...prev, unit }));
    onChange(`${parsed.num}${unit}`);
  };

  // Adjust max based on unit
  const effectiveMax = parsed.unit === "px" ? 64 : parsed.unit === "%" ? 100 : max;
  const effectiveStep = parsed.unit === "px" ? 1 : step;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        {showReset && onReset && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onReset}
            title="Réinitialiser"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Slider
            value={[parsed.num]}
            onValueChange={([num]) => handleNumChange(num)}
            min={min}
            max={effectiveMax}
            step={effectiveStep}
            className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
          />
        </div>
        
        <Input
          type="number"
          value={parsed.num}
          onChange={(e) => handleNumChange(parseFloat(e.target.value) || 0)}
          className="w-16 h-8 text-xs font-mono"
          min={min}
          max={effectiveMax}
          step={effectiveStep}
        />
        
        <Select value={parsed.unit} onValueChange={(v) => handleUnitChange(v as Unit)}>
          <SelectTrigger className="w-16 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rem">rem</SelectItem>
            <SelectItem value="px">px</SelectItem>
            <SelectItem value="em">em</SelectItem>
            <SelectItem value="%">%</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Preview box */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div 
          className="h-4 bg-foreground/20 rounded"
          style={{ width: `${parsed.num}${parsed.unit}` }}
        />
        <span className="font-mono">{parsed.num}{parsed.unit}</span>
      </div>
    </div>
  );
}
