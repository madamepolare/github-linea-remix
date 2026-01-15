import { useState, useCallback } from "react";

export interface StyleProperty {
  id: string;
  label: string;
  type: "color" | "size" | "select" | "number" | "text";
  cssVariable?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface ComponentStyle {
  componentName: string;
  filePath: string;
  usedIn: string[];
  properties: StyleProperty[];
}

export function useStyleEditor() {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [editedStyles, setEditedStyles] = useState<Record<string, Record<string, string>>>({});

  // Apply a style change to DOM
  const applyStyle = useCallback((variable: string, value: string) => {
    document.documentElement.style.setProperty(variable, value);
  }, []);

  // Set a component-specific style
  const setComponentStyle = useCallback((componentId: string, property: string, value: string) => {
    setEditedStyles((prev) => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        [property]: value,
      },
    }));
  }, []);

  // Get component styles
  const getComponentStyles = useCallback((componentId: string): Record<string, string> => {
    return editedStyles[componentId] ?? {};
  }, [editedStyles]);

  // Reset component styles
  const resetComponentStyles = useCallback((componentId: string) => {
    setEditedStyles((prev) => {
      const newStyles = { ...prev };
      delete newStyles[componentId];
      return newStyles;
    });
  }, []);

  // Reset all styles
  const resetAllStyles = useCallback(() => {
    // Remove all inline styles from document root
    const root = document.documentElement;
    root.style.cssText = "";
    setEditedStyles({});
  }, []);

  // Export styles as CSS
  const exportStyles = useCallback((): string => {
    const lines: string[] = [];
    
    // Export global CSS variables
    const rootStyles = document.documentElement.style.cssText;
    if (rootStyles) {
      lines.push(":root {");
      rootStyles.split(";").filter(Boolean).forEach((style) => {
        lines.push(`  ${style.trim()};`);
      });
      lines.push("}");
    }
    
    return lines.join("\n") || "/* No style modifications */";
  }, []);

  // Copy styles to clipboard
  const copyToClipboard = useCallback(async () => {
    const css = exportStyles();
    await navigator.clipboard.writeText(css);
    return css;
  }, [exportStyles]);

  return {
    activeComponent,
    setActiveComponent,
    editedStyles,
    applyStyle,
    setComponentStyle,
    getComponentStyles,
    resetComponentStyles,
    resetAllStyles,
    exportStyles,
    copyToClipboard,
  };
}
