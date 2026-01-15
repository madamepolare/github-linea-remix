import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RotateCcw, Copy, Check } from "lucide-react";

interface ShadowEditorProps {
  label: string;
  value: string; // e.g., "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  onChange: (value: string) => void;
  onReset?: () => void;
  showReset?: boolean;
  className?: string;
}

interface ShadowValues {
  x: number;
  y: number;
  blur: number;
  spread: number;
  opacity: number;
}

function parseShadow(shadow: string): ShadowValues {
  // Parse simple shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  const match = shadow.match(/([\d.-]+)px?\s+([\d.-]+)px?\s+([\d.-]+)px?\s+([\d.-]+)px?\s+rgba?\([^)]*,\s*([\d.]+)\)?/);
  if (match) {
    return {
      x: parseFloat(match[1]) || 0,
      y: parseFloat(match[2]) || 0,
      blur: parseFloat(match[3]) || 0,
      spread: parseFloat(match[4]) || 0,
      opacity: parseFloat(match[5]) || 0.1,
    };
  }
  
  // Try simpler format
  const simpleMatch = shadow.match(/([\d.-]+)\s+([\d.-]+)px?\s+([\d.-]+)px?/);
  if (simpleMatch) {
    return {
      x: parseFloat(simpleMatch[1]) || 0,
      y: parseFloat(simpleMatch[2]) || 0,
      blur: parseFloat(simpleMatch[3]) || 0,
      spread: 0,
      opacity: 0.1,
    };
  }
  
  return { x: 0, y: 4, blur: 6, spread: -1, opacity: 0.1 };
}

function toShadowString(values: ShadowValues): string {
  return `${values.x}px ${values.y}px ${values.blur}px ${values.spread}px rgba(0, 0, 0, ${values.opacity})`;
}

export function ShadowEditor({
  label,
  value,
  onChange,
  onReset,
  showReset = true,
  className,
}: ShadowEditorProps) {
  const [values, setValues] = useState<ShadowValues>(() => parseShadow(value));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setValues(parseShadow(value));
  }, [value]);

  const handleChange = (key: keyof ShadowValues, val: number) => {
    const newValues = { ...values, [key]: val };
    setValues(newValues);
    onChange(toShadowString(newValues));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(toShadowString(values));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        <div className="flex items-center gap-1">
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
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
            title="Copier"
          >
            {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>
      
      {/* Shadow preview */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div
          className="w-full h-16 bg-card rounded-lg border"
          style={{ boxShadow: toShadowString(values) }}
        />
      </div>
      
      {/* X Offset */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">X Offset</Label>
          <span className="text-xs font-mono">{values.x}px</span>
        </div>
        <Slider
          value={[values.x]}
          onValueChange={([v]) => handleChange("x", v)}
          min={-20}
          max={20}
          step={1}
          className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
        />
      </div>
      
      {/* Y Offset */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Y Offset</Label>
          <span className="text-xs font-mono">{values.y}px</span>
        </div>
        <Slider
          value={[values.y]}
          onValueChange={([v]) => handleChange("y", v)}
          min={-20}
          max={30}
          step={1}
          className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
        />
      </div>
      
      {/* Blur */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Blur</Label>
          <span className="text-xs font-mono">{values.blur}px</span>
        </div>
        <Slider
          value={[values.blur]}
          onValueChange={([v]) => handleChange("blur", v)}
          min={0}
          max={50}
          step={1}
          className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
        />
      </div>
      
      {/* Spread */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Spread</Label>
          <span className="text-xs font-mono">{values.spread}px</span>
        </div>
        <Slider
          value={[values.spread]}
          onValueChange={([v]) => handleChange("spread", v)}
          min={-10}
          max={20}
          step={1}
          className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
        />
      </div>
      
      {/* Opacity */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Opacité</Label>
          <span className="text-xs font-mono">{(values.opacity * 100).toFixed(0)}%</span>
        </div>
        <Slider
          value={[values.opacity * 100]}
          onValueChange={([v]) => handleChange("opacity", v / 100)}
          min={0}
          max={50}
          step={1}
          className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
        />
      </div>
      
      {/* Raw value */}
      <div className="pt-2 border-t">
        <Input
          value={toShadowString(values)}
          onChange={(e) => {
            const parsed = parseShadow(e.target.value);
            setValues(parsed);
            onChange(e.target.value);
          }}
          className="font-mono text-xs h-8"
        />
      </div>
    </div>
  );
}
