/* =============================================================================
   UI PATTERN COMPONENTS
   
   These are opinionated wrappers around base shadcn/ui primitives.
   Use these instead of importing from the base components directly.
   
   DECISION TREE:
   ┌─────────────────────┬────────────────────┐
   │ Action              │ Component          │
   ├─────────────────────┼────────────────────┤
   │ View details        │ DetailSheet        │
   │ Create/Edit form    │ FormDialog         │
   │ Confirmation        │ ConfirmDialog      │
   │ Delete action       │ DeleteDialog       │
   │ Display content     │ StandardCard       │
   │ Loading state       │ LoadingState       │
   └─────────────────────┴────────────────────┘
   ============================================================================= */

// Loading states
export {
  LoadingState,
  TableSkeleton,
  CardSkeleton,
  FormSkeleton,
  PageLoader,
  ButtonLoader,
  InlineLoader,
  type LoadingVariant,
  type LoadingSize,
} from "./loading-state";

// Card components
export {
  StandardCard,
  CompactCard,
  SpaciousCard,
  InteractiveCard,
  StatsCard,
  type CardPadding,
} from "./standard-card";

// Dialog components
export {
  FormDialog,
  CreateDialog,
  EditDialog,
  type DialogSize,
} from "./form-dialog";

// Sheet components
export {
  DetailSheet,
  DetailSection,
  DetailRow,
  DetailGrid,
  DetailDivider,
  type SheetSize,
} from "./detail-sheet";

// Confirmation dialogs
export {
  ConfirmDialog,
  DeleteDialog,
  ArchiveDialog,
  type ConfirmVariant,
} from "./confirm-dialog";
