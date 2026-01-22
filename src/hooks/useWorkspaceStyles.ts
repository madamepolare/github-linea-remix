import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Predefined font options with Google Fonts URL
export const FONT_OPTIONS = [
  { id: "inter", name: "Inter", family: "'Inter', sans-serif", style: "Moderne", googleUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" },
  { id: "roboto", name: "Roboto", family: "'Roboto', sans-serif", style: "Clean", googleUrl: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" },
  { id: "poppins", name: "Poppins", family: "'Poppins', sans-serif", style: "Géométrique", googleUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" },
  { id: "nunito", name: "Nunito", family: "'Nunito', sans-serif", style: "Arrondi", googleUrl: "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap" },
  { id: "playfair", name: "Playfair Display", family: "'Playfair Display', serif", style: "Élégant", googleUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" },
  { id: "source-sans", name: "Source Sans 3", family: "'Source Sans 3', sans-serif", style: "Pro", googleUrl: "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&display=swap" },
  { id: "dm-sans", name: "DM Sans", family: "'DM Sans', sans-serif", style: "Sharp", googleUrl: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" },
  { id: "space-grotesk", name: "Space Grotesk", family: "'Space Grotesk', sans-serif", style: "Tech", googleUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" },
];

export const COLOR_THEMES = [
  { id: "default", name: "Noir & Blanc", primary: "0 0% 4%", accent: "262 83% 58%", preview: { bg: "#fafafa", fg: "#0a0a0a", accent: "#7c3aed" } },
  { id: "ocean", name: "Océan", primary: "217 91% 60%", accent: "199 89% 48%", preview: { bg: "#f0f9ff", fg: "#0369a1", accent: "#0ea5e9" } },
  { id: "forest", name: "Forêt", primary: "142 76% 36%", accent: "158 64% 52%", preview: { bg: "#f0fdf4", fg: "#166534", accent: "#22c55e" } },
  { id: "sunset", name: "Crépuscule", primary: "24 95% 53%", accent: "338 78% 52%", preview: { bg: "#fff7ed", fg: "#c2410c", accent: "#ec4899" } },
  { id: "purple", name: "Violet", primary: "262 83% 58%", accent: "280 65% 60%", preview: { bg: "#faf5ff", fg: "#7c3aed", accent: "#a855f7" } },
  { id: "rose", name: "Rose", primary: "346 77% 50%", accent: "328 85% 70%", preview: { bg: "#fff1f2", fg: "#be123c", accent: "#f472b6" } },
];

export interface CustomFont {
  id: string;
  name: string;
  fileName: string;
  fontFamily: string;
  dataUrl?: string; // Base64 encoded font data for persistence
}

export interface StyleSettings {
  headingFont: string;
  bodyFont: string;
  baseFontSize: number;
  headingWeight: string;
  bodyWeight: string;
  borderRadius: number;
  colorTheme: string;
  customFonts: CustomFont[];
}

const DEFAULT_STYLE_SETTINGS: StyleSettings = {
  headingFont: "inter",
  bodyFont: "inter",
  baseFontSize: 14,
  headingWeight: "600",
  bodyWeight: "400",
  borderRadius: 8,
  colorTheme: "default",
  customFonts: [],
};

// Load a Google Font dynamically
function loadGoogleFont(fontData: (typeof FONT_OPTIONS)[number]) {
  const existingLink = document.querySelector(`link[href="${fontData.googleUrl}"]`);
  if (!existingLink) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontData.googleUrl;
    document.head.appendChild(link);
  }
}

// Load a custom font from base64 data
async function loadCustomFont(font: CustomFont) {
  if (!font.dataUrl) return;
  
  try {
    // Check if font is already loaded
    const existingFont = Array.from(document.fonts).find(f => f.family === font.fontFamily);
    if (existingFont) return;
    
    const fontFace = new FontFace(font.fontFamily, `url(${font.dataUrl})`);
    await fontFace.load();
    document.fonts.add(fontFace);
  } catch (error) {
    console.error(`Failed to load custom font ${font.name}:`, error);
  }
}

// Apply styles to the document
export function applyStyles(settings: StyleSettings) {
  const root = document.documentElement;
  
  // Apply color theme
  const theme = COLOR_THEMES.find(t => t.id === settings.colorTheme);
  if (theme) {
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--accent", theme.accent);
  }
  
  // Apply typography - scale root font size (affects all rem-based sizes)
  // Base is 16px, so we calculate a percentage multiplier
  const fontSizePercent = (settings.baseFontSize / 16) * 100;
  root.style.fontSize = `${fontSizePercent}%`;
  
  root.style.setProperty("--font-weight-heading", settings.headingWeight);
  root.style.setProperty("--font-weight-body", settings.bodyWeight);
  root.style.setProperty("--radius", `${settings.borderRadius}px`);
  
  // Load and apply heading font
  const headingFontData = FONT_OPTIONS.find(f => f.id === settings.headingFont);
  const customHeadingFont = settings.customFonts.find(f => f.id === settings.headingFont);
  
  if (headingFontData) {
    loadGoogleFont(headingFontData);
    root.style.setProperty("--font-heading", headingFontData.family);
  } else if (customHeadingFont) {
    loadCustomFont(customHeadingFont);
    root.style.setProperty("--font-heading", `'${customHeadingFont.fontFamily}', sans-serif`);
  }
  
  // Load and apply body font
  const bodyFontData = FONT_OPTIONS.find(f => f.id === settings.bodyFont);
  const customBodyFont = settings.customFonts.find(f => f.id === settings.bodyFont);
  
  if (bodyFontData) {
    loadGoogleFont(bodyFontData);
    root.style.setProperty("--font-body", bodyFontData.family);
  } else if (customBodyFont) {
    loadCustomFont(customBodyFont);
    root.style.setProperty("--font-body", `'${customBodyFont.fontFamily}', sans-serif`);
  }
  
  // Load all custom fonts (so they're available in selectors)
  settings.customFonts.forEach(font => loadCustomFont(font));
}

export function useWorkspaceStyles() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: styleSettings, isLoading } = useQuery({
    queryKey: ["workspace-styles", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return DEFAULT_STYLE_SETTINGS;
      
      const { data, error } = await supabase
        .from("workspaces")
        .select("style_settings")
        .eq("id", activeWorkspace.id)
        .single();
      
      if (error) throw error;
      
      // Merge with defaults to ensure all fields exist
      const settings = {
        ...DEFAULT_STYLE_SETTINGS,
        ...(data?.style_settings as Partial<StyleSettings> || {}),
      };
      
      return settings;
    },
    enabled: !!activeWorkspace?.id,
  });
  
  // Apply styles when they change
  useEffect(() => {
    if (styleSettings) {
      applyStyles(styleSettings);
    }
  }, [styleSettings]);
  
  const updateStyles = useMutation({
    mutationFn: async (newSettings: Partial<StyleSettings>) => {
      if (!activeWorkspace?.id) throw new Error("No active workspace");
      
      const mergedSettings = {
        ...styleSettings,
        ...newSettings,
      };
      
      const { error } = await supabase
        .from("workspaces")
        .update({ style_settings: JSON.parse(JSON.stringify(mergedSettings)) })
        .eq("id", activeWorkspace.id);
      
      if (error) throw error;
      
      return mergedSettings;
    },
    onSuccess: (newSettings) => {
      queryClient.setQueryData(["workspace-styles", activeWorkspace?.id], newSettings);
      applyStyles(newSettings as StyleSettings);
    },
  });
  
  return {
    styleSettings: styleSettings || DEFAULT_STYLE_SETTINGS,
    isLoading,
    updateStyles,
  };
}

// Hook to apply styles on app init (call once at app root level)
export function useApplyWorkspaceStyles() {
  const { styleSettings, isLoading } = useWorkspaceStyles();
  
  useEffect(() => {
    if (!isLoading && styleSettings) {
      applyStyles(styleSettings);
    }
  }, [styleSettings, isLoading]);
}
