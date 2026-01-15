import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPicker } from "../editors/ColorPicker";
import { useCSSVariables } from "../hooks/useCSSVariables";
import { Copy, Check, Download, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ColorSwatchProps {
  name: string;
  variable: string;
  className: string;
  editable?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onReset?: () => void;
}

function ColorSwatch({ 
  name, 
  variable, 
  className, 
  editable,
  value,
  onChange,
  onReset 
}: ColorSwatchProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-2">
      <div 
        className={`h-16 rounded-lg border ${className} cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all`}
        onClick={() => editable && setIsEditing(!isEditing)}
      />
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{name}</p>
        <code className="text-xs text-muted-foreground">{variable}</code>
      </div>
      {isEditing && editable && value && onChange && (
        <div className="pt-2">
          <ColorPicker
            label=""
            value={value}
            onChange={onChange}
            onReset={onReset}
            showReset={!!onReset}
          />
        </div>
      )}
    </div>
  );
}

export function ColorsSection() {
  const { getValue, setValue, resetValue, exportCSS, hasModifications, resetAll } = useCSSVariables();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const css = exportCSS();
    await navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("CSS copié");
  };

  const coreColors = [
    { name: "Background", variable: "--background", className: "bg-background" },
    { name: "Foreground", variable: "--foreground", className: "bg-foreground" },
    { name: "Primary", variable: "--primary", className: "bg-primary" },
    { name: "Secondary", variable: "--secondary", className: "bg-secondary" },
    { name: "Muted", variable: "--muted", className: "bg-muted" },
    { name: "Accent", variable: "--accent", className: "bg-accent" },
    { name: "Card", variable: "--card", className: "bg-card" },
    { name: "Popover", variable: "--popover", className: "bg-popover" },
  ];

  const statusColors = [
    { name: "Destructive", variable: "--destructive", className: "bg-destructive" },
    { name: "Success", variable: "--success", className: "bg-success" },
    { name: "Warning", variable: "--warning", className: "bg-warning" },
    { name: "Info", variable: "--info", className: "bg-info" },
  ];

  const textColors = [
    { name: "Text Primary", variable: "--text-primary", className: "text-primary-content" },
    { name: "Text Secondary", variable: "--text-secondary", className: "text-secondary-content" },
    { name: "Text Tertiary", variable: "--text-tertiary", className: "text-tertiary" },
    { name: "Muted Foreground", variable: "--muted-foreground", className: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      {hasModifications && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                <span className="text-sm text-warning">Modifications non sauvegardées</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copier CSS
                </Button>
                <Button variant="outline" size="sm" onClick={resetAll} className="gap-1">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="view" className="space-y-4">
        <TabsList>
          <TabsTrigger value="view">Visualisation</TabsTrigger>
          <TabsTrigger value="edit">Édition</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Couleurs de base
                <Badge variant="secondary">index.css</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                {coreColors.map((color) => (
                  <ColorSwatch 
                    key={color.variable} 
                    {...color} 
                    editable
                    value={getValue(color.variable)}
                    onChange={(v) => setValue(color.variable, v)}
                    onReset={() => resetValue(color.variable)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Couleurs de statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {statusColors.map((color) => (
                  <ColorSwatch 
                    key={color.variable} 
                    {...color}
                    editable
                    value={getValue(color.variable)}
                    onChange={(v) => setValue(color.variable, v)}
                    onReset={() => resetValue(color.variable)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hiérarchie de texte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {textColors.map((color) => (
                  <div key={color.variable} className="flex items-center gap-4">
                    <div className={`text-lg font-medium ${color.className} flex-1`}>
                      Exemple de texte
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {color.name}
                    </Badge>
                    <code className="text-xs text-muted-foreground">{color.variable}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...coreColors, ...statusColors].map((color) => (
              <Card key={color.variable}>
                <CardContent className="pt-4">
                  <ColorPicker
                    label={color.name}
                    value={getValue(color.variable)}
                    onChange={(v) => setValue(color.variable, v)}
                    onReset={() => resetValue(color.variable)}
                  />
                  <div className={`h-8 rounded mt-3 ${color.className}`} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
