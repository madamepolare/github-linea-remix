import { useWorkspaceStyles, FONT_OPTIONS, COLOR_THEMES } from "@/hooks/useWorkspaceStyles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingState, StandardCard, StatsCard } from "@/components/ui/patterns";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const SPACING_SCALE = [
  { name: "xs", value: "4px", token: "0.25rem" },
  { name: "sm", value: "8px", token: "0.5rem" },
  { name: "md", value: "12px", token: "0.75rem" },
  { name: "base", value: "16px", token: "1rem" },
  { name: "lg", value: "24px", token: "1.5rem" },
  { name: "xl", value: "32px", token: "2rem" },
  { name: "2xl", value: "48px", token: "3rem" },
];

const SEMANTIC_COLORS = [
  { name: "Background", token: "--background", desc: "Fond principal" },
  { name: "Foreground", token: "--foreground", desc: "Texte principal" },
  { name: "Primary", token: "--primary", desc: "Actions principales" },
  { name: "Secondary", token: "--secondary", desc: "Actions secondaires" },
  { name: "Muted", token: "--muted", desc: "Éléments atténués" },
  { name: "Accent", token: "--accent", desc: "Mise en valeur" },
  { name: "Destructive", token: "--destructive", desc: "Actions dangereuses" },
  { name: "Success", token: "--success", desc: "États de succès" },
  { name: "Warning", token: "--warning", desc: "Avertissements" },
  { name: "Info", token: "--info", desc: "Informations" },
];

const SHADOW_LEVELS = [
  { name: "sm", class: "shadow-sm", desc: "Cartes légères" },
  { name: "base", class: "shadow", desc: "Cartes standard" },
  { name: "md", class: "shadow-md", desc: "Éléments surélevés" },
  { name: "lg", class: "shadow-lg", desc: "Modaux, dropdowns" },
  { name: "xl", class: "shadow-xl", desc: "Sheets, grands modaux" },
];

export function TokenEditor() {
  const { styleSettings, isLoading, updateStyles } = useWorkspaceStyles();

  if (isLoading) {
    return <LoadingState variant="spinner" text="Chargement des paramètres..." />;
  }

  return (
    <div className="space-y-8">
      {/* Typography Section */}
      <Card>
        <CardHeader>
          <CardTitle>Typographie</CardTitle>
          <CardDescription>Polices et tailles de texte utilisées dans l'application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Police des titres</Label>
            <Select
              value={styleSettings.headingFont}
              onValueChange={(value) => updateStyles.mutate({ headingFont: value })}
            >
              <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      <span style={{ fontFamily: font.family }}>{font.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Police du corps</Label>
            <Select
              value={styleSettings.bodyFont}
              onValueChange={(value) => updateStyles.mutate({ bodyFont: value })}
            >
              <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      <span style={{ fontFamily: font.family }}>{font.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Taille de base ({styleSettings.baseFontSize}px)</Label>
            <Slider
              value={[styleSettings.baseFontSize]}
              min={12}
              max={20}
              step={1}
              onValueChange={([value]) => updateStyles.mutate({ baseFontSize: value })}
            />
            <p className="text-xs text-muted-foreground">
              Affecte proportionnellement toutes les tailles de texte.
            </p>
          </div>

          {/* Typography Preview */}
          <div className="p-4 border rounded-lg space-y-2 bg-muted/30">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Aperçu</p>
            <h1 className="text-3xl font-bold">Titre principal (H1)</h1>
            <h2 className="text-2xl font-semibold">Sous-titre (H2)</h2>
            <h3 className="text-xl font-medium">Section (H3)</h3>
            <p className="text-base">Paragraphe de texte standard avec la police du corps.</p>
            <p className="text-sm text-muted-foreground">Texte secondaire atténué.</p>
          </div>
        </CardContent>
      </Card>

      {/* Spacing Section */}
      <Card>
        <CardHeader>
          <CardTitle>Échelle d'espacement</CardTitle>
          <CardDescription>Grille de 4px pour un espacement cohérent.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {SPACING_SCALE.map((space) => (
              <div key={space.name} className="text-center">
                <div
                  className="bg-primary/20 border border-primary/40 rounded"
                  style={{ width: space.value, height: space.value }}
                />
                <p className="text-xs font-medium mt-1">{space.name}</p>
                <p className="text-xs text-muted-foreground">{space.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Colors Section */}
      <Card>
        <CardHeader>
          <CardTitle>Couleurs sémantiques</CardTitle>
          <CardDescription>Tokens de couleur utilisés dans les composants.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Thème de couleurs</Label>
              <Select
                value={styleSettings.colorTheme}
                onValueChange={(value) => updateStyles.mutate({ colorTheme: value })}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_THEMES.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ background: theme.preview.accent }}
                        />
                        {theme.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {SEMANTIC_COLORS.map((color) => (
                <div key={color.token} className="space-y-1.5">
                  <div
                    className="h-12 rounded-md border"
                    style={{ background: `hsl(var(${color.token}))` }}
                  />
                  <p className="text-xs font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground">{color.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shadows Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ombres</CardTitle>
          <CardDescription>Niveaux d'élévation pour les composants.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {SHADOW_LEVELS.map((shadow) => (
              <div key={shadow.name} className="text-center">
                <div
                  className={cn(
                    "w-20 h-20 rounded-lg bg-card border flex items-center justify-center",
                    shadow.class
                  )}
                >
                  <span className="text-xs font-medium">{shadow.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{shadow.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Border Radius Section */}
      <Card>
        <CardHeader>
          <CardTitle>Coins arrondis</CardTitle>
          <CardDescription>Rayon de bordure appliqué aux éléments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Rayon de base ({styleSettings.borderRadius}px)</Label>
            <Slider
              value={[styleSettings.borderRadius]}
              min={0}
              max={24}
              step={2}
              onValueChange={([value]) => updateStyles.mutate({ borderRadius: value })}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            {[0, 4, 8, 12, 16, 20, 24].map((radius) => (
              <div
                key={radius}
                className={cn(
                  "w-16 h-16 bg-primary/20 border border-primary/40 flex items-center justify-center text-xs",
                  radius === styleSettings.borderRadius && "ring-2 ring-primary"
                )}
                style={{ borderRadius: `${radius}px` }}
              >
                {radius}px
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Aperçu en direct</CardTitle>
          <CardDescription>Visualisez vos modifications sur des composants réels.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              title="Projets actifs"
              value="24"
              description="Ce mois"
              icon={<FileText className="h-4 w-4" />}
              trend={{ value: 8 }}
            />
            <StatsCard
              title="Équipe"
              value="12"
              description="Membres"
              icon={<Users className="h-4 w-4" />}
            />
            <StatsCard
              title="Revenus"
              value="48 200 €"
              description="+15%"
              icon={<TrendingUp className="h-4 w-4" />}
              trend={{ value: 15 }}
            />
          </div>

          <StandardCard
            title="Exemple de carte standard"
            description="Avec description et actions"
            headerActions={
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Annuler</Button>
                <Button size="sm">Enregistrer</Button>
              </div>
            }
          >
            <p className="text-muted-foreground">
              Ce contenu utilise les tokens de couleur et d'espacement du design system.
              Les modifications sont appliquées en temps réel.
            </p>
          </StandardCard>
        </CardContent>
      </Card>
    </div>
  );
}
