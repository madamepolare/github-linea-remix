// Unified Quote Lines Tab - Single view with per-line pricing mode (% or fixed)

import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { QuoteLinesEditor } from './QuoteLinesEditor';

interface QuoteFeesAndLinesTabProps {
  document: Partial<QuoteDocument>;
  onDocumentChange: (doc: Partial<QuoteDocument>) => void;
  lines: QuoteLine[];
  onLinesChange: (lines: QuoteLine[]) => void;
  showFeesSubTab?: boolean; // Deprecated - kept for backward compatibility
}

export function QuoteFeesAndLinesTab({
  document,
  onDocumentChange,
  lines,
  onLinesChange,
}: QuoteFeesAndLinesTabProps) {
  return (
    <QuoteLinesEditor
      lines={lines}
      onLinesChange={onLinesChange}
      document={document}
      onDocumentChange={onDocumentChange}
    />
  );
}
