import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "./editors/ColorPicker";
import { SpacingEditor } from "./editors/SpacingEditor";
import { useCSSVariables } from "./hooks/useCSSVariables";
import { 
  Settings2, 
  Eye, 
  Code,
  RotateCcw,
  Copy,
  Check,
  FileCode,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EditableProperty {
  id: string;
  label: string;
  type: "color" | "spacing" | "radius" | "shadow";
  cssVariable: string;
  description?: string;
}

interface ComponentStyleEditorProps {
  componentName: string;
  filePath: string;
  description?: string;
  usedIn?: string[];
  properties: EditableProperty[];
  children: React.ReactNode;
  variants?: { name: string; render: React.ReactNode }[];
}

export function ComponentStyleEditor({
  componentName,
  filePath,
  description,
  usedIn = [],
  properties,
  children,
  variants = [],
}: ComponentStyleEditorProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [darkPreview, setDarkPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const { getValue, setValue, resetValue } = useCSSVariables();

  const handleCopyPath = async () => {
    await navigator.clipboard.writeText(filePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Chemin copié");
  };

  const handleResetAll = () => {
    properties.forEach((prop) => resetValue(prop.cssVariable));
    toast.success("Styles réinitialisés");
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{componentName}</CardTitle>
              {properties.length > 0 && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Settings2 className="h-3 w-3" />
                  Éditable
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {properties.length > 0 && (
              <div className="flex items-center gap-2">
                <Label htmlFor={`editor-${componentName}`} className="text-xs text-muted-foreground">
                  Éditeur
                </Label>
                <Switch
                  id={`editor-${componentName}`}
                  checked={showEditor}
                  onCheckedChange={setShowEditor}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* File path and usage */}
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 text-xs font-mono"
            onClick={handleCopyPath}
          >
            <FileCode className="h-3 w-3" />
            {filePath}
            {copied ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          {usedIn.length > 0 && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <div className="flex gap-1">
                {usedIn.slice(0, 3).map((usage) => (
                  <Badge key={usage} variant="outline" className="text-xs">
                    {usage}
                  </Badge>
                ))}
                {usedIn.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{usedIn.length - 3}
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          {/* Preview area */}
          <div className={cn("flex-1 rounded-lg border p-6 transition-colors", 
            darkPreview ? "bg-[#0f0f0f] border-[#262626]" : "bg-muted/30"
          )}>
            <div className={darkPreview ? "dark" : ""}>
              {children}
            </div>
          </div>
          
          {/* Editor panel */}
          {showEditor && properties.length > 0 && (
            <div className="w-72 border rounded-lg p-4 bg-card shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">Propriétés</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={handleResetAll}
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
              </div>
              <ScrollArea className="h-[300px] pr-2">
                <div className="space-y-4">
                  {properties.map((prop) => (
                    <div key={prop.id}>
                      {prop.type === "color" && (
                        <ColorPicker
                          label={prop.label}
                          value={getValue(prop.cssVariable)}
                          onChange={(v) => setValue(prop.cssVariable, v)}
                          onReset={() => resetValue(prop.cssVariable)}
                        />
                      )}
                      {(prop.type === "spacing" || prop.type === "radius") && (
                        <SpacingEditor
                          label={prop.label}
                          value={getValue(prop.cssVariable)}
                          onChange={(v) => setValue(prop.cssVariable, v)}
                          onReset={() => resetValue(prop.cssVariable)}
                          max={prop.type === "radius" ? 2 : 4}
                        />
                      )}
                      {prop.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {prop.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        
        {/* Variants */}
        {variants.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Variantes</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {variants.map((variant) => (
                <div key={variant.name} className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    {variant.name}
                  </Badge>
                  <div className={cn(
                    "rounded-lg border p-4 transition-colors",
                    darkPreview ? "bg-[#0f0f0f] border-[#262626]" : "bg-muted/30"
                  )}>
                    <div className={darkPreview ? "dark" : ""}>
                      {variant.render}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Preview controls */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDarkPreview(!darkPreview)}
            className="gap-1 text-xs"
          >
            <Eye className="h-3 w-3" />
            {darkPreview ? "Light mode" : "Dark mode"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
