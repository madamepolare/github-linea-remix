import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TypographySection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Échelle typographique
            <Badge variant="secondary">Headings</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-baseline gap-4 pb-4 border-b">
              <h1>Heading 1</h1>
              <code className="text-xs text-muted-foreground">text-2xl sm:text-3xl font-semibold</code>
            </div>
            <div className="flex items-baseline gap-4 pb-4 border-b">
              <h2>Heading 2</h2>
              <code className="text-xs text-muted-foreground">text-xl sm:text-2xl font-semibold</code>
            </div>
            <div className="flex items-baseline gap-4 pb-4 border-b">
              <h3>Heading 3</h3>
              <code className="text-xs text-muted-foreground">text-lg sm:text-xl font-semibold</code>
            </div>
            <div className="flex items-baseline gap-4 pb-4 border-b">
              <h4>Heading 4</h4>
              <code className="text-xs text-muted-foreground">text-base font-semibold</code>
            </div>
            <div className="flex items-baseline gap-4 pb-4 border-b">
              <h5>Heading 5</h5>
              <code className="text-xs text-muted-foreground">text-sm font-semibold</code>
            </div>
            <div className="flex items-baseline gap-4">
              <h6>Heading 6</h6>
              <code className="text-xs text-muted-foreground">text-xs font-semibold</code>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Corps de texte
            <Badge variant="secondary">Body</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="pb-4 border-b">
              <p className="text-base mb-2">Paragraphe base (text-base)</p>
              <code className="text-xs text-muted-foreground">Ceci est un exemple de texte paragraphe avec la taille par défaut.</code>
            </div>
            <div className="pb-4 border-b">
              <p className="text-sm mb-2">Paragraphe small (text-sm)</p>
              <code className="text-xs text-muted-foreground">Ceci est un exemple de texte plus petit pour les descriptions.</code>
            </div>
            <div className="pb-4 border-b">
              <p className="text-xs mb-2">Texte extra small (text-xs)</p>
              <code className="text-xs text-muted-foreground">Pour les labels et les métadonnées.</code>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Classes utilitaires
            <Badge variant="secondary">Utilities</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 pb-3 border-b">
            <span className="text-primary-content font-medium">text-primary-content</span>
            <code className="text-xs text-muted-foreground">Texte principal</code>
          </div>
          <div className="flex items-center gap-4 pb-3 border-b">
            <span className="text-secondary-content">text-secondary-content</span>
            <code className="text-xs text-muted-foreground">Texte secondaire</code>
          </div>
          <div className="flex items-center gap-4 pb-3 border-b">
            <span className="text-tertiary">text-tertiary</span>
            <code className="text-xs text-muted-foreground">Texte tertiaire</code>
          </div>
          <div className="flex items-center gap-4 pb-3 border-b">
            <span className="text-muted-foreground">text-muted-foreground</span>
            <code className="text-xs text-muted-foreground">Texte atténué</code>
          </div>
          <div className="flex items-center gap-4">
            <span className="label-sm">LABEL-SM</span>
            <code className="text-xs text-muted-foreground">Labels et catégories</code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Poids de police
            <Badge variant="secondary">Font Weight</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 pb-3 border-b">
            <span className="font-light text-lg">Light (300)</span>
            <code className="text-xs text-muted-foreground">font-light</code>
          </div>
          <div className="flex items-center gap-4 pb-3 border-b">
            <span className="font-normal text-lg">Normal (400)</span>
            <code className="text-xs text-muted-foreground">font-normal</code>
          </div>
          <div className="flex items-center gap-4 pb-3 border-b">
            <span className="font-medium text-lg">Medium (500)</span>
            <code className="text-xs text-muted-foreground">font-medium</code>
          </div>
          <div className="flex items-center gap-4 pb-3 border-b">
            <span className="font-semibold text-lg">Semibold (600)</span>
            <code className="text-xs text-muted-foreground">font-semibold</code>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg">Bold (700)</span>
            <code className="text-xs text-muted-foreground">font-bold</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
