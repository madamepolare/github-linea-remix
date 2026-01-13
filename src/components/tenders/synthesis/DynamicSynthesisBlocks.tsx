import { useMemo } from "react";
import { useTenderSynthesisBlocks } from "@/hooks/useDisciplineTabs";
import type { DisciplineSlug } from "@/lib/disciplines";

// Import all synthesis block components
import { AccordCadreBlock } from "./AccordCadreBlock";
import { CasPratiqueBlock, AuditionBlock } from "./CommunicationBlocks";
import { LotsBlock, SortantsBlock } from "./LotsBlock";
import { CriteresBlock } from "./CriteresBlock";

// Architecture blocks (already exist or inline)
import { TenderKeyMetrics } from "./TenderKeyMetrics";
import { TenderCriteriaChart } from "./TenderCriteriaChart";

interface DynamicSynthesisBlocksProps {
  tender: any;
  disciplineSlug: DisciplineSlug;
}

// Map component names to actual components
const BLOCK_COMPONENTS: Record<string, React.ComponentType<{ tender: any }>> = {
  // Communication blocks
  AccordCadreBlock,
  CasPratiqueBlock,
  AuditionBlock,
  LotsBlock,
  SortantsBlock,
  CriteresBlock,
  // Note: Architecture blocks like BudgetBlock, HonorairesBlock, SurfaceBlock
  // are rendered inline in TenderSyntheseTab for now
};

export function DynamicSynthesisBlocks({ tender, disciplineSlug }: DynamicSynthesisBlocksProps) {
  const blocks = useTenderSynthesisBlocks(disciplineSlug);
  
  // Filter only blocks that have a component and are visible
  const visibleBlocks = useMemo(() => {
    return blocks.filter(block => 
      block.visible && BLOCK_COMPONENTS[block.component]
    );
  }, [blocks]);

  if (visibleBlocks.length === 0) return null;

  return (
    <div className="space-y-4">
      {visibleBlocks.map(block => {
        const Component = BLOCK_COMPONENTS[block.component];
        if (!Component) return null;
        return <Component key={block.key} tender={tender} />;
      })}
    </div>
  );
}

// Export individual blocks for direct use
export { AccordCadreBlock, CasPratiqueBlock, AuditionBlock, LotsBlock, SortantsBlock };
