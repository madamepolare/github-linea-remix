import { ReactNode, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileCode, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComponentShowcaseProps {
  name: string;
  description?: string;
  filePath: string;
  children: ReactNode;
  variants?: { name: string; render: ReactNode }[];
  importStatement?: string;
  className?: string;
}

export function ComponentShowcase({
  name,
  description,
  filePath,
  children,
  variants,
  importStatement,
  className,
}: ComponentShowcaseProps) {
  const [copied, setCopied] = useState(false);
  const [darkPreview, setDarkPreview] = useState(false);

  const handleCopyImport = () => {
    if (importStatement) {
      navigator.clipboard.writeText(importStatement);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-base">{name}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setDarkPreview(!darkPreview)}
              title={darkPreview ? "Mode clair" : "Mode sombre"}
            >
              {darkPreview ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="font-mono text-xs">
            <FileCode className="h-3 w-3 mr-1" />
            {filePath}
          </Badge>
          {importStatement && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1"
              onClick={handleCopyImport}
            >
              {copied ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              Copier import
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview area */}
        <div
          className={cn(
            "rounded-lg border p-6 transition-colors",
            darkPreview ? "bg-[#0f0f0f] border-[#262626]" : "bg-muted/30"
          )}
        >
          <div className={darkPreview ? "dark" : ""}>{children}</div>
        </div>

        {/* Variants */}
        {variants && variants.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Variantes
            </h4>
            <div className="grid gap-3">
              {variants.map((variant) => (
                <div key={variant.name} className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    {variant.name}
                  </Badge>
                  <div
                    className={cn(
                      "rounded-lg border p-4 transition-colors",
                      darkPreview
                        ? "bg-[#0f0f0f] border-[#262626]"
                        : "bg-muted/30"
                    )}
                  >
                    <div className={darkPreview ? "dark" : ""}>
                      {variant.render}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
