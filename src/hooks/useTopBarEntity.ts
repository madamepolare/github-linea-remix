import { useEffect } from "react";
import { useTopBar, TopBarEntityConfig } from "@/contexts/TopBarContext";

/**
 * Hook for detail pages to register their entity configuration with the TopBar.
 * The TopBar will transform from module view to entity view when config is set.
 * 
 * @param config - Entity configuration or null to use standard module view
 */
export function useTopBarEntity(config: TopBarEntityConfig | null) {
  const { setEntityConfig } = useTopBar();

  useEffect(() => {
    setEntityConfig(config);
    
    // Clear entity config on unmount
    return () => {
      setEntityConfig(null);
    };
  }, [config, setEntityConfig]);
}
