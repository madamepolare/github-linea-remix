import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { RotateCcw, Copy, Check } from "lucide-react";

interface ColorPickerProps {
  label: string;
  value: string; // HSL format: "262 83% 58%"
  onChange: (value: string) => void;
  onReset?: () => void;
  showReset?: boolean;
  className?: string;
}

// Parse HSL string "h s% l%" to object
function parseHSL(hslString: string): { h: number; s: number; l: number } {
  const match = hslString.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%?\s+(\d+(?:\.\d+)?)%?/);
  if (match) {
    return {
      h: parseFloat(match[1]),
      s: parseFloat(match[2]),
      l: parseFloat(match[3]),
    };
  }
  return { h: 0, s: 0, l: 50 };
}

// Convert HSL object to string
function toHSLString(h: number, s: number, l: number): string {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

// Convert HSL to CSS hsl() for preview
function toHSLCSS(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function ColorPicker({
  label,
  value,
  onChange,
  onReset,
  showReset = true,
  className,
}: ColorPickerProps) {
  const [hsl, setHSL] = useState(() => parseHSL(value));
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setHSL(parseHSL(value));
  }, [value]);

  const handleChange = useCallback((newHSL: { h: number; s: number; l: number }) => {
    setHSL(newHSL);
    onChange(toHSLString(newHSL.h, newHSL.s, newHSL.l));
  }, [onChange]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(toHSLString(hsl.h, hsl.s, hsl.l));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [hsl]);

  const previewColor = toHSLCSS(hsl.h, hsl.s, hsl.l);

  return (
    <div className={cn("space-y-2", className)}>
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
            title="Copier la valeur"
          >
            {copied ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="w-full h-10 rounded-md border border-input flex items-center gap-2 px-2 hover:border-foreground/30 transition-colors"
          >
            <div
              className="w-6 h-6 rounded border border-border shrink-0"
              style={{ backgroundColor: previewColor }}
            />
            <span className="text-xs font-mono text-muted-foreground truncate">
              {toHSLString(hsl.h, hsl.s, hsl.l)}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4 space-y-4" align="start">
          {/* Color preview */}
          <div
            className="w-full h-20 rounded-lg border border-border"
            style={{ backgroundColor: previewColor }}
          />
          
          {/* Hue slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Teinte (H)</Label>
              <span className="text-xs text-muted-foreground">{Math.round(hsl.h)}°</span>
            </div>
            <Slider
              value={[hsl.h]}
              onValueChange={([h]) => handleChange({ ...hsl, h })}
              max={360}
              step={1}
              className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
              style={{
                background: `linear-gradient(to right, 
                  hsl(0, ${hsl.s}%, ${hsl.l}%), 
                  hsl(60, ${hsl.s}%, ${hsl.l}%), 
                  hsl(120, ${hsl.s}%, ${hsl.l}%), 
                  hsl(180, ${hsl.s}%, ${hsl.l}%), 
                  hsl(240, ${hsl.s}%, ${hsl.l}%), 
                  hsl(300, ${hsl.s}%, ${hsl.l}%), 
                  hsl(360, ${hsl.s}%, ${hsl.l}%))`,
              }}
            />
          </div>
          
          {/* Saturation slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Saturation (S)</Label>
              <span className="text-xs text-muted-foreground">{Math.round(hsl.s)}%</span>
            </div>
            <Slider
              value={[hsl.s]}
              onValueChange={([s]) => handleChange({ ...hsl, s })}
              max={100}
              step={1}
              className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
              style={{
                background: `linear-gradient(to right, 
                  hsl(${hsl.h}, 0%, ${hsl.l}%), 
                  hsl(${hsl.h}, 100%, ${hsl.l}%))`,
              }}
            />
          </div>
          
          {/* Lightness slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Luminosité (L)</Label>
              <span className="text-xs text-muted-foreground">{Math.round(hsl.l)}%</span>
            </div>
            <Slider
              value={[hsl.l]}
              onValueChange={([l]) => handleChange({ ...hsl, l })}
              max={100}
              step={1}
              className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
              style={{
                background: `linear-gradient(to right, 
                  hsl(${hsl.h}, ${hsl.s}%, 0%), 
                  hsl(${hsl.h}, ${hsl.s}%, 50%), 
                  hsl(${hsl.h}, ${hsl.s}%, 100%))`,
              }}
            />
          </div>
          
          {/* Manual input */}
          <div className="space-y-2">
            <Label className="text-xs">Valeur HSL</Label>
            <Input
              value={toHSLString(hsl.h, hsl.s, hsl.l)}
              onChange={(e) => {
                const parsed = parseHSL(e.target.value);
                handleChange(parsed);
              }}
              className="font-mono text-xs h-8"
              placeholder="262 83% 58%"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
