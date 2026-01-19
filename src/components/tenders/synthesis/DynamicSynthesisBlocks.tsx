import { useMemo } from "react";
import { useTenderSynthesisBlocks } from "@/hooks/useDisciplineTabs";
import type { DisciplineSlug } from "@/lib/disciplines";

// Import all synthesis block components
import { AccordCadreBlock } from "./AccordCadreBlock";
import { CasPratiqueBlock, AuditionBlock } from "./CommunicationBlocks";
import { LotsBlock, SortantsBlock } from "./LotsBlock";
import { CriteresBlock } from "./CriteresBlock";

// Architecture blocks
import { BudgetBlock } from "./BudgetBlock";
import { HonorairesBlock } from "./HonorairesBlock";
import { SurfaceBlock } from "./SurfaceBlock";
import { MissionsBlock } from "./MissionsBlock";
import { VisiteBlock } from "./VisiteBlock";
import { EquipeRequisBlock } from "./EquipeRequisBlock";

interface DynamicSynthesisBlocksProps {
  tender: any;
  disciplineSlug: DisciplineSlug;
  onNavigateToTab?: (tab: string) => void;
}

// Map component names to actual components
const BLOCK_COMPONENTS: Record<string, React.ComponentType<{ tender: any; onNavigateToTab?: (tab: string) => void }>> = {
  // Architecture blocks
  BudgetBlock,
  HonorairesBlock,
  SurfaceBlock,
  MissionsBlock,
  VisiteBlock,
  EquipeRequisBlock,
  // Communication blocks
  AccordCadreBlock,
  CasPratiqueBlock,
  AuditionBlock,
  LotsBlock,
  SortantsBlock,
  AnciensTitulairesBlock: SortantsBlock,
  // Shared blocks
  CriteresBlock,
};

export function DynamicSynthesisBlocks({ tender, disciplineSlug, onNavigateToTab }: DynamicSynthesisBlocksProps) {
  const blocks = useTenderSynthesisBlocks(disciplineSlug);
  
  // Filter only blocks that have a component and are visible
  const visibleBlocks = useMemo(() => {
    return blocks.filter(block => 
      block.visible && BLOCK_COMPONENTS[block.component]
    );
  }, [blocks]);

  if (visibleBlocks.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {visibleBlocks.map(block => {
        const Component = BLOCK_COMPONENTS[block.component];
        if (!Component) return null;
        return <Component key={block.key} tender={tender} onNavigateToTab={onNavigateToTab} />;
      })}
    </div>
  );
}

// Export individual blocks for direct use
export { 
  AccordCadreBlock, 
  CasPratiqueBlock, 
  AuditionBlock, 
  LotsBlock, 
  SortantsBlock,
  BudgetBlock,
  HonorairesBlock,
  SurfaceBlock,
  MissionsBlock,
  VisiteBlock,
  EquipeRequisBlock,
};
