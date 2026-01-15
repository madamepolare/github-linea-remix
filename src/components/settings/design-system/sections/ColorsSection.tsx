import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ColorSwatchProps {
  name: string;
  variable: string;
  className: string;
  textClass?: string;
}

function ColorSwatch({ name, variable, className, textClass = "text-foreground" }: ColorSwatchProps) {
  return (
    <div className="space-y-2">
      <div className={`h-16 rounded-lg border ${className}`} />
      <div className="space-y-0.5">
        <p className={`text-sm font-medium ${textClass}`}>{name}</p>
        <code className="text-xs text-muted-foreground">{variable}</code>
      </div>
    </div>
  );
}

export function ColorsSection() {
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

  const borderColors = [
    { name: "Border", variable: "--border", className: "bg-border" },
    { name: "Input", variable: "--input", className: "bg-input" },
    { name: "Ring", variable: "--ring", className: "bg-ring" },
  ];

  const textColors = [
    { name: "Text Primary", variable: "--text-primary", className: "text-primary-content" },
    { name: "Text Secondary", variable: "--text-secondary", className: "text-secondary-content" },
    { name: "Text Tertiary", variable: "--text-tertiary", className: "text-tertiary" },
    { name: "Muted Foreground", variable: "--muted-foreground", className: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
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
              <ColorSwatch key={color.variable} {...color} />
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
              <ColorSwatch key={color.variable} {...color} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bordures et contours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {borderColors.map((color) => (
              <ColorSwatch key={color.variable} {...color} />
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
                <div className={`text-lg font-medium ${color.className}`}>
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
    </div>
  );
}
