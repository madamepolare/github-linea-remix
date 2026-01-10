import React, { createContext, useContext, useMemo } from 'react';
import { LineFeatureFlags, getLineFeatures, FALLBACK_LINE_FEATURES } from '@/lib/lineFeatureConfig';
import { ContractType } from '@/hooks/useContractTypes';

interface LineFeatureContextValue {
  features: LineFeatureFlags;
  contractType?: ContractType;
}

const LineFeatureContext = createContext<LineFeatureContextValue>({
  features: FALLBACK_LINE_FEATURES,
});

interface LineFeatureProviderProps {
  children: React.ReactNode;
  contractType?: ContractType;
  // Permet de surcharger depuis la DB si le contractType a une config custom
  customFeatures?: Partial<LineFeatureFlags>;
}

export function LineFeatureProvider({ 
  children, 
  contractType,
  customFeatures 
}: LineFeatureProviderProps) {
  const features = useMemo(() => {
    // Récupérer les features par défaut selon le code du type
    const baseFeatures = getLineFeatures(contractType?.code);
    
    // Surcharger avec les features custom si disponibles
    // Note: on pourrait stocker ça dans contractType.line_features en DB
    if (customFeatures) {
      return { ...baseFeatures, ...customFeatures };
    }
    
    return baseFeatures;
  }, [contractType?.code, customFeatures]);

  return (
    <LineFeatureContext.Provider value={{ features, contractType }}>
      {children}
    </LineFeatureContext.Provider>
  );
}

export function useLineFeatures(): LineFeatureFlags {
  const context = useContext(LineFeatureContext);
  return context.features;
}

export function useLineFeatureContext(): LineFeatureContextValue {
  return useContext(LineFeatureContext);
}
