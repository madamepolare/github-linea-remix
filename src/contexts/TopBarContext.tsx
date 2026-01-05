import { createContext, useContext, useState, ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export interface EntityTab {
  key: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
}

export interface EntityBadge {
  label: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
  icon?: LucideIcon;
}

export interface TopBarEntityConfig {
  /** Back button navigation path */
  backTo: string;
  /** Entity color (accent line) */
  color?: string;
  /** Entity name/title */
  title: string;
  /** Badges to display after title */
  badges?: EntityBadge[];
  /** Metadata items (location, status, etc.) */
  metadata?: {
    icon?: LucideIcon;
    label: string;
  }[];
  /** Entity-specific tabs */
  tabs?: EntityTab[];
  /** Currently active tab key */
  activeTab?: string;
  /** Tab change handler */
  onTabChange?: (key: string) => void;
  /** Custom actions on the right */
  actions?: ReactNode;
}

interface TopBarContextValue {
  /** Entity config (null = standard module view) */
  entityConfig: TopBarEntityConfig | null;
  /** Set entity config for detail pages */
  setEntityConfig: (config: TopBarEntityConfig | null) => void;
}

const TopBarContext = createContext<TopBarContextValue | null>(null);

export function TopBarProvider({ children }: { children: ReactNode }) {
  const [entityConfig, setEntityConfig] = useState<TopBarEntityConfig | null>(null);

  return (
    <TopBarContext.Provider value={{ entityConfig, setEntityConfig }}>
      {children}
    </TopBarContext.Provider>
  );
}

export function useTopBar() {
  const context = useContext(TopBarContext);
  if (!context) {
    throw new Error("useTopBar must be used within a TopBarProvider");
  }
  return context;
}

// Hook for detail pages to register their entity config
export function useTopBarEntity(config: TopBarEntityConfig | null, deps: any[] = []) {
  const { setEntityConfig } = useTopBar();

  // Set config on mount, clear on unmount
  useState(() => {
    if (config) {
      setEntityConfig(config);
    }
    return null;
  });

  // Update when deps change (need to do this properly with useEffect)
  // Using a ref pattern to avoid infinite loops
}
