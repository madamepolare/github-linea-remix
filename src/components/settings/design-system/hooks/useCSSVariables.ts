import { useState, useCallback, useEffect } from "react";

interface CSSVariable {
  name: string;
  value: string;
  defaultValue: string;
  category: "color" | "size" | "shadow" | "font" | "other";
}

// Extract CSS variables from :root
const extractCSSVariables = (): Record<string, string> => {
  const styles = getComputedStyle(document.documentElement);
  const variables: Record<string, string> = {};
  
  // Get all CSS custom properties
  const cssText = document.documentElement.style.cssText;
  const rootStyles = document.styleSheets[0]?.cssRules;
  
  // Common CSS variables we want to track
  const variableNames = [
    "--background", "--foreground", "--card", "--card-foreground",
    "--popover", "--popover-foreground", "--primary", "--primary-foreground",
    "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
    "--accent", "--accent-foreground", "--destructive", "--destructive-foreground",
    "--border", "--input", "--ring", "--radius",
    "--surface", "--surface-foreground",
    "--text-primary", "--text-secondary", "--text-tertiary", "--text-muted",
    "--success", "--success-foreground", "--warning", "--warning-foreground",
    "--info", "--info-foreground",
    "--shadow-xs", "--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-xl",
    "--shadow-card", "--shadow-card-hover",
    "--sidebar-background", "--sidebar-foreground", "--sidebar-primary",
    "--sidebar-primary-foreground", "--sidebar-accent", "--sidebar-accent-foreground",
    "--sidebar-border", "--sidebar-ring", "--sidebar-muted",
    "--sidebar-width", "--sidebar-width-collapsed",
    "--font-heading", "--font-body", "--font-size-base",
    "--font-weight-heading", "--font-weight-body",
  ];
  
  variableNames.forEach((name) => {
    const value = styles.getPropertyValue(name).trim();
    if (value) {
      variables[name] = value;
    }
  });
  
  return variables;
};

// Default CSS variable values (from index.css :root)
const DEFAULT_VALUES: Record<string, string> = {
  "--background": "0 0% 100%",
  "--foreground": "0 0% 4%",
  "--card": "0 0% 100%",
  "--card-foreground": "0 0% 4%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "0 0% 4%",
  "--primary": "0 0% 4%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "0 0% 96%",
  "--secondary-foreground": "0 0% 4%",
  "--muted": "0 0% 96%",
  "--muted-foreground": "0 0% 45%",
  "--accent": "262 83% 58%",
  "--accent-foreground": "0 0% 100%",
  "--destructive": "0 84% 60%",
  "--destructive-foreground": "0 0% 100%",
  "--border": "0 0% 90%",
  "--input": "0 0% 90%",
  "--ring": "0 0% 4%",
  "--radius": "0.5rem",
  "--surface": "0 0% 98%",
  "--surface-foreground": "0 0% 4%",
  "--text-primary": "0 0% 4%",
  "--text-secondary": "0 0% 40%",
  "--text-tertiary": "0 0% 55%",
  "--text-muted": "0 0% 65%",
  "--success": "152 69% 40%",
  "--success-foreground": "0 0% 100%",
  "--warning": "38 92% 50%",
  "--warning-foreground": "0 0% 4%",
  "--info": "217 91% 60%",
  "--info-foreground": "0 0% 100%",
};

export function useCSSVariables() {
  const [variables, setVariables] = useState<Record<string, string>>(() => extractCSSVariables());
  const [modifications, setModifications] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<Array<Record<string, string>>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Get current value (modified or original)
  const getValue = useCallback((variableName: string): string => {
    return modifications[variableName] ?? variables[variableName] ?? DEFAULT_VALUES[variableName] ?? "";
  }, [modifications, variables]);

  // Set a CSS variable value
  const setValue = useCallback((variableName: string, value: string) => {
    // Apply to DOM immediately
    document.documentElement.style.setProperty(variableName, value);
    
    // Track modification
    setModifications((prev) => {
      const newMods = { ...prev, [variableName]: value };
      
      // Add to history for undo/redo
      setHistory((h) => [...h.slice(0, historyIndex + 1), newMods]);
      setHistoryIndex((i) => i + 1);
      
      return newMods;
    });
  }, [historyIndex]);

  // Reset a single variable to default
  const resetValue = useCallback((variableName: string) => {
    const defaultValue = DEFAULT_VALUES[variableName] ?? variables[variableName];
    if (defaultValue) {
      document.documentElement.style.setProperty(variableName, defaultValue);
      setModifications((prev) => {
        const newMods = { ...prev };
        delete newMods[variableName];
        return newMods;
      });
    }
  }, [variables]);

  // Reset all modifications
  const resetAll = useCallback(() => {
    Object.keys(modifications).forEach((varName) => {
      const defaultValue = DEFAULT_VALUES[varName] ?? variables[varName];
      if (defaultValue) {
        document.documentElement.style.setProperty(varName, defaultValue);
      }
    });
    setModifications({});
    setHistory([]);
    setHistoryIndex(-1);
  }, [modifications, variables]);

  // Undo last change
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevMods = history[historyIndex - 1];
      Object.entries(prevMods).forEach(([varName, value]) => {
        document.documentElement.style.setProperty(varName, value);
      });
      setModifications(prevMods);
      setHistoryIndex((i) => i - 1);
    } else if (historyIndex === 0) {
      resetAll();
    }
  }, [historyIndex, history, resetAll]);

  // Redo last undone change
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextMods = history[historyIndex + 1];
      Object.entries(nextMods).forEach(([varName, value]) => {
        document.documentElement.style.setProperty(varName, value);
      });
      setModifications(nextMods);
      setHistoryIndex((i) => i + 1);
    }
  }, [historyIndex, history]);

  // Export current modifications as CSS
  const exportCSS = useCallback((): string => {
    if (Object.keys(modifications).length === 0) {
      return "/* No modifications to export */";
    }
    
    const cssLines = Object.entries(modifications)
      .map(([varName, value]) => `  ${varName}: ${value};`)
      .join("\n");
    
    return `:root {\n${cssLines}\n}`;
  }, [modifications]);

  // Check if there are unsaved modifications
  const hasModifications = Object.keys(modifications).length > 0;
  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    variables,
    modifications,
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
  };
}
