import { useRef, useState } from "react";
import { useWorkspaceStyles, FONT_OPTIONS, COLOR_THEMES, CustomFont } from "@/hooks/useWorkspaceStyles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingState, StandardCard, StatsCard } from "@/components/ui/patterns";
import { 
  TrendingUp, Users, FileText, Upload, Trash2, Type, Check, Sun, Moon, Monitor, 
  Palette, RotateCcw 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type ThemeMode = "light" | "dark" | "system";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFont, setIsUploadingFont] = useState(false);
  
  // Theme mode (local per user)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") return "dark";
    if (saved === "light") return "light";
    return "system";
  });

  if (isLoading) {
    return <LoadingState variant="spinner" text="Chargement des paramètres..." />;
  }

  // Handle theme mode change
  const handleThemeModeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    const root = document.documentElement;
    
    if (mode === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else if (mode === "light") {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      localStorage.removeItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
    toast.success(`Mode ${mode === "light" ? "clair" : mode === "dark" ? "sombre" : "système"} activé`);
  };

  // Font stack helper
  const fontStack = (family: string, fallback: string) => {
    const normalized = family.startsWith("'") || family.startsWith('"') ? family : `'${family}'`;
    return `${normalized}, ${fallback}`;
  };

  // Handle font upload
  const handleFontUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validExtensions = [".otf", ".ttf", ".woff", ".woff2"];
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(extension)) {
      toast.error("Format non supporté. Utilisez OTF, TTF, WOFF ou WOFF2.");
      return;
    }

    setIsUploadingFont(true);

    try {
      const fontName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "-");
      const fontFamily = `custom-${fontName}`;

      const format = (() => {
        switch (extension) {
          case ".otf": return "opentype";
          case ".ttf": return "truetype";
          case ".woff": return "woff";
          case ".woff2": return "woff2";
          default: return undefined;
        }
      })();

      // Create a blob URL for the font
      const fontUrl = URL.createObjectURL(file);

      // Create and load the font face
      const src = format ? `url(${fontUrl}) format('${format}')` : `url(${fontUrl})`;
      const fontFace = new FontFace(fontFamily, src, { style: "normal", weight: "100 900" });
      await fontFace.load();
      document.fonts.add(fontFace);

      const newFont: CustomFont = {
        id: crypto.randomUUID(),
        name: fontName.replace(/-/g, " "),
        fileName: file.name,
        fontFamily: fontFamily,
      };

      const updatedFonts = [...(styleSettings.customFonts || []), newFont];
      updateStyles.mutate({ customFonts: updatedFonts });
      toast.success(`Police "${newFont.name}" ajoutée avec succès`);
    } catch (error) {
      console.error("Font upload error:", error);
      toast.error("Erreur lors du chargement de la police");
    } finally {
      setIsUploadingFont(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove custom font
  const removeCustomFont = (fontId: string) => {
    const updatedFonts = (styleSettings.customFonts || []).filter(f => f.id !== fontId);
    updateStyles.mutate({ customFonts: updatedFonts });
    toast.success("Police supprimée");
  };

  // Combined font options
  const allFontOptions = [
    ...FONT_OPTIONS,
    ...(styleSettings.customFonts || []).map((f) => ({ 
      id: f.id, 
      name: f.name, 
      family: fontStack(f.fontFamily, "sans-serif"), 
      style: "Custom",
      googleUrl: "" 
    })),
  ];

  // Reset to defaults
  const resetToDefaults = () => {
    updateStyles.mutate({
      headingFont: "inter",
      bodyFont: "inter",
      baseFontSize: 16,
      headingWeight: "600",
      bodyWeight: "400",
      borderRadius: 8,
      colorTheme: "default",
    });
    
    handleThemeModeChange("system");
    toast.success("Paramètres réinitialisés");
  };

  return (
    <div className="space-y-8">
      {/* Theme Mode Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Mode d'affichage
          </CardTitle>
          <CardDescription>Choisissez entre le mode clair, sombre ou automatique.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {[
              { mode: "light" as ThemeMode, icon: Sun, label: "Clair" },
              { mode: "dark" as ThemeMode, icon: Moon, label: "Sombre" },
              { mode: "system" as ThemeMode, icon: Monitor, label: "Système" },
            ].map(({ mode, icon: Icon, label }) => (
              <motion.button
                key={mode}
                onClick={() => handleThemeModeChange(mode)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all",
                  themeMode === mode 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-muted-foreground/30"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium text-sm">{label}</span>
                {themeMode === mode && (
                  <Check className="h-4 w-4 text-primary ml-1" />
                )}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

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
                  {allFontOptions.map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: font.family }}>{font.name}</span>
                        {font.style === "Custom" && (
                          <Badge variant="secondary" className="text-2xs">Custom</Badge>
                        )}
                      </div>
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
                  {allFontOptions.map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: font.family }}>{font.name}</span>
                        {font.style === "Custom" && (
                          <Badge variant="secondary" className="text-2xs">Custom</Badge>
                        )}
                      </div>
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

      {/* Custom Fonts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Polices personnalisées
          </CardTitle>
          <CardDescription>
            Uploadez vos propres polices (OTF, TTF, WOFF, WOFF2)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".otf,.ttf,.woff,.woff2"
              onChange={handleFontUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFont}
            >
              {isUploadingFont ? (
                <>
                  <motion.div
                    className="h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Chargement...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Ajouter une police
                </>
              )}
            </Button>
          </div>

          <AnimatePresence>
            {(styleSettings.customFonts || []).length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {(styleSettings.customFonts || []).map((font) => (
                  <motion.div
                    key={font.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                        <Type className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p 
                          className="font-medium text-sm"
                          style={{ fontFamily: font.fontFamily }}
                        >
                          {font.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{font.fileName}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomFont(font.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {(styleSettings.customFonts || []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune police personnalisée. Uploadez une police pour la voir ici.
            </p>
          )}
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

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={resetToDefaults}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser les paramètres
        </Button>
      </div>
    </div>
  );
}
