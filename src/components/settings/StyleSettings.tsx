import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Palette, 
  Type, 
  Upload, 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  Trash2,
  RotateCcw,
  Eye,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Predefined color themes
const COLOR_THEMES = [
  { 
    id: "default", 
    name: "Noir & Blanc", 
    primary: "0 0% 4%", 
    accent: "262 83% 58%",
    preview: { bg: "#fafafa", fg: "#0a0a0a", accent: "#7c3aed" }
  },
  { 
    id: "ocean", 
    name: "Océan", 
    primary: "217 91% 60%", 
    accent: "199 89% 48%",
    preview: { bg: "#f0f9ff", fg: "#0369a1", accent: "#0ea5e9" }
  },
  { 
    id: "forest", 
    name: "Forêt", 
    primary: "142 76% 36%", 
    accent: "158 64% 52%",
    preview: { bg: "#f0fdf4", fg: "#166534", accent: "#22c55e" }
  },
  { 
    id: "sunset", 
    name: "Crépuscule", 
    primary: "24 95% 53%", 
    accent: "338 78% 52%",
    preview: { bg: "#fff7ed", fg: "#c2410c", accent: "#ec4899" }
  },
  { 
    id: "purple", 
    name: "Violet", 
    primary: "262 83% 58%", 
    accent: "280 65% 60%",
    preview: { bg: "#faf5ff", fg: "#7c3aed", accent: "#a855f7" }
  },
  { 
    id: "rose", 
    name: "Rose", 
    primary: "346 77% 50%", 
    accent: "328 85% 70%",
    preview: { bg: "#fff1f2", fg: "#be123c", accent: "#f472b6" }
  },
];

// Predefined font options
const FONT_OPTIONS = [
  { id: "inter", name: "Inter", family: "'Inter', sans-serif", style: "Moderne" },
  { id: "roboto", name: "Roboto", family: "'Roboto', sans-serif", style: "Clean" },
  { id: "poppins", name: "Poppins", family: "'Poppins', sans-serif", style: "Géométrique" },
  { id: "nunito", name: "Nunito", family: "'Nunito', sans-serif", style: "Arrondi" },
  { id: "playfair", name: "Playfair Display", family: "'Playfair Display', serif", style: "Élégant" },
  { id: "source-sans", name: "Source Sans Pro", family: "'Source Sans Pro', sans-serif", style: "Pro" },
  { id: "dm-sans", name: "DM Sans", family: "'DM Sans', sans-serif", style: "Sharp" },
  { id: "space-grotesk", name: "Space Grotesk", family: "'Space Grotesk', sans-serif", style: "Tech" },
];

interface CustomFont {
  id: string;
  name: string;
  fileName: string;
  fontFamily: string;
}

type ThemeMode = "light" | "dark" | "system";

export function StyleSettings() {
  // Theme state
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") return "dark";
    if (saved === "light") return "light";
    return "system";
  });
  const [selectedColorTheme, setSelectedColorTheme] = useState("default");
  
  // Typography state
  const [headingFont, setHeadingFont] = useState("inter");
  const [bodyFont, setBodyFont] = useState("inter");
  const [baseFontSize, setBaseFontSize] = useState([14]);
  const [fontWeight, setFontWeight] = useState("400");
  
  // Custom fonts state
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [isUploadingFont, setIsUploadingFont] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI options
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [borderRadius, setBorderRadius] = useState([8]);

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

  // Handle color theme change
  const handleColorThemeChange = (themeId: string) => {
    setSelectedColorTheme(themeId);
    const theme = COLOR_THEMES.find(t => t.id === themeId);
    if (theme) {
      document.documentElement.style.setProperty("--primary", theme.primary);
      document.documentElement.style.setProperty("--accent", theme.accent);
      localStorage.setItem("color-theme", themeId);
      toast.success(`Thème "${theme.name}" appliqué`);
    }
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
      
      // Create a blob URL for the font
      const fontUrl = URL.createObjectURL(file);
      
      // Create and load the font face
      const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);
      await fontFace.load();
      document.fonts.add(fontFace);
      
      const newFont: CustomFont = {
        id: crypto.randomUUID(),
        name: fontName.replace(/-/g, " "),
        fileName: file.name,
        fontFamily: fontFamily,
      };
      
      setCustomFonts(prev => [...prev, newFont]);
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
    setCustomFonts(prev => prev.filter(f => f.id !== fontId));
    toast.success("Police supprimée");
  };

  // Apply font changes
  const applyFontChanges = () => {
    const headingFontData = FONT_OPTIONS.find(f => f.id === headingFont) || 
                           customFonts.find(f => f.id === headingFont);
    const bodyFontData = FONT_OPTIONS.find(f => f.id === bodyFont) || 
                        customFonts.find(f => f.id === bodyFont);

    if (headingFontData) {
      const family = 'fontFamily' in headingFontData ? headingFontData.fontFamily : headingFontData.family;
      document.documentElement.style.setProperty("--font-heading", family);
    }
    if (bodyFontData) {
      const family = 'fontFamily' in bodyFontData ? bodyFontData.fontFamily : bodyFontData.family;
      document.documentElement.style.setProperty("--font-body", family);
    }
    document.documentElement.style.setProperty("--font-size-base", `${baseFontSize[0]}px`);
    document.documentElement.style.setProperty("--radius", `${borderRadius[0]}px`);
    
    toast.success("Typographie mise à jour");
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setSelectedColorTheme("default");
    setThemeMode("system");
    setHeadingFont("inter");
    setBodyFont("inter");
    setBaseFontSize([14]);
    setFontWeight("400");
    setEnableAnimations(true);
    setCompactMode(false);
    setBorderRadius([8]);
    
    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--accent");
    document.documentElement.style.removeProperty("--font-heading");
    document.documentElement.style.removeProperty("--font-body");
    document.documentElement.style.removeProperty("--font-size-base");
    document.documentElement.style.setProperty("--radius", "0.5rem");
    
    localStorage.removeItem("color-theme");
    localStorage.removeItem("theme");
    
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    toast.success("Paramètres réinitialisés");
  };

  // Combined font options for selects
  const allFontOptions = [
    ...FONT_OPTIONS,
    ...customFonts.map(f => ({ id: f.id, name: f.name, family: f.fontFamily, style: "Custom" }))
  ];

  return (
    <div className="space-y-6">
      {/* Theme Mode Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Mode d'affichage
          </CardTitle>
          <CardDescription>
            Choisissez entre le mode clair, sombre ou automatique
          </CardDescription>
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

      {/* Color Theme Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Thème de couleurs
          </CardTitle>
          <CardDescription>
            Personnalisez les couleurs principales de l'interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COLOR_THEMES.map((theme) => (
              <motion.button
                key={theme.id}
                onClick={() => handleColorThemeChange(theme.id)}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all text-left",
                  selectedColorTheme === theme.id 
                    ? "border-primary ring-2 ring-primary/20" 
                    : "border-border hover:border-muted-foreground/30"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Color preview circles */}
                <div className="flex gap-1.5 mb-3">
                  <div 
                    className="w-6 h-6 rounded-full border border-black/10"
                    style={{ backgroundColor: theme.preview.bg }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: theme.preview.fg }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: theme.preview.accent }}
                  />
                </div>
                <p className="font-medium text-sm">{theme.name}</p>
                {selectedColorTheme === theme.id && (
                  <motion.div 
                    className="absolute top-2 right-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Check className="h-4 w-4 text-primary" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Typographie
          </CardTitle>
          <CardDescription>
            Personnalisez les polices et tailles de texte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Font selections */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Police des titres</Label>
              <Select value={headingFont} onValueChange={setHeadingFont}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une police" />
                </SelectTrigger>
                <SelectContent>
                  {allFontOptions.map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span style={{ fontFamily: font.family }}>{font.name}</span>
                        <Badge variant="secondary" className="text-2xs">
                          {font.style}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Police du corps</Label>
              <Select value={bodyFont} onValueChange={setBodyFont}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une police" />
                </SelectTrigger>
                <SelectContent>
                  {allFontOptions.map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span style={{ fontFamily: font.family }}>{font.name}</span>
                        <Badge variant="secondary" className="text-2xs">
                          {font.style}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Font size slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Taille de base</Label>
              <span className="text-sm text-muted-foreground">{baseFontSize[0]}px</span>
            </div>
            <Slider
              value={baseFontSize}
              onValueChange={setBaseFontSize}
              min={12}
              max={18}
              step={1}
              className="w-full"
            />
          </div>

          {/* Border radius slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Arrondis</Label>
              <span className="text-sm text-muted-foreground">{borderRadius[0]}px</span>
            </div>
            <Slider
              value={borderRadius}
              onValueChange={setBorderRadius}
              min={0}
              max={16}
              step={2}
              className="w-full"
            />
          </div>

          <Button onClick={applyFontChanges} className="w-full sm:w-auto">
            <Eye className="h-4 w-4 mr-2" />
            Appliquer la typographie
          </Button>
        </CardContent>
      </Card>

      {/* Custom Fonts Card */}
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
          {/* Upload button */}
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

          {/* Custom fonts list */}
          <AnimatePresence>
            {customFonts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {customFonts.map((font) => (
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

          {customFonts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune police personnalisée. Uploadez une police pour la voir ici.
            </p>
          )}
        </CardContent>
      </Card>

      {/* UI Options Card */}
      <Card>
        <CardHeader>
          <CardTitle>Options d'interface</CardTitle>
          <CardDescription>
            Ajustez le comportement de l'interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Animations</Label>
              <p className="text-sm text-muted-foreground">
                Activer les animations et transitions
              </p>
            </div>
            <Switch 
              checked={enableAnimations} 
              onCheckedChange={setEnableAnimations}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mode compact</Label>
              <p className="text-sm text-muted-foreground">
                Réduire les espacements pour plus de contenu
              </p>
            </div>
            <Switch 
              checked={compactMode} 
              onCheckedChange={setCompactMode}
            />
          </div>
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
