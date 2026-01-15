import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ColorPicker, SpacingEditor, ShadowEditor } from "./editors";
import { useCSSVariables } from "./hooks/useCSSVariables";
import { 
  Download, 
  RotateCcw, 
  Undo2, 
  Redo2, 
  Copy,
  Check,
  Palette,
  Box,
  Type,
  Layers
} from "lucide-react";
import { toast } from "sonner";

const COLOR_TOKENS = {
  core: [
    { name: "--background", label: "Background" },
    { name: "--foreground", label: "Foreground" },
    { name: "--card", label: "Card" },
    { name: "--card-foreground", label: "Card Foreground" },
    { name: "--primary", label: "Primary" },
    { name: "--primary-foreground", label: "Primary Foreground" },
    { name: "--secondary", label: "Secondary" },
    { name: "--secondary-foreground", label: "Secondary Foreground" },
    { name: "--muted", label: "Muted" },
    { name: "--muted-foreground", label: "Muted Foreground" },
    { name: "--accent", label: "Accent" },
    { name: "--accent-foreground", label: "Accent Foreground" },
  ],
  status: [
    { name: "--destructive", label: "Destructive" },
    { name: "--destructive-foreground", label: "Destructive Foreground" },
    { name: "--success", label: "Success" },
    { name: "--success-foreground", label: "Success Foreground" },
    { name: "--warning", label: "Warning" },
    { name: "--warning-foreground", label: "Warning Foreground" },
    { name: "--info", label: "Info" },
    { name: "--info-foreground", label: "Info Foreground" },
  ],
  text: [
    { name: "--text-primary", label: "Text Primary" },
    { name: "--text-secondary", label: "Text Secondary" },
    { name: "--text-tertiary", label: "Text Tertiary" },
    { name: "--text-muted", label: "Text Muted" },
  ],
  ui: [
    { name: "--border", label: "Border" },
    { name: "--input", label: "Input" },
    { name: "--ring", label: "Ring" },
    { name: "--surface", label: "Surface" },
    { name: "--surface-foreground", label: "Surface Foreground" },
  ],
};

const SHADOW_TOKENS = [
  { name: "--shadow-xs", label: "Extra Small" },
  { name: "--shadow-sm", label: "Small" },
  { name: "--shadow-md", label: "Medium" },
  { name: "--shadow-lg", label: "Large" },
  { name: "--shadow-xl", label: "Extra Large" },
  { name: "--shadow-card", label: "Card" },
  { name: "--shadow-card-hover", label: "Card Hover" },
];

export function TokenEditor() {
  const {
    getValue,
    setValue,
    resetValue,
    resetAll,
    undo,
    redo,
    exportCSS,
    hasModifications,
    canUndo,
    canRedo,
  } = useCSSVariables();
  
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    const css = exportCSS();
    const blob = new Blob([css], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design-tokens.css";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSS exporté avec succès");
  };

  const handleCopy = async () => {
    const css = exportCSS();
    await navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("CSS copié dans le presse-papier");
  };

  const handleResetAll = () => {
    resetAll();
    toast.success("Tous les tokens réinitialisés");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {hasModifications && (
                <Badge variant="secondary" className="gap-1">
                  <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                  Modifications non sauvegardées
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                className="gap-1"
              >
                <Undo2 className="h-4 w-4" />
                Annuler
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                className="gap-1"
              >
                <Redo2 className="h-4 w-4" />
                Rétablir
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copier CSS
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-1"
              >
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleResetAll}
                disabled={!hasModifications}
                className="gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token tabs */}
      <Tabs defaultValue="colors" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="colors" className="gap-1">
            <Palette className="h-4 w-4" />
            Couleurs
          </TabsTrigger>
          <TabsTrigger value="shadows" className="gap-1">
            <Layers className="h-4 w-4" />
            Ombres
          </TabsTrigger>
          <TabsTrigger value="spacing" className="gap-1">
            <Box className="h-4 w-4" />
            Espaces
          </TabsTrigger>
          <TabsTrigger value="typography" className="gap-1">
            <Type className="h-4 w-4" />
            Typo
          </TabsTrigger>
        </TabsList>

        {/* Colors */}
        <TabsContent value="colors">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Core colors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Core</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {COLOR_TOKENS.core.map((token) => (
                      <ColorPicker
                        key={token.name}
                        label={token.label}
                        value={getValue(token.name)}
                        onChange={(v) => setValue(token.name, v)}
                        onReset={() => resetValue(token.name)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Status colors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {COLOR_TOKENS.status.map((token) => (
                      <ColorPicker
                        key={token.name}
                        label={token.label}
                        value={getValue(token.name)}
                        onChange={(v) => setValue(token.name, v)}
                        onReset={() => resetValue(token.name)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Text colors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Texte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {COLOR_TOKENS.text.map((token) => (
                    <ColorPicker
                      key={token.name}
                      label={token.label}
                      value={getValue(token.name)}
                      onChange={(v) => setValue(token.name, v)}
                      onReset={() => resetValue(token.name)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* UI colors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Interface</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {COLOR_TOKENS.ui.map((token) => (
                    <ColorPicker
                      key={token.name}
                      label={token.label}
                      value={getValue(token.name)}
                      onChange={(v) => setValue(token.name, v)}
                      onReset={() => resetValue(token.name)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shadows */}
        <TabsContent value="shadows">
          <div className="grid gap-4 md:grid-cols-2">
            {SHADOW_TOKENS.map((token) => (
              <Card key={token.name}>
                <CardContent className="pt-4">
                  <ShadowEditor
                    label={token.label}
                    value={getValue(token.name)}
                    onChange={(v) => setValue(token.name, v)}
                    onReset={() => resetValue(token.name)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Spacing */}
        <TabsContent value="spacing">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Radius & Spacing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <SpacingEditor
                  label="Border Radius (--radius)"
                  value={getValue("--radius")}
                  onChange={(v) => setValue("--radius", v)}
                  onReset={() => resetValue("--radius")}
                  max={2}
                />
                <SpacingEditor
                  label="Sidebar Width (--sidebar-width)"
                  value={getValue("--sidebar-width")}
                  onChange={(v) => setValue("--sidebar-width", v)}
                  onReset={() => resetValue("--sidebar-width")}
                  max={400}
                  step={4}
                />
                <SpacingEditor
                  label="Sidebar Collapsed (--sidebar-width-collapsed)"
                  value={getValue("--sidebar-width-collapsed")}
                  onChange={(v) => setValue("--sidebar-width-collapsed", v)}
                  onReset={() => resetValue("--sidebar-width-collapsed")}
                  max={120}
                  step={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography */}
        <TabsContent value="typography">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Variables typographiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <SpacingEditor
                  label="Font Size Base (--font-size-base)"
                  value={getValue("--font-size-base")}
                  onChange={(v) => setValue("--font-size-base", v)}
                  onReset={() => resetValue("--font-size-base")}
                  max={24}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
