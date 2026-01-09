import React, { createContext, useContext, ReactNode } from "react";
import { useDiscipline } from "@/hooks/useDiscipline";
import { DisciplineTerminology, DisciplineSlug, getTerminology } from "@/lib/disciplinesConfig";

interface TerminologyContextType {
  t: DisciplineTerminology;
  discipline: DisciplineSlug;
}

const TerminologyContext = createContext<TerminologyContextType | undefined>(undefined);

export function TerminologyProvider({ children }: { children: ReactNode }) {
  const { disciplineSlug, terminology } = useDiscipline();

  return (
    <TerminologyContext.Provider value={{ t: terminology, discipline: disciplineSlug }}>
      {children}
    </TerminologyContext.Provider>
  );
}

export function useT(): DisciplineTerminology {
  const context = useContext(TerminologyContext);
  if (context === undefined) {
    // Fallback to architecture terminology if used outside provider
    return getTerminology('architecture');
  }
  return context.t;
}

export function useDisciplineContext(): TerminologyContextType {
  const context = useContext(TerminologyContext);
  if (context === undefined) {
    return { t: getTerminology('architecture'), discipline: 'architecture' };
  }
  return context;
}
