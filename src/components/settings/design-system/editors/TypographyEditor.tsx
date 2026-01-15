import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

interface TypographyEditorProps {
  label: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  fontFamily?: string;
  onFontSizeChange?: (value: string) => void;
  onFontWeightChange?: (value: string) => void;
  onLineHeightChange?: (value: string) => void;
  onLetterSpacingChange?: (value: string) => void;
  onFontFamilyChange?: (value: string) => void;
  onReset?: () => void;
  showReset?: boolean;
  className?: string;
}

const FONT_WEIGHTS = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
];

const FONT_FAMILIES = [
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'SF Pro Display', sans-serif", label: "SF Pro" },
  { value: "'Roboto', sans-serif", label: "Roboto" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" },
  { value: "'Lato', sans-serif", label: "Lato" },
  { value: "system-ui, sans-serif", label: "System UI" },
];

export function TypographyEditor({
  label,
  fontSize = "14px",
  fontWeight = "400",
  lineHeight = "1.5",
  letterSpacing = "0em",
  fontFamily = "'Inter', sans-serif",
  onFontSizeChange,
  onFontWeightChange,
  onLineHeightChange,
  onLetterSpacingChange,
  onFontFamilyChange,
  onReset,
  showReset = true,
  className,
}: TypographyEditorProps) {
  const parsedFontSize = parseFloat(fontSize) || 14;
  const parsedLineHeight = parseFloat(lineHeight) || 1.5;
  const parsedLetterSpacing = parseFloat(letterSpacing) || 0;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
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
      
      {/* Preview */}
      <div
        className="p-4 bg-muted/30 rounded-lg border"
        style={{
          fontSize,
          fontWeight,
          lineHeight,
          letterSpacing,
          fontFamily,
        }}
      >
        <p className="text-foreground">
          Aperçu du texte
        </p>
        <p className="text-muted-foreground">
          The quick brown fox jumps over the lazy dog.
        </p>
      </div>
      
      {/* Font Family */}
      {onFontFamilyChange && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Police</Label>
          <Select value={fontFamily} onValueChange={onFontFamilyChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Font Size */}
      {onFontSizeChange && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Taille</Label>
            <span className="text-xs font-mono">{parsedFontSize}px</span>
          </div>
          <Slider
            value={[parsedFontSize]}
            onValueChange={([v]) => onFontSizeChange(`${v}px`)}
            min={10}
            max={48}
            step={1}
            className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
          />
        </div>
      )}
      
      {/* Font Weight */}
      {onFontWeightChange && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Graisse</Label>
          <Select value={fontWeight} onValueChange={onFontWeightChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map((weight) => (
                <SelectItem key={weight.value} value={weight.value}>
                  <span style={{ fontWeight: weight.value }}>{weight.label} ({weight.value})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Line Height */}
      {onLineHeightChange && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Hauteur de ligne</Label>
            <span className="text-xs font-mono">{parsedLineHeight}</span>
          </div>
          <Slider
            value={[parsedLineHeight * 10]}
            onValueChange={([v]) => onLineHeightChange((v / 10).toString())}
            min={10}
            max={30}
            step={1}
            className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
          />
        </div>
      )}
      
      {/* Letter Spacing */}
      {onLetterSpacingChange && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Espacement lettres</Label>
            <span className="text-xs font-mono">{parsedLetterSpacing}em</span>
          </div>
          <Slider
            value={[(parsedLetterSpacing + 0.1) * 100]}
            onValueChange={([v]) => onLetterSpacingChange(`${(v / 100 - 0.1).toFixed(3)}em`)}
            min={0}
            max={30}
            step={1}
            className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
          />
        </div>
      )}
    </div>
  );
}
